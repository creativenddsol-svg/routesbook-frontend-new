// src/components/ui/SectionCard.jsx
import React from "react";

/* ---- Shared matte palette (fallbacks to CSS vars if present) ---- */
const PALETTE = {
  surface: "var(--rb-surface, #FFFFFF)",
  border: "var(--rb-border, #E5E7EB)",
  text: "var(--rb-text, #1A1A1A)",
};

export default function SectionCard({ title, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
    >
      {title ? (
        <h3 className="text-lg font-semibold mb-3" style={{ color: PALETTE.text }}>
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}
