import axios from "axios";

// Create a single, configured instance of axios
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true, // Sends cookies with requests if backend sets them
});

export default apiClient;
