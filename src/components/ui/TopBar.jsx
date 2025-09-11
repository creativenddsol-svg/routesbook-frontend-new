// src/components/ui/TopBar.jsx
import React from "react";

/* ---- Shared matte palette (fallbacks to CSS vars if present) ---- */
const PALETTE = {
  primary: "var(--rb-primary, #D84E55)",
};

export default function TopBar({ title, subtitle, rightSlot }) {
  return (
    <div
      className="sticky top-0 z-30"
      style={{ background: PALETTE.primary, paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            {title ? (
              <p className="text-white text-base font-semibold leading-tight">{title}</p>
            ) : null}
            {subtitle ? (
              <p className="text-white/90 text-xs mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {rightSlot ? <div className="ml-3">{rightSlot}</div> : null}
        </div>
      </div>
    </div>
  );
}
