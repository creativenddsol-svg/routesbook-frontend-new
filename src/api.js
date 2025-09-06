// src/api.js
import axios from "axios";

/**
 * Resolve API base URL from env (CRA or Vite) with a safe fallback.
 * Change the fallback to your own production URL if needed.
 */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
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
 * Used to safely identify a user before login for seat locking.
 */
export const getClientId = () => {
  try {
    let id = localStorage.getItem("rb_client_id");
    if (!id) {
      // Use crypto UUID when available; fall back to a short random id
      id =
        (globalThis.crypto && crypto.randomUUID && crypto.randomUUID()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("rb_client_id", id);
    }
    return id;
  } catch {
    // In very restricted environments, fall back to a non-persistent id
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

/**
 * Request interceptor:
 * - Attaches Authorization header if a token exists (adjust key if your app uses a different one)
 * - Adds a persistent clientId to seat-lock related routes (body/params as needed)
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
    config.headers["x-client-id"] = clientId; // optional header (useful for logs)

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

    // Automatically include clientId for these endpoints
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

/**
 * (Optional) Response interceptor – here just passes errors through.
 * You can add global handling for 401/403, logging, etc.
 */
apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default apiClient;
