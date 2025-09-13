// src/components/AdminRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // make sure path is correct

export default function AdminRoute({ children }) {
  const { user, isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 text-lg animate-pulse">
        🔐 Checking admin access...
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  const isAdmin =
    user?.role?.toString?.().toLowerCase() === "admin" ||
    user?.isAdmin === true ||
    (Array.isArray(user?.roles) &&
      user.roles.some((r) => r?.toString?.().toLowerCase() === "admin"));

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
