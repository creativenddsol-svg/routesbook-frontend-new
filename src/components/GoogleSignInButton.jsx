// src/components/GoogleSignInButton.jsx
import { useEffect, useRef } from "react";
import apiClient from "../api";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Load Google Identity Services script once and wait until ready
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();

    const existing = document.getElementById("google-identity-services");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const s = document.createElement("script");
    s.id = "google-identity-services";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(s);
  });
}

export default function GoogleSignInButton({
  text = "signup_with", // "signin_with" | "signup_with" | "continue_with"
  shape = "pill",
  theme = "outline",
  size = "large",
  onSuccess,
  onError,
}) {
  const btnRef = useRef(null);
  const { login } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!GOOGLE_CLIENT_ID) {
          console.warn("REACT_APP_GOOGLE_CLIENT_ID is missing.");
          return;
        }

        await loadGoogleScript();
        if (cancelled || !btnRef.current || !window.google?.accounts?.id) return;

        // Clear previous button if React re-mounted this component
        btnRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          ux_mode: "popup",
          callback: async (response) => {
            try {
              const { data } = await apiClient.post("/auth/google", {
                credential: response.credential,
              });
              localStorage.setItem("token", data.token);
              login(data.user, data.token);
              toast.success("Signed in with Google");
              onSuccess?.(data);
            } catch (err) {
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Google sign-in failed";
              toast.error(msg);
              onError?.(msg);
            }
          },
        });

        window.google.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          text,   // "signin_with" | "signup_with" | "continue_with"
          theme,  // "outline" | "filled_blue" | ...
          size,   // "large" | "medium" | "small"
          shape,  // "pill" | "rectangular" | "circle"
          logo_alignment: "left",
          width: 320,
        });

        // Optional: one-tap
        // window.google.accounts.id.prompt();
      } catch (e) {
        console.error(e);
        onError?.(e?.message || "Failed to initialize Google Sign-In");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  return <div ref={btnRef} className="w-full flex justify-center" />;
}
