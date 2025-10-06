// src/pages/SearchResults/index.jsx
// Route target for /search-results
// Chooses Mobile vs Desktop UI while sharing all logic via _core.

import React, { Suspense, memo } from "react";
import { Toaster } from "react-hot-toast";
import { SearchCoreProvider } from "./_core";          // shared state/effects/handlers
import useIsDesktop from "./useIsDesktop";             // matchMedia('(min-width:1024px)')

// Code-split UIs (helps initial load)
const Mobile = React.lazy(() => import(/* webpackChunkName: "sr-mobile" */ "./Mobile"));
const Desktop = React.lazy(() => import(/* webpackChunkName: "sr-desktop" */ "./Desktop"));

// Tiny inline fallback to avoid layout shift
const Fallback = () => (
  <div className="min-h-[40vh] w-full flex items-center justify-center">
    <div className="animate-spin h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-500" />
  </div>
);

function SearchResultsIndex(props) {
  const isDesktop = useIsDesktop();

  return (
    <SearchCoreProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: 14 },
          success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
        }}
      />
      <Suspense fallback={<Fallback />}>
        {isDesktop ? <Desktop {...props} /> : <Mobile {...props} />}
      </Suspense>
    </SearchCoreProvider>
  );
}

export default memo(SearchResultsIndex);
