import React from "react";
import { CheckCircle } from "lucide-react";

/**
 * 6-step progress bar matching mobile style used on steps 1–3.
 * Props:
 *   - currentStep: number 1..6
 *   - className: optional extra classes
 */
const stepsDef = [
  { id: 1, label: "Select Seats", short: "Seats", icon: "chair" },
  { id: 2, label: "Select Points", short: "Points", icon: "map" },
  { id: 3, label: "Summary",      short: "Summary", icon: "user" },
  { id: 4, label: "Confirm Details", short: "Confirm", icon: "user" },
  { id: 5, label: "Payment",      short: "Pay",   icon: "credit-card" },
  { id: 6, label: "Download Ticket", short: "Ticket", icon: "ticket" },
];

const Icon = ({ name }) => {
  switch (name) {
    case "map":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 6l-6-3-6 3v12l6-3 6 3 6-3V3l-6 3zM9 4.2l4 2v9.6l-4-2V4.2zM3 7.8l4-2v9.6l-4 2V7.8zm16 9.6l-4-2V5.8l4 2v9.6z" />
        </svg>
      );
    case "chair":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 2h12c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v6h12V4H6zm-4 8h20v2H2v-2zm4 4h12v4h2v-4h2v6H2v-6h2v4h2v-4z" />
        </svg>
      );
    case "user":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm0 2c2.69 0 5.77 1.28 6 2H6c.2-.72 3.3-2 6-2z" />
        </svg>
      );
    case "credit-card":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 2v2H4V6h16zM4 18v-6h16v6H4zm2-4h12v2H6v-2z" />
        </svg>
      );
    case "ticket":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 10V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 100 4v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 100-4zm-2-4v3h-2V6h2zM4 6h12v3H4V6zm0 12v-3h2v3H4zm14 0H8v-3h10v3z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function BookingSteps({ currentStep = 1, className = "" }) {
  return (
    <div className={`w-full ${className}`}>
      {/* MOBILE: compact numbered bar */}
      <div className="md:hidden grid grid-cols-6 gap-2">
        {stepsDef.map((s, idx) => {
          const isActive = s.id === currentStep;
          const isDone = s.id < currentStep;
          return (
            <div key={s.id} className="flex flex-col items-center">
              <div
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center border text-[11px] font-bold",
                  isActive
                    ? "border-red-600 text-white bg-red-600 animate-pulse"
                    : isDone
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                    : "border-gray-300 text-gray-600 bg-white",
                ].join(" ")}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <div className="mt-1 h-1 w-full rounded-full">
                <div
                  className={`h-1 w-full rounded-full ${
                    isActive || isDone ? "bg-red-600" : "bg-gray-300"
                  }`}
                />
              </div>
              <div className="mt-1 text-[10px] text-gray-600 truncate w-full text-center">
                {s.short}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP: labeled steps */}
      <div className="hidden md:flex items-center gap-4">
        {stepsDef.map((s, idx) => {
          const isActive = s.id === currentStep;
          const isDone = s.id < currentStep;
          return (
            <div key={s.id} className="flex items-center min-w-0">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center border text-sm font-bold",
                  isActive
                    ? "border-red-600 text-white bg-red-600"
                    : isDone
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                    : "border-gray-300 text-gray-600 bg-white",
                ].join(" ")}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={`ml-2 text-sm truncate ${
                  isActive ? "text-red-700 font-semibold" : "text-gray-700"
                }`}
              >
                {s.label}
              </span>
              {idx < stepsDef.length - 1 && (
                <div className="mx-3 h-[2px] w-8 bg-gray-200 rounded" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
