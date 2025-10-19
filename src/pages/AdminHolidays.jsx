// src/pages/AdminHolidays.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../api"; // ✅ shared API client (baseURL includes /api)

// UI options
const TYPE_OPTIONS = [
  { value: "national", label: "National" },
  { value: "poya", label: "Poya" },
  { value: "observance", label: "Observance" },
  { value: "other", label: "Other" },
];

const COLOR_OPTIONS = [
  { value: "rose", label: "rose" },
  { value: "indigo", label: "indigo" },
  { value: "emerald", label: "emerald" },
  { value: "amber", label: "amber" },
  { value: "slate", label: "slate" },
];

// Safe preview palette (avoid dynamic Tailwind class pitfalls)
const PALETTES = {
  rose:    { chipBg: "bg-rose-50",   chipText: "text-rose-700",   pillBg: "bg-rose-100",   ring: "ring-rose-200" },
  indigo:  { chipBg: "bg-indigo-50", chipText: "text-indigo-700", pillBg: "bg-indigo-100", ring: "ring-indigo-200" },
  emerald: { chipBg: "bg-emerald-50",chipText: "text-emerald-700",pillBg: "bg-emerald-100",ring: "ring-emerald-200" },
  amber:   { chipBg: "bg-amber-50",  chipText: "text-amber-800",  pillBg: "bg-amber-100",  ring: "ring-amber-200" },
  slate:   { chipBg: "bg-slate-50",  chipText: "text-slate-700",  pillBg: "bg-slate-100",  ring: "ring-slate-200" },
};

const fmtDayMon = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    : "DD Mon";

const AdminHolidays = () => {
  const token = localStorage.getItem("token");

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [type, setType] = useState("other");
  const [colorKey, setColorKey] = useState("rose");
  const [isActive, setIsActive] = useState(true);
  const [link, setLink] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [order, setOrder] = useState(0);
  const [expiresAt, setExpiresAt] = useState("");

  // List & UI state
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null); // null = create, otherwise update
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all (admin)
  const fetchHolidays = async () => {
    try {
      const res = await apiClient.get("/holidays", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setHolidays(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch holidays", err);
      alert(
        (err?.response?.data?.message) ||
          "Failed to fetch holidays"
      );
    }
  };

  useEffect(() => {
    if (token) fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setSavingId(null);
    setTitle("");
    setDate("");
    setType("other");
    setColorKey("rose");
    setIsActive(true);
    setLink("");
    setCtaLabel("");
    setOrder(0);
    setExpiresAt("");
  };

  const handleSave = async () => {
    if (!title || !date) {
      alert("Please fill Title and Date.");
      return;
    }
    const body = {
      title,
      date, // ISO string YYYY-MM-DD accepted by controller (new Date(date))
      type,
      colorKey,
      isActive,
      link,
      ctaLabel,
      order: Number(order) || 0,
    };
    if (expiresAt) body.expiresAt = expiresAt;

    try {
      setLoading(true);
      if (savingId) {
        // update
        await apiClient.patch(`/holidays/${savingId}`, body, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
      } else {
        // create
        await apiClient.post("/holidays", body, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
      }
      await fetchHolidays();
      resetForm();
      alert("Saved!");
    } catch (err) {
      console.error("Save failed", err);
      alert((err?.response?.data?.message) || "Failed to save holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this holiday? This cannot be undone.");
    if (!ok) return;
    try {
      setDeletingId(id);
      await apiClient.delete(`/holidays/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setHolidays((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
      alert((err?.response?.data?.message) || "Failed to delete holiday");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (h) => {
    setSavingId(h._id);
    setTitle(h.title || "");
    setDate(h.date ? h.date.slice(0, 10) : "");
    setType(h.type || "other");
    setColorKey(h.colorKey || "rose");
    setIsActive(Boolean(h.isActive));
    setLink(h.link || "");
    setCtaLabel(h.ctaLabel || "");
    setOrder(typeof h.order === "number" ? h.order : 0);
    setExpiresAt(h.expiresAt ? h.expiresAt.slice(0, 10) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Live preview palette
  const pal = PALETTES[colorKey] || PALETTES.rose;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Holidays</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Left: Form */}
        <div className="rounded-2xl border bg-white shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title (e.g., Deepavali)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-2 rounded"
            />

            <select
              className="border p-2 rounded"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={colorKey}
              onChange={(e) => setColorKey(e.target.value)}
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Order (0..n)"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="border p-2 rounded"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>

            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="border p-2 rounded md:col-span-2"
              placeholder="Auto-hide after (optional)"
            />

            <input
              type="url"
              placeholder="Optional Link (CTA target)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="border p-2 rounded md:col-span-2"
            />
            <input
              type="text"
              placeholder="CTA Label (e.g., Search buses)"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="border p-2 rounded md:col-span-2"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Saving..." : savingId ? "Update Holiday" : "Add Holiday"}
            </button>
            {savingId && (
              <button
                onClick={resetForm}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50"
              >
                Cancel edit
              </button>
            )}
            <p className="text-sm text-gray-500">
              Tip: Choose a color & type to style the small holiday card (no images).
            </p>
          </div>
        </div>

        {/* Right: Live preview (small holiday card) */}
        <div className="rounded-2xl border bg-white shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Live preview</p>
          <div
            className={`inline-block rounded-2xl px-4 py-3 ring-1 ${pal.ring} ${pal.chipBg}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pal.pillBg} ${pal.chipText}`}
              >
                {fmtDayMon(date)}
              </span>
              <span className={`text-sm font-semibold ${pal.chipText}`}>
                {title || "Holiday title"}
              </span>
            </div>
            {ctaLabel && (
              <div className="mt-2 text-[12px] font-semibold text-gray-700">
                {ctaLabel} {link ? "→ " + link : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Existing list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {holidays.map((h) => {
          const p = PALETTES[h.colorKey] || PALETTES.rose;
          return (
            <div
              key={h._id}
              className="rounded-2xl border bg-white shadow-sm p-4 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div
                  className={`inline-block rounded-2xl px-3 py-2 ring-1 ${p.ring} ${p.chipBg} mb-2`}
                >
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.pillBg} ${p.chipText} mr-2`}
                  >
                    {fmtDayMon(h.date)}
                  </span>
                  <span className={`text-sm font-semibold ${p.chipText}`}>
                    {h.title}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {h.type} · {h.colorKey} · {h.isActive ? "active" : "inactive"} ·
                  {" order "}{h.order}{h.expiresAt ? ` · expires ${h.expiresAt.slice(0,10)}` : ""}
                </div>
                {h.ctaLabel && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {h.ctaLabel} {h.link ? `→ ${h.link}` : ""}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <button
                  onClick={() => handleEdit(h)}
                  className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(h._id)}
                  disabled={deletingId === h._id}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId === h._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hide scrollbar utility for any horizontal lists we might add later */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AdminHolidays;
