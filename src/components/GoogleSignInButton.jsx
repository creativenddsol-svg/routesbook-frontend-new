// src/components/GoogleSignInButton.jsx
import { useEffect, useRef, useState } from "react";
import apiClient from "../api";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({
  text = "signin_with",      // "signin_with" | "signup_with" | "continue_with"
  shape = "pill",            // "pill" | "rectangular" | "circle"
  theme = "outline",         // "outline" | "filled_blue" | "filled_black"
  size = "large",            // "large" | "medium" | "small"
  width = 320,               // px
  className = "",
  onSuccess,
  onError,
}) {
  const ref = useRef(null);
  const { login } = useAuth();
  const [gisReady, setGisReady] = useState(false);

  useEffect(() => {
    // Basic readiness checks
    if (!GOOGLE_CLIENT_ID) {
      console.warn("[GIS] Missing REACT_APP_GOOGLE_CLIENT_ID");
      return;
    }
    if (typeof window !== "undefined" && window.google && ref.current) {
      setGisReady(true);

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const { data } = await apiClient.post("/auth/google", { credential });
            localStorage.setItem("token", data.token);
            login(data.user, data.token);
            toast.success("Signed in with Google");
            onSuccess?.(data);
          } catch (err) {
            const msg =
              err?.response?.data?.message || err?.message || "Google sign-in failed";
            toast.error(msg);
            onError?.(msg);
          }
        },
        ux_mode: "popup",
      });

      window.google.accounts.id.renderButton(ref.current, {
        type: "standard",
        text,
        theme,
        size,
        shape,
        logo_alignment: "left",
        width,
      });
    }
  }, [login, onSuccess, onError]);

  // Fallback: show a disabled button if the GIS script hasn't loaded yet
  return gisReady ? (
    <div ref={ref} className={`w-full flex justify-center ${className}`} />
  ) : (
    <button
      type="button"
      disabled
      className={`w-full flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-gray-500 bg-white ${className}`}
      title="Loading Google..."
    >
      Continue with Google
    </button>
  );
}

