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

/* ---------- Hour helpers ---------- */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h).padStart(2, "0"),
  label: new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: "numeric" }), // "12 AM", "1 AM"...
}));

function computeHourWindowISO(dateStr, startHH, endHH) {
  if (!dateStr || startHH === "" || endHH === "") return null;
  const s = Number(startHH);
  const e = Number(endHH);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return null;

  // Build local Date objects for the same calendar day
  const [y, m, d] = dateStr.split("-").map(Number);
  const from = new Date(y, m - 1, d, s, 0, 0, 0);
  const to = new Date(y, m - 1, d, e, 0, 0, 0);
  return { fromISO: from.toISOString(), toISO: to.toISOString(), from, to };
}

function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getCreatedAtForSort(b) {
  // Prefer createdAt; fall back to departureAt/date
  return (
    safeDate(b.createdAt) ||
    safeDate(b.created_at) ||
    safeDate(b.created) ||
    safeDate(b.creationTime) ||
    safeDate(b.departureAt) ||
    safeDate(b.date) ||
    null
  );
}

/* ---------- Booking No helpers (NEW) ---------- */
// Build RB code from date + sequence (pads to 4 digits)
function buildRB(dateStr, seq) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const dayKey = dateStr.replaceAll("-", ""); // YYYYMMDD
  const raw = String(seq || "").replace(/\D/g, "");
  if (!raw) return `RB${dayKey}`;
  return `RB${dayKey}${raw.padStart(4, "0")}`;
}

// If user typed something that looks like RB..., normalize it
function normalizeRBInput(s) {
  if (!s) return null;
  const t = String(s).trim().toUpperCase();
  if (!/^RB/.test(t)) return null;
  // RB + 8 date digits + optional 1-4 seq digits
  const m = t.match(/^RB(\d{8})(\d{1,4})?$/);
  if (!m) return t; // let server/client fuzzy match if it's a partial like "RB2025"
  const [, dayKey, seq] = m;
  if (!seq) return `RB${dayKey}`;
  return `RB${dayKey}${String(seq).padStart(4, "0")}`;
}

/* ---------- Component ---------- */
const AdminBookings = () => {
  /* Filters */
  const [filter, setFilter] = useState({
    date: "",
    from: "",
    to: "",
    userEmail: "",
    status: "",          // CONFIRMED, PENDING_PAYMENT, CANCELLED, REFUNDED
    paymentStatus: "",   // PAID, UNPAID, FAILED, REFUNDED

    // NEW: hour-by-hour window and basis
    hourStart: "",       // "00".."23"
    hourEnd: "",         // "01".."24" (we use 00..23; validation ensures end>start)
    timeBasis: "created" // "created" | "departure"
  });
  const debouncedFilter = useDebouncedValue(filter, 500);

  // NEW: quick RB builder inputs
  const [bnDate, setBnDate] = useState("");
  const [bnSeq, setBnSeq] = useState("");

  /* Paging & sorting */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  // NEW BOOKINGS FIRST by default:
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

  // Build query params for server; also compute local window for client-side fallback
  const timeWindow = useMemo(() => {
    const { date, hourStart, hourEnd } = debouncedFilter;
    return computeHourWindowISO(date, hourStart, hourEnd);
  }, [debouncedFilter]);

  const queryParams = useMemo(() => {
    // Send only non-empty filters as query params
    const {
      date, from, to, userEmail, status, paymentStatus, timeBasis,
    } = debouncedFilter;

    const clean = {};
    if (date) clean.date = date;
    if (from) clean.from = from;
    if (to) clean.to = to;
    if (userEmail) clean.userEmail = userEmail;

    // NEW: if user typed an RB-like value, also pass it explicitly as bookingNo (backend may use it)
    const rbGuess =
      normalizeRBInput(userEmail) ||
      null;
    if (rbGuess) clean.bookingNo = rbGuess;

    if (status) clean.status = status;
    if (paymentStatus) clean.paymentStatus = paymentStatus;

    // Hour-by-hour: if we have a valid window, add server params
    if (timeWindow) {
      if ((timeBasis || "created") === "created") {
        clean.createdFrom = timeWindow.fromISO;
        clean.createdTo = timeWindow.toISO;
      } else {
        clean.departureFrom = timeWindow.fromISO;
        clean.departureTo = timeWindow.toISO;
      }
    }

    return {
      ...clean,
      page,
      pageSize,
      ...(sort ? { sort } : {}),
    };
  }, [debouncedFilter, page, pageSize, sort, timeWindow]);

  const clientSideFilterAndPaginate = (data) => {
    // 1) Hour window filter (fallback if server didn't filter)
    let arr = Array.isArray(data) ? data.slice() : [];

    if (timeWindow) {
      const { from, to } = timeWindow;
      const basis = debouncedFilter.timeBasis || "created";
      arr = arr.filter((b) => {
        const t =
          basis === "created"
            ? (safeDate(b.createdAt) || safeDate(b.created_at) || safeDate(b.created))
            : (safeDate(b.departureAt) || safeDate(b.date));
        if (!t) return false;
        return t >= from && t < to;
      });
    }

    // 1.5) NEW: client-side fuzzy search by booking number OR email
    const qRaw = (debouncedFilter.userEmail || "").trim();
    if (qRaw) {
      const q = qRaw.toLowerCase();
      const rbNorm = normalizeRBInput(qRaw)?.toLowerCase() || null;
      arr = arr.filter((b) => {
        const emailOk = (b.userEmail || b.user?.email || "").toLowerCase().includes(q);
        const bn = (b.bookingNo || "").toLowerCase();
        const bns = (b.bookingNoShort || "").toLowerCase();
        // match raw query or normalized RB
        const byBN =
          (rbNorm ? bn === rbNorm || bns === rbNorm : false) ||
          bn.includes(q) ||
          bns.includes(q);
        return emailOk || byBN;
      });
    }

    // 2) Sort newest first by createdAt (fallback if server didn't sort)
    arr.sort((a, b) => {
      const da = getCreatedAtForSort(a);
      const db = getCreatedAtForSort(b);
      const ta = da ? da.getTime() : 0;
      const tb = db ? db.getTime() : 0;
      return tb - ta; // DESC
    });

    // 3) Client-side pagination if server returned raw array
    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = arr.slice(start, end);

    return { items: pageItems, total: totalCount };
  };

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

      const data = res.data;

      if (Array.isArray(data)) {
        const { items, total } = clientSideFilterAndPaginate(data);
        setRows(items);
        setTotal(total);
      } else if (data && Array.isArray(data.items)) {
        // Assume server already applied time window + sorting; still keep "new first" by default via ?sort
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
      <div className="grid grid-cols-1 md:grid-cols-8 gap-3 mb-4">
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

        {/* NEW: Hour-by-hour window */}
        <select
          value={filter.hourStart}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, hourStart: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          title="Hour start"
        >
          <option value="">Hour from</option>
          {HOUR_OPTIONS.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>

        <select
          value={filter.hourEnd}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, hourEnd: e.target.value }));
          }}
          className="border px-3 py-2 rounded"
          title="Hour end"
        >
          <option value="">Hour to</option>
          {HOUR_OPTIONS.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>
      </div>

      {/* Time basis row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-sm text-gray-700">Time basis:</label>
        <select
          value={filter.timeBasis}
          onChange={(e) => {
            setPage(1);
            setFilter((f) => ({ ...f, timeBasis: e.target.value }));
          }}
          className="border px-3 py-1.5 rounded"
        >
          <option value="created">Booking Created</option>
          <option value="departure">Departure Time</option>
        </select>
        <span className="text-xs text-gray-500">
          Tip: select a Date + Hour from/to (e.g., 12 PM → 1 PM) to see that window.
        </span>
      </div>

      {/* NEW: Quick "RB + date + number" builder */}
      <div className="flex flex-wrap items-end gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Quick booking search:</span>
        <input
          value="RB"
          disabled
          className="border px-3 py-2 rounded w-16 bg-gray-100 text-gray-600"
          title="Prefix"
        />
        <input
          type="date"
          value={bnDate}
          onChange={(e) => setBnDate(e.target.value)}
          className="border px-3 py-2 rounded"
          title="Date part"
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="####"
          value={bnSeq}
          onChange={(e) => setBnSeq(e.target.value)}
          className="border px-3 py-2 rounded w-24"
          title="Sequence (last 4 digits)"
        />
        <button
          className="border px-3 py-2 rounded"
          onClick={() => {
            const rb = buildRB(bnDate, bnSeq);
            if (rb) {
              setPage(1);
              setFilter((f) => ({ ...f, userEmail: rb }));
            }
          }}
          title="Apply to the search box"
        >
          Find
        </button>
        <button
          className="text-sm underline text-gray-600"
          onClick={() => {
            setBnDate("");
            setBnSeq("");
            setPage(1);
            setFilter((f) => ({ ...f, userEmail: "" }));
          }}
        >
          Clear
        </button>
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
