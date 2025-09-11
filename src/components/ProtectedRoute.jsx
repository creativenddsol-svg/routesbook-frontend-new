// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, isLoggedIn, loading, hydrated } = useAuth() || {};
  const location = useLocation();

  // ⏳ Wait until auth state is ready (supports either `hydrated` or `loading`)
  const ready =
    typeof hydrated === "boolean"
      ? hydrated
      : typeof loading === "boolean"
      ? !loading
      : true;

  if (!ready) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 text-lg animate-pulse">
        🔐 Checking authentication...
      </div>
    );
  }

  // Determine auth status (supports `isLoggedIn`, `isAuthenticated`, or `user`)
  const authed =
    typeof isLoggedIn !== "undefined" ? !!isLoggedIn : !!(user || isAuthenticated);

  // 🚫 Not logged in → redirect to login (preserve intended destination)
  if (!authed) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  // ✅ Logged in → render protected page
  return children;
};

export default ProtectedRoute;
