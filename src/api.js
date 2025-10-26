// src/api.js
import axios from "axios";

/** ========= Base URL resolution ========= */
const fromVite = (() => {
  try { return import.meta?.env?.VITE_API_BASE_URL || null; } catch { return null; }
})();
const API_BASE_URL =
  fromVite ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "https://routesbook-backend-api.onrender.com/api"; // fallback

export const API_ORIGIN = (() => {
  try { const u = new URL(API_BASE_URL); return `${u.protocol}//${u.host}`; }
  catch { return API_BASE_URL.replace(/\/api\/?$/i, ""); }
})();

export const toImgURL = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      return u.protocol === "http:" ? `https://${u.host}${u.pathname}${u.search}${u.hash}` : p;
    } catch { return p; }
  }
  return `${API_ORIGIN}${p.startsWith("/") ? p : "/" + p}`;
};

/** ========= Axios instance ========= */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 20000,
});

/** ========= Client ID ========= */
export const getClientId = () => {
  try {
    let id = localStorage.getItem("rb_client_id");
    if (!id) {
      if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        id = window.crypto.randomUUID();
      } else if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
        const buf = new Uint32Array(2);
        window.crypto.getRandomValues(buf);
        id = `${Date.now()}-${Array.from(buf).map(n=>n.toString(16)).join("")}`;
      } else {
        id = `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
      }
      localStorage.setItem("rb_client_id", id);
    }
    return id;
  } catch { return `${Date.now()}-${Math.random().toString(36).slice(2,10)}`; }
};

/** ========= Helpers ========= */
const normalizePath = (raw) => {
  try { return new URL(raw || "", API_BASE_URL).pathname.toLowerCase(); }
  catch {
    const baseLower = API_BASE_URL.toLowerCase();
    const inLower = String(raw || "").toLowerCase();
    let p = inLower.startsWith(baseLower) ? inLower.slice(baseLower.length) : inLower;
    if (!p.startsWith("/")) p = `/${p}`;
    return p;
  }
};
const isPlainObject =
  (x) => !!x && typeof x === "object" && (typeof FormData === "undefined" || !(x instanceof FormData));

/** ======= Fetch-compat wrapper (res.ok / res.json()) ======= */
const addFetchCompat = (resp) => {
  if (!resp) return resp;
  if (typeof resp.json !== "function") resp.json = async () => resp.data;
  if (typeof resp.ok !== "boolean") resp.ok = resp.status >= 200 && resp.status < 300;
  return resp;
};

/** ========= Request coalescing & rate limit =========
 *  - Coalesce identical requests (method + full URL + params + body) while in flight
 *  - Limit concurrent GETs to prevent server overload (token-bucket-ish)
 */
const inflight = new Map();
const keyOf = (cfg) => {
  const url = (()=>{ try { return new URL(cfg.url || "", API_BASE_URL).toString(); } catch { return String(cfg.url||""); }})();
  const m = (cfg.method || "get").toLowerCase();
  const p = cfg.params ? JSON.stringify(cfg.params) : "";
  const d = isPlainObject(cfg.data) ? JSON.stringify(cfg.data) : (cfg.data instanceof FormData ? "[formdata]" : "");
  return `${m} ${url} | ${p} | ${d}`;
};

let getSlots = 4;                // allow 4 parallel GETs
const waiters = [];
const acquireGetSlot = async () => {
  if (getSlots > 0) { getSlots--; return; }
  await new Promise((res) => waiters.push(res));
};
const releaseGetSlot = () => {
  getSlots++;
  const next = waiters.shift();
  if (next) { getSlots--; next(); }
};

/** ========= Request interceptors ========= */
apiClient.interceptors.request.use(
  (config) => {
    // Auth bearer
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Content-Type only for plain objects (NOT FormData)
    const method = (config.method || "get").toLowerCase();
    if (method !== "get" && isPlainObject(config.data)) {
      config.headers = config.headers || {};
      if (!config.headers["Content-Type"]) config.headers["Content-Type"] = "application/json";
    }

    // Path / cookies
    const path = normalizePath(config.url);
    const needsCookie =
      /(\/auth|\/me|\/profile|\/bookings|\/admin|\/payments|\/payment|\/payhere|\/checkout)(\/|$)/.test(path);
    config.withCredentials = !!needsCookie;

    // clientId -> payload/params (never header)
    const clientId = getClientId();
    const addToData = () => {
      if (isPlainObject(config.data)) {
        if (!("clientId" in config.data)) config.data.clientId = clientId;
      } else if (!config.data || !(config.data instanceof FormData)) {
        config.data = { clientId };
      }
    };
    const addToParams = () => {
      config.params = { ...(config.params || {}), clientId };
    };

    if (path.includes("/bookings/lock") && method === "post") addToData();
    if (path.includes("/bookings/release") && method === "delete") addToData();
    if (method === "get" && (path.includes("/bookings/lock-remaining") || path.includes("/bookings/lock/remaining"))) {
      addToParams();
    }
    if (method === "post" && /(^|\/)bookings(\/|$)/.test(path) && !path.includes("/bookings/lock") && !path.includes("/bookings/release")) {
      addToData();
    }

    // CORS-safe header cleanup + Accept
    try {
      if (config.headers) {
        const h = config.headers;
        const del = (k) => (typeof h.delete === "function" ? h.delete(k) : delete h[k]);
        del("x-client-id"); del("X-Client-Id"); del("xClientId");
        if (!h.Accept) config.headers.Accept = "application/json";
      }
    } catch {}

    // Availability micro-cache (30s)
    if (method === "get" && path.startsWith("/bookings/availability")) {
      const fullURL = new URL(config.url || "", API_BASE_URL);
      if (config.params) Object.entries(config.params).forEach(([k,v]) => fullURL.searchParams.set(k, v));
      const cacheKey = `rb_av_${fullURL.toString()}`;
      const now = Date.now();
      try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (cached && cached.exp > now) {
          config.adapter = async () => ({
            data: cached.data,
            status: 200,
            statusText: "OK (cache)",
            headers: {},
            config,
            request: {},
          });
          return config;
        }
        config._rbCacheKey = cacheKey;
      } catch {}
    }

    // Coalesce identical in-flight requests
    const coalesce = (method === "get" || method === "post");
    if (coalesce) {
      const k = keyOf(config);
      if (inflight.has(k)) {
        const p = inflight.get(k);
        config.adapter = async () => await p;
        return config;
      }
      const realAdapter = config.adapter || axios.defaults.adapter;
      const promise = (async () => {
        if (method === "get") await acquireGetSlot();
        try {
          const resp = await realAdapter(config);
          return resp;
        } finally {
          if (method === "get") releaseGetSlot();
          inflight.delete(k);
        }
      })();
      inflight.set(k, promise);
      config.adapter = async () => await promise;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/** ========= Response interceptors ========= */

// Small error logger (first in the chain)
apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    try {
      const cfg = err?.config || {};
      const method = (cfg.method || "get").toUpperCase();
      const url = new URL(cfg?.url || "", API_BASE_URL).toString();
      const status = err?.response?.status;
      const retryAfter = err?.response?.headers?.["retry-after"];
      // eslint-disable-next-line no-console
      console.warn(`[API ERROR] ${method} ${url} -> ${status}`, { retryAfter, data: err?.response?.data });
    } catch {}
    return Promise.reject(err);
  }
);

/* 401 refresh with concurrency control */
let isRefreshing = false;
let refreshWaiters = [];
const enqueueWait = () => new Promise((resolve, reject) => refreshWaiters.push({ resolve, reject }));
const resolveWaiters = () => { refreshWaiters.forEach(({resolve})=>resolve()); refreshWaiters = []; };
const rejectWaiters  = (e) => { refreshWaiters.forEach(({reject})=>reject(e)); refreshWaiters = []; };

// separate axios instance for 429 retries
const retryClient = axios.create();

// Success path (cache write-through + fetch-compat) and robust error path
apiClient.interceptors.response.use(
  async (response) => {
    const cfg = response?.config;
    if (cfg?._rbCacheKey) {
      try {
        sessionStorage.setItem(
          cfg._rbCacheKey,
          JSON.stringify({ data: response.data, exp: Date.now() + 30_000 })
        );
      } catch {}
    }
    return addFetchCompat(response);
  },
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config || {};

    // only our API
    const isOurApiCall = (() => {
      try { return new URL(original?.url || "", API_BASE_URL).toString().startsWith(API_BASE_URL); }
      catch { return String(original?.url || "").startsWith(API_BASE_URL); }
    })();

    // ---- 401 refresh
    if (
      status === 401 &&
      original &&
      isOurApiCall &&
      !original._retry &&
      !String(original?.url || "").includes("/auth/login") &&
      !String(original?.url || "").includes("/auth/refresh")
    ) {
      original._retry = true;
      try {
        if (isRefreshing) {
          await enqueueWait();
        } else {
          isRefreshing = true;
          await apiClient.post("/auth/refresh");
          isRefreshing = false;
          resolveWaiters();
        }
        const resp = await apiClient(original);
        return addFetchCompat(resp);
      } catch (e) {
        isRefreshing = false;
        rejectWaiters(e);
        throw e;
      }
    }

    // ---- 429: wait (Retry-After or 3s) and single retry
    if (status === 429 && original && !original._rb429) {
      original._rb429 = 1;
      const ra = parseInt(error?.response?.headers?.["retry-after"] || "0", 10);
      const waitMs = (ra > 0 ? ra : 3000);
      await new Promise((r) => setTimeout(r, waitMs));
      const rebuilt = {
        method: original.method,
        url: new URL(original.url || "", API_BASE_URL).toString(),
        headers: original.headers,
        data: original.data,
        params: original.params,
        withCredentials: original.withCredentials,
        timeout: original.timeout || 20000,
      };
      const resp = await retryClient.request(rebuilt);
      return addFetchCompat(resp);
    }

    // ---- Optional endpoints soft-fallback (avoid “Oops”)
    const path = normalizePath(original.url);
    if (status === 404 && isOurApiCall) {
      if (/(^|\/)(buses|special-notices|bus-locations)(\/|$)/.test(path)) {
        const resp = {
          data: [],
          status: 200,
          statusText: "OK (empty fallback)",
          headers: {},
          config: original,
          request: {},
        };
        return addFetchCompat(resp);
      }
    }

    throw error;
  }
);

/** ========= Utilities ========= */
export async function warmUp() {
  try { await apiClient.get("/health", { timeout: 30000 }); } catch {}
}

// Simple GET with exponential backoff (0.5s, 1s, 2s + jitter)
export async function getWithRetry(url, config = {}, { retries = 2 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return addFetchCompat(await apiClient.get(url, config)); }
    catch (err) {
      lastErr = err;
      if (i === retries) break;
      const base = 500 * 2 ** i;
      const jitter = Math.random() * 300;
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
  throw lastErr;
}

export default apiClient;
