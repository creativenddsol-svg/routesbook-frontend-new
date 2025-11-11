// src/pages/AdminBookingDetails.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import apiClient from "../api";

const AdminBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // if we came from /admin/bookings we already passed booking in state
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [error, setError] = useState("");

  // fetch single booking if user opened this URL directly
  useEffect(() => {
    if (booking) return;
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/admin/bookings/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setBooking(res.data);
      } catch (err) {
        console.error(err);
        setError("Could not load booking.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, booking]);

  // normalize seats so it works for both selectedSeats and seats[]
  const seats =
    (booking?.selectedSeats && booking.selectedSeats.length
      ? booking.selectedSeats
      : Array.isArray(booking?.seats)
      ? booking.seats
          .map((s) => (typeof s === "string" ? s : s?.no))
          .filter(Boolean)
      : []) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Admin – Booking Details</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 border text-sm"
        >
          ← Back
        </button>
      </div>

      {loading && <p>Loading booking…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && booking && (
        <div className="space-y-6">
          {/* top booking summary */}
          <div className="border rounded-lg bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-1">
              {booking.bookingNo ? `Booking – ${booking.bookingNo}` : "Booking details"}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Created:{" "}
              {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <p>
                <span className="font-semibold">Bus:</span>{" "}
                {booking.busName || booking.bus?.name || "-"}
              </p>
              <p>
                <span className="font-semibold">Route:</span>{" "}
                {booking.routeFrom && booking.routeTo
                  ? `${booking.routeFrom} → ${booking.routeTo}`
                  : booking.bus?.from && booking.bus?.to
                  ? `${booking.bus.from} → ${booking.bus.to}`
                  : "-"}
              </p>
              <p>
                <span className="font-semibold">Departure:</span>{" "}
                {booking.departureAt
                  ? new Date(booking.departureAt).toLocaleString()
                  : booking.date || "-"}
              </p>
              <p>
                <span className="font-semibold">Payment:</span>{" "}
                {booking.paymentStatus || "-"}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {booking.status || "-"}
              </p>
              <p>
                <span className="font-semibold">Seats:</span>{" "}
                {seats.length ? seats.join(", ") : "-"}
              </p>
            </div>
          </div>

          {/* main passenger */}
          <div className="border rounded-lg bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold mb-3">Main passenger / contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {booking.passengerInfo?.fullName ||
                  booking.userName ||
                  booking.user?.name ||
                  "-"}
              </p>
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {booking.passengerInfo?.phone || "-"}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {/* ✅ now backend stores passengerInfo.email, so this will show the confirm-booking email first */}
                {booking.passengerInfo?.email ||
                  booking.userEmail ||
                  booking.user?.email ||
                  "-"}
              </p>
              <p>
                <span className="font-semibold">NIC:</span>{" "}
                {booking.passengerInfo?.nic || "-"}
              </p>
            </div>
          </div>

          {/* per-seat passengers */}
          {Array.isArray(booking.passengers) && booking.passengers.length > 0 && (
            <div className="border rounded-lg bg-white p-5 shadow-sm">
              <h4 className="text-base font-semibold mb-3">Seat-wise passengers</h4>
              <div className="overflow-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 text-left">#</th>
                      <th className="border px-2 py-1 text-left">Seat</th>
                      <th className="border px-2 py-1 text-left">Name</th>
                      <th className="border px-2 py-1 text-left">Age</th>
                      <th className="border px-2 py-1 text-left">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.passengers.map((p, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{idx + 1}</td>
                        <td className="border px-2 py-1">{p.seat || "-"}</td>
                        <td className="border px-2 py-1">{p.name || "-"}</td>
                        <td className="border px-2 py-1">{p.age || "-"}</td>
                        <td className="border px-2 py-1">
                          {p.gender === "F"
                            ? "Female"
                            : p.gender === "M"
                            ? "Male"
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBookingDetails;
