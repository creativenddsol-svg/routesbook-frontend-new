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
function toMoney(n) {
  const v = Number(n || 0);
  return `Rs ${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function downloadCSV(filename, rows) {
  if (!rows?.length) return;
  const header = Object.keys(rows[0]);
  const body = rows.map((r) =>
    header.map((h) => JSON.stringify(r[h] ?? "")).join(",")
  );
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Component ---------- */
const AdminOperatorPayments = () => {
  /* Tabs: summary (by date), byOperator (grouped), history */
  const [tab, setTab] = useState("summary"); // 'summary' | 'byOperator' | 'history'

  /* Filters */
  const [filter, setFilter] = useState({
    date: "",
    operatorId: "",
    q: "", // free-text search (name/email)
  });
  const debounced = useDebouncedValue(filter, 400);

  /* Data */
  const [summaryRows, setSummaryRows] = useState([]); // pending by date
  const [historyRows, setHistoryRows] = useState([]); // settled
  const [operators, setOperators] = useState([]); // for dropdown

  /* UI state */
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  /* Cancel token (avoid races) */
  const abortRef = useRef(null);

  /* Fetch operators for search (once) */
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/admin/operators", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setOperators(Array.isArray(res.data) ? res.data : []);
      } catch {
        // best-effort; ignore
      }
    })();
  }, []);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (tab === "summary" || tab === "byOperator") {
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
      const endpoint =
        tab === "history"
          ? `/admin/operator-payments/history?${queryParams}`
          : `/admin/operator-payments/summary?${queryParams}`;

      const res = await apiClient.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        signal: controller.signal,
      });

      if (tab === "history") {
        setHistoryRows(Array.isArray(res.data) ? res.data : []);
      } else {
        setSummaryRows(Array.isArray(res.data) ? res.data : []);
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

  /* ---- Filters applied client-side (free-text) ---- */
  const filteredSummary = useMemo(() => {
    const q = (debounced.q || "").toLowerCase().trim();
    if (!q) return summaryRows;
    return summaryRows.filter((r) => {
      const hay =
        `${r.operatorName || ""} ${r.operatorEmail || ""} ${r.operatorId || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [summaryRows, debounced.q]);

  /* ---- KPI totals (for current view) ---- */
  const kpis = useMemo(() => {
    const rows = tab === "history" ? historyRows : filteredSummary;
    const out = rows.reduce(
      (acc, r) => {
        acc.bookings += Number(r.totalBookings || (r.bookings || []).length || 0);
        acc.revenue += Number(r.totalRevenue || r.revenue || 0);
        acc.commission += Number(r.totalCommission || r.commission || 0);
        acc.payable += Number(
          r.totalPayable || r.operatorReceivable || (r.revenue || 0) - (r.commission || 0) || 0
        );
        return acc;
      },
      { bookings: 0, revenue: 0, commission: 0, payable: 0 }
    );
    return out;
  }, [tab, filteredSummary, historyRows]);

  /* ---- Grouping: pending by operator ---- */
  const groupedByOperator = useMemo(() => {
    if (tab !== "byOperator") return [];
    const map = new Map();
    for (const r of filteredSummary) {
      const id = r.operatorId || (r.operator && r.operator._id) || "unknown";
      const key = String(id);
      const prev = map.get(key) || {
        operatorId: key,
        operatorName: r.operatorName || r.operator?.fullName || "",
        operatorEmail: r.operatorEmail || r.operator?.email || "",
        totalBookings: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalPayable: 0,
        dates: new Set(),
      };
      prev.totalBookings += Number(r.totalBookings || 0);
      prev.totalRevenue += Number(r.totalRevenue || 0);
      prev.totalCommission += Number(r.totalCommission || 0);
      prev.totalPayable += Number(r.totalPayable || 0);
      if (r.date) prev.dates.add(r.date);
      map.set(key, prev);
    }
    return Array.from(map.values()).map((x) => ({
      ...x,
      dates: Array.from(x.dates),
      datesCount: x.dates.size,
    }));
  }, [tab, filteredSummary]);

  /* ---- Actions ---- */
  const markPaid = async (operatorId, date) => {
    if (!operatorId || !date) return;
    if (!window.confirm(`Mark ${date} as PAID for this operator?`)) return;

    try {
      await apiClient.post(
        `/admin/operator-payments/mark-paid/${operatorId}/${date}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      await load();
      alert("Marked as paid ✅");
    } catch (e) {
      console.error("Failed to mark as paid", e);
      alert("Failed to mark as paid.");
    }
  };

  const markPaidAllForOperator = async (operatorId) => {
    const rows = filteredSummary.filter((r) => r.operatorId === operatorId);
    if (!rows.length) return;
    if (
      !window.confirm(
        `Mark ALL ${rows.length} date(s) as PAID for this operator?\n\nThis will call the API once per date.`
      )
    )
      return;
    try {
      await Promise.allSettled(
        rows.map((r) =>
          apiClient.post(
            `/admin/operator-payments/mark-paid/${operatorId}/${r.date}`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          )
        )
      );
      await load();
      alert("All shown dates marked as paid ✅");
    } catch (e) {
      console.error("Bulk mark paid failed", e);
      alert("Some items may have failed. Refresh to verify.");
    }
  };

  /* ---- Exports ---- */
  const exportSummaryCSV = () => {
    const rows = filteredSummary.map((r) => ({
      date: r.date,
      operatorId: r.operatorId,
      operatorName: r.operatorName || "",
      operatorEmail: r.operatorEmail || "",
      bookings: r.totalBookings,
      revenue: r.totalRevenue,
      commission: r.totalCommission,
      payable: r.totalPayable,
    }));
    downloadCSV("operator-payments-summary.csv", rows);
  };
  const exportGroupedCSV = () => {
    const rows = groupedByOperator.map((r) => ({
      operatorId: r.operatorId,
      operatorName: r.operatorName,
      operatorEmail: r.operatorEmail,
      datesCount: r.datesCount,
      bookings: r.totalBookings,
      revenue: r.totalRevenue,
      commission: r.totalCommission,
      payable: r.totalPayable,
    }));
    downloadCSV("operator-payments-by-operator.csv", rows);
  };
  const exportHistoryCSV = () => {
    const rows = historyRows.map((p) => ({
      date: p.date,
      operatorId: p.operator?._id,
      operatorName: p.operator?.fullName || "",
      operatorEmail: p.operator?.email || "",
      bookings: (p.bookings || []).length,
      revenue: p.totalRevenue,
      commission: p.totalCommission,
      paid: p.operatorReceivable,
      paidBy: p.paidBy?.email || "",
      paymentDate: p.paymentDate,
    }));
    downloadCSV("operator-payments-history.csv", rows);
  };

  /* ---- Render ---- */
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
          onClick={() => setTab("byOperator")}
          className={cls(
            "px-3 py-1.5 rounded border",
            tab === "byOperator"
              ? "bg-black text-white border-black"
              : "bg-gray-100 hover:bg-gray-200"
          )}
        >
          By Operator (Pending)
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

        {/* Export */}
        <div className="ml-auto flex items-center gap-2">
          {tab === "summary" && (
            <button className="px-3 py-1.5 rounded border" onClick={exportSummaryCSV}>
              Export CSV
            </button>
          )}
          {tab === "byOperator" && (
            <button className="px-3 py-1.5 rounded border" onClick={exportGroupedCSV}>
              Export CSV
            </button>
          )}
          {tab === "history" && (
            <button className="px-3 py-1.5 rounded border" onClick={exportHistoryCSV}>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-white shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(tab === "summary" || tab === "byOperator") && (
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
              className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="Date"
              title="Travel date (YYYY-MM-DD)"
            />
          )}

          {/* Operator dropdown (optional) */}
          <select
            value={filter.operatorId}
            onChange={(e) => setFilter((f) => ({ ...f, operatorId: e.target.value }))}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            title="Filter by operator"
          >
            <option value="">Operator: Any</option>
            {operators.map((op) => (
              <option key={op._id} value={op._id}>
                {op.fullName || op.email} ({op._id.slice(-6)})
              </option>
            ))}
          </select>

          {/* Free text search (name/email/id) */}
          <input
            type="text"
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Search operator (name/email/id)…"
            title="Client-side search"
          />

          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100" onClick={load} disabled={loading}>
              Apply
            </button>
            <button
              className="text-sm underline text-gray-600"
              onClick={() => setFilter({ date: "", operatorId: "", q: "" })}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-xs text-gray-500">Bookings</div>
          <div className="text-xl font-semibold">{kpis.bookings.toLocaleString()}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-xs text-gray-500">Revenue</div>
          <div className="text-xl font-semibold">{toMoney(kpis.revenue)}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-xs text-gray-500">Commission</div>
          <div className="text-xl font-semibold">{toMoney(kpis.commission)}</div>
        </div>
        <div className="p-4 rounded-lg border bg-white">
          <div className="text-xs text-gray-500">Payable</div>
          <div className="text-xl font-semibold">{toMoney(kpis.payable)}</div>
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
              ) : (filteredSummary || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="border px-3 py-6 text-center text-gray-600">
                    No pending settlements.
                  </td>
                </tr>
              ) : (
                filteredSummary.map((r, i) => (
                  <tr key={`${r.operatorId}-${r.date}-${i}`} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{r.date}</td>
                    <td className="border px-3 py-2">
                      {(r.operatorName || r.operatorEmail || r.operatorId) ?? "-"}
                    </td>
                    <td className="border px-3 py-2 text-center">{r.totalBookings}</td>
                    <td className="border px-3 py-2 text-right">{toMoney(r.totalRevenue)}</td>
                    <td className="border px-3 py-2 text-right">{toMoney(r.totalCommission)}</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {toMoney(r.totalPayable)}
                    </td>
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
      ) : tab === "byOperator" ? (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Operator</th>
                <th className="border px-3 py-2 text-left">Email</th>
                <th className="border px-3 py-2 text-center">Dates</th>
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
              ) : (groupedByOperator || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="border px-3 py-6 text-center text-gray-600">
                    No pending settlements.
                  </td>
                </tr>
              ) : (
                groupedByOperator.map((r) => (
                  <tr key={r.operatorId} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{r.operatorName || r.operatorId}</td>
                    <td className="border px-3 py-2">{r.operatorEmail || "-"}</td>
                    <td className="border px-3 py-2 text-center">{r.datesCount}</td>
                    <td className="border px-3 py-2 text-center">{r.totalBookings}</td>
                    <td className="border px-3 py-2 text-right">{toMoney(r.totalRevenue)}</td>
                    <td className="border px-3 py-2 text-right">{toMoney(r.totalCommission)}</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {toMoney(r.totalPayable)}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        onClick={() => markPaidAllForOperator(r.operatorId)}
                      >
                        Mark Paid (All dates)
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
                    <td className="border px-3 py-2 text-right">{toMoney(p.totalRevenue)}</td>
                    <td className="border px-3 py-2 text-right">{toMoney(p.totalCommission)}</td>
                    <td className="border px-3 py-2 text-right font-semibold">
                      {toMoney(p.operatorReceivable)}
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
