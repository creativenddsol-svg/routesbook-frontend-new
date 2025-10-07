// src/pages/SearchResults/index.jsx
// Route target for /search-results
// Chooses Mobile vs Desktop UI while sharing all logic via _core.

import React from "react";
import { Toaster } from "react-hot-toast";
import { SearchCoreProvider } from "./_core"; // shared state/effects/handlers
import useIsDesktop from "./useIsDesktop"; // matchMedia('(min-width:1024px)')
import Mobile from "./Mobile"; // mobile-only markup
import Desktop from "./Desktop"; // desktop-only markup

export default function SearchResultsIndex(props) {
  const isDesktop = useIsDesktop();

  return (
    <SearchCoreProvider>
      <Toaster position="top-right" />
      {isDesktop ? <Desktop {...props} /> : <Mobile {...props} />}
    </SearchCoreProvider>
  );
}
