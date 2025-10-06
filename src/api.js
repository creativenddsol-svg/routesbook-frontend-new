// src/api.js
import axios from "axios";

/** Resolve API base URL */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  "https://routesbook-backend-api.onrender.com/api"; // fallback

/* === Absolute origin (no /api) + image URL normalizer === */
export const API_ORIGIN = (() => {
  try {
    const u = new URL(API_BASE_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/i, "");
  }
})();

export const toImgURL = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) {
    try {
      const u = new URL(p);
      return u.protocol === "http:" ? `https://${u.host}${u.pathname}${u.search}${u.hash}` : p;
    } catch {
      return p;
    }
  }
  return `${API_ORIGIN}${p.startsWith("/") ? p : "/" + p}`;
};

/** Axios instance */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/** Persistent anonymous client id (no globalThis usage) */
export const getClientId = () => {
  try {
    let id = localStorage.getItem("rb_client_id");
    if (!id) {
      const hasUUID =
        typeof window !== "undefined" &&
        window.crypto &&
        typeof window.crypto.randomUUID === "function";
      if (hasUUID) {
        id = window.crypto.randomUUID();
      } else {
        const hasRand =
          typeof window !== "undefined" &&
          window.crypto &&
          typeof window.crypto.getRandomValues === "function";
        if (hasRand) {
          const buf = new Uint32Array(2);
          window.crypto.getRandomValues(buf);
          id = `${Date.now()}-${Array.from(buf).map((n) => n.toString(16)).join("")}`;
        } else {
          id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        }
      }
      localStorage.setItem("rb_client_id", id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

/* ---------- Idempotency helpers (checkout only) ---------- */
/** Persist per-attempt key in sessionStorage (cartId + paymentIntentId scoped) */
function getOrCreateIdemKey(cartId, paymentIntentId) {
  const safeCart = String(cartId || "").trim();
  const safePi = String(paymentIntentId || "").trim();
  const k = `rb_idem_${safeCart}_${safePi}`;
  try {
    let val = sessionStorage.getItem(k);
    if (!val) {
      if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        val = window.crypto.randomUUID();
      } else {
        val = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      }
      sessionStorage.setItem(k, val);
    }
    return val;
  } catch {
    // fallback, non-persistent
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** Quick path matcher that strips baseURL if axios got an absolute URL */
function pathOf(config) {
  const rawUrl = (config.url || "").toLowerCase();
  const baseLower = API_BASE_URL.toLowerCase();
  let path = rawUrl.startsWith(baseLower) ? rawUrl.slice(baseLower.length) : rawUrl;
  if (!path.startsWith("/")) path = `/${path}`;
  return path;
}

/** Interceptors */
apiClient.interceptors.request.use(
  (config) => {
    // Auth
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Always ensure Accept
    config.headers = { ...(config.headers || {}), Accept: "application/json" };

    // Never send x-client-id as a header (CORS); we’ll send clientId in body/params instead.
    try {
      const h = config.headers;
      const del = (k) =>
        typeof h?.delete === "function" ? h.delete(k) : delete h[k];
      del?.("x-client-id"); del?.("X-Client-Id"); del?.("xClientId");
    } catch {}

    // ---- clientId injection (body/params) ----
    const clientId = getClientId();
    const method = (config.method || "get").toLowerCase();
    const path = pathOf(config);

    const addToData = () => {
      if (config.data && typeof config.data === "object") {
        if (!("clientId" in config.data)) config.data.clientId = clientId;
      } else {
        config.data = { clientId };
      }
    };
    const addToParams = () => {
      config.params = { ...(config.params || {}), clientId };
    };

    // Seat lock & release
    if (path.includes("/bookings/lock") && method === "post") addToData();
    if (path.includes("/bookings/release") && method === "delete") addToData();

    // Lock remaining (both styles)
    if (
      method === "get" &&
      (path.includes("/bookings/lock-remaining") || path.includes("/bookings/lock/remaining"))
    ) {
      addToParams();
    }

    // 🆕 Cart endpoints: ensure clientId is always present
    // - GET  => add to params
    // - POST/DELETE => add to body
    if (path.includes("/bookings/cart")) {
      if (method === "get") addToParams();
      else if (method === "post" || method === "delete") addToData();
    }

    // Creating bookings (server needs clientId to match locks)
    if (
      method === "post" &&
      /(^|\/)bookings(\/|$)/.test(path) &&
      !path.includes("/bookings/lock") &&
      !path.includes("/bookings/release")
    ) {
      addToData();
    }

    // ---- Idempotency: checkout endpoint ONLY ----
    // POST /api/bookings/cart/checkout
    if (method === "post" && /\/bookings\/cart\/checkout(?:\/|$)/.test(path)) {
      const cartId = config.data?.cartId ?? "";
      const paymentIntentId = config.data?.paymentIntentId ?? "";
      const idemKey = getOrCreateIdemKey(cartId, paymentIntentId);

      // Send header (recommended) …
      // NOTE: Backend CORS must allow this header: "Idempotency-Key"
      config.headers["Idempotency-Key"] = config.headers["Idempotency-Key"] || idemKey;

      // …and also include a body fallback so server-side middleware can read if desired
      if (config.data && typeof config.data === "object" && !("idempotencyKey" in config.data)) {
        config.data.idempotencyKey = idemKey;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* Safe 401 auto-refresh (cookie-based) with concurrency control) */
let isRefreshing = false;
let refreshWaiters = [];

const enqueueWait = () =>
  new Promise((resolve, reject) => {
    refreshWaiters.push({ resolve, reject });
  });
const resolveWaiters = () => {
  refreshWaiters.forEach(({ resolve }) => resolve());
  refreshWaiters = [];
};
const rejectWaiters = (err) => {
  refreshWaiters.forEach(({ reject }) => reject(err));
  refreshWaiters = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !String(original?.url || "").includes("/auth/login") &&
      !String(original?.url || "").includes("/auth/refresh")
    ) {
      original._retry = true;
      try {
        if (isRefreshing) {
          await enqueueWait(); // wait for ongoing refresh
        } else {
          isRefreshing = true;
          await apiClient.post("/auth/refresh"); // expects httpOnly refresh cookie
          isRefreshing = false;
          resolveWaiters();
        }
        return apiClient(original); // retry original request
      } catch (e) {
        isRefreshing = false;
        rejectWaiters(e);
        throw e;
      }
    }

    throw error;
  }
);

export default apiClient;
