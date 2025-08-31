// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast, { Toaster } from "react-hot-toast";
// ✅ Import the shared API client
import apiClient from "../api";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // ✅ Use apiClient instead of axios with localhost
      const res = await apiClient.post("/auth/signup", formData);

      // Store token + user in context
      localStorage.setItem("token", res.data.token);
      login(res.data.user, res.data.token);

      toast.success("Signup successful!");
      navigate("/");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        toast.error(errors[0].msg);
        setError(errors[0].msg);
      } else {
        const msg = err.response?.data?.message || "Signup failed";
        toast.error(msg);
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center text-[#0F172A]">
          Sign Up to Routesbook
        </h2>

        <p className="text-sm text-gray-500 mb-4 text-center">
          Password must be at least <strong>6 characters</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:brightness-110 text-white py-2 rounded-lg font-semibold transition-all"
          >
            Sign Up
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Signup;
