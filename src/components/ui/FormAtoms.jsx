// src/components/ui/FormAtoms.jsx
import React from "react";

/* ---- Shared matte palette (fallbacks to CSS vars if present) ---- */
const PALETTE = {
  text: "var(--rb-text, #1A1A1A)",
  subtle: "var(--rb-subtle, #6B7280)",
  border: "var(--rb-border, #E5E7EB)",
  surface: "var(--rb-surface, #FFFFFF)",
  primary: "var(--rb-primary, #D84E55)",
};

export const Label = ({ children }) => (
  <span className="block text-xs font-semibold mb-1" style={{ color: PALETTE.subtle }}>
    {children}
  </span>
);

export const RowInput = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  inputMode,
  enterKeyHint,
  placeholder,
  required,
}) => (
  <div className="w-full">
    {label ? <Label>{label}</Label> : null}
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      inputMode={inputMode}
      enterKeyHint={enterKeyHint}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-3 rounded-xl border outline-none focus:ring-2"
      style={{
        background: PALETTE.surface,
        borderColor: PALETTE.border,
        color: PALETTE.text,
        boxShadow: "none",
      }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${PALETTE.primary}33`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
    />
  </div>
);
