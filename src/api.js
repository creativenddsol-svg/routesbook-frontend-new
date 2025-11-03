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

/* =========================================================
   NEW: legacy → split route rewriter
   ---------------------------------------------------------
   Your front end today calls things like:
     GET  /buses?from=...
     GET  /booking/availability/:busId?...
     POST /booking/lock-seats
     POST /bookings        (create booking)
     GET  /bookings/me
     DELETE /bookings/:id

   Backend new world wants:
     /public/buses
     /public/booking/availability/:busId
     /secure/booking/lock-seats
     /secure/booking
     /secure/booking/me
     /secure/booking/:id

   NOTE:
   - apiClient.baseURL already ends with /api
     so config.url is usually like "/buses", "/bookings", etc.
   - We only rewrite paths that match these known patterns.
========================================================= */
function rewritePath(config) {
  // normalize method and url
  const method = (config.method || "get").toLowerCase();
  let url = String(config.url || "");

  // if full absolute URL to somewhere else, don't touch it
  if (/^https?:\/\//i.test(url)) {
    return config;
  }

  // ensure url starts with "/"
  if (!url.startsWith("/")) {
    url = "/" + url;
  }

  // 1) PUBLIC READS
  // /buses        -> /public/buses
  if (method === "get" && url.startsWith("/buses")) {
    url = url.replace(/^\/buses/i, "/public/buses");
  }

  // /booking/availability/:busId -> /public/booking/availability/:busId
  if (
    method === "get" &&
    url.startsWith("/booking/availability/")
  ) {
    url = url.replace(
      /^\/booking\/availability\//i,
      "/public/booking/availability/"
    );
  }

  // 2) SECURE WRITES / PRIVATE
  // lock seats: POST /booking/lock-seats -> /secure/booking/lock-seats
  if (
    method === "post" &&
    /^\/booking\/lock-seats\/?$/i.test(url)
  ) {
    url = "/secure/booking/lock-seats";
  }

  // create booking: POST /bookings or /booking -> /secure/booking
  if (
    method === "post" &&
    (/^\/bookings\/?$/i.test(url) || /^\/booking\/?$/i.test(url))
  ) {
    url = "/secure/booking";
  }

  // my bookings: GET /bookings/me or /booking/me -> /secure/booking/me
  if (
    method === "get" &&
    (/^\/bookings\/me\/?$/i.test(url) || /^\/booking\/me\/?$/i.test(url))
  ) {
    url = "/secure/booking/me";
  }

  // cancel booking: DELETE /bookings/:id -> /secure/booking/:id
  if (
    method === "delete" &&
    /^\/bookings\/[^/]+$/i.test(url)
  ) {
    url = url.replace(/^\/bookings\//i, "/secure/booking/");
  }

  // write it back
  config.url = url;
  return config;
}

/** Interceptors */
apiClient.interceptors.request.use(
  (config) => {
    // ✅ first rewrite legacy paths to /public /secure split
    config = rewritePath(config);

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

    // Add clientId ONLY in payload/params for the lock & booking APIs (no custom header)
    const clientId = getClientId();

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

    // 🔒 Opt-in cookies only where needed (auth, bookings, admin, and payment)
    // Includes PayHere-related paths to avoid issues on payment flows.
    const needsCookie =
      /(\/auth|\/me|\/profile|\/bookings|\/admin|\/payments|\/payment|\/payhere|\/checkout)(\/|$)/.test(
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
