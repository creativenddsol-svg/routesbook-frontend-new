// src/pages/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import apiClient from "../api";
import { useAuth } from "../AuthContext";

/* Shared UI */
import TopBar from "../components/ui/TopBar";
import SectionCard from "../components/ui/SectionCard";
import { RowInput } from "../components/ui/FormAtoms";

const PALETTE = {
  primary: "var(--rb-primary, #D84E55)",
  bg: "var(--rb-bg, #F5F6F8)",
  subtle: "var(--rb-subtle, #6B7280)",
};

export default function AdminLogin() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };

      // ✅ Use dedicated admin auth endpoint
      const res = await apiClient.post("/admin/auth/login", payload);

      const token = res?.data?.token || res?.data?.accessToken || null;
      const user = res?.data?.user;

      const role = user?.role?.toString?.().toLowerCase?.() || "";

      // ✅ Only allow admin / superadmin roles in this UI
      if (role !== "admin" && role !== "superadmin") {
        localStorage.removeItem("token");
        const msg =
          "This account does not have admin access. Please use the main login page.";
        setError(msg);
        toast.error(msg);
        return;
      }

      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");

      // Update global auth state
      login(user, token);

      toast.success("Admin login successful");
      // ✅ Redirect to Admin Dashboard (not bus list)
      navigate("/admin", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <Toaster position="top-right" />
      <TopBar />

      <div className="max-w-xl mx-auto px-4 py-8">
        <SectionCard title="Routesbook Admin Login">
          <p className="text-sm mb-4" style={{ color: PALETTE.subtle }}>
            This page is for Routesbook staff only. Passengers should use the
            main login page.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <RowInput
              id="email"
              name="email"
              label="Admin email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              placeholder="admin@routesbook.lk"
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
              placeholder="••••••••"
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: PALETTE.primary }}
            >
              {submitting ? "Logging in..." : "Log in as Admin"}
            </button>

            {error && (
              <p
                className="text-sm mt-2 font-semibold"
                style={{ color: "#B91C1C" }}
              >
                {error}
              </p>
            )}
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
