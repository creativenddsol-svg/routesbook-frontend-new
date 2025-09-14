// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast, { Toaster } from "react-hot-toast";
// Use the shared API client (has baseURL + withCredentials)
import apiClient from "../api";

/* ---- Shared UI (matches ConfirmBooking look & feel) ---- */
import TopBar from "../components/ui/TopBar";
import SectionCard from "../components/ui/SectionCard";
import { RowInput } from "../components/ui/FormAtoms";

/* ---- Page palette (fallbacks to CSS vars, matches CB) ---- */
const PALETTE = {
  primary: "var(--rb-primary, #D84E55)",
  bg: "var(--rb-bg, #F5F6F8)",
  subtle: "var(--rb-subtle, #6B7280)",
};

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // Support both styles of redirect: ?redirect=/path and state.from from guards
  const redirectQuery = searchParams.get("redirect");
  const stateFrom = location.state?.from?.pathname || null;
  const redirect = redirectQuery || stateFrom || "/";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

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
        navigate(`/book/${busId}?date=${date}`, { replace: true });
        return;
      }

      // ✅ ALWAYS land admins on Home, even if a redirect exists
      const role = user?.role?.toString?.().toLowerCase?.() || "";
      if (role === "admin") {
        navigate("/", { replace: true });
        return;
      }

      // For non-admins: honor redirect (from guards), else go Home
      if (redirect && redirect !== "/login") {
        navigate(redirect, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <Toaster position="top-right" />

      {/* Matte top bar identical to ConfirmBooking */}
      <TopBar title="Login" subtitle="Sign in to continue your booking" />

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
                disabled={submitting}
                className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: PALETTE.primary }}
              >
                {submitting ? "Logging in..." : "Log In"}
              </button>

              {error && (
                <p className="text-sm mt-2 font-semibold" style={{ color: "#B91C1C" }}>
                  {error}
                </p>
              )}
            </form>

            <p className="mt-4 text-sm text-center" style={{ color: PALETTE.subtle }}>
              Not a user?{" "}
              <Link
                to="/signup"
                className="font-semibold hover:underline"
                style={{ color: PALETTE.primary }}
              >
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
