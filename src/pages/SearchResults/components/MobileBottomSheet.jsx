// src/pages/SearchResults/components/MobileBottomSheet.jsx
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaTimes } from "react-icons/fa";

import SeatLayout from "../../../components/SeatLayout";
import SeatLegend from "../../../components/SeatLegend";
import BookingSummary from "../../../components/BookingSummary";
import PointSelection from "../../../components/PointSelection";

import { useSearchCore, PALETTE, getDisplayPrice } from "../_core";

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

  // -------- resolve selected bus (id + time encoded in expandedBusId) --------
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

  const selectedBookingData =
    (expandedBusId && busSpecificBookingData[expandedBusId]) || {
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

  const handleCloseSheet = () => {
    const seats = busSpecificBookingData[expandedBusId]?.selectedSeats || [];
    if (seats.length) {
      releaseSeats(selectedBus, seats).finally(() => setExpandedBusId(null));
    } else {
      setExpandedBusId(null);
    }
  };

  // ----- Redbus "drop-up" helpers -----
  const perSeat = getDisplayPrice(selectedBus, from, to);
  const selSeats = selectedBookingData.selectedSeats || [];
  const selCount = selSeats.length;
  const subtotal =
    selectedBookingData.totalPrice && selectedBookingData.totalPrice > 0
      ? selectedBookingData.totalPrice
      : perSeat * selCount;

  const showDropUp = currentMobileStep === 1 && selCount > 0;

  // ----- Derived labels for details card -----
  const operatorLabel =
    selectedBus?.operator?.fullName ||
    selectedBus?.operator?.email ||
    selectedBus?.owner?.name ||
    "Operator";
  const seatsCount =
    Array.isArray(selectedBus?.seatLayout) && selectedBus.seatLayout.length
      ? `${selectedBus.seatLayout.length} seats`
      : null;

  return createPortal(
    expandedBusId ? (
      <motion.div
        key={`mobile-sheet-${expandedBusId}`}
        className="fixed inset-0 z-[10001] md:hidden flex flex-col bg-white"
        initial={{ opacity: 0.99 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="pt-3 pb-2 px-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentMobileStep > 1) setCurrentMobileStep(currentMobileStep - 1);
                else handleCloseSheet();
              }}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Back"
            >
              <FaChevronLeft />
            </button>

            <div className="min-w-0 px-2 text-center">
              <h3 className="text-base font-semibold truncate" style={{ color: PALETTE.textDark }}>
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

          {!hideSteps && (
            <div className="mt-3 flex items-center justify-between">
              {[1, 2, 3].map((n) => {
                const active = currentMobileStep === n;
                return (
                  <button
                    key={n}
                    onClick={() => setCurrentMobileStep(n)}
                    className="flex-1 flex flex-col items-center px-1"
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full border text-[12px] font-bold mb-1 ${
                        active ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-500 border-gray-300"
                      }`}
                    >
                      {n}
                    </span>
                    <span
                      className={`text-[11px] sm:text-[12px] truncate w-full text-center ${
                        active ? "text-red-500 font-semibold" : "text-gray-500"
                      }`}
                    >
                      {n === 1 ? "Select seats" : n === 2 ? "Board/Drop point" : "Passenger info"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content — add bottom padding ONLY when drop-up is visible */}
        <div
          className={`flex-1 overflow-y-auto px-4 pt-3 bg-white ${
            showDropUp ? "pb-36" : currentMobileStep === 1 ? "pb-6" : "pb-6"
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
                  selectedSeats={selSeats}
                  onSeatClick={(seat) => handleSeatToggle(selectedBus, seat)}
                  bookedSeatGenders={selectedAvailability?.seatGenderMap || {}}
                  selectedSeatGenders={selectedBookingData.seatGenders || {}}
                />
              </div>

              {/* ==== NEW: Bus details card (Redbus-style) ==== */}
              <div className="mt-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* logo (if present) */}
                    {selectedBus?.operatorLogo ? (
                      <img
                        src={selectedBus.operatorLogo}
                        alt="operator"
                        className="h-8 w-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] text-gray-500 truncate">{operatorLabel}</p>
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {selectedBus.name}
                          </h4>
                        </div>
                        {/* price block */}
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wide text-gray-500">Starts at</div>
                          <div className="text-base font-bold text-gray-900 tabular-nums">
                            Rs. {perSeat}
                          </div>
                        </div>
                      </div>

                      {/* tags / meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                          {selectedBus.busType || "Bus"}
                        </span>
                        {seatsCount ? (
                          <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                            {seatsCount}
                          </span>
                        ) : null}
                        {selectedBus?.features?.wifi ? (
                          <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                            Wi-Fi
                          </span>
                        ) : null}
                        {selectedBus?.features?.chargingPort ? (
                          <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                            Charging Port
                          </span>
                        ) : null}
                      </div>

                      {/* times + route */}
                      <div className="mt-3 grid grid-cols-3 items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {selectedBus.departureTime}
                        </div>
                        <div className="text-center text-[11px] text-gray-500">
                          {from} → {to}
                        </div>
                        <div className="text-right text-sm font-medium text-gray-900">
                          {selectedBus.arrivalTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* divider */}
                <div className="h-px bg-gray-100" />

                {/* footer row (small tip / offer) */}
                {selectedBus?.trendingOffer?.isActive ? (
                  <div className="px-4 py-2 text-[12px] text-green-700 bg-green-50">
                    {selectedBus.trendingOffer.message || "Offer available"}
                  </div>
                ) : (
                  <div className="px-4 py-2 text-[12px] text-gray-500 bg-gray-50">
                    Review points and proceed when ready.
                  </div>
                )}
              </div>
              {/* ==== END Bus details card ==== */}
            </div>
          )}

          {/* STEP 2: Points */}
          {currentMobileStep === 2 && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                <PointSelection
                  boardingPoints={selectedBus.boardingPoints}
                  droppingPoints={selectedBus.droppingPoints}
                  selectedBoardingPoint={selectedBookingData.selectedBoardingPoint}
                  setSelectedBoardingPoint={(p) => handleBoardingPointSelect(selectedBus, p)}
                  selectedDroppingPoint={selectedBookingData.selectedDroppingPoint}
                  setSelectedDroppingPoint={(p) => handleDroppingPointSelect(selectedBus, p)}
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
                    selCount === 0
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
                <BookingSummary
                  bus={selectedBus}
                  selectedSeats={selSeats}
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

        {/* 🔻 Redbus-style DROP-UP (only Step 1 and only when ≥1 seat selected) */}
        <AnimatePresence>
          {showDropUp && (
            <motion.div
              key="rb-dropup"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="fixed left-0 right-0 bottom-0 z-[10002]"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* shadow + rounded top, very Redbus-like */}
              <div className="mx-3 mb-3 rounded-2xl border border-gray-200 bg-white shadow-lg">
                {/* drag handle */}
                <div className="pt-2 flex justify-center">
                  <span className="h-1.5 w-12 rounded-full bg-gray-300" />
                </div>

                <div className="px-4 pb-4 pt-2">
                  {/* top row: seat chips + price */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        {selSeats.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 border border-gray-200 text-gray-700"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1.5 text-xs text-gray-500">
                        {selCount} {selCount === 1 ? "seat" : "seats"} selected
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">
                        Total
                      </div>
                      <div className="text-lg font-bold tabular-nums text-gray-900">
                        Rs. {subtotal}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => setCurrentMobileStep(2)}
                    className="mt-3 w-full px-4 py-3 rounded-xl font-bold text-white"
                    style={{ background: PALETTE.primaryRed }}
                  >
                    Select boarding &amp; dropping points
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    ) : null,
    document.body
  );
}
