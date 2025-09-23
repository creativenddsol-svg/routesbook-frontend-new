import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FaChevronLeft, FaTimes } from "react-icons/fa";

import SeatLegend from "../../components/SeatLegend";
import SeatLayout from "../../components/SeatLayout";
import PointSelection from "../../components/PointSelection";
import BookingSummary from "../../components/BookingSummary";

/**
 * Props:
 * - open: boolean
 * - bus: bus object
 * - availability: { bookedSeats?: string[], seatGenderMap?: object }
 * - bookingData: {
 *     selectedSeats: string[],
 *     seatGenders: Record<string,"M"|"F">,
 *     selectedBoardingPoint: any,
 *     selectedDroppingPoint: any,
 *     basePrice: number,
 *     convenienceFee: number,
 *     totalPrice: number
 *   }
 * - currentStep: 1 | 2 | 3
 * - setStep: (n:number) => void
 * - onSeatToggle: (seatId:string|number) => void
 * - onBoarding: (point:any) => void
 * - onDropping: (point:any) => void
 * - onProceed: () => void
 * - onClose: () => void
 * - from, to: strings (for header line)
 * - date?: 'YYYY-MM-DD' (optional, passed to BookingSummary if needed)
 * - PALETTE?: color tokens (optional)
 */
export default function MobileBottomSheet({
  open,
  bus,
  availability = {},
  bookingData = {
    selectedSeats: [],
    seatGenders: {},
    selectedBoardingPoint: null,
    selectedDroppingPoint: null,
    basePrice: 0,
    convenienceFee: 0,
    totalPrice: 0,
  },
  currentStep = 1,
  setStep,
  onSeatToggle,
  onBoarding,
  onDropping,
  onProceed,
  onClose,
  from,
  to,
  date,
  PALETTE = {
    primaryRed: "#D84E55",
    accentBlue: "#3A86FF",
    textDark: "#1A1A1A",
    textLight: "#4B5563",
    bgLight: "#F0F2F5",
    borderLight: "#E9ECEF",
    white: "#FFFFFF",
  },
}) {
  // Only render on mobile (to mirror the original behavior)
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : true;
  if (!open || !bus || !isMobile) return null;

  const inactive = "#6B7280";
  const active = PALETTE.primaryRed;

  const handleBack = () => {
    if (currentStep > 1) setStep(currentStep - 1);
    else onClose();
  };

  return createPortal(
    <motion.div
      key={`mobile-sheet-${bus._id}-${bus.departureTime}`}
      className="fixed inset-0 z-[10001] md:hidden flex flex-col bg-white overscroll-contain"
      initial={false}
      animate={{ opacity: 1 }}
      style={{
        touchAction: "none",
        willChange: "opacity, transform",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Header */}
      <div className="pt-3 pb-2 px-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
            aria-label="Back"
            type="button"
          >
            <FaChevronLeft />
          </button>

          <div className="min-w-0 px-2 text-center">
            <h3 className="text-base font-semibold truncate" style={{ color: PALETTE.textDark }}>
              {bus.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {from} → {to} • {bus.departureTime}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
            aria-label="Close"
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        {/* Stepper */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => {
            const isActive = currentStep === n;
            return (
              <button
                key={n}
                onClick={() => setStep(n)}
                className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg border"
                style={{
                  borderColor: isActive ? active : "#E5E7EB",
                  background: isActive ? "#FFF5F5" : "#FFFFFF",
                  color: isActive ? active : inactive,
                  fontWeight: 700,
                  fontSize: 12,
                }}
                type="button"
              >
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full border"
                  style={{
                    borderColor: isActive ? active : "#D1D5DB",
                    background: isActive ? active : "#FFF",
                    color: isActive ? "#FFF" : inactive,
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {n}
                </span>
                <span className="truncate">
                  {n === 1 ? "Select Seats" : n === 2 ? "Select Points" : "Summary"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 bg-white" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* STEP 1: Seats */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <SeatLegend />
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <SeatLayout
                seatLayout={bus.seatLayout}
                bookedSeats={[...(availability?.bookedSeats || [])]}
                selectedSeats={bookingData.selectedSeats}
                onSeatClick={(seat) => onSeatToggle && onSeatToggle(seat)}
                bookedSeatGenders={availability?.seatGenderMap || {}}
                selectedSeatGenders={bookingData.seatGenders || {}}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Selected: <b>{bookingData.selectedSeats.length}</b>
              </span>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg font-bold text-white disabled:opacity-60"
                style={{ background: PALETTE.primaryRed }}
                disabled={bookingData.selectedSeats.length === 0}
                type="button"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Points */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <PointSelection
              boardingPoints={bus.boardingPoints}
              droppingPoints={bus.droppingPoints}
              selectedBoardingPoint={bookingData.selectedBoardingPoint}
              setSelectedBoardingPoint={(p) => onBoarding && onBoarding(p)}
              selectedDroppingPoint={bookingData.selectedDroppingPoint}
              setSelectedDroppingPoint={(p) => onDropping && onDropping(p)}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg font-bold"
                style={{ color: PALETTE.textLight, background: "#F3F4F6" }}
                type="button"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-lg font-bold text-white disabled:opacity-60"
                style={{ background: PALETTE.primaryRed }}
                disabled={
                  !bookingData.selectedBoardingPoint ||
                  !bookingData.selectedDroppingPoint ||
                  bookingData.selectedSeats.length === 0
                }
                type="button"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Summary */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <BookingSummary
              bus={bus}
              selectedSeats={bookingData.selectedSeats}
              date={date}
              basePrice={bookingData.basePrice}
              convenienceFee={bookingData.convenienceFee}
              totalPrice={bookingData.totalPrice}
              onProceed={onProceed}
              boardingPoint={bookingData.selectedBoardingPoint}
              droppingPoint={bookingData.selectedDroppingPoint}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg font-bold"
                style={{ color: PALETTE.textLight, background: "#F3F4F6" }}
                type="button"
              >
                Back
              </button>
              <button
                onClick={onProceed}
                className="px-4 py-2 rounded-lg font-bold text-white disabled:opacity-60"
                style={{ background: PALETTE.primaryRed }}
                disabled={
                  bookingData.selectedSeats.length === 0 ||
                  !bookingData.selectedBoardingPoint ||
                  !bookingData.selectedDroppingPoint ||
                  bookingData.totalPrice <= 0
                }
                type="button"
              >
                Proceed
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
