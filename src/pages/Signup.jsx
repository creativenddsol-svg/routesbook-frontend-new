// src/pages/Signup.jsx
import { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  Link,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../AuthContext";
import toast, { Toaster } from "react-hot-toast";
import apiClient from "../api";

/* ---- Shared UI (same as Login) ---- */
import TopBar from "../components/ui/TopBar";
import SectionCard from "../components/ui/SectionCard";
import { RowInput } from "../components/ui/FormAtoms";

/* ---- Google ---- */
import GoogleSignInButton from "../components/GoogleSignInButton";

/* ---- Page palette (same as Login) ---- */
const PALETTE = {
  primary: "var(--rb-primary, #D84E55)",
  bg: "var(--rb-bg, #F5F6F8)",
  subtle: "var(--rb-subtle, #6B7280)",
};

const isValidLKMobile = (raw = "") => {
  const s = String(raw).replace(/[^\d+]/g, "");
  return /^\+94\d{9}$/.test(s) || /^0\d{9}$/.test(s);
};

// Normalize to a single canonical format before sending to backend
const normalizeLkMobile = (raw = "") => {
  const s = String(raw).replace(/[^\d+]/g, "");
  if (/^\+94\d{9}$/.test(s)) return s;
  if (/^0\d{9}$/.test(s)) return "+94" + s.slice(1);
  return s; // fallback unchanged
};

// Persist resend cooldown so it doesn't reset on rerender
const startResendTimer = (key, seconds, setResendIn) => {
  const target = Date.now() + seconds * 1000;
  sessionStorage.setItem(key, String(target));
  setResendIn(seconds);
};

export default function Signup() {
  // —— page mode (mirror Login)
  const [mode, setMode] = useState("phone"); // "email" | "phone"  ← default changed to phone

  // —— email signup state (fullName optional)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // —— phone unified OTP (login-or-signup) state
  const [mobile, setMobile] = useState("");
  const [fullName, setFullName] = useState(""); // optional; used if number is new
  const [step, setStep] = useState("request"); // "request" | "verify"
  const [code, setCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [isExistingUser, setIsExistingUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // same redirect policy as Login
  const redirectQuery = searchParams.get("redirect");
  const stateFrom = location.state?.from?.pathname || null;
  const redirect = useMemo(
    () => redirectQuery || stateFrom || "/",
    [redirectQuery, stateFrom]
  );

  // resend timer tick
  useEffect(() => {
    if (!resendIn) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // restore resend cooldown on mount (separate key for signup)
  useEffect(() => {
    const t = parseInt(
      sessionStorage.getItem("rb-signup-otp-resend") || "0",
      10
    );
    if (t > Date.now()) {
      setResendIn(Math.ceil((t - Date.now()) / 1000));
    }
  }, []);

  // clear errors when switching modes
  useEffect(() => {
    setError("");
  }, [mode]);

  /* ================= EMAIL SIGNUP (fullName optional) ================= */
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };
      if (formData.fullName.trim()) payload.fullName = formData.fullName.trim(); // optional

      const res = await apiClient.post("/auth/signup", payload);
      const token = res?.data?.token || null;
      const user = res?.data?.user;

      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");

      login(user, token);
      toast.success("Signup successful!");

      // pending booking resume
      const pending = localStorage.getItem("pendingBooking");
      if (pending) {
        const { busId, date } = JSON.parse(pending);
        localStorage.removeItem("pendingBooking");
        navigate(`/book/${busId}?date=${date}`, { replace: true });
        return;
      }

      navigate(redirect, { replace: true });
    } catch (err) {
      const arr = err?.response?.data?.errors;
      const msg =
        (Array.isArray(arr) && arr.length && arr[0]?.msg) ||
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ============ PHONE: UNIFIED OTP (login or signup) – same as Login ============ */
  const sendOtp = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!isValidLKMobile(mobile)) {
      setError(
        "Enter a valid Sri Lanka mobile (e.g., 077xxxxxxx or +9477xxxxxxx)"
      );
      return;
    }
    setOtpLoading(true);
    try {
      const mobileNorm = normalizeLkMobile(mobile);
      const payload = { mobile: mobileNorm };
      if (fullName.trim()) payload.fullName = fullName.trim(); // only used if new

      const { data } = await apiClient.post(
        "/auth/otp/login-or-signup/request",
        payload
      );

      toast.success(data?.message || "OTP sent");
      setIsExistingUser(Boolean(data?.isExistingUser));
      setStep("verify");

      // ✅ use server-provided resend window (fallback 45s) and reset any stale timer key
      sessionStorage.removeItem("rb-signup-otp-resend");
      const seconds =
        typeof data?.resendInSec === "number" ? data.resendInSec : 45;
      startResendTimer("rb-signup-otp-resend", seconds, setResendIn);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send OTP";
      setError(msg);
      toast.error(msg);

      // ✅ if rate limited, sync UI to server's retry hint
      const retry = Number(err?.response?.data?.retryAfterSec);
      if (!Number.isNaN(retry) && retry > 0) {
        startResendTimer("rb-signup-otp-resend", retry, setResendIn);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e?.preventDefault?.();
    setError("");
    const numeric = code.replace(/[^\d]/g, "");
    if (numeric.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setOtpLoading(true);
    try {
      const mobileNorm = normalizeLkMobile(mobile);
      const { data } = await apiClient.post(
        "/auth/otp/login-or-signup/verify",
        { mobile: mobileNorm, code: numeric }
      );

      login(data.user, data.token);
      toast.success(isExistingUser ? "Logged in!" : "Account created!");

      // ✅ clear any stored OTP resend timer after success
      sessionStorage.removeItem("rb-signup-otp-resend");

      // pending booking resume
      const pending = localStorage.getItem("pendingBooking");
      if (pending) {
        const { busId, date } = JSON.parse(pending);
        localStorage.removeItem("pendingBooking");
        navigate(`/book/${busId}?date=${date}`, { replace: true });
        return;
      }

      navigate(redirect, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Verification failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    await sendOtp();
  };

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <Toaster position="top-right" />
      <TopBar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <SectionCard title="Create your Routesbook account">
            {/* Toggle (same buttons as Login) */}
            <div className="flex gap-2 mb-4">
              {/* Phone first */}
              <button
                onClick={() => setMode("phone")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  mode === "phone" ? "text-white" : ""
                }`}
                style={{
                  background: mode === "phone" ? PALETTE.primary : "#E5E7EB",
                }}
              >
                Phone
              </button>
              {/* Email second */}
              <button
                onClick={() => setMode("email")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  mode === "email" ? "text-white" : ""
                }`}
                style={{
                  background: mode === "email" ? PALETTE.primary : "#E5E7EB",
                }}
              >
                Email
              </button>
            </div>

            {/* EMAIL SIGNUP FORM + Google */}
            {mode === "email" && (
              <>
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  {/* Full name now OPTIONAL */}
                  <RowInput
                    id="fullName"
                    name="fullName"
                    label="Full name (optional)"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g., Tharindu Perera"
                  />

                  <RowInput
                    id="email"
                    name="email"
                    label="Email"
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
                    autoComplete="new-password"
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
                    {submitting ? "Creating…" : "Create Account"}
                  </button>

                  {error && (
                    <p
                      className="text-sm mt-2 font-semibold"
                      style={{ color: "#B91C1C" }}
                    >
                      {error}
                    </p>
                  )}

                  <p
                    className="mt-4 text-sm text-center"
                    style={{ color: PALETTE.subtle }}
                  >
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold hover:underline"
                      style={{ color: PALETTE.primary }}
                    >
                      Log in
                    </Link>
                  </p>
                </form>

                {/* Divider */}
                <div className="flex items-center my-6">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="px-3 text-xs uppercase tracking-wide text-gray-400">
                    or
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                {/* Google Sign-Up (GIS) */}
                <GoogleSignInButton
                  text="signup_with"
                  size="large"
                  shape="pill"
                  theme="outline"
                  onSuccess={() => {
                    const pending = localStorage.getItem("pendingBooking");
                    if (pending) {
                      const { busId, date } = JSON.parse(pending);
                      localStorage.removeItem("pendingBooking");
                      navigate(`/book/${busId}?date=${date}`, {
                        replace: true,
                      });
                      return;
                    }
                    navigate(redirect, { replace: true });
                  }}
                />
              </>
            )}

            {/* PHONE: unified login-or-signup (same logic as Login) */}
            {mode === "phone" && (
              <div className="space-y-4">
                {step === "request" && (
                  <form onSubmit={sendOtp} className="space-y-4">
                    <RowInput
                      id="mobile"
                      name="mobile"
                      label="Mobile number"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="077xxxxxxx or +9477xxxxxxx"
                      required
                    />

                    {/* Optional: used only if the number is new */}
                    <RowInput
                      id="fullNamePhone"
                      name="fullNamePhone"
                      label="Full name (optional)"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Tharindu Perera"
                    />

                    <button
                      type="submit"
                      disabled={otpLoading || !isValidLKMobile(mobile)}
                      className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: PALETTE.primary }}
                    >
                      {otpLoading ? "Sending…" : "Send OTP"}
                    </button>
                  </form>
                )}

                {step === "verify" && (
                  <form onSubmit={verifyOtp} className="space-y-4">
                    <RowInput
                      id="code"
                      name="code"
                      label="Enter 6-digit code"
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/[^\d]/g, ""))
                      }
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="••••••"
                      required
                    />

                    <div className="text-sm" style={{ color: PALETTE.subtle }}>
                      Didn’t get it?{" "}
                      <button
                        type="button"
                        onClick={resend}
                        disabled={otpLoading || resendIn > 0}
                        className="font-semibold hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ color: PALETTE.primary }}
                      >
                        {resendIn > 0
                          ? `Resend in ${resendIn}s`
                          : "Resend now"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: PALETTE.primary }}
                    >
                      {otpLoading ? "Verifying…" : "Verify & Continue"}
                    </button>

                    {isExistingUser === false && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: PALETTE.subtle }}
                      >
                        We’ll create your account after verification.
                      </p>
                    )}
                  </form>
                )}

                {error && (
                  <p
                    className="text-sm mt-2 font-semibold"
                    style={{ color: "#B91C1C" }}
                  >
                    {error}
                  </p>
                )}

                <p
                  className="mt-4 text-sm text-center"
                  style={{ color: PALETTE.subtle }}
                >
                  Prefer email?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("email")}
                    className="font-semibold hover:underline"
                    style={{ color: PALETTE.primary }}
                  >
                    Sign up with email
                  </button>
                </p>
              </div>
            )}
          </SectionCard>

          {/* Right column (same as Login) */}
          <div className="hidden md:block">
            <SectionCard title="Welcome aboard ✨">
              <p className="text-sm" style={{ color: PALETTE.subtle }}>
                Use your email & password, Google, or your mobile number with a
                6-digit OTP. If it’s your first time with phone, we’ll create
                your account right after verification.
              </p>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
