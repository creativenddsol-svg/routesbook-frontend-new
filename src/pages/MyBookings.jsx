// src/pages/MyBookings.jsx
import { useEffect, useState, useMemo } from "react";
import apiClient from "../api"; // ✅ use the shared API client (baseURL set here)
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

/* ---------- auth helpers (same pattern used elsewhere) ---------- */
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/* ---------- skeleton ---------- */
const BookingCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 animate-pulse">
    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
      <div>
        <div className="h-6 w-48 bg-gray-200 rounded"></div>
        <div className="h-4 w-32 bg-gray-200 rounded mt-2"></div>
      </div>
      <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
    </div>
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
      <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
      <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <FaTicketAlt className="text-red-500" /> My Bookings
        </h2>

        {loading ? (
          <div className="space-y-4">
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-xl shadow-md border">
            <FaExclamationCircle className="mx-auto text-5xl text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">
              No Bookings Found
            </h3>
            <p className="text-gray-500 mt-2 mb-6">
              You haven't booked any trips yet. Let's find one for you!
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-transform hover:scale-105"
            >
              Book a Trip Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl shadow-md p-5 border border-gray-200"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-start border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {booking.bus?.name || "Unknown Bus"}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      {booking.bus?.from} <FaArrowRight className="text-xs" />{" "}
                      {booking.bus?.to}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full mt-2 sm:mt-0 ${
                      booking.paymentStatus === "Paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {booking.paymentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="text-gray-400" />
                    <span className="text-gray-600">
                      Date:{" "}
                      <strong className="text-gray-800">
                        {getReadableDate(booking.date)}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaClock className="text-gray-400" />
                    <span className="text-gray-600">
                      Departure:{" "}
                      <strong className="text-gray-800">
                        {booking.departureTime}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span className="text-gray-600">
                      Boarding:{" "}
                      <strong className="text-gray-800">{booking.from}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaChair className="text-gray-400" />
                    <span className="text-gray-600">
                      Seats:{" "}
                      <strong className="text-red-500">
                        {booking.selectedSeats.join(", ")}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-end mt-4 pt-4 border-t border-gray-100">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="text-xl font-bold text-green-600">
                      Rs. {booking.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleDownloadTicket(booking)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                    >
                      <FaDownload /> Download Ticket
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
