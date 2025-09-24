// src/pages/SearchResults/useIsDesktop.js
import { useEffect, useState } from "react";

/**
 * useIsDesktop
 * Returns true when (min-width: 1024px) matches.
 * - Safe on SSR (assumes desktop to avoid hydration mismatch).
 * - Works across older browsers that still use addListener/removeListener.
 */
export default function useIsDesktop(query = "(min-width: 1024px)") {
  const getInitial = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      // On SSR or very old browsers, default to desktop layout
      return true;
    }
    return window.matchMedia(query).matches;
  };

  const [isDesktop, setIsDesktop] = useState(getInitial);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mql = window.matchMedia(query);
    const onChange = (e) => setIsDesktop(e.matches);

    // keep state in sync if query prop changes
    if (mql.matches !== isDesktop) setIsDesktop(mql.matches);

    // modern + legacy listeners
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    } else {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, [query]);

  return isDesktop;
}
