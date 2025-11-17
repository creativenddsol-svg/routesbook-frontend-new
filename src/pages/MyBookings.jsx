// src/pages/MyBookings.jsx
import { useEffect, useState, useMemo } from "react";
import apiClient from "../api"; // ✅ shared API client
import { Link, useNavigate } from "react-router-dom";
import {
  FaBus,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaChair,
  FaTicketAlt,
  FaArrowRight,
  FaExclamationCircle,
  FaDownload,
} from "react-icons/fa";

/* ---------- Matte palette (aligned with ConfirmBooking / SearchResults) ---------- */
const PALETTE = {
  primary: "#C74A50",
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#111827",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",
  successBg: "#DCFCE7",
  successText: "#166534",
  warningBg: "#FEF3C7",
  warningText: "#92400E",
};

/* ---------- auth helpers (same pattern used elsewhere) ---------- */
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/* ---------- small shared UI bits ---------- */
const StatusPill = ({ status }) => {
  const paid = status === "Paid";
  const bg = paid ? PALETTE.successBg : PALETTE.warningBg;
  const color = paid ? PALETTE.successText : PALETTE.warningText;
  return (
    <span
      className="text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}
    >
      {status}
    </span>
  );
};

const Chip = ({ label }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium mr-1 mt-1"
    style={{ background: PALETTE.pillBg, color: PALETTE.textSubtle }}
  >
    {label}
  </span>
);

/* ---------- skeleton (restyled to match matte cards) ---------- */
const BookingCardSkeleton = () => (
  <div
    className="rounded-2xl p-5 animate-pulse"
    style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
  >
    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
      <div className="space-y-2">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div className="h-5 w-20 bg-gray-200 rounded-full" />
    </div>
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
      <div className="h-8 w-24 bg-gray-200 rounded-lg" />
      <div className="h-9 w-32 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      const token = getAuthToken();
      if (!token) {
        console.error("No token found. Please login.");
        setLoading(false);
        return;
      }
      try {
        // ✅ IMPORTANT: relative path to your API base; no localhost anywhere
        const res = await apiClient.get("/bookings/me", buildAuthConfig(token));
        setBookings(res.data || []);
      } catch (err) {
        console.error("Failed to load bookings", err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [bookings]
  );

  const handleDownloadTicket = (booking) => {
    const bookingDetails = {
      bus: booking.bus,
      passenger: booking.passengerInfo,
      passengers: booking.passengers,
      date: booking.date,
      selectedSeats: booking.selectedSeats,
      priceDetails: {
        totalPrice: booking.totalAmount,
        convenienceFee: booking.convenienceFee,
        basePrice: booking.totalAmount - booking.convenienceFee,
      },
      boardingPoint: booking.bus?.boardingPoints.find(
        (p) => p.point === booking.from
      ),
      droppingPoint: booking.bus?.droppingPoints.find(
        (p) => p.point === booking.to
      ),
      departureTime: booking.departureTime,
      bookingId: booking._id,
    };

    navigate("/download-ticket", { state: { bookingDetails } });
  };

  const getReadableDate = (dateString) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen text-[15px] md:text-base"
      style={{ background: PALETTE.bg }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Page header – aligned with matte pages */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <div>
            <h2
              className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
              style={{ color: PALETTE.text }}
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-sm border border-gray-200 text-red-500">
                <FaTicketAlt />
              </span>
              <span>My Bookings</span>
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: PALETTE.textSubtle }}
            >
              View your upcoming and past trips, and download tickets anytime.
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        ) : sortedBookings.length === 0 ? (
          <div
            className="text-center rounded-2xl px-6 py-10 sm:px-10"
            style={{
              background: PALETTE.surface,
              border: `1px solid ${PALETTE.border}`,
            }}
          >
            <FaExclamationCircle className="mx-auto text-5xl text-gray-300 mb-4" />
            <h3
              className="text-xl font-bold"
              style={{ color: PALETTE.text }}
            >
              No bookings found
            </h3>
            <p
              className="mt-2 mb-6 text-sm sm:text-base"
              style={{ color: PALETTE.textSubtle }}
            >
              You haven&apos;t booked any trips yet. Let&apos;s find one for you!
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm sm:text-base font-semibold transition-transform hover:scale-[1.02]"
              style={{
                background: "var(--rb-primary, #D84E55)",
                color: "#FFFFFF",
              }}
            >
              Book a trip now
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {sortedBookings.map((booking) => (
              <div
                key={booking._id}
                className="rounded-2xl p-4 sm:p-5"
                style={{
                  background: PALETTE.surface,
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                {/* Header: bus + route + status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FaBus className="text-sm text-red-500 flex-shrink-0" />
                      <h3
                        className="text-base sm:text-lg font-semibold truncate"
                        style={{ color: PALETTE.text }}
                      >
                        {booking.bus?.name || "Bus"}
                      </h3>
                    </div>
                    <p
                      className="mt-1 text-xs sm:text-sm flex items-center gap-2 text-gray-500"
                      style={{ color: PALETTE.textSubtle }}
                    >
                      {booking.bus?.from}{" "}
                      <FaArrowRight className="text-[10px]" />{" "}
                      {booking.bus?.to}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusPill status={booking.paymentStatus} />
                    {booking.bookingNo ? (
                      <p className="text-[11px] text-gray-500">
                        Booking No:{" "}
                        <span className="font-semibold tabular-nums text-gray-700">
                          {booking.bookingNo}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Details grid */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[13px] sm:text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200">
                      <FaCalendarAlt className="text-xs text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">
                        Travel date
                      </div>
                      <div className="font-medium" style={{ color: PALETTE.text }}>
                        {getReadableDate(booking.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200">
                      <FaClock className="text-xs text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">
                        Departure
                      </div>
                      <div className="font-medium" style={{ color: PALETTE.text }}>
                        {booking.departureTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200">
                      <FaMapMarkerAlt className="text-xs text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">
                        Boarding point
                      </div>
                      <div className="font-medium truncate" style={{ color: PALETTE.text }}>
                        {booking.from}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200">
                      <FaChair className="text-xs text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-gray-400">
                        Seats
                      </div>
                      <div
                        className="font-semibold tabular-nums"
                        style={{ color: PALETTE.primary }}
                      >
                        {booking.selectedSeats.join(", ")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra chips (optional but matches other pages’ feel) */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {booking.bus?.busType && <Chip label={booking.bus.busType} />}
                  {booking.bus?.features?.wifi && <Chip label="Wi-Fi" />}
                  {booking.bus?.features?.chargingPort && (
                    <Chip label="Charging Port" />
                  )}
                  {booking.createdAt && (
                    <Chip
                      label={`Booked on ${new Date(
                        booking.createdAt
                      ).toLocaleDateString("en-GB")}`}
                    />
                  )}
                </div>

                {/* Footer: price + action */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <p
                      className="text-xs uppercase tracking-wide font-medium"
                      style={{ color: PALETTE.textSubtle }}
                    >
                      Total paid
                    </p>
                    <p
                      className="text-lg sm:text-xl font-bold tabular-nums"
                      style={{ color: "#16A34A" }}
                    >
                      Rs. {booking.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleDownloadTicket(booking)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02]"
                      style={{
                        background: "var(--rb-primary, #D84E55)",
                        color: "#FFFFFF",
                      }}
                    >
                      <FaDownload className="text-xs" />
                      <span>Download ticket</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
