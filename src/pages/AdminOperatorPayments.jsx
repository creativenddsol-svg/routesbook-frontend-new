// src/pages/AdminOperatorPayments.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api";

/* ---------- Small utilities ---------- */
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

/* ---------- Component ---------- */
const AdminOperatorPayments = () => {
  /* Tabs */
  const [tab, setTab] = useState("summary"); // summary | history

  /* Filters (summary only) */
  const [filter, setFilter] = useState({
    date: "",
    operatorId: "",
  });
  const debounced = useDebouncedValue(filter, 400);

  /* Data */
  const [summaryRows, setSummaryRows] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);

  /* UI state */
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  /* Cancel token (avoid races) */
  const abortRef = useRef(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (tab === "summary") {
      if (debounced.date) params.set("date", debounced.date);
      if (debounced.operatorId) params.set("operatorId", debounced.operatorId);
    } else {
      if (debounced.operatorId) params.set("operatorId", debounced.operatorId);
    }
    return params.toString();
  }, [tab, debounced]);

  const load = async () => {
    setLoading(true);
    setErr(null);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url =
        tab === "summary"
          ? `/admin/operator-payments/summary?${queryParams}`
          : `/admin/operator-payments/history?${queryParams}`;

      const res = await apiClient.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        signal: controller.signal,
      });

      if (tab === "summary") {
        setSummaryRows(Array.isArray(res.data) ? res.data : []);
      } else {
        setHistoryRows(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      if (e.name === "CanceledError") return;
      console.error("Failed to load operator payments", e);
      setErr("Failed to load data.");
      setSummaryRows([]);
      setHistoryRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, queryParams]);

  const markPaid = async (operatorId, date) => {
    if (!operatorId || !date) return;
    if (!window.confirm(`Mark ${date} as PAID for this operator?`)) return;

    try {
      await apiClient.post(
        `/admin/operator-payments/mark-paid/${operatorId}/${date}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      // Refresh summary (row should disappear), and (optionally) history
      await load();
      alert("Marked as paid ✅");
    } catch (e) {
      console.error("Failed to mark as paid", e);
      alert("Failed to mark as paid.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">💸 Operator Payments</h2>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab("summary")}
          className={cls(
            "px-3 py-1.5 rounded border",
            tab === "summary" ? "bg-black text-white border-black" : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          Summary (Pending)
        </button>
        <button
          onClick={() => setTab("history")}
          className={cls(
            "px-3 py-1.5 rounded border",
            tab === "history" ? "bg-black text-white border-black" : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          History
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {tab === "summary" && (
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
              className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Date"
              title="Travel date (YYYY-MM-DD)"
            />
          )}
          <input
            type="text"
            value={filter.operatorId}
            onChange={(e) => setFilter((f) => ({ ...f, operatorId: e.target.value.trim() }))}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Operator ID (optional)"
            title="Filter by operator ID"
          />
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100 transition"
              onClick={load}
              disabled={loading}
            >
              Apply
            </button>
            <button
              className="text-sm underline text-gray-600"
              onClick={() => setFilter({ date: "", operatorId: "" })}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {tab === "summary" ? (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Date</th>
                <th className="border px-3 py-2 text-left">Operator</th>
                <th className="border px-3 py-2 text-center">Bookings</th>
                <th className="border px-3 py-2 text-right">Revenue</th>
                <th className="border px-3 py-2 text-right">Commission</th>
                <th className="border px-3 py-2 text-right">Payable</th>
                <th className="border px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="border px-3 py-2">
                        <div className="h-3 bg-gray-200 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : err ? (
                <tr>
                  <td colSpan={7} className="border px-3 py-6 text-center text-red-700">
                    {err}
                  </td>
                </tr>
              ) : (summaryRows || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="border px-3 py-6 text-center text-gray-600">
                    No pending settlements.
                  </td>
                </tr>
              ) : (
                summaryRows.map((r, i) => (
                  <tr key={`${r.operatorId}-${r.date}-${i}`} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{r.date}</td>
                    <td className="border px-3 py-2">
                      {r.operatorName || r.operatorEmail || r.operatorId}
                    </td>
                    <td className="border px-3 py-2 text-center">{r.totalBookings}</td>
                    <td className="border px-3 py-2 text-right">Rs {r.totalRevenue}</td>
                    <td className="border px-3 py-2 text-right">Rs {r.totalCommission}</td>
                    <td className="border px-3 py-2 text-right font-semibold">Rs {r.totalPayable}</td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        onClick={() => markPaid(r.operatorId, r.date)}
                      >
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Date</th>
                <th className="border px-3 py-2 text-left">Operator</th>
                <th className="border px-3 py-2 text-center">Bookings</th>
                <th className="border px-3 py-2 text-right">Revenue</th>
                <th className="border px-3 py-2 text-right">Commission</th>
                <th className="border px-3 py-2 text-right">Paid</th>
                <th className="border px-3 py-2 text-left">Paid By</th>
                <th className="border px-3 py-2 text-left">When</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="border px-3 py-2">
                        <div className="h-3 bg-gray-200 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : err ? (
                <tr>
                  <td colSpan={8} className="border px-3 py-6 text-center text-red-700">
                    {err}
                  </td>
                </tr>
              ) : (historyRows || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="border px-3 py-6 text-center text-gray-600">
                    No settlements yet.
                  </td>
                </tr>
              ) : (
                historyRows.map((p, i) => (
                  <tr key={`${p._id || i}`} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{p.date}</td>
                    <td className="border px-3 py-2">
                      {p.operator?.fullName || p.operator?.name || p.operator?.email || "-"}
                    </td>
                    <td className="border px-3 py-2 text-center">{(p.bookings || []).length}</td>
                    <td className="border px-3 py-2 text-right">Rs {p.totalRevenue}</td>
                    <td className="border px-3 py-2 text-right">Rs {p.totalCommission}</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      Rs {p.operatorReceivable}
                    </td>
                    <td className="border px-3 py-2">
                      {p.paidBy?.fullName || p.paidBy?.name || p.paidBy?.email || "-"}
                    </td>
                    <td className="border px-3 py-2">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOperatorPayments;
