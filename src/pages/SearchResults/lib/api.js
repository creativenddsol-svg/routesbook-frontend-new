// src/pages/lib/api.js

// Re-use your central axios client + clientId generator
import apiClient, { getClientId } from "../../api";

// Token helpers (some places in SearchResults code expect these)
export const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

export const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

// Re-export the client & getClientId
export default apiClient;
export { getClientId };
