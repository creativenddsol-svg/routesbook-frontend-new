// 🔹 React imports
import { createContext, useContext, useState, useEffect, useRef } from "react";
import apiClient from "../api";
// ⬇️ NEW: bring in the pre-logout seat release
import { releaseLocksBeforeLogout } from "../seatLockBridge";

// 🔹 1. Create the AuthContext
const AuthContext = createContext();

// --- small helper: decode JWT exp (seconds since epoch) safely ---
function getJwtExp(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    // handle base64url
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return typeof json?.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

// compute milliseconds until token expiry minus a safety buffer
function msUntilRefresh(token, bufferMs = 2 * 60 * 1000) {
  const exp = getJwtExp(token);
  if (!exp) return null;
  const ms = exp * 1000 - Date.now() - bufferMs;
  return Math.max(ms, 0);
}

// 🔹 2. Create the AuthProvider Component
export const AuthProvider = ({ children }) => {
  // ✅ Hydrate immediately using functions in useState
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false); // No delayed hydration needed

  // holds the pending refresh timer id so we can clear/reschedule
  const refreshTimerRef = useRef(null);

  // --- schedule a proactive refresh based on current token exp ---
  const scheduleRefresh = (tok) => {
    // clear any prior timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (!tok) return;

    const ms = msUntilRefresh(tok); // ~2 minutes before exp
    if (ms === null) return; // can't decode exp → skip proactive scheduling
    if (ms <= 0) {
      // if already expired/near expiry, try refresh soon
      refreshTimerRef.current = setTimeout(doRefresh, 1500);
      return;
    }
    refreshTimerRef.current = setTimeout(doRefresh, ms);
  };

  // --- call backend /auth/refresh; update token if returned ---
  const doRefresh = async () => {
    try {
      const res = await apiClient.post("/auth/refresh"); // httpOnly refresh cookie is sent via withCredentials=true in api.js (for /auth)
      const newToken = res?.data?.token;
      if (newToken && typeof newToken === "string") {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        // reschedule next proactive refresh
        scheduleRefresh(newToken);
      }
    } catch {
      // If refresh fails, we leave the current token as-is.
      // apiClient already has a retry flow for 401s during requests.
      // You could choose to log the user out here, but we're being lenient.
    }
  };

  /* ---------------- one-time hydration & cross-tab sync ---------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const existing = localStorage.getItem("token");
        if (existing) {
          // schedule proactive refresh if possible
          scheduleRefresh(existing);
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
        const newTok = e.newValue || null;
        setToken(newTok);
        scheduleRefresh(newTok);
      }
    };
    window.addEventListener("storage", onStorage);

    // Refresh when user returns to the tab AND token is close to expiring
    const onVisibility = () => {
      if (document.visibilityState === "visible" && token) {
        const ms = msUntilRefresh(token, 60 * 1000); // 1min buffer on visibility
        if (ms !== null && ms <= 0) {
          doRefresh();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // 🔹 3. Login function
  const login = (userData, tok) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", tok);
    setUser(userData);
    setToken(tok);
    // schedule the proactive refresh for this new token
    scheduleRefresh(tok);
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

    // 4) clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // 5) now clear local state & tokens
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
