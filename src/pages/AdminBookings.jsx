// src/pages/AdminBookings.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// ⬇️ Lazy-load XLSX inside handler to avoid blocking first paint
// import * as XLSX from "xlsx";
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
  label: new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: "numeric" }),
}));

function computeHourWindowISO(dateStr, startHH, endHH) {
  if (!dateStr || startHH === "" || endHH === "") return null;
  const s = Number(startHH);
  const e = Number(endHH);
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return null;
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

/* ---------- RB helpers ---------- */
function buildRB(dateStr, seq) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const dayKey = dateStr.replaceAll("-", "");
  const raw = String(seq || "").replace(/\D/g, "");
  if (!raw) return `RB${dayKey}`;
  return `RB${dayKey}${raw.padStart(4, "0")}`;
}
function normalizeRBInput(s) {
  if (!s) return null;
  const t = String(s).trim().toUpperCase();
  if (!/^RB/.test(t)) return null;
  const m = t.match(/^RB(\d{8})(\d{1,4})?$/);
  if (!m) return t;
  const [, dayKey, seq] = m;
  if (!seq) return `RB${dayKey}`;
  return `RB${dayKey}${String(seq).padStart(4, "0")}`;
}

const AdminBookings = () => {
  const navigate = useNavigate();

  /* Filters */
  const [filter, setFilter] = useState({
    date: "",
    from: "",
    to: "",
    userEmail: "",
    status: "",
    paymentStatus: "",
    hourStart: "",
    hourEnd: "",
    timeBasis: "created",
  });
  const debouncedFilter = useDebouncedValue(filter, 500);

  /* quick RB inputs */
  const [bnDate, setBnDate] = useState("");
  const [bnSeq, setBnSeq] = useState("");

  /* paging & sorting */
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState("-createdAt");

  /* data */
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  /* reschedule */
  const [rescheduleData, setRescheduleData] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newSeats, setNewSeats] = useState("");

  const abortRef = useRef(null);
  const reqIdRef = useRef(0); // ⬅️ guard against stale responses

  // Reset to first page only when the *debounced* filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedFilter]);

  const timeWindow = useMemo(() => {
    const { date, hourStart, hourEnd } = debouncedFilter;
    return computeHourWindowISO(date, hourStart, hourEnd);
  }, [debouncedFilter]);

  const queryParams = useMemo(() => {
    const { date, from, to, userEmail, status, paymentStatus, timeBasis } =
      debouncedFilter;
    const clean = {};
    if (date) clean.date = date;
    if (from) clean.from = from;
    if (to) clean.to = to;
    const rbGuess = normalizeRBInput(userEmail) || null;
    if (rbGuess) {
      clean.bookingNo = rbGuess;
    } else if (userEmail) {
      clean.userEmail = userEmail;
    }
    if (status) clean.status = status;
    if (paymentStatus) clean.paymentStatus = paymentStatus;

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
    let arr = Array.isArray(data) ? data.slice() : [];

    if (timeWindow) {
      const { from, to } = timeWindow;
      const basis = debouncedFilter.timeBasis || "created";
      arr = arr.filter((b) => {
        const t =
          basis === "created"
            ? safeDate(b.createdAt) ||
              safeDate(b.created_at) ||
              safeDate(b.created)
            : safeDate(b.departureAt) || safeDate(b.date);
        if (!t) return false;
        return t >= from && t < to;
      });
    }

    const qRaw = (debouncedFilter.userEmail || "").trim();
    if (qRaw) {
      const q = qRaw.toLowerCase();
      const rbNorm = normalizeRBInput(qRaw)?.toLowerCase() || null;
      arr = arr.filter((b) => {
        const contact = (
          b.userEmail ||
          b.user?.email ||
          b.passengerInfo?.email ||
          b.user?.mobile ||
          b.user?.phone ||
          b.passengerInfo?.phone ||
          ""
        ).toLowerCase();
        const emailOk = contact.includes(q);
        const bn = (b.bookingNo || "").toLowerCase();
        const bns = (b.bookingNoShort || "").toLowerCase();
        const byBN =
          (rbNorm ? bn === rbNorm || bns === rbNorm : false) ||
          bn.includes(q) ||
          bns.includes(q);
        return emailOk || byBN;
      });
    }

    arr.sort((a, b) => {
      const da = getCreatedAtForSort(a);
      const db = getCreatedAtForSort(b);
      const ta = da ? da.getTime() : 0;
      const tb = db ? db.getTime() : 0;
      return tb - ta;
    });

    const totalCount = arr.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = arr.slice(start, end);

    return { items: pageItems, total: totalCount };
  };

  const fetchBookings = async () => {
    setErr(null);
    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const myReqId = ++reqIdRef.current;

    try {
      const res = await apiClient.get("/admin/bookings", {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        signal: controller.signal,
      });

      // Ignore stale responses
      if (myReqId !== reqIdRef.current) return;

      const data = res.data;
      if (Array.isArray(data)) {
        const { items, total } = clientSideFilterAndPaginate(data);
        setRows(items);
        setTotal(total);
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
      if (e.name === "CanceledError" || e.name === "AbortError") return;
      if (myReqId !== reqIdRef.current) return; // stale error, ignore
      console.error("Failed to fetch bookings", e);
      setErr("Failed to fetch bookings.");
      setRows([]);
      setTotal(0);
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const refetchAfterUpdate = async () => {
    await fetchBookings();
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/admin/bookings/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
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

  /* -------- EXPORT TO EXCEL -------- */
  const handleExport = async () => {
    try {
      // ⬇️ Lazy load XLSX so the admin page loads faster initially
      const XLSX = (await import("xlsx")).default || (await import("xlsx"));
      const res = await apiClient.get("/admin/bookings", {
        params: {
          ...queryParams,
          page: 1,
          pageSize: 10000,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.items)
        ? res.data.items
        : [];

      const sheetData = data.map((b, idx) => {
        const seats = Array.isArray(b.seats)
          ? b.seats
              .map((s) => (typeof s === "string" ? s : s?.no))
              .filter(Boolean)
              .join(", ")
          : Array.isArray(b.selectedSeats)
          ? b.selectedSeats.join(", ")
          : "";

        const route =
          b.routeFrom && b.routeTo
            ? `${b.routeFrom} → ${b.routeTo}`
            : b.bus?.from && b.bus?.to
            ? `${b.bus.from} → ${b.bus.to}`
            : "";

        const contact =
          b.passengerInfo?.email ||
          b.userEmail ||
          b.user?.email ||
          b.passengerInfo?.phone ||
          b.user?.mobile ||
          b.user?.phone ||
          "";

        const mainName =
          b.passengerInfo?.fullName || b.userName || b.user?.name || "";

        return {
          "#": idx + 1,
          "Booking No": b.bookingNo || "",
          "Created At": b.createdAt
            ? new Date(b.createdAt).toLocaleString()
            : "",
          Bus: b.busName || b.bus?.name || "",
          Route: route,
          "Departure / Date": b.departureAt
            ? new Date(b.departureAt).toLocaleString()
            : b.date || "",
          Seats: seats,
          "Payment Status": b.paymentStatus || "",
          Status: b.status || "",
          Name: mainName,
          "Contact (Email/Phone)": contact,
          NIC: b.passengerInfo?.nic || "",
          "Total Amount":
            typeof b.totalAmount === "number" ? b.totalAmount : "",
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, "bookings.xlsx");
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export Excel.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📄 All User Bookings</h2>

      {/* ------- START filters block ------- */}
      <div className="rounded-xl border bg-white shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
          <input
            type="date"
            value={filter.date}
            onChange={(e) => {
              // page reset now handled in debounced effect
              setFilter((f) => ({ ...f, date: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <input
            type="text"
            value={filter.from}
            onChange={(e) => {
              setFilter((f) => ({ ...f, from: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="From"
          />
          <input
            type="text"
            value={filter.to}
            onChange={(e) => {
              setFilter((f) => ({ ...f, to: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="To"
          />
          <input
            type="text"
            value={filter.userEmail}
            onChange={(e) => {
              setFilter((f) => ({ ...f, userEmail: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="User Email / Phone / RB"
          />
          <select
            value={filter.status}
            onChange={(e) => {
              setFilter((f) => ({ ...f, status: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
              setFilter((f) => ({ ...f, paymentStatus: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Payment: Any</option>
            <option value="PAID">PAID</option>
            <option value="UNPAID">UNPAID</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
          <select
            value={filter.hourStart}
            onChange={(e) => {
              setFilter((f) => ({ ...f, hourStart: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Hour from</option>
            {HOUR_OPTIONS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
          <select
            value={filter.hourEnd}
            onChange={(e) => {
              setFilter((f) => ({ ...f, hourEnd: e.target.value }));
            }}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="">Hour to</option>
            {HOUR_OPTIONS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <label className="text-sm text-gray-700">Time basis:</label>
          <select
            value={filter.timeBasis}
            onChange={(e) => {
              setFilter((f) => ({ ...f, timeBasis: e.target.value }));
            }}
            className="border px-3 py-1.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="created">Booking Created</option>
            <option value="departure">Departure Time</option>
          </select>
          <span className="text-xs text-gray-500">
            Tip: select a Date + Hour from/to to see that window.
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-2 mt-4">
          <span className="text-sm font-medium text-gray-700">
            Quick booking search:
          </span>
          <input
            value="RB"
            disabled
            className="border px-3 py-2 rounded w-16 bg-gray-100 text-gray-600"
          />
          <input
            type="date"
            value={bnDate}
            onChange={(e) => setBnDate(e.target.value)}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="####"
            value={bnSeq}
            onChange={(e) => setBnSeq(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const rb = buildRB(bnDate, bnSeq);
                if (rb) {
                  setFilter((f) => ({
                    ...f,
                    userEmail: rb,
                    date: bnDate || f.date,
                  }));
                }
              }
            }}
            className="border px-3 py-2 rounded w-24 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            className="px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100 transition"
            onClick={() => {
              const rb = buildRB(bnDate, bnSeq);
              if (rb) {
                setFilter((f) => ({
                  ...f,
                  userEmail: rb,
                  date: bnDate || f.date,
                }));
              }
            }}
          >
            Find
          </button>
          <button
            className="text-sm underline text-gray-600"
            onClick={() => {
              setBnDate("");
              setBnSeq("");
              setFilter((f) => ({ ...f, userEmail: "" }));
            }}
          >
            Clear
          </button>
        </div>
      </div>
      {/* ------- END filters block ------- */}

      {/* top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-sm text-gray-600">
          {loading ? "Loading…" : `Total: ${total.toLocaleString()}`}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 text-sm"
          >
            Export to Excel
          </button>
          <label className="text-sm text-gray-600">Rows:</label>
          <select
            className="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
            Page {page} / {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          <button
            className="border px-2 py-1 rounded disabled:opacity-50"
            onClick={() => setPage((p) => p + 1)}
            disabled={
              page >= Math.max(1, Math.ceil(total / pageSize)) || loading
            }
          >
            Next
          </button>
        </div>
      </div>

      {/* table */}
      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <HeaderCell label="User" field="userName" />
              <HeaderCell label="Email / Phone" field="userEmail" />
              <HeaderCell label="Booking No" field="bookingNo" />
              <HeaderCell label="Bus" field="busName" />
              <HeaderCell label="Route" field="routeFrom" />
              <HeaderCell label="Date" field="departureAt" />
              <HeaderCell label="Seats" field="seatsCount" />
              <HeaderCell label="Payment" field="paymentStatus" />
              <HeaderCell label="Status" field="status" />
              <th className="border px-3 py-2 bg-gray-100 sticky top-0 z-10">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
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
                <td
                  colSpan={10}
                  className="border px-3 py-6 text-center text-red-700"
                >
                  {err}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="border px-3 py-6 text-center text-gray-600"
                >
                  No bookings found for your filters.
                </td>
              </tr>
            ) : (
              rows.map((b) => {
                const route =
                  b.routeFrom && b.routeTo
                    ? `${b.routeFrom} → ${b.routeTo}`
                    : b.bus?.from && b.bus?.to
                    ? `${b.bus.from} → ${b.bus.to}`
                    : "-";
                const dateText = b.departureAt
                  ? new Date(b.departureAt).toLocaleString()
                  : b.date || "-";
                const seats = Array.isArray(b.seats)
                  ? b.seats
                      .map((s) => (typeof s === "string" ? s : s?.no))
                      .filter(Boolean)
                  : Array.isArray(b.selectedSeats)
                  ? b.selectedSeats
                  : [];
                const contactValue =
                  b.userEmail ||
                  b.user?.email ||
                  b.passengerInfo?.email ||
                  b.user?.mobile ||
                  b.user?.phone ||
                  b.passengerInfo?.phone ||
                  "-";

                return (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">
                      {b.userName || b.user?.name || "-"}
                    </td>
                    <td className="border px-3 py-2">{contactValue}</td>
                    <td className="border px-3 py-2">{b.bookingNo || "-"}</td>
                    <td className="border px-3 py-2">
                      {b.busName || b.bus?.name || "-"}
                    </td>
                    <td className="border px-3 py-2">{route}</td>
                    <td className="border px-3 py-2">{dateText}</td>
                    <td className="border px-3 py-2">
                      {seats && seats.length ? seats.join(", ") : "-"}
                    </td>
                    <td className="border px-3 py-2">
                      {b.paymentStatus || "-"}
                    </td>
                    <td className="border px-3 py-2">{b.status || "-"}</td>
                    <td className="border px-3 py-2 text-center space-x-2">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        onClick={() =>
                          navigate(`/admin/bookings/${b._id}`, {
                            state: { booking: b },
                          })
                        }
                      >
                        View
                      </button>
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
                              ? new Date(b.departureAt)
                                  .toISOString()
                                  .slice(0, 10)
                              : b.date || ""
                          );
                          const s = Array.isArray(b.seats)
                            ? b.seats
                                .map((x) =>
                                  typeof x === "string" ? x : x?.no
                                )
                                .filter(Boolean)
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

      {/* reschedule inline card */}
      {rescheduleData && (
        <div className="mt-6 p-6 border bg-gray-50 rounded shadow-sm">
          <h3 className="text-lg font-bold mb-2">✏️ Reschedule Booking</h3>
          <p className="text-sm text-gray-700">
            <strong>User:</strong>{" "}
            {rescheduleData.userEmail ||
              rescheduleData.user?.email ||
              rescheduleData.user?.mobile ||
              rescheduleData.user?.phone ||
              "-"}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Bus:</strong>{" "}
            {rescheduleData.busName || rescheduleData.bus?.name || "-"}
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
              <label className="text-xs text-gray-600">
                New seats (comma-separated)
              </label>
              <input
                type="text"
                value={newSeats}
                onChange={(e) => setNewSeats(e.target.value)}
                className="w-full border px-3 py-2 rounded"
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
