// src/pages/SearchResults/components/MobileCityPicker.jsx
import React, { useState } from "react";

export default function MobileCityPicker({
  open,
  mode,
  options,
  recent,
  onPick,
  onClose,
}) {
  const [q, setQ] = useState("");
  const all = options.map((o) => o.label);
  const filtered =
    q.trim() === ""
      ? all
      : all.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-[10050] bg-white flex flex-col">
      <div style={{ height: "env(safe-area-inset-top)" }} />
      <div className="px-4 pb-3 pt-3 border-b flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border flex items-center justify-center"
          aria-label="Back"
        >
          ←
        </button>
        <div className="text-base font-semibold">
          {mode === "from" ? "Select From City" : "Select To City"}
        </div>
      </div>
      <div className="px-4 py-3 border-b">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city"
          className="w-full rounded-xl border px-4 py-3 text-base outline-none"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          style={{ fontSize: 16, WebkitTextSizeAdjust: "100%" }}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Recent searches
          </div>
          {(recent?.[mode] || []).length === 0 ? (
            <div className="text-sm text-gray-400">No recent searches</div>
          ) : (
            <div className="mb-3 divide-y rounded-xl border border-gray-100 overflow-hidden">
              {recent[mode].map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-gray-50"
                  onClick={() => onPick(city)}
                >
                  <span className="text-base font-medium text-gray-800">
                    {city}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-4 pb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            {q ? "Matching Cities" : "All Cities"}
          </div>
          <div className="divide-y rounded-xl border border-gray-100 overflow-hidden">
            {filtered.map((c) => (
              <button
                key={c}
                className="w-full text-left px-3 py-3 active:bg-gray-50"
                onClick={() => onPick(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
