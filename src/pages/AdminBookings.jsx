// src/pages/AdminBookings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api";

/* ---------- Small utilities ---------- */
const PAGE_SIZES = [25, 50, 100, 200];

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}

const SortButton = ({ label, field, sort, setSort }) => {
  const dir = sort?.startsWith("-") ? "desc" : sort?.startsWith("+") ? "asc" : null;
  const active = sort?.slice(1) === field;
  const next = () => {
    // cycle: none -> asc -> desc -> none
    if (!active) return setSort("+" + field);
    if (dir === "asc") return setSort("-" + field);
    if (dir === "desc") return setSort(null);
  };
  return (
    <button
      type="button"
      onClick={next}
      className={cls(
        "flex items-center gap-1 select-none",
        active ? "text-blue-700 font-semibold" : "text-gray-700"
      )}
      title={active ? (dir === "asc" ? "Sorted ascending" : "Sorted descending") : "Not sorted"}
    >
      <span>{label}</span>
      <span className="text-xs opacity-70">
        {!active ? "↕" : dir === "asc" ? "↑" : "↓"}
      </span>
    </button>
  );
};

/* ---------- Component ---------- */
const AdminBookings = () => {
  /* Filters */
  const [filter, setFilter] = useState({
    date: "",
    from: "",
    to: "",
    userEmail: "",
    status: "",          // optional: CONFIRMED, PENDING_PAYMENT, CANCELLED, REFUNDED (comma-separated allowed later)
    paymentStatus: "",   // optional: PAID, UNPAID, FAILED, REFUNDED
  });
  const debouncedFilter = useDebouncedValue(filter, 500);

  /* Paging & sorting */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState("-createdAt"); // +field or -field, or null

  /* Data & UI */
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  /* Reschedule UI */
  const [rescheduleData, setRescheduleData] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSeats, setNewSeats] = useState("");

  /* Cancel token */
  const abortRef = useRef(null);

  const queryParams = useMemo(() => {
    // Send only non-empty filters as query params
    const cleanFilters = Object.fromEntries(
      Object.entries(debouncedFilter).filter(
        ([, v]) => v !== undefined && String(v).trim() !== ""
      )
    );

    return {
      ...cleanFilters,
      page,
      pageSize,
      ...(sort ? { sort } : {}),
    };
  }, [debouncedFilter, page, pageSize, sort]);

  const fetchBookings = async () => {
    setLoading(true);
    setErr(null);

    // Abort any inflight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await apiClient.get("/admin/bookings", {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        signal: controller.signal,
      });

      // Backward-compatible adapter:
      // Support either array or { items, total, page, pageSize, totalPages }
      const data = res.data;
      if (Array.isArray(data)) {
        setRows(data);
        setTotal(data.length);
      } else if (data && Array.isArray(data.items)) {
        setRows(data.items);
        if (typeof data.total === "number") setTotal(data.total);
        if (typeof data.page === "number") setPage(data.page);
        if (typeof data.pageSize === "number") setPageSize(data.pageSize);
      } else {
        setRows([]);
        setTotal(0);
      }
    } catch (e) {
      if (e.name === "CanceledError") return; // ignore canceled
      console.error("Failed to fetch bookings", e);
      setErr("Failed to fetch bookings.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]); // re-fetch when filters/paging/sort change

  const refetchAfterUpdate = async () => {
    await fetchBookings();
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // Optimistic remove; then refetch to be sure
      setRows((prev) => prev.filter((bk) => bk._id !== id));
      refetchAfterUpdate();
    } catch (err) {
      console.error("Failed to cancel booking", err);
      alert("Failed to cancel booking.");
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
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Booking rescheduled.");
      setRescheduleData(null);
      setNewDate("");
      setNewSeats("");
      await refetchAfterUpdate();
    } catch (err) {
      console.error("Failed to reschedule", err);
      alert("Failed to reschedule.");
    }
  };

  /* Derived */
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  /* Render helpers */
  const HeaderCell = ({ label, field }) => (
    <th className="border px-3 py-2 bg-gray-100 sticky top-0 z-10">
      <SortButton label={label} field={field} sort={sort} setSort={setSort} />
    </th>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📄 All User Bookings</h2>

      {/* Toolbar: Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <input
          type="date"
          value={filter.date}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, date: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          placeholder="Date"
        />
        <input
          type="text"
          value={filter.from}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, from: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          placeholder="From"
        />
        <input
          type="text"
          value={filter.to}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, to: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          placeholder="To"
        />
        <input
          type="text"
          value={filter.userEmail}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, userEmail: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          placeholder="User Email or Booking No"
        />
        <select
          value={filter.status}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, status: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          title="Booking status"
        >
          <option value="">Status: Any</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
        <select
          value={filter.paymentStatus}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, paymentStatus: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          title="Payment status"
        >
          <option value="">Payment: Any</option>
          <option value="PAID">PAID</option>
          <option value="UNPAID">UNPAID</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      {/* Toolbar: Paging */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          {loading ? "Loading…" : `Total: ${total.toLocaleString()}`}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows:</label>
          <select
            className="border px-2 py-1 rounded"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            className="border px-2 py-1 rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page {page} / {totalPages}
          </span>
          <button
            className="border px-2 py-1 rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <HeaderCell label="User" field="userName" />
              <HeaderCell label="Email" field="userEmail" />
              <HeaderCell label="Booking No" field="bookingNo" />
              <HeaderCell label="Bus" field="busName" />
              <HeaderCell label="Route" field="routeFrom" />
              <HeaderCell label="Date" field="departureAt" />
              <HeaderCell label="Seats" field="seatsCount" />
              <HeaderCell label="Payment" field="paymentStatus" />
              <HeaderCell label="Status" field="status" />
              <th className="border px-3 py-2 bg-gray-100 sticky top-0 z-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows
              Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 10 }).map((__, j) => (
                    <td key={j} className="border px-3 py-2">
                      <div className="h-3 bg-gray-200 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : err ? (
              <tr>
                <td colSpan={10} className="border px-3 py-6 text-center text-red-700">
                  {err}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="border px-3 py-6 text-center text-gray-600">
                  No bookings found for your filters.
                </td>
              </tr>
            ) : (
              rows.map((b) => {
                const route =
                  (b.routeFrom && b.routeTo) ? `${b.routeFrom} → ${b.routeTo}` :
                  b.bus?.from && b.bus?.to ? `${b.bus.from} → ${b.bus.to}` : "-";
                const dateText =
                  b.departureAt
                    ? new Date(b.departureAt).toLocaleString()
                    : b.date || "-";
                const seats = Array.isArray(b.seats)
                  ? b.seats.map((s) => (typeof s === "string" ? s : s?.no)).filter(Boolean)
                  : Array.isArray(b.selectedSeats)
                    ? b.selectedSeats
                    : [];
                return (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{b.userName || b.user?.name || "-"}</td>
                    <td className="border px-3 py-2">{b.userEmail || b.user?.email || "-"}</td>
                    <td className="border px-3 py-2">{b.bookingNo || "-"}</td>
                    <td className="border px-3 py-2">{b.busName || b.bus?.name || "-"}</td>
                    <td className="border px-3 py-2">{route}</td>
                    <td className="border px-3 py-2">{dateText}</td>
                    <td className="border px-3 py-2">
                      {seats && seats.length ? seats.join(", ") : "-"}
                    </td>
                    <td className="border px-3 py-2">{b.paymentStatus || "-"}</td>
                    <td className="border px-3 py-2">{b.status || "-"}</td>
                    <td className="border px-3 py-2 text-center space-x-2">
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
                          setNewDate(
                            b.departureAt
                              ? new Date(b.departureAt).toISOString().slice(0, 10)
                              : (b.date || "")
                          );
                          const s =
                            Array.isArray(b.seats)
                              ? b.seats.map((x) => (typeof x === "string" ? x : x?.no)).filter(Boolean)
                              : Array.isArray(b.selectedSeats)
                                ? b.selectedSeats
                                : [];
                          setNewSeats(s.join(", "));
                        }}
                      >
                        Reschedule
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reschedule Modal (simple inline card for now) */}
      {rescheduleData && (
        <div className="mt-6 p-6 border bg-gray-50 rounded shadow-sm">
          <h3 className="text-lg font-bold mb-2">✏️ Reschedule Booking</h3>
          <p className="text-sm text-gray-700">
            <strong>User:</strong> {rescheduleData.userEmail || rescheduleData.user?.email || "-"}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Bus:</strong> {rescheduleData.busName || rescheduleData.bus?.name || "-"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-gray-600">New date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">New seats (comma-separated)</label>
              <input
                type="text"
                value={newSeats}
                onChange={(e) => setNewSeats(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="e.g. 1A, 2B"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
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
