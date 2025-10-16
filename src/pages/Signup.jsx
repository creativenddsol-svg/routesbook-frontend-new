// src/pages/Signup.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast, { Toaster } from "react-hot-toast";
import apiClient from "../api";
import GoogleSignInButton from "../components/GoogleSignInButton"; // 👈 add this

const isValidLKMobile = (raw = "") => {
  const s = String(raw).replace(/[^\d+]/g, "");
  return /^\+94\d{9}$/.test(s) || /^0\d{9}$/.test(s);
};

// ✅ Normalize to a single canonical format before sending to backend
const normalizeLkMobile = (raw = "") => {
  const s = String(raw).replace(/[^\d+]/g, "");
  if (/^\+94\d{9}$/.test(s)) return s;
  if (/^0\d{9}$/.test(s)) return "+94" + s.slice(1);
  return s; // fallback unchanged
};

// ✅ Persist resend cooldown so it doesn't reset on rerender
const startResendTimer = (key, seconds, setResendIn) => {
  const target = Date.now() + seconds * 1000;
  sessionStorage.setItem(key, String(target));
  setResendIn(seconds);
};

export default function Signup() {
  const [mode, setMode] = useState("email"); // "email" | "phone"

  // Email signup state
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Phone signup state
  const [fullNameP, setFullNameP] = useState("");
  const [mobile, setMobile] = useState("");
  const [emailP, setEmailP] = useState(""); // optional
  const [step, setStep] = useState("request"); // "request" | "verify"
  const [code, setCode] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // resend countdown tick
  useEffect(() => {
    if (!resendIn) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // restore resend cooldown on mount (so it won't reset)
  useEffect(() => {
    const t = parseInt(sessionStorage.getItem("rb-signup-otp-resend") || "0", 10);
    if (t > Date.now()) {
      setResendIn(Math.ceil((t - Date.now()) / 1000));
    }
  }, []);

  // clear errors when switching modes
  useEffect(() => {
    setError("");
  }, [mode]);

  /* =========================
     EMAIL SIGNUP (existing)
     ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = name === "email" || name === "fullName" ? value.replace(/^\s+/, "") : value;
    setFormData((prev) => ({ ...prev, [name]: v }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
    };
    if (payload.password.length < 6) {
      const msg = "Password must be at least 6 characters";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoadingEmail(true);
    try {
      const res = await apiClient.post("/auth/signup", payload);
      localStorage.setItem("token", res.data.token);
      // AuthContext: login(user, token)
      login(res.data.user, res.data.token);
      toast.success("Signup successful!");
      navigate("/", { replace: true });
    } catch (err) {
      const arr = err.response?.data?.errors;
      const msg =
        (Array.isArray(arr) && arr.length && arr[0]?.msg) ||
        err.response?.data?.message ||
        "Signup failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingEmail(false);
    }
  };

  /* =========================
     PHONE SIGNUP (OTP)
     ========================= */
  const requestOtp = async (e) => {
    e?.preventDefault?.();
    setError("");

    if (!fullNameP.trim()) {
      setError("Full name is required");
      toast.error("Full name is required");
      return;
    }
    if (!isValidLKMobile(mobile)) {
      const msg = "Enter a valid Sri Lanka mobile (e.g., 077xxxxxxx or +9477xxxxxxx)";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoadingOtp(true);
    try {
      const mobileNorm = normalizeLkMobile(mobile);
      const { data } = await apiClient.post("/auth/otp/signup/request", {
        fullName: fullNameP.trim(),
        mobile: mobileNorm,
        email: emailP.trim() || undefined, // optional
      });
      toast.success(data?.message || "OTP sent");
      setStep("verify");

      // use server-provided cooldown if available; fallback to 45s
      const serverCooldownMs = data?.resendAvailableAt
        ? Math.max(0, Math.floor((data.resendAvailableAt - Date.now()) / 1000))
        : 45;

      startResendTimer("rb-signup-otp-resend", serverCooldownMs, setResendIn);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingOtp(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault?.();
    setError("");

    const numeric = code.replace(/[^\d]/g, "");
    if (numeric.length !== 6) {
      const msg = "Enter the 6-digit code";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoadingOtp(true);
    try {
      const mobileNorm = normalizeLkMobile(mobile);
      const { data } = await apiClient.post("/auth/otp/signup/verify", {
        mobile: mobileNorm,
        code: numeric,
      });
      // AuthContext: login(user, token)
      login(data.user, data.token);
      toast.success("Account created!");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Verification failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingOtp(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    await requestOtp();
  };

  const canSendOtp = fullNameP.trim().length > 0 && isValidLKMobile(mobile);

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2 text-center text-[#0F172A]">
          Create your Routesbook account
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Choose Email & Password or Phone (OTP).
        </p>

        {/* Toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode("email")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === "email" ? "text-white" : ""}`}
            style={{ background: mode === "email" ? "#2563eb" : "#E5E7EB" }}
          >
            Sign up with Email
          </button>
          <button
            onClick={() => setMode("phone")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === "phone" ? "text-white" : ""}`}
            style={{ background: mode === "phone" ? "#2563eb" : "#E5E7EB" }}
          >
            Sign up with Phone
          </button>
        </div>

        {/* EMAIL SIGNUP */}
        {mode === "email" && (
          <>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                disabled={loadingEmail}
                className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:brightness-110 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-60"
              >
                {loadingEmail ? "Creating account…" : "Sign Up"}
              </button>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="px-3 text-xs uppercase tracking-wide text-gray-400">or</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            {/* Google Sign-Up (GIS) */}
            <GoogleSignInButton
              text="signup_with"
              size="large"
              shape="pill"
              theme="outline"
              onSuccess={() => navigate("/", { replace: true })}
            />
          </>
        )}

        {/* PHONE SIGNUP (OTP) */}
        {mode === "phone" && (
          <div className="space-y-4">
            {step === "request" && (
              <form onSubmit={requestOtp} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullNameP}
                  onChange={(e) => setFullNameP(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="077xxxxxxx or +9477xxxxxxx"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={emailP}
                  onChange={(e) => setEmailP(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="submit"
                  disabled={loadingOtp || !canSendOtp}
                  className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:brightness-110 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-60"
                >
                  {loadingOtp ? "Sending…" : "Send OTP"}
                </button>
              </form>
            )}

            {step === "verify" && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
                  className="w-full border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg"
                  required
                />

                <div className="text-sm text-gray-600">
                  Didn’t get it?{" "}
                  <button
                    type="button"
                    onClick={resend}
                    disabled={loadingOtp || resendIn > 0}
                    className="text-blue-600 font-semibold disabled:opacity-60"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend now"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loadingOtp}
                  className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:brightness-110 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-60"
                >
                  {loadingOtp ? "Verifying…" : "Create Account"}
                </button>
              </form>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
