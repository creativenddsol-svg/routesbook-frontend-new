// src/api.js
import axios from "axios";

/** Resolve API base URL (Vite → CRA → fallback) */
const fromVite = (() => {
  try {
    // Works only when bundled by Vite
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
    // if backend accidentally returns http while site is https, prefer https
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
  // Default to no credentials to reduce CORS preflights; opt-in below per-route.
  withCredentials: false,
  timeout: 20000, // 20s safety
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

/** Interceptors */
apiClient.interceptors.request.use(
  (config) => {
    // Auth bearer
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure JSON content-type on non-GET if missing
    const method = (config.method || "get").toLowerCase();
    if (method !== "get") {
      config.headers = config.headers || {};
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }

    // Stable client identity
    const clientId = getClientId();
    config.headers = config.headers || {};
    // ✅ Always send header now that server CORS allows it
    config.headers["X-Client-Id"] = clientId;

    // Normalize URL for matching (strip base if axios was given an absolute URL)
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

    // 🔒 Opt-in cookies where needed (auth, bookings/booking, secure booking, admin, payments)
    const needsCookie =
      /(\/auth|\/me|\/profile|\/bookings?|\/secure\/booking|\/admin|\/payments?|\/payment|\/payhere|\/checkout)(\/|$)/.test(
        path
      );
    config.withCredentials = !!needsCookie;

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

    // ----- Seat lock & release (legacy + new secure paths) -----
    // Lock seats: POST /api/bookings/lock ... OR /api/secure/booking/lock-seats
    if (
      method === "post" &&
      (path.includes("/bookings/lock") || path.includes("/secure/booking/lock"))
    ) {
      addToData();
    }

    // Release seats: DELETE/POST /api/bookings/release ... OR /api/secure/booking/release-seats
    if (
      (method === "delete" || method === "post") &&
      (path.includes("/bookings/release") ||
        path.includes("/secure/booking/release"))
    ) {
      addToData();
    }

    // Remaining time: GET /api/bookings/lock-remaining|/bookings/lock/remaining OR /api/secure/booking/lock-remaining
    if (
      method === "get" &&
      (path.includes("/bookings/lock-remaining") ||
        path.includes("/bookings/lock/remaining") ||
        path.includes("/secure/booking/lock-remaining"))
    ) {
      addToParams();
    }

    // Create booking: POST /api/bookings ... OR /api/secure/booking (but not the lock/release endpoints already handled)
    if (
      method === "post" &&
      (/(^|\/)bookings?(\/|$)/.test(path) || /(\/secure\/booking)(\/|$)/.test(path)) &&
      !path.includes("/bookings/lock") &&
      !path.includes("/bookings/release") &&
      !path.includes("/secure/booking/lock") &&
      !path.includes("/secure/booking/release")
    ) {
      addToData();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* 2nd request interceptor: keep Accept header; do NOT remove X-Client-Id anymore */
apiClient.interceptors.request.use(
  (config) => {
    try {
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

/* Safe 401 auto-refresh (cookie-based) with concurrency control */
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

    // Only handle refresh for our own API URLs
    const isOurApiCall = (() => {
      try {
        const full = new URL(original?.url || "", API_BASE_URL).toString();
        return full.startsWith(API_BASE_URL);
      } catch {
        return String(original?.url || "").startsWith(API_BASE_URL);
      }
    })();

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

/* ---- Helpers to improve reliability on free hosting (cold starts) ---- */

// Best-effort warm-up for cold starts (Render free can take 20–60s)
export async function warmUp() {
  try {
    await apiClient.get("/health", { timeout: 30000 });
  } catch {
    // swallow – it's just a nudge to wake the dyno
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
