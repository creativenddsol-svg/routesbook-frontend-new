import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // ✅ or use env variable for production
  withCredentials: true, // optional: include cookies if using sessions
});

// ✅ Attach token to every request if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
