// src/pages/WhatsNew.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import WhatsNewCard from "../components/WhatsNewCard";

const WhatsNew = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await axios.get("/api/whats-new/active", {
          withCredentials: true,
        });
        if (live) setItems(res.data || []);
      } catch (e) {
        if (live) setErr(e?.response?.data?.message || "Failed to load items.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">What’s new</h1>
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

  if (err) {
    return (
      <div className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">What’s new</h1>
        <p className="text-red-600">{err}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">What’s new</h1>
      {items.length === 0 ? (
        <p className="text-gray-600">No items to show.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <WhatsNewCard key={it._id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsNew;
