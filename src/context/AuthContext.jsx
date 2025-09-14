// 🔹 React imports
import { createContext, useContext, useState } from "react";
// 🔹 Added (kept original line above untouched)
import { useEffect } from "react";
import apiClient from "../api";

// 🔹 1. Create the AuthContext
const AuthContext = createContext();

// 🔹 2. Create the AuthProvider Component
export const AuthProvider = ({ children }) => {
  // ✅ Hydrate immediately using functions in useState
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error("Failed to parse stored user:", err);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch (err) {
      console.error("Failed to load token:", err);
      return null;
    }
  });

  const [loading, setLoading] = useState(false); // No delayed hydration needed

  /* ---------------- Added: one-time hydration & cross-tab sync ---------------- */

  // On first mount, verify/refresh session with backend and sync latest profile
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Optional: if you use httpOnly refresh cookies, this will silently refresh
        await apiClient.post("/auth/refresh").catch(() => {});
        // Pull the latest user (works for both token-in-header or cookie-based auth)
        const { data } = await apiClient.get("/auth/me").catch(() => ({ data: null }));
        const me = data?.user ?? data ?? null;
        if (mounted && me) {
          localStorage.setItem("user", JSON.stringify(me));
          setUser(me);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Keep context in sync if another tab logs in/out
    const onStorage = (e) => {
      if (e.key === "user") {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
      if (e.key === "token") {
        setToken(e.newValue || null);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // 🔹 3. Login function
  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
    setToken(token);

    // Added: verify & hydrate from backend so Home sees admin state immediately
    setLoading(true);
    apiClient
      .post("/auth/refresh")
      .catch(() => {})
      .then(() => apiClient.get("/auth/me"))
      .then((res) => {
        const me = res?.data?.user ?? res?.data ?? null;
        if (me) {
          localStorage.setItem("user", JSON.stringify(me));
          setUser(me);
        }
      })
      .finally(() => setLoading(false));
  };

  // 🔹 4. Logout function
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);

    // Added: tell backend (ignore failures)
    apiClient.post("/auth/logout").catch(() => {});
  };

  // 🔹 5. Provide context to children
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔹 6. Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
