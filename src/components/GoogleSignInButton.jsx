// src/components/GoogleSignInButton.jsx
import { useEffect, useRef } from "react";
import apiClient from "../api";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID; // CRA env name

function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const id = "google-gsi-script";
    if (document.getElementById(id)) {
      // already injected; wait a tick
      const iv = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(iv);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(iv);
        if (window.google?.accounts?.id) resolve();
        else reject(new Error("GIS not ready"));
      }, 3000);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.id = id;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load GIS script"));
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

    async function mount() {
      try {
        if (!CLIENT_ID) {
          console.warn(
            "REACT_APP_GOOGLE_CLIENT_ID is missing. Set it in your env and redeploy."
          );
          return;
        }
        await loadGsiScript();
        if (cancelled || !btnRef.current) return;

        // Initialize
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
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
          ux_mode: "popup",
        });

        // Render button
        window.google.accounts.id.renderButton(btnRef.current, {
          type: "standard",
          text,
          theme,
          size,
          shape,
          logo_alignment: "left",
          width: 320,
        });
      } catch (e) {
        console.error(e);
        onError?.(String(e?.message || e));
      }
    }

    mount();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSuccess, onError]);

  return <div ref={btnRef} className="w-full flex justify-center" />;
}
