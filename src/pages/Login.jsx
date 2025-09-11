// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast, { Toaster } from "react-hot-toast";
// Use the shared API client (has baseURL + withCredentials)
import apiClient from "../api";

/* ---------------- Matte palette (matches ConfirmBooking) ---------------- */
const PALETTE = {
  primary: "#C74A50", // matte red
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",
};

/* ---------------- Small shared UI atoms (styled like CB) ---------------- */
const SectionCard = ({ title, children }) => (
  <div
    className="rounded-2xl p-5"
    style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
  >
    {title ? (
      <h3 className="text-lg font-semibold mb-3" style={{ color: PALETTE.text }}>
        {title}
      </h3>
    ) : null}
    {children}
  </div>
);

const Label = ({ children }) => (
  <span className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textSubtle }}>
    {children}
  </span>
);

const RowInput = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  inputMode,
  enterKeyHint,
  placeholder,
  required,
}) => (
  <div className="w-full">
    <Label>{label}</Label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      inputMode={inputMode}
      enterKeyHint={enterKeyHint}
      placeholder={placeholder}
      required={required}
      className="w-full bg-white px-3 py-3 rounded-xl border outline-none"
      style={{ borderColor: PALETTE.border, color: PALETTE.text }}
    />
  </div>
);

/* ========================= Component ========================= */
const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const redirect = searchParams.get("redirect") || "/";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // This uses your apiClient (withCredentials: true)
      const res = await apiClient.post("/auth/login", formData);

      // Support both token-in-body and cookie-only flows:
      const token = res?.data?.token || null;
      const user = res?.data?.user;

      if (token) {
        localStorage.setItem("token", token);
      } else {
        // If you previously stored a token, clear it to avoid stale auth
        localStorage.removeItem("token");
      }

      // Update your auth context (pass token or null)
      login(user, token);

      toast.success("Login successful!");

      // If user had a pending booking, send them back to it
      const pending = localStorage.getItem("pendingBooking");
      if (pending) {
        const { busId, date } = JSON.parse(pending);
        localStorage.removeItem("pendingBooking");
        navigate(`/book/${busId}?date=${date}`);
      } else {
        navigate(redirect);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <Toaster position="top-right" />

      {/* Matte top bar (same as CB) */}
      <div
        className="sticky top-0 z-30"
        style={{ background: PALETTE.primary, paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-md mx-auto px-4 py-3">
          <p className="text-white text-base font-semibold leading-tight">Login</p>
          <p className="text-white/90 text-xs">Sign in to continue your booking</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pb-20">
        <div className="pt-6">
          <SectionCard title="Welcome back">
            <form onSubmit={handleSubmit} className="space-y-4">
              <RowInput
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                placeholder="you@email.com"
                required
              />

              <RowInput
                id="password"
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                enterKeyHint="done"
                placeholder="Enter your password"
                required
              />

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium hover:underline"
                  style={{ color: PALETTE.primary }}
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition"
                style={{ background: PALETTE.primary }}
              >
                Log In
              </button>

              {error && (
                <p className="text-sm mt-2 font-semibold" style={{ color: "#B91C1C" }}>
                  {error}
                </p>
              )}
            </form>

            <p className="mt-4 text-sm text-center" style={{ color: PALETTE.textSubtle }}>
              Not a user?{" "}
              <Link to="/signup" className="font-semibold hover:underline" style={{ color: PALETTE.primary }}>
                Create an account
              </Link>
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Login;
