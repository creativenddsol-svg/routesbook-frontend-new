import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Prevents back navigation when enabled (used on step 4+). */
export default function StepGuard({ enabled }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!enabled) return;
    const onPop = (e) => {
      e.preventDefault?.();
      navigate(0); // cancel going back
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [enabled, navigate]);
  return null;
}
