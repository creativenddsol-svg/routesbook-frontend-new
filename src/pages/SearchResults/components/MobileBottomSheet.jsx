// src/pages/SearchResults/components/MobileBottomSheet.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaTimes } from "react-icons/fa";

import SeatLayout from "../../../components/SeatLayout";
import SeatLegend from "../../../components/SeatLegend";
import BookingSummary from "../../../components/BookingSummary";
import PointSelection from "../../../components/PointSelection";

import { useSearchCore, PALETTE, getDisplayPrice } from "../_core"; // ✅ bring getDisplayPrice

export default function MobileBottomSheet({ hideSteps }) {
  const {
    from,
    to,
    searchDateParam,
    buses,
    availability,
    expandedBusId,
    setExpandedBusId,
    busSpecificBookingData,
    mobileSheetStepByBus,
    setMobileSheetStepByBus,
    handleSeatToggle,
    handleBoardingPointSelect,
    handleDroppingPointSelect,
    handleProceedToPayment,
    releaseSeats,
  } = useSearchCore();

  /* ---------------- Mobile bottom sheet (portaled) ---------------- */
  const selectedBus = useMemo(() => {
    if (!expandedBusId) return null;
    const lastDash = expandedBusId.lastIndexOf("-");
    const id = lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
    const time = lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";
    return buses.find((b) => b._id === id && b.departureTime === time) || null;
  }, [expandedBusId, buses]);

  const selectedAvailability = expandedBusId
    ? availability[expandedBusId] || {}
    : {};

  const selectedBookingData = (expandedBusId &&
    busSpecificBookingData[expandedBusId]) || {
    selectedSeats: [],
    seatGenders: {},
    selectedBoardingPoint: selectedBus?.boardingPoints?.[0] || null,
    selectedDroppingPoint: selectedBus?.droppingPoints?.[0] || null,
    basePrice: 0,
    convenienceFee: 0,
    totalPrice: 0,
  };

  const currentMobileStep =
    (expandedBusId && mobileSheetStepByBus[expandedBusId]) || 1;

  const setCurrentMobileStep = (n) =>
    setMobileSheetStepByBus((prev) => ({ ...prev, [expandedBusId]: n }));

  if (!selectedBus) return null;

  // 🔁 ensure seat locks are released when the sheet is closed from mobile
  const handleCloseSheet = () => {
    const seats = busSpecificBookingData[expandedBusId]?.selectedSeats || [];
    if (seats.length) {
      releaseSeats(selectedBus, seats).finally(() => setExpandedBusId(null));
    } else {
      setExpandedBusId(null);
    }
  };

  // —— helpers for sticky bar (Redbus-style) ——
  const perSeat = getDisplayPrice(selectedBus, from, to);
  const selCount = selectedBookingData.selectedSeats.length;
  const computedSubtotal =
    selectedBookingData.totalPrice && selectedBookingData.totalPrice > 0
      ? selectedBookingData.totalPrice
      : perSeat * selCount;

  return createPortal(
    expandedBusId ? (
      <motion.div
        key={`mobile-sheet-${expandedBusId}`}
        className="fixed inset-0 z-[10001] md:hidden flex flex-col bg-white overscroll-contain"
        style={{
          touchAction: "none",
          willChange: "opacity, transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
        initial={false}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="pt-3 pb-2 px-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentMobileStep > 1) {
                  setCurrentMobileStep(currentMobileStep - 1);
                } else {
                  handleCloseSheet();
                }
              }}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Back"
            >
              <FaChevronLeft />
            </button>

            <div className="min-w-0 px-2 text-center">
              <h3
                className="text-base font-semibold truncate"
                style={{ color: PALETTE.textDark }}
              >
                {selectedBus.name}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {from} → {to} • {selectedBus.departureTime}
              </p>
            </div>

            <button
              onClick={handleCloseSheet}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          {/* Stepper — hidden when hideSteps is true */}
          {!hideSteps && (
            <div className="mt-3 flex items-center justify-between">
              {[1, 2, 3].map((n) => {
                const activeStep = currentMobileStep === n;
                return (
                  <button
                    key={n}
                    onClick={() => setCurrentMobileStep(n)}
                    className="flex-1 flex flex-col items-center px-1"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-[12px] font-bold mb-1 ${
                        activeStep
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-500 border-gray-300"
                      }`}
                    >
                      {n}
                    </span>
                    <span
                      className={`text-[11px] sm:text-[12px] truncate w-full text-center ${
                        activeStep
                          ? "text-red-500 font-semibold"
                          : "text-gray-500"
                      }`}
                      title={
                        n === 1
                          ? "Select Seats"
                          : n === 2
                          ? "Select Points"
                          : "Summary"
                      }
                    >
                      {n === 1
                        ? "Select Seats"
                        : n === 2
                        ? "Select Points"
                        : "Summary"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content (extra bottom padding on Step 1 so sticky bar never covers seats) */}
        <div
          className={`flex-1 overflow-y-auto px-4 pt-3 bg-white ${
            currentMobileStep === 1 ? "pb-28" : "pb-6"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* STEP 1: Seats */}
          {currentMobileStep === 1 && (
            <div className="space-y-3">
              <SeatLegend />
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <SeatLayout
                  seatLayout={selectedBus.seatLayout}
                  bookedSeats={[...(selectedAvailability?.bookedSeats || [])]}
                  selectedSeats={selectedBookingData.selectedSeats}
                  onSeatClick={(seat) => handleSeatToggle(selectedBus, seat)}
                  bookedSeatGenders={selectedAvailability?.seatGenderMap || {}}
                  selectedSeatGenders={selectedBookingData.seatGenders || {}}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Points */}
          {currentMobileStep === 2 && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                <PointSelection
                  boardingPoints={selectedBus.boardingPoints}
                  droppingPoints={selectedBus.droppingPoints}
                  selectedBoardingPoint={
                    selectedBookingData.selectedBoardingPoint
                  }
                  setSelectedBoardingPoint={(p) =>
                    handleBoardingPointSelect(selectedBus, p)
                  }
                  selectedDroppingPoint={
                    selectedBookingData.selectedDroppingPoint
                  }
                  setSelectedDroppingPoint={(p) =>
                    handleDroppingPointSelect(selectedBus, p)
                  }
                />
              </div>
              <div className="flex items-center justify-between border-t pt-3 bg-white">
                <button
                  onClick={() => setCurrentMobileStep(1)}
                  className="px-4 py-2 rounded-lg font-bold"
                  style={{ color: PALETTE.textLight, background: "#F3F4F6" }}
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentMobileStep(3)}
                  className="px-4 py-2 rounded-lg font-bold text-white disabled:opacity-60"
                  style={{ background: PALETTE.primaryRed }}
                  disabled={
                    !selectedBookingData.selectedBoardingPoint ||
                    !selectedBookingData.selectedDroppingPoint ||
                    selectedBookingData.selectedSeats.length === 0
                  }
                >
                  Proceed
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary */}
          {currentMobileStep === 3 && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {/* 🚫 Removed onProceed to avoid duplicate button */}
                <BookingSummary
                  bus={selectedBus}
                  selectedSeats={selectedBookingData.selectedSeats}
                  date={searchDateParam}
                  basePrice={selectedBookingData.basePrice}
                  convenienceFee={selectedBookingData.convenienceFee}
                  totalPrice={selectedBookingData.totalPrice}
                  boardingPoint={selectedBookingData.selectedBoardingPoint}
                  droppingPoint={selectedBookingData.selectedDroppingPoint}
                />
              </div>

              <div className="border-t pt-3 bg-white">
                <button
                  onClick={() => handleProceedToPayment(selectedBus)}
                  className="w-full px-4 py-3 rounded-xl font-bold text-white disabled:opacity-60"
                  style={{ background: PALETTE.primaryRed }}
                >
                  Continue to Passenger Info
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🔴 Sticky CTA bar (Redbus-style) — only visible on Step 1 */}
        {currentMobileStep === 1 && (
          <div
            className="sticky bottom-0 left-0 right-0 z-[10002] bg-white/95 backdrop-blur border-t"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="px-4 py-3 flex items-center gap-3">
              {/* Left: small summary pill(s) */}
              <div className="flex-1 min-w-0">
                {selCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: "#FEE2E2", color: PALETTE.primaryRed }}
                    >
                      {selCount} {selCount === 1 ? "seat" : "seats"} selected
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-gray-900">
                      Rs. {computedSubtotal}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">
                    Select at least one seat to continue
                  </span>
                )}
              </div>

              {/* Right: big red CTA */}
              <button
                onClick={() => setCurrentMobileStep(2)}
                disabled={selCount === 0}
                className="flex-shrink-0 px-4 py-3 rounded-xl font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: PALETTE.primaryRed }}
              >
                Select boarding &amp; dropping points
              </button>
            </div>
          </div>
        )}
      </motion.div>
    ) : null,
    document.body
  );
}
