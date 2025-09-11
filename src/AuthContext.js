// src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Hydrate immediately from localStorage
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem("user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const t = localStorage.getItem("token");
    // Guard against the strings "null"/"undefined"
    return t && t !== "null" && t !== "undefined" ? t : null;
  });

  // Keep axios Authorization header in sync with token
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Login updates React state immediately (Navbar re-renders now)
  const login = (userData, nextToken) => {
    // user
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
    setUser(userData || null);

    // token (avoid saving "null"/"undefined")
    if (nextToken) {
      localStorage.setItem("token", nextToken);
      setToken(nextToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      // Prefer user presence for UI; token can be cookie-only
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
