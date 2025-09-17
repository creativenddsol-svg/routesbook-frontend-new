// src/pages/AdminBookings.jsx
import { useEffect, useState } from "react";
// ✅ use the shared API client that points to Render/Vercel backend
import apiClient from "../api";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState({
    date: "",
    from: "",
    to: "",
    userEmail: "",
  });
  const [rescheduleData, setRescheduleData] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSeats, setNewSeats] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Send only non-empty filters as query params
        const params = Object.fromEntries(
          Object.entries(filter).filter(
            ([, v]) => v !== undefined && String(v).trim() !== ""
          )
        );

        const res = await apiClient.get("/admin/bookings", {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          // withCredentials is already enabled in apiClient, but harmless to leave out
        });

        setBookings(res.data || []);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
        alert("Failed to fetch bookings");
      }
    };

    fetchBookings();
  }, [filter]);

  const cancelBooking = async (id) => {
    try {
      await apiClient.delete(`/admin/bookings/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBookings((prev) => prev.filter((bk) => bk._id !== id));
      alert("Booking cancelled.");
    } catch (err) {
      console.error("Failed to cancel booking", err);
      alert("Failed to cancel booking.");
    }
  };

  const refetchAfterUpdate = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filter).filter(
          ([, v]) => v !== undefined && String(v).trim() !== ""
        )
      );
      const res = await apiClient.get("/admin/bookings", {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBookings(res.data || []);
    } catch (e) {
      console.error("Failed to refresh bookings after update", e);
    }
  };

  const confirmReschedule = async () => {
    if (!rescheduleData?._id) return;
    try {
      await apiClient.put(
        `/admin/bookings/${rescheduleData._id}`,
        {
          date: newDate,
          selectedSeats: newSeats
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => s.toUpperCase()),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Booking rescheduled.");
      setRescheduleData(null);
      await refetchAfterUpdate(); // ✅ refresh list without full page reload
    } catch (err) {
      console.error("Failed to reschedule", err);
      alert("Failed to reschedule.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📄 All User Bookings</h2>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <input
          type="date"
          value={filter.date}
          onChange={(e) => setFilter({ ...filter, date: e.target.value })}
          className="border px-3 py-2 rounded"
          placeholder="Date"
        />
        <input
          type="text"
          value={filter.from}
          onChange={(e) => setFilter({ ...filter, from: e.target.value })}
          className="border px-3 py-2 rounded"
          placeholder="From"
        />
        <input
          type="text"
          value={filter.to}
          onChange={(e) => setFilter({ ...filter, to: e.target.value })}
          className="border px-3 py-2 rounded"
          placeholder="To"
        />
        <input
          type="text"
          value={filter.userEmail}
          onChange={(e) => setFilter({ ...filter, userEmail: e.target.value })}
          className="border px-3 py-2 rounded"
          placeholder="User Email"
        />
      </div>

      {/* Booking Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm shadow-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-3 py-2">User</th>
              <th className="border px-3 py-2">Email</th>
              <th className="border px-3 py-2">Bus</th>
              <th className="border px-3 py-2">Route</th>
              <th className="border px-3 py-2">Date</th>
              <th className="border px-3 py-2">Seats</th>
              <th className="border px-3 py-2">Payment</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-100">
                <td className="border px-3 py-2">{b.user?.name}</td>
                <td className="border px-3 py-2">{b.user?.email}</td>
                <td className="border px-3 py-2">{b.bus?.name}</td>
                <td className="border px-3 py-2">
                  {b.bus?.from} → {b.bus?.to}
                </td>
                <td className="border px-3 py-2">{b.date}</td>
                <td className="border px-3 py-2">
                  {Array.isArray(b.selectedSeats) && b.selectedSeats.length
                    ? b.selectedSeats.join(", ")
                    : "-"}
                </td>
                <td className="border px-3 py-2">{b.paymentStatus}</td>
                <td className="border px-3 py-2 space-x-2 text-center">
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    onClick={() => cancelBooking(b._id)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    onClick={() => {
                      setRescheduleData(b);
                      setNewDate(b.date || "");
                      setNewSeats(
                        Array.isArray(b.selectedSeats)
                          ? b.selectedSeats.join(", ")
                          : ""
                      );
                    }}
                  >
                    Reschedule
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rescheduling Modal UI */}
      {rescheduleData && (
        <div className="mt-8 p-6 border bg-gray-50 rounded shadow-md">
          <h3 className="text-lg font-bold mb-2">✏️ Reschedule Booking</h3>
          <p>
            <strong>User:</strong> {rescheduleData.user?.email}
          </p>
          <p>
            <strong>Bus:</strong> {rescheduleData.bus?.name}
          </p>

          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full border px-3 py-2 rounded mt-4"
          />
          <input
            type="text"
            value={newSeats}
            onChange={(e) => setNewSeats(e.target.value)}
            className="w-full border px-3 py-2 rounded mt-2"
            placeholder="e.g. 1A, 2B"
          />

          <div className="flex gap-4 mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={confirmReschedule}
            >
              Confirm
            </button>
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={() => setRescheduleData(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
