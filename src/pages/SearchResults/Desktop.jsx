// src/pages/SearchResults/Desktop.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import {
  FaBus,
  FaClock,
  FaRoute,
  FaChevronLeft,
  FaExchangeAlt,
} from "react-icons/fa";

import {
  useSearchCore,
  PALETTE,
  calculateDuration,
  getDisplayPrice,
} from "./_core";

import BookingDeadlineTimer from "./components/BookingDeadlineTimer";
import FilterPanel from "./components/FilterPanel";
import SpecialNoticesSection from "./components/SpecialNoticesSection";

import SeatLayout from "../../components/SeatLayout";
import SeatLegend from "../../components/SeatLegend";
import BookingSummary from "../../components/BookingSummary";
import PointSelection from "./components/PointSelection"; // keep same path as your project
import { API_ORIGIN } from "../../api";

/* ————————————————————————————————
   Small skeleton while loading
——————————————————————————————— */
const BusCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 animate-pulse border border-gray-300">
    <div className="flex justify-between items-start">
      <div className="flex-1 pr-4">
        <div className="h-6 w-3/5 rounded bg-gray-200 mb-4" />
        <div className="h-4 w-4/5 rounded bg-gray-200" />
      </div>
      <div className="h-10 w-24 rounded-lg bg-gray-200" />
    </div>
    <div className="border-t border-dashed my-5 border-gray-200" />
    <div className="flex justify-between items-center">
      <div className="flex gap-4">
        <div className="h-8 w-24 rounded-full bg-gray-200" />
        <div className="h-8 w-24 rounded-full bg-gray-200" />
      </div>
      <div className="h-12 w-32 rounded-lg bg-gray-200" />
    </div>
  </div>
);

const listVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

/* ──────────────────────────────────────────────────────────────
   Helpers reused from mobile sheet (robust absolute image URLs)
   (kept local to avoid cross-file imports)
   ────────────────────────────────────────────────────────────── */
const isAbs = (s) => /^https?:\/\//i.test(s || "");
const isProtocolRelative = (s) => /^\/\//.test(s || "");
const isRootRelative = (s) => /^\//.test(s || "");

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

export default function Desktop() {
  const {
    // routing/search context
    navigate,
    from,
    to,

    // options + inputs
    fromOptions,
    toOptions,
    searchFrom,
    setSearchFrom,
    searchTo,
    setSearchTo,
    dateInputRef,
    handleDateContainerClick,

    // data
    loading,
    fetchError,
    visibleBuses,
    sortedBuses,
    availability,
    fetchData,

    // filters
    sortBy,
    setSortBy,
    activeFilterCount,

    // sticky bits
    stickySearchCardRef,
    stickySearchCardOwnHeight,

    // booking state/actions
    expandedBusId,
    handleToggleSeatLayout,
    handleSeatToggle,
    busSpecificBookingData,
    handleBoardingPointSelect,
    handleDroppingPointSelect,
    handleProceedToPayment,
    searchDateParam,
  } = useSearchCore();

  // per-bus "More details" toggle (only affects the details panel under seat layout)
  const [detailsOpenByBus, setDetailsOpenByBus] = useState({});
  const isDetailsOpen = (busKey) => !!detailsOpenByBus[busKey];
  const toggleDetails = (busKey) =>
    setDetailsOpenByBus((p) => ({ ...p, [busKey]: !p[busKey] }));

  const selectStyles = {
    control: (p) => ({
      ...p,
      border: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      minHeight: "auto",
      height: "auto",
      cursor: "pointer",
    }),
    valueContainer: (p) => ({ ...p, padding: "0" }),
    placeholder: (p) => ({
      ...p,
      color: PALETTE.textLight,
      fontSize: "16px",
      fontWeight: "500",
    }),
    singleValue: (p) => ({
      ...p,
      color: PALETTE.textDark,
      fontSize: "18px",
      fontWeight: "600",
    }),
    menu: (p) => ({
      ...p,
      borderRadius: "12px",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    }),
    menuPortal: (p) => ({ ...p, zIndex: 9999 }),
    option: (p, state) => ({
      ...p,
      backgroundColor: state.isSelected
        ? PALETTE.primaryRed
        : state.isFocused
        ? "#FEE2E2"
        : PALETTE.white,
      color: state.isSelected ? PALETTE.white : PALETTE.textDark,
      cursor: "pointer",
      padding: "12px 16px",
      transition: "background-color 0.2s ease, color 0.2s ease",
    }),
  };

  const filterPanelTopOffset = useMemo(
    () => stickySearchCardOwnHeight + 16,
    [stickySearchCardOwnHeight]
  );

  const renderCards = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <BusCardSkeleton key={i} />
      ));
    }
    if (fetchError) {
      return (
        <div className="text-center p-10 bg-white rounded-2xl shadow">
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: PALETTE.textDark }}
          >
            Oops! Something went wrong.
          </h3>
          <p className="mb-6" style={{ color: PALETTE.textLight }}>
            {fetchError}
          </p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 font-semibold rounded-lg text-white"
            style={{ backgroundColor: PALETTE.accentBlue }}
          >
            Try again
          </button>
        </div>
      );
    }
    if (!visibleBuses.length) {
      return (
        <div className="text-center p-10 bg-white rounded-2xl shadow">
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: PALETTE.textDark }}
          >
            {activeFilterCount
              ? "No Buses Match Your Filters"
              : "No Buses Available"}
          </h3>
          <p className="mb-6" style={{ color: PALETTE.textLight }}>
            {activeFilterCount
              ? "Try adjusting or resetting your filters."
              : "No buses were found for this route on the selected date."}
          </p>
        </div>
      );
    }

    return (
      <motion.div variants={listVariants} initial="hidden" animate="visible">
        {visibleBuses.map((bus) => {
          const busKey = `${bus._id}-${bus.departureTime}`;
          const displayPrice = getDisplayPrice(bus, from, to);

          // Timer within 12h window
          let timerProps = null;
          if (searchDateParam && bus.departureTime) {
            const now = new Date();
            const [h, m] = bus.departureTime.split(":").map(Number);
            const [yy, mm, dd] = searchDateParam.split("-").map(Number);
            const dep = new Date(yy, mm - 1, dd, h, m).getTime();
            const diffHrs = (dep - now.getTime()) / (1000 * 60 * 60);
            if (diffHrs > 0 && diffHrs <= 12) {
              timerProps = {
                deadlineTimestamp: dep - 60 * 60 * 1000,
                departureTimestamp: dep,
                onDeadline: fetchData,
              };
            }
          }

          const a = availability?.[busKey];
          const availableSeats = a?.available;
          const availableWindowSeats = a?.window;
          const isSoldOut = availableSeats === 0;

          const currentBusBookingData = busSpecificBookingData[busKey] || {
            selectedSeats: [],
            seatGenders: {},
            selectedBoardingPoint: bus.boardingPoints?.[0] || null,
            selectedDroppingPoint: bus.droppingPoints?.[0] || null,
            basePrice: 0,
            convenienceFee: 0,
            totalPrice: 0,
          };

          const hasStrike =
            typeof bus.originalPrice === "number" &&
            bus.originalPrice > displayPrice;

          // derive media/details (stable by bus identity)
          const {
            coverUrl,
            gallery,
            tags,
            detailsText,
            detailsHtml,
            specs,
            seatsCount,
            operatorLabel,
          } = useMemo(() => {
            const imagesArray =
              (Array.isArray(bus?.gallery) && bus.gallery) ||
              (Array.isArray(bus?.galleryPhotos) && bus.galleryPhotos) ||
              (Array.isArray(bus?.images) && bus.images) ||
              (Array.isArray(bus?.media?.gallery) && bus.media.gallery) ||
              [];

            const coverRaw =
              bus?.cover ||
              bus?.coverPhoto ||
              bus?.coverImage ||
              bus?.images?.cover ||
              bus?.media?.cover ||
              imagesArray[0] ||
              null;

            const _coverUrl = toAbsolute(coverRaw);
            const _gallery = Object.freeze(normalizeGallery(imagesArray));
            const _tags = Array.isArray(bus?.tags) ? bus.tags : [];
            const _detailsText = bus?.details ?? null;
            const _detailsHtml = bus?.detailsHtml ?? null;
            const _specs = bus?.specs || {};
            const _seatsCount =
              Array.isArray(bus?.seatLayout) && bus?.seatLayout?.length
                ? `${bus.seatLayout.length} seats`
                : null;
            const _operatorLabel =
              bus?.operator?.fullName ||
              bus?.operator?.email ||
              bus?.owner?.name ||
              "Operator";

            return {
              coverUrl: _coverUrl,
              gallery: _gallery,
              tags: _tags,
              detailsText: _detailsText,
              detailsHtml: _detailsHtml,
              specs: _specs,
              seatsCount: _seatsCount,
              operatorLabel: _operatorLabel,
            };
          }, [bus?._id]);

          return (
            <motion.div
              key={busKey}
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md mb-4"
            >
              {/* Desktop card */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 flex items-center justify-center">
                        {bus.operatorLogo ? (
                          <img
                            src={bus.operatorLogo}
                            alt={`${bus.name} logo`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <FaBus className="text-3xl text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {bus.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-600">
                            {bus.busType}
                          </p>
                        </div>
                        {bus.liveTracking && (
                          <p className="text-xs font-medium mt-1 flex items-center gap-1 text-gray-500">
                            <FaRoute /> Live Tracking
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-1">
                      <div className="flex items-center">
                        <div className="flex flex-col min-w-[84px]">
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">
                            Departs
                          </span>
                          <span className="text-xl font-semibold tabular-nums text-gray-900">
                            {bus.departureTime}
                          </span>
                        </div>
                        <div className="flex-1 mx-3">
                          <div className="h-[2px] w-full rounded bg-gray-200" />
                        </div>
                        <div className="flex flex-col min-w-[84px] text-right">
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">
                            Arrives
                          </span>
                          <span className="text-xl font-semibold tabular-nums text-gray-900">
                            {bus.arrivalTime}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <FaClock />{" "}
                          {calculateDuration(
                            bus.departureTime,
                            bus.arrivalTime
                          )}
                        </span>
                        {typeof availableSeats === "number" && (
                          <span>{availableSeats} seats</span>
                        )}
                        {typeof availableWindowSeats === "number" &&
                          availableWindowSeats > 0 && (
                            <span>{availableWindowSeats} window</span>
                          )}
                      </div>
                    </div>

                    {timerProps && <BookingDeadlineTimer {...timerProps} />}
                  </div>

                  <div className="flex flex-col items-start md:items-end">
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          typeof availableSeats === "number" &&
                          availableSeats > 0
                            ? "#EF4444"
                            : "#9CA3AF",
                      }}
                    >
                      {isSoldOut
                        ? "Sold Out"
                        : availableSeats == null
                        ? "Checking..."
                        : `${availableSeats} Seats Left`}
                    </p>

                    <div className="mt-2 inline-block text-right">
                      {hasStrike && (
                        <div className="text-xs line-through text-gray-400">
                          Rs. {bus.originalPrice}
                        </div>
                      )}
                      <div className="leading-tight">
                        <span className="text-[11px] font-medium mr-1 align-top text-gray-500">
                          Rs.
                        </span>
                        <span className="text-2xl font-bold tabular-nums text-gray-900">
                          {displayPrice}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium mt-0.5 text-gray-500">
                        Onwards
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSeatLayout(bus)}
                      disabled={isSoldOut}
                      className="w-full md:w-auto mt-3 px-6 py-2.5 text-white font-semibold rounded-full transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isSoldOut ? "#9CA3AF" : "#DC2626",
                      }}
                    >
                      {isSoldOut
                        ? "Sold Out"
                        : expandedBusId === busKey
                        ? "Hide Seats"
                        : "View seats"}
                    </button>
                  </div>
                </div>

                {/* Expanded section */}
                {expandedBusId === busKey && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="mt-6 border-t pt-6 border-gray-200"
                    >
                      <div className="grid grid-cols-12 gap-5 items-start">
                        {/* Left: Seat layout with our new Cover + Details block below */}
                        <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                            <SeatLegend />
                            <SeatLayout
                              seatLayout={bus.seatLayout}
                              bookedSeats={[...(a?.bookedSeats || [])]}
                              selectedSeats={
                                currentBusBookingData.selectedSeats
                              }
                              onSeatClick={(seat) =>
                                handleSeatToggle(bus, seat)
                              }
                              bookedSeatGenders={a?.seatGenderMap || {}}
                              selectedSeatGenders={{}}
                            />
                          </div>

                          {/* ==== NEW: Cover + Details block (desktop) ==== */}
                          {coverUrl && (
                            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                              {/* Cover only initially */}
                              <div className="w-full aspect-[16/9] bg-gray-100">
                                <img
                                  src={coverUrl}
                                  alt="cover"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) =>
                                    (e.currentTarget.style.display = "none")
                                  }
                                />
                              </div>

                              <div className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-[13px] text-gray-500 truncate">
                                      {operatorLabel}
                                    </p>
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                      {bus.name}
                                    </h4>
                                  </div>

                                  {/* Reg No. */}
                                  <div className="text-right">
                                    <div className="text-[10px] uppercase tracking-wide text-gray-500">
                                      Reg. No.
                                    </div>
                                    <div className="text-base font-bold text-gray-900 tabular-nums">
                                      {bus?.vehicle?.registrationNo ||
                                        bus?.specs?.registrationNo ||
                                        bus?.registrationNo ||
                                        bus?.regNo ||
                                        "—"}
                                    </div>
                                  </div>
                                </div>

                                {/* Chips row */}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {bus?.busType ? (
                                    <Chip>{bus.busType}</Chip>
                                  ) : null}
                                  {seatsCount ? <Chip>{seatsCount}</Chip> : null}
                                  {bus?.features?.wifi ? (
                                    <Chip>Wi-Fi</Chip>
                                  ) : null}
                                  {bus?.features?.chargingPort ? (
                                    <Chip>Charging Port</Chip>
                                  ) : null}
                                  {tags.map((t, i) => (
                                    <Chip key={i}>{t}</Chip>
                                  ))}
                                </div>

                                {/* Times + route */}
                                <div className="mt-3 grid grid-cols-3 items-center">
                                  <div className="text-sm font-medium text-gray-900">
                                    {bus.departureTime}
                                  </div>
                                  <div className="text-center text-[11px] text-gray-500">
                                    {from} → {to}
                                  </div>
                                  <div className="text-right text-sm font-medium text-gray-900">
                                    {bus.arrivalTime}
                                  </div>
                                </div>

                                {/* Toggle button */}
                                <div className="mt-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleDetails(busKey)}
                                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                                  >
                                    {isDetailsOpen(busKey)
                                      ? "Hide details"
                                      : "More details"}
                                  </button>
                                </div>

                                {/* Expanded details */}
                                <AnimatePresence initial={false}>
                                  {isDetailsOpen(busKey) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{
                                        opacity: 1,
                                        height: "auto",
                                      }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{
                                        duration: 0.25,
                                        ease: "easeInOut",
                                      }}
                                      className="mt-4"
                                    >
                                      {/* Quick specs */}
                                      {(specs?.make ||
                                        specs?.model ||
                                        specs?.year ||
                                        specs?.registrationNo ||
                                        specs?.busNo ||
                                        specs?.seatCount ||
                                        bus?.vehicle?.seatCount ||
                                        bus?.vehicle?.make ||
                                        bus?.vehicle?.model ||
                                        bus?.vehicle?.year) && (
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                          <LabelValue
                                            label="Make"
                                            value={
                                              specs.make || bus?.vehicle?.make
                                            }
                                          />
                                          <LabelValue
                                            label="Model"
                                            value={
                                              specs.model ||
                                              bus?.vehicle?.model
                                            }
                                          />
                                        <LabelValue
                                            label="Year"
                                            value={specs.year || bus?.vehicle?.year}
                                          />
                                          <LabelValue
                                            label="Registration No."
                                            value={
                                              specs.registrationNo ||
                                              bus?.vehicle?.registrationNo ||
                                              bus?.registrationNo ||
                                              bus?.regNo
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
                                              bus?.vehicle?.seatCount
                                            }
                                          />
                                        </div>
                                      )}

                                      {/* About / details */}
                                      {(detailsHtml || detailsText) && (
                                        <div className="mb-4">
                                          <div className="text-sm font-semibold text-gray-800 mb-1">
                                            About this bus
                                          </div>
                                          {detailsHtml ? (
                                            <div
                                              className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0 text-gray-700"
                                              dangerouslySetInnerHTML={{
                                                __html: detailsHtml,
                                              }}
                                            />
                                          ) : (
                                            <p className="text-sm text-gray-700 whitespace-pre-line">
                                              {detailsText}
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {/* Gallery */}
                                      {gallery?.length > 0 && (
                                        <>
                                          <div className="text-sm font-semibold text-gray-800 mb-2">
                                            Gallery
                                          </div>
                                          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                                            {gallery.map((src, i) => (
                                              <img
                                                key={i}
                                                src={src}
                                                alt={`gallery-${i}`}
                                                className="h-24 w-32 flex-none rounded-lg object-cover border border-gray-200"
                                                loading="lazy"
                                                decoding="async"
                                                onError={(e) =>
                                                  (e.currentTarget.style.display =
                                                    "none")
                                                }
                                              />
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          )}
                          {/* ==== /NEW block ==== */}
                        </div>

                        {/* Right: Points + Summary (unchanged) */}
                        <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <PointSelection
                              boardingPoints={bus.boardingPoints}
                              droppingPoints={bus.droppingPoints}
                              selectedBoardingPoint={
                                currentBusBookingData.selectedBoardingPoint
                              }
                              setSelectedBoardingPoint={(p) =>
                                handleBoardingPointSelect(bus, p)
                              }
                              selectedDroppingPoint={
                                currentBusBookingData.selectedDroppingPoint
                              }
                              setSelectedDroppingPoint={(p) =>
                                handleDroppingPointSelect(bus, p)
                              }
                            />
                          </div>
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <BookingSummary
                              bus={bus}
                              selectedSeats={
                                currentBusBookingData.selectedSeats
                              }
                              date={searchDateParam}
                              basePrice={currentBusBookingData.basePrice}
                              convenienceFee={
                                currentBusBookingData.convenienceFee
                              }
                              totalPrice={currentBusBookingData.totalPrice}
                              onProceed={() => handleProceedToPayment(bus)}
                              boardingPoint={
                                currentBusBookingData.selectedBoardingPoint
                              }
                              droppingPoint={
                                currentBusBookingData.selectedDroppingPoint
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: PALETTE.bgLight }}
    >
      {/* Header */}
      <div className="w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="hidden lg:block">
            <div className="flex items-center mb-2">
              <FaChevronLeft
                className="text-xl mr-2 cursor-pointer"
                onClick={() => navigate(-1)}
              />
              <span
                className="text-sm font-medium"
                style={{ color: PALETTE.textLight }}
              >
                Bus Ticket
              </span>
              <span className="mx-1 text-gray-400 text-sm">&gt;</span>
              <span
                className="text-sm font-medium"
                style={{ color: PALETTE.textLight }}
              >
                {from} to {to} Bus
              </span>
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: PALETTE.textDark }}
            >
              {from}
              <FaExchangeAlt className="inline-block mx-2 text-gray-500" /> {to}
            </h1>
            {!loading && !fetchError && (
              <p className="text-sm text-gray-500 mb-4">
                {sortedBuses.length} buses
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky search controls (desktop) */}
      <div
        ref={stickySearchCardRef}
        className="sticky top-0 z-40 w-full bg-opacity-95 backdrop-blur-sm shadow-sm"
        style={{ backgroundColor: `${PALETTE.white}F2` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-white border border-gray-300 rounded-3xl">
            {/* keep your existing sticky search controls here */}
            {/* omitted for brevity – unchanged from your current file */}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar filters */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="relative" style={{ top: filterPanelTopOffset }}>
              <FilterPanel sortBy={sortBy} setSortBy={setSortBy} />
              <div className="mt-6">
                <SpecialNoticesSection />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">{renderCards()}</div>
        </div>
      </div>
    </div>
  );
}
