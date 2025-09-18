// src/pages/SpecialNotices.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import apiClient from "../api"; // ✅ use shared API client (baseURL includes /api)
import SpecialNoticeCard from "../components/SpecialNoticeCard";

const SpecialNotices = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const inFlight = useRef(false);
  const cancelRef = useRef(null);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setErr("");
    setLoading(true);

    // basic exponential backoff for 429s: 800ms → 1600ms → 3200ms
    const maxTries = 3;
    let attempt = 0;
    let lastError = null;

    const source = new AbortController();
    cancelRef.current = source;

    while (attempt < maxTries) {
      try {
        // ✅ call your backend through apiClient; path has no /api prefix
        const res = await apiClient.get("/special-notices", {
          signal: source.signal,
        });
        setItems(res.data || []);
        setLoading(false);
        inFlight.current = false;
        return;
      } catch (e) {
        lastError = e;
        const status = e?.response?.status;
        const isAbort = e?.name === "CanceledError" || e?.name === "AbortError";
        if (isAbort) break;

        if (status === 429 && attempt < maxTries - 1) {
          // wait and retry
          const delay = 800 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          attempt += 1;
          continue;
        }
        break;
      }
    }

    setLoading(false);
    inFlight.current = false;
    const message =
      lastError?.response?.data?.message ||
      (lastError?.response?.status === 429
        ? "Rate limit hit. Please try again."
        : "Failed to load special notices.");
    setErr(message);
  }, []);

  useEffect(() => {
    load();
    return () => {
      try {
        cancelRef.current?.abort();
      } catch {}
      inFlight.current = false;
    };
  }, [load]);

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Special Notices</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-[220px] rounded-2xl ring-1 ring-black/5 bg-white shadow-sm animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Special Notices</h1>

      {err ? (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-red-600">{err}</p>
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm hover:opacity-90"
          >
            Retry
          </button>
        </div>
      ) : null}

      {items.length === 0 && !err ? (
        <p className="text-gray-600">No notices to show.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((n) => (
            <SpecialNoticeCard key={n._id} notice={n} aspect="4:3" />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialNotices;
