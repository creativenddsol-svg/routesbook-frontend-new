import { useEffect, useMemo, useState } from "react";
import apiClient from "../api";
import { Link } from "react-router-dom";

/* ---------------- helpers ---------------- */
const todayYYYYMMDD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

// convert "10:30 PM" / "22:05" → minutes since midnight for sorting
const toMinutes = (t) => {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const s = String(t).trim().toUpperCase();
  // "HH:MM AM/PM"
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hh = parseInt(ampmMatch[1], 10);
    const mm = parseInt(ampmMatch[2], 10);
    const ap = ampmMatch[3];
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    return hh * 60 + mm;
  }
  // "HH:MM" 24h
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    return hh * 60 + mm;
  }
  return Number.MAX_SAFE_INTEGER;
};

const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
  </svg>
);

/* ================== PAGE ================== */
const AdminArrivalsToday = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // global inputs for one-click sending
  const [date, setDate] = useState(todayYYYYMMDD());
  const [standPoint, setStandPoint] = useState(() => localStorage.getItem("arrive_stand") || "");
  const [platform, setPlatform] = useState(() => localStorage.getItem("arrive_platform") || "");
  const [savingPrefs, setSavingPrefs] = useState(true); // persist defaults automatically

  // search filters
  const [q, setQ] = useState("");
  const [routeFilter, setRouteFilter] = useState("");

  // avoid double sends per bus until refresh
  const [sentMap, setSentMap] = useState({}); // { [busId]: true }

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/buses");
        setBuses(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Failed to fetch buses", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // persist stand/platform choice for convenience
  useEffect(() => {
    if (!savingPrefs) return;
    try {
      localStorage.setItem("arrive_stand", standPoint || "");
      localStorage.setItem("arrive_platform", platform || "");
    } catch {}
  }, [standPoint, platform, savingPrefs]);

  const uniqueRoutes = useMemo(
    () => Array.from(new Set((buses || []).map((b) => `${b.from} → ${b.to}`))),
    [buses]
  );

  // only show "today's trips" — here we consider buses that have a departureTime string (every bus),
  // and we send using today's date field (admin sets/chosen at top).
  // Admin can still change Date at the top if needed, but the list remains the same for simplicity.
  const todayList = useMemo(() => {
    let list = [...(buses || [])];

    // search
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.name?.toLowerCase().includes(s) ||
          b.from?.toLowerCase().includes(s) ||
          b.to?.toLowerCase().includes(s) ||
          b.busNumber?.toLowerCase().includes(s) ||
          (b.departureTime || "").toLowerCase().includes(s)
      );
    }

    // route filter
    if (routeFilter) {
      list = list.filter((b) => `${b.from} → ${b.to}` === routeFilter);
    }

    // sort by departure time
    list.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime));

    return list;
  }, [buses, q, routeFilter]);

  const disabledGlobalSend = !standPoint || !date;

  const sendArrived = async (bus) => {
    if (disabledGlobalSend) {
      alert("Please fill Date and Stand first.");
      return;
    }
    if (sentMap[bus._id]) return;

    try {
      // optimistic disable
      setSentMap((m) => ({ ...m, [bus._id]: true }));

      const payload = {
        busId: bus._id,
        date, // "YYYY-MM-DD"
        departureTime: bus?.departureTime || "",
        standPoint,
        platform: platform || undefined,
      };

      const res = await apiClient.post("/admin/trips/arrived", payload, { timeout: 30000 });
      const sent = res?.data?.sent ?? 0;
      alert(`Arrived SMS sent to ${sent} passenger(s) — ${bus.name} ${bus.departureTime}`);
    } catch (e) {
      // re-enable on failure
      setSentMap((m) => {
        const copy = { ...m };
        delete copy[bus._id];
        return copy;
      });
      const msg = e?.response?.data?.message || "Failed to send arrival SMS";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Arrivals — Today</h1>
            <p className="text-gray-600">Quickly send “Bus Arrived” SMS to passengers in one click.</p>
          </div>
          <Link to="/admin" className="text-blue-600 hover:text-blue-800">
            ← Back to Admin
          </Link>
        </div>

        {/* Controls: Date + Stand + Platform */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <label className="block md:col-span-1">
              <span className="text-sm font-medium text-gray-700">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Stand (used for all sends)</span>
              <input
                type="text"
                placeholder="e.g., Matara Highway Stand"
                value={standPoint}
                onChange={(e) => setStandPoint(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>

            <label className="block md:col-span-1">
              <span className="text-sm font-medium text-gray-700">Platform (optional)</span>
              <input
                type="text"
                placeholder="e.g., 3"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>

            <label className="flex items-center gap-2 md:col-span-1">
              <input
                type="checkbox"
                checked={savingPrefs}
                onChange={(e) => setSavingPrefs(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Remember stand/platform</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Set the stand once. Then click “Send” on each bus below — one click per bus.
          </p>
        </div>

        {/* Search / Route filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search by bus name, route, number, or time"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Routes</option>
              {uniqueRoutes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing <b>{todayList.length}</b> buses
              </span>
              {(q || routeFilter) && (
                <button
                  onClick={() => {
                    setQ("");
                    setRouteFilter("");
                  }}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-600">Loading today’s buses…</div>
          ) : todayList.length === 0 ? (
            <div className="py-16 text-center text-gray-600">No matching buses found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {todayList.map((bus) => (
                  <tr key={bus._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {bus.departureTime || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800 whitespace-nowrap">
                      <div className="font-semibold">{bus.name}</div>
                      <div className="text-xs text-gray-500">{bus.busNumber}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {bus.from} → {bus.to}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => sendArrived(bus)}
                        disabled={disabledGlobalSend || sentMap[bus._id]}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                          disabledGlobalSend || sentMap[bus._id]
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                        title="Send 'Arrived' SMS"
                      >
                        <Icon path="M3 10h10M3 6h10M3 14h7M21 16V8a2 2 0 00-2-2h-4l-4-3-4 3H5a2 2 0 00-2 2v8a2 2 0 002 2h6" />
                        {sentMap[bus._id] ? "Sent" : "Send"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Note: This sends to passengers with bookings where payment is confirmed/manual for the selected date.
        </p>
      </div>
    </div>
  );
};

export default AdminArrivalsToday;
