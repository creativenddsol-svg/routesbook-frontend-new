// src/pages/Login.jsx
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

/* ---- Shared UI ---- */
import TopBar from "../components/ui/TopBar";
import SectionCard from "../components/ui/SectionCard";
import { RowInput } from "../components/ui/FormAtoms";

/* ---- Google ---- */
import GoogleSignInButton from "../components/GoogleSignInButton";

/* ---- Page palette ---- */
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

export default function Login() {
  // —— phone login-or-signup (unified) state
  const [mobile, setMobile] = useState("");
  const [step, setStep] = useState("request"); // "request" | "verify"
  const [code, setCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0); // 45s default cooldown
  const [isExistingUser, setIsExistingUser] = useState(null); // null until request returns
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // redirect policy (kept as before)
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

  // restore resend cooldown on mount (so it won't reset)
  useEffect(() => {
    const t = parseInt(
      sessionStorage.getItem("rb-login-otp-resend") || "0",
      10
    );
    if (t > Date.now()) {
      setResendIn(Math.ceil((t - Date.now()) / 1000));
    }
  }, []);

  // helper: route to redirect, passing confirm draft if needed
  const navigateWithConfirmDraftIfNeeded = () => {
    if (redirect && redirect.startsWith("/confirm-booking")) {
      try {
        const raw = sessionStorage.getItem("rb_confirm_draft");
        const draft = raw ? JSON.parse(raw) : null;
        navigate("/confirm-booking", {
          replace: true,
          state: draft || undefined,
        });
        return true;
      } catch {
        // fall through to normal redirect if parse fails
      }
    }
    navigate(redirect, { replace: true });
    return false;
  };

  /* ============ PHONE: UNIFIED OTP (login or signup) ============ */
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

      const { data } = await apiClient.post(
        "/auth/otp/login-or-signup/request",
        payload
      );

      toast.success(data?.message || "OTP sent");
      setIsExistingUser(Boolean(data?.isExistingUser));
      setStep("verify");

      // ✅ use server-provided resend window (fallback 45s) and reset any stale timer key
      sessionStorage.removeItem("rb-login-otp-resend");
      const seconds =
        typeof data?.resendInSec === "number" ? data.resendInSec : 45;
      startResendTimer("rb-login-otp-resend", seconds, setResendIn);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to send OTP";
      setError(msg);
      toast.error(msg);

      // ✅ if rate limited, sync UI to server's retry hint
      const retry = Number(err?.response?.data?.retryAfterSec);
      if (!Number.isNaN(retry) && retry > 0) {
        startResendTimer("rb-login-otp-resend", retry, setResendIn);
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
      sessionStorage.removeItem("rb-login-otp-resend");

      const pending = localStorage.getItem("pendingBooking");
      if (pending) {
        const { busId, date } = JSON.parse(pending);
        localStorage.removeItem("pendingBooking");
        navigate(`/book/${busId}?date=${date}`, { replace: true });
        return;
      }

      const role = data?.user?.role?.toString?.().toLowerCase?.() || "";
      if (role === "admin") {
        navigate("/", { replace: true });
        return;
      }

      // 🔁 If returning to ConfirmBooking, pass draft state
      navigateWithConfirmDraftIfNeeded();
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

  // ✅ allow changing the phone number during OTP verify
  const changeNumber = () => {
    // Clear state and timers so UI is fresh when user edits number
    setStep("request");
    setCode("");
    setIsExistingUser(null);
    setError("");
    setResendIn(0);
    sessionStorage.removeItem("rb-login-otp-resend");
  };

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <Toaster position="top-right" />
      <TopBar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <SectionCard title="Sign in to Routesbook">
            {/* PHONE: unified login-or-signup (no name field) */}
            <div className="space-y-4 text-[16px] md:text-base">
              {step === "request" && (
                <form onSubmit={sendOtp} className="space-y-4">
                  <RowInput
                    id="mobile"
                    name="mobile"
                    label="Mobile number"
                    type="tel"
                    inputMode="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="077xxxxxxx or +9477xxxxxxx"
                    required
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
                  {/* ✅ Show where we sent the code + Change number action */}
                  <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="text-sm">
                      <div className="font-semibold text-gray-800">
                        Code sent to
                      </div>
                      <div className="text-gray-700">
                        {normalizeLkMobile(mobile) || "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={changeNumber}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: PALETTE.primary }}
                    >
                      Change number
                    </button>
                  </div>

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
                Don’t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold hover:underline"
                  style={{ color: PALETTE.primary }}
                >
                  Create an account
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="px-3 text-xs uppercase tracking-wide text-gray-400">
                or
              </span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            {/* GOOGLE SIGN-IN (always visible) */}
            <div className="mb-4 text-[16px] md:text-base">
              <GoogleSignInButton
                text="signin_with"
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
                  // 🔁 If returning to ConfirmBooking, pass draft state
                  if (redirect && redirect.startsWith("/confirm-booking")) {
                    try {
                      const raw = sessionStorage.getItem("rb_confirm_draft");
                      const draft = raw ? JSON.parse(raw) : null;
                      navigate("/confirm-booking", {
                        replace: true,
                        state: draft || undefined,
                      });
                      return;
                    } catch {
                      // fall through
                    }
                  }
                  navigate(redirect, { replace: true });
                }}
              />
            </div>
          </SectionCard>

          {/* Right column: optional helper / marketing block */}
          <div className="hidden md:block">
            <SectionCard title="Welcome back 👋">
              <p className="text-sm" style={{ color: PALETTE.subtle }}>
                Use Google or your mobile number with a 6-digit OTP. If it’s
                your first time with phone, we’ll create your account right
                after verification.
              </p>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
