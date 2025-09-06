// src/api.js
import axios from "axios";

/** Resolve API base URL */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  "https://routesbook-backend-api.onrender.com/api"; // fallback

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

    // Add clientId ONLY in payload/params for the lock APIs (no custom header)
    const clientId = getClientId();
    const url = (config.url || "").toLowerCase();
    const method = (config.method || "get").toLowerCase();

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

    if (url.includes("/bookings/lock") && method === "post") addToData();
    if (url.includes("/bookings/release") && method === "delete") addToData();
    if (url.includes("/bookings/lock-remaining") && method === "get")
      addToParams();

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default apiClient;
