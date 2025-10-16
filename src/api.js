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
  withCredentials: true,
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
    // Auth
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

    // Add clientId ONLY in payload/params for the lock & booking APIs (no custom header)
    const clientId = getClientId();

    // Normalize URL for matching (strip base if axios was given an absolute URL)
    const rawUrl = (config.url || "").toLowerCase();
    const baseLower = API_BASE_URL.toLowerCase();
    let path = rawUrl.startsWith(baseLower)
      ? rawUrl.slice(baseLower.length)
      : rawUrl;
    if (!path.startsWith("/")) path = `/${path}`;

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

    // Lock remaining (both styles: /lock-remaining and /lock/remaining)
    if (
      method === "get" &&
      (path.includes("/bookings/lock-remaining") ||
        path.includes("/bookings/lock/remaining"))
    ) {
      addToParams();
    }

    // Ensure clientId is also sent when creating the booking
    // Matches POST /bookings and POST /bookings/... (but not the lock/release endpoints already handled)
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

/* 2nd request interceptor: CORS-safe guard — never send x-client-id as a header; keep Accept */
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Remove any x-client-id header injected elsewhere (CORS preflight will fail otherwise)
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
        // Fallback if URL parsing fails: best-effort string check
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
        // Optional: clear volatile tokens if you want a clean state
        // localStorage.removeItem("token");
        // localStorage.removeItem("authToken");
        throw e;
      }
    }

    throw error;
  }
);

export default apiClient;
