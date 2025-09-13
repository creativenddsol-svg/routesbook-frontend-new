// 🔹 React imports
import { createContext, useContext, useState } from "react";

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

  // 🔹 3. Login function
  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
    setToken(token);
  };

  // 🔹 4. Logout function
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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
