// src/api.js
import axios from "axios";

/** Resolve API base URL (Vite → CRA → fallback) */
const fromVite = (() => {
  try {
    return import.meta?.env?.VITE_API_BASE_URL || null;
  } catch {
    return null;
  }
})();

const API_BASE_URL =
  fromVite ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  "https://routesbook-backend-api.onrender.com/api"; // fallback

/* === Derive absolute origin (no /api) + image URL normalizer === */
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
      return u.protocol === "http:"
        ? `https://${u.host}${u.pathname}${u.search}${u.hash}`
        : p;
    } catch {
      return p;
    }
  }
  return `${API_ORIGIN}${p.startsWith("/") ? p : "/" + p}`;
};

/** Axios instance */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 20000,
});

/** Persistent anonymous client id */
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
          id = `${Date.now()}-${Array.from(buf)
            .map((n) => n.toString(16))
            .join("")}`;
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

/* ---------------- Request interceptors ---------------- */

apiClient.interceptors.request.use(
  (config) => {
    // Auth bearer
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set JSON Content-Type ONLY for plain objects (not FormData)
    const method = (config.method || "get").toLowerCase();
    const isPlainObject =
      !!config.data &&
      typeof config.data === "object" &&
      typeof FormData !== "undefined" &&
      !(config.data instanceof FormData);

    if (method !== "get") {
      config.headers = config.headers || {};
      if (!config.headers["Content-Type"] && isPlainObject) {
        config.headers["Content-Type"] = "application/json";
      }
    }

    // Normalize path for matching
    const rawUrl = String(config.url || "");
    let path;
    try {
      const full = new URL(rawUrl, API_BASE_URL);
      path = full.pathname.toLowerCase();
    } catch {
      const baseLower = API_BASE_URL.toLowerCase();
      const inLower = rawUrl.toLowerCase();
      let p = inLower.startsWith(baseLower) ? inLower.slice(baseLower.length) : inLower;
      if (!p.startsWith("/")) p = `/${p}`;
      path = p;
    }

    // 🔒 Opt-in cookies only where needed (auth, me, profile, bookings, admin, payment)
    const needsCookie =
      /(\/auth|\/me|\/profile|\/bookings|\/admin|\/payments|\/payment|\/payhere|\/checkout)(\/|$)/.test(
        path
      );
    config.withCredentials = !!needsCookie;

    // Add clientId where required (payload/params — never a custom header)
    const clientId = getClientId();
    const addToData = () => {
      if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
        if (!("clientId" in config.data)) config.data.clientId = clientId;
      } else if (!(config.data instanceof FormData)) {
        config.data = { clientId };
      }
      // If it's FormData, skip — server doesn’t expect clientId there.
    };
    const addToParams = () => {
      config.params = { ...(config.params || {}), clientId };
    };

    if (path.includes("/bookings/lock") && method === "post") addToData();
    if (path.includes("/bookings/release") && method === "delete") addToData();

    if (
      method === "get" &&
      (path.includes("/bookings/lock-remaining") ||
        path.includes("/bookings/lock/remaining"))
    ) {
      addToParams();
    }

    if (
      method === "post" &&
      /(^|\/)bookings(\/|$)/.test(path) &&
      !path.includes("/bookings/lock") &&
      !path.includes("/bookings/release")
    ) {
      addToData();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// CORS-safe guard — never send x-client-id as header; ensure Accept
apiClient.interceptors.request.use(
  (config) => {
    try {
      if (config && config.headers) {
        const h = config.headers;
        const del = (k) =>
          typeof h.delete === "function" ? h.delete(k) : delete h[k];
        del("x-client-id");
        del("X-Client-Id");
        del("xClientId");
      }
      if (!config.headers?.Accept) {
        config.headers = {
          ...(config.headers || {}),
          Accept: "application/json",
        };
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- Response interceptors ---------------- */

// Small console logger for failed calls (helps diagnose “site is down” quickly)
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
      console.warn(`[API ERROR] ${method} ${url} -> ${status}`, {
        data: err?.response?.data,
        retryAfter,
      });
    } catch {}
    return Promise.reject(err);
  }
);

/* 401 auto-refresh (cookie-based) with concurrency control */
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

// Lightweight 429 backoff per-request (uses Retry-After if provided)
const retryable = axios.create(); // used only for retries (no interceptors)

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    // Only handle refresh for our own API URLs
    const isOurApiCall = (() => {
      try {
        const full = new URL(original?.url || "", API_BASE_URL).toString();
        return full.startsWith(API_BASE_URL);
      } catch {
        return String(original?.url || "").startsWith(API_BASE_URL);
      }
    })();

    // ---- 401 refresh flow ----
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
          await apiClient.post("/auth/refresh"); // expects httpOnly cookie
          isRefreshing = false;
          resolveWaiters();
        }
        return apiClient(original);
      } catch (e) {
        isRefreshing = false;
        rejectWaiters(e);
        throw e;
      }
    }

    // ---- Gentle 429 backoff (bounded) ----
    if (status === 429 && original && !original._rb429) {
      original._rb429 = 1;
      const ra = parseInt(error?.response?.headers?.["retry-after"] || "0", 10);
      const waitMs = (ra > 0 ? ra : 3) * 1000; // default 3s if header missing
      await new Promise((r) => setTimeout(r, waitMs));
      // re-send with a clean client (to avoid re-entering interceptors loops)
      const rebuilt = {
        method: original.method,
        url: new URL(original.url || "", API_BASE_URL).toString(),
        baseURL: undefined, // url is absolute now
        headers: original.headers,
        data: original.data,
        params: original.params,
        withCredentials: original.withCredentials,
        timeout: original.timeout || 20000,
      };
      return retryable.request(rebuilt);
    }

    throw error;
  }
);

/* ---- Helpers to improve reliability on free hosting (cold starts) ---- */

export async function warmUp() {
  try {
    await apiClient.get("/health", { timeout: 30000 });
  } catch {
    // swallow
  }
}

// Simple GET with exponential backoff (0.5s, 1s, 2s + jitter)
export async function getWithRetry(url, config = {}, { retries = 2 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await apiClient.get(url, config);
    } catch (err) {
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
