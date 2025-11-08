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
import { API_ORIGIN } from "../../../api"; // ✅ used to build absolute image URLs

/* ──────────────────────────────────────────────────────────────
   Small local UI helpers (no external deps)
   ────────────────────────────────────────────────────────────── */
const Chip = ({ children }) => (
  <span className="px-2 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs">
    {children}
  </span>
);

const LabelValue = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900 truncate">{value}</div>
    </div>
  );
};

// ⬇️ Memoized gallery rail
const GalleryRail = React.memo(({ images = [] }) => {
  if (!images?.length) return null;
  return (
    <div className="mt-3">
      <div className="text-sm font-semibold text-gray-800 mb-2">Gallery</div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`gallery-${i}`}
            className="h-20 w-28 flex-none rounded-lg object-cover border border-gray-200"
            loading="lazy"
            decoding="async"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ))}
      </div>
    </div>
  );
});

/* ──────────────────────────────────────────────────────────────
   Robust image URL normalizer
   ────────────────────────────────────────────────────────────── */
const isAbs = (s) => /^https?:\/\//i.test(s);
const isProtocolRelative = (s) => /^\/\//.test(s);
const isRootRelative = (s) => /^\//.test(s);

function toAbsolute(src) {
  if (!src) return null;
  let s = typeof src === "string" ? src.trim() : src.url || "";

  if (!s) return null;
  if (isAbs(s)) return s;
  if (isProtocolRelative(s)) return `https:${s}`;
  if (isRootRelative(s)) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s.replace(/^\.\//, "")}`;
}

function normalizeGallery(list = []) {
  const arr = (Array.isArray(list) ? list : []).map((item) => toAbsolute(item));
  return arr.filter(Boolean);
}

export default function MobileBottomSheet({ hideSteps }) {
  const {
    from,
    to,
    searchDateParam,
    expandedBusId,
    setExpandedBusId,
    handleSeatToggle,
    handleBoardingPointSelect,
    handleDroppingPointSelect,
    handleProceedToPayment,
    handleToggleSeatLayout, // ✅ use same close logic as core seat layout

    // ✅ precomputed from core – no re-deriving here
    selectedBus,
    selectedAvailability,
    selectedBookingData,
    currentMobileStep,
    setCurrentMobileStep,

    // ✅ safe global release helper (still available if ever needed)
    releaseAllSelectedSeats,
  } = useSearchCore();

  // ❗ If nothing is selected, don’t render sheet at all
  if (!expandedBusId || !selectedBus) return null;

  // ----- Labels -----
  const operatorLabel =
    selectedBus?.operator?.fullName ||
    selectedBus?.operator?.email ||
    selectedBus?.owner?.name ||
    "Operator";
  const seatsCount =
    Array.isArray(selectedBus?.seatLayout) && selectedBus?.seatLayout?.length
      ? `${selectedBus.seatLayout.length} seats`
      : null;

  // ----- Media & details (memo) -----
  const { coverUrl, gallery, tags, detailsText, detailsHtml, specs } =
    useMemo(() => {
      if (!selectedBus) {
        return {
          coverUrl: null,
          gallery: [],
          tags: [],
          detailsText: null,
          detailsHtml: null,
          specs: {},
        };
      }

      const imagesArray =
        (Array.isArray(selectedBus?.gallery) && selectedBus.gallery) ||
        (Array.isArray(selectedBus?.galleryPhotos) &&
          selectedBus.galleryPhotos) ||
        (Array.isArray(selectedBus?.images) && selectedBus.images) ||
        (Array.isArray(selectedBus?.media?.gallery) &&
          selectedBus.media.gallery) ||
        [];

      const coverRaw =
        selectedBus?.cover ||
        selectedBus?.coverPhoto ||
        selectedBus?.coverImage ||
        selectedBus?.images?.cover ||
        selectedBus?.media?.cover ||
        imagesArray[0] ||
        null;

      const coverUrlLocal = toAbsolute(coverRaw);
      const galleryLocal = Object.freeze(normalizeGallery(imagesArray));
      const tagsLocal = Array.isArray(selectedBus?.tags)
        ? selectedBus.tags
        : [];
      const detailsTextLocal = selectedBus?.details ?? null;
      const detailsHtmlLocal = selectedBus?.detailsHtml ?? null;
      const specsLocal = selectedBus?.specs || {};

      return {
        coverUrl: coverUrlLocal,
        gallery: galleryLocal,
        tags: tagsLocal,
        detailsText: detailsTextLocal,
        detailsHtml: detailsHtmlLocal,
        specs: specsLocal,
      };
    }, [selectedBus]);

  // ----- Close handler: use core's unified toggle (releases this bus's seats + collapse) -----
  const handleCloseSheet = () => {
    handleToggleSeatLayout(selectedBus);
  };

  // ----- Drop-up helpers -----
  const perSeat = getDisplayPrice(selectedBus, from, to);
  const selSeats = selectedBookingData.selectedSeats || [];
  const selCount = selSeats.length;
  const subtotal =
    selectedBookingData.totalPrice && selectedBookingData.totalPrice > 0
      ? selectedBookingData.totalPrice
      : perSeat * selCount;

  const hasPoints =
    !!selectedBookingData.selectedBoardingPoint &&
    !!selectedBookingData.selectedDroppingPoint;

  const showDropUpSeats = currentMobileStep === 1 && selCount > 0;
  const showDropUpPoints = currentMobileStep === 2 && hasPoints && selCount > 0;

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
                if (currentMobileStep > 1)
                  setCurrentMobileStep(currentMobileStep - 1);
                else handleCloseSheet();
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
                        active
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-500 border-gray-300"
                      }`}
                    >
                      {n}
                    </span>
                    <span
                      className={`text-[11px] sm:text-[12px] truncate w-full text-center ${
                        active ? "text-red-500 font-semibold" : "text-gray-500"
                      }`}
                    >
                      {n === 1
                        ? "Select seats"
                        : n === 2
                        ? "Board/Drop point"
                        : "Passenger info"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content — add bottom padding when any drop-up visible */}
        <div
          className={`flex-1 overflow-y-auto px-4 pt-3 bg-white ${
            showDropUpSeats || showDropUpPoints ? "pb-40" : "pb-6"
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

              {/* ==== Details card (cover, specs, tags, details, gallery) ==== */}
              <div className="mt-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {coverUrl ? (
                  <div className="w-full aspect-[16/9] bg-gray-100">
                    <img
                      src={coverUrl}
                      alt="cover"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                ) : null}

                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {selectedBus?.operatorLogo ? (
                      <img
                        src={toAbsolute(selectedBus.operatorLogo)}
                        alt="operator"
                        className="h-9 w-9 rounded-full object-cover border border-gray-200"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] text-gray-500 truncate">
                            {operatorLabel}
                          </p>
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {selectedBus.name}
                          </h4>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wide text-gray-500">
                            Reg. No.
                          </div>
                          <div className="text-base font-bold text-gray-900 tabular-nums">
                            {selectedBus?.vehicle?.registrationNo ||
                              selectedBus?.specs?.registrationNo ||
                              selectedBus?.registrationNo ||
                              selectedBus?.regNo ||
                              "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {selectedBus?.busType ? (
                          <Chip>{selectedBus.busType}</Chip>
                        ) : null}
                        {seatsCount ? <Chip>{seatsCount}</Chip> : null}
                        {selectedBus?.features?.wifi ? (
                          <Chip>Wi-Fi</Chip>
                        ) : null}
                        {selectedBus?.features?.chargingPort ? (
                          <Chip>Charging Port</Chip>
                        ) : null}
                        {tags.map((t, i) => (
                          <Chip key={i}>{t}</Chip>
                        ))}
                      </div>

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

                      {(specs?.make ||
                        specs?.model ||
                        specs?.year ||
                        specs?.registrationNo ||
                        specs?.busNo ||
                        specs?.seatCount ||
                        selectedBus?.vehicle?.seatCount ||
                        selectedBus?.vehicle?.make ||
                        selectedBus?.vehicle?.model ||
                        selectedBus?.vehicle?.year) && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <LabelValue
                            label="Make"
                            value={specs.make || selectedBus?.vehicle?.make}
                          />
                          <LabelValue
                            label="Model"
                            value={specs.model || selectedBus?.vehicle?.model}
                          />
                          <LabelValue
                            label="Year"
                            value={specs.year || selectedBus?.vehicle?.year}
                          />
                          <LabelValue
                            label="Registration No."
                            value={
                              specs.registrationNo ||
                              selectedBus?.vehicle?.registrationNo ||
                              selectedBus?.registrationNo ||
                              selectedBus?.regNo
                            }
                          />
                          <LabelValue
                            label="Bus Number"
                            value={specs.busNo}
                          />
                          <LabelValue
                            label="Seat Count"
                            value={
                              specs.seatCount ||
                              selectedBus?.vehicle?.seatCount
                            }
                          />
                        </div>
                      )}

                      {(detailsHtml || detailsText) && (
                        <div className="mt-4">
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            About this bus
                          </div>
                          {detailsHtml ? (
                            <div
                              className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 text-gray-700"
                              dangerouslySetInnerHTML={{ __html: detailsHtml }}
                            />
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {detailsText}
                            </p>
                          )}
                        </div>
                      )}

                      <GalleryRail images={gallery} />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

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
              {/* ==== END details block ==== */}
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
              {/* ❌ Removed old Back/Proceed footer — replaced by drop-up */}
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

        {/* 🔻 Redbus-style DROP-UP — FLUSH (no curves/border/shadow), seats step */}
        <AnimatePresence>
          {showDropUpSeats && (
            <motion.div
              key="rb-dropup-seats"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="fixed left-0 right-0 bottom-0 z-[10002]"
            >
              <div
                className="w-full bg-white"
                style={{
                  paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
                }}
              >
                <div className="pt-2 flex justify-center">
                  <span className="h-1.5 w-12 rounded-full bg-gray-300" />
                </div>

                <div className="px-4 pt-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">
                        {selCount} {selCount === 1 ? "seat" : "seats"} selected
                      </div>
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

                  <button
                    onClick={() => setCurrentMobileStep(2)}
                    className="mt-3 w-11/12 mx-auto block px-4 py-3 rounded-xl font-bold text-white"
                    style={{ background: PALETTE.primaryRed }}
                  >
                    Select boarding &amp; dropping points
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔻 Redbus-style DROP-UP — FLUSH, points step */}
        <AnimatePresence>
          {showDropUpPoints && (
            <motion.div
              key="rb-dropup-points"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="fixed left-0 right-0 bottom-0 z-[10002]"
            >
              <div
                className="w-full bg-white"
                style={{
                  paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
                }}
              >
                <div className="pt-2 flex justify-center">
                  <span className="h-1.5 w-12 rounded-full bg-gray-300" />
                </div>

                <div className="px-4 pt-2">
                  {/* Top row shows selected points (compact) and total */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">
                        Points selected
                      </div>
                      <div className="text-sm text-gray-900 truncate">
                        {selectedBookingData.selectedBoardingPoint?.point} →{" "}
                        {selectedBookingData.selectedDroppingPoint?.point}
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

                  {/* CTA mirrors seats step style */}
                  <button
                    onClick={() => setCurrentMobileStep(3)}
                    className="mt-3 w-11/12 mx-auto block px-4 py-3 rounded-xl font-bold text-white"
                    style={{ background: PALETTE.primaryRed }}
                  >
                    Check booking summary
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
