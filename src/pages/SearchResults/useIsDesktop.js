// src/pages/SearchResults/useIsDesktop.js
import { useSyncExternalStore } from "react";

/**
 * useIsDesktop
 * Returns true when (min-width: 1024px) matches.
 * - SSR-safe (assumes desktop on server to avoid hydration mismatch).
 * - Uses useSyncExternalStore for correct subscription semantics.
 */
export default function useIsDesktop(query = "(min-width: 1024px)") {
  const subscribe = (onStoreChange) => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      // nothing to subscribe to on the server
      return () => {};
    }
    const mql = window.matchMedia(query);
    // modern + legacy listeners
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    } else {
      mql.addListener(onStoreChange);
      return () => mql.removeListener(onStoreChange);
    }
  };

  const getSnapshot = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true; // default to desktop on SSR/very old browsers
    }
    return window.matchMedia(query).matches;
  };

  // server snapshot = same as fallback (desktop) to keep hydration consistent
  const getServerSnapshot = () => true;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
