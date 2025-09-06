// src/api.js
import axios from "axios";

/**
 * Resolve API base URL from env with a safe fallback.
 * Set REACT_APP_API_URL in Vercel → Project → Settings → Environment Variables.
 */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  "https://routesbook-backend-api.onrender.com/api"; // fallback

/**
 * Create a single, configured axios instance.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send/receive cookies when backend uses them
});

/**
 * Generate / read a persistent, anonymous client id.
 * Avoids `globalThis` to satisfy CRA/ESLint.
 */
export const getClientId = () => {
  try {
    let id = localStorage.getItem("rb_client_id");
    if (!id) {
      // Prefer crypto.randomUUID when available in the browser
      const hasUUID =
        typeof window !== "undefined" &&
        window.crypto &&
        typeof window.crypto.randomUUID === "function";
      if (hasUUID) {
        id = window.crypto.randomUUID();
      } else {
        // Fallbacks for older browsers
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
    // Non-persistent fallback (very restricted environments)
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

/**
 * Request interceptor:
 * - Attaches Authorization header if a token exists
 * - Adds a persistent clientId for seat-lock related routes
 */
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    const clientId = getClientId();
    config.headers = config.headers || {};
    config.headers["x-client-id"] = clientId; // optional (useful for logs)

    const url = (config.url || "").toLowerCase();
    const method = (config.method || "get").toLowerCase();

    const attachClientIdToData = () => {
      if (config.data && typeof config.data === "object") {
        if (!("clientId" in config.data)) config.data.clientId = clientId;
      } else {
        config.data = { clientId };
      }
    };
    const attachClientIdToParams = () => {
      config.params = { ...(config.params || {}), clientId };
    };

    // Auto-include clientId where the backend expects it
    if (url.includes("/bookings/lock") && method === "post") {
      attachClientIdToData();
    }
    if (url.includes("/bookings/release") && method === "delete") {
      attachClientIdToData();
    }
    if (url.includes("/bookings/lock-remaining") && method === "get") {
      attachClientIdToParams();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default apiClient;
