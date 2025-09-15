// 🔹 React imports
import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api";
// ⬇️ NEW: bring in the pre-logout seat release
import { releaseLocksBeforeLogout } from "../seatLockBridge";

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

  /* ---------------- one-time hydration & cross-tab sync ---------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const hasToken =
          !!(localStorage.getItem("token") || localStorage.getItem("authToken"));
        if (!hasToken) return;
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
  };

  // 🔹 4. Logout function (UPDATED)
  const logout = async () => {
    try {
      // 1) release any locked seats while token is still valid
      await releaseLocksBeforeLogout();
      // 2) optionally tell backend you're logging out (while token still present)
      await apiClient.post("/auth/logout").catch(() => {});
    } catch (e) {
      // best-effort: continue even if seat release/log out fails
      console.warn("Pre-logout cleanup issue:", e);
    }

    // 3) broadcast so open pages (SearchResults) can reset UI immediately
    window.dispatchEvent(new Event("rb:logout"));

    // 4) now clear local state & tokens
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("jwt");
    sessionStorage.removeItem("token");

    setUser(null);
    setToken(null);
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
