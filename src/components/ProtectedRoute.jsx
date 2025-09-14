import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  const isLoggedIn = !!(token || user);

  // ⏳ Wait until auth state is loaded
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 text-lg animate-pulse">
        🔐 Checking authentication...
      </div>
    );
  }

  // 🚫 Not logged in → redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Logged in → render protected page
  return children;
};

export default ProtectedRoute;
