import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged in → render protected page
  return children;
};

export default ProtectedRoute;
