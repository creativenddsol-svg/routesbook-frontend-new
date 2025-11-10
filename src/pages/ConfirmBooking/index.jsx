// src/pages/ConfirmBooking/index.jsx
import React from "react";
import { PALETTE, useConfirmBookingCore } from "./core";
import ConfirmBookingMobile from "./ConfirmBookingMobile";
import ConfirmBookingDesktop from "./ConfirmBookingDesktop";

const ConfirmBooking = () => {
  // 🔁 All original logic (state, effects, seat lock, submit, etc.)
  // now lives inside this hook in ./core.jsx
  const core = useConfirmBookingCore();

  const { missingData, bus, date, navigate } = core;

  // ⛔ missingData fallback — EXACT same UI as your original component
  if (missingData) {
    return (
      <div className="text-center mt-10">
        <p className="font-semibold" style={{ color: PALETTE.primary }}>
          Booking details are incomplete. Returning to search results.
        </p>
        <button
          onClick={() => {
            const params = new URLSearchParams({
              from: bus?.from || "",
              to: bus?.to || "",
              date: date || "",
            }).toString();
            navigate(`/search-results?${params}`);
          }}
          className="mt-4 px-4 py-2 rounded-md text-white"
          style={{ background: PALETTE.primary }}
        >
          Go to Search Results
        </button>
      </div>
    );
  }

  // 📱 + 🖥 Split UI: same data/logic, different layouts
  return (
    <>
      {/* Mobile layout */}
      <div className="sm:hidden">
        <ConfirmBookingMobile {...core} />
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:block">
        <ConfirmBookingDesktop {...core} />
      </div>
    </>
  );
};

export default ConfirmBooking;
