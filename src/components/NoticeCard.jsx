// src/components/NoticeCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

// Build absolute https URL safely
const buildAbsolute = (img, base) => {
  if (!img) return null;
  try {
    if (/^https?:\/\//i.test(img)) return img.replace(/^http:\/\//i, "https://");
    const u = new URL(
      base || "",
      typeof window !== "undefined" ? window.location.href : "https://example.com"
    );
    const origin = u.origin;
    const path = (u.pathname || "").replace(/\/api\/?$/i, "");
    const joined = (img.startsWith("/") ? "" : "/") + img.replace(/^\//, "");
    return (origin + path + joined).replace(/([^:]\/)\/+/g, "$1");
  } catch {
    return img;
  }
};

const NoticeCard = ({ notice, linkTo }) => {
  const base = apiClient?.defaults?.baseURL || "";
  const src = useMemo(
    () => buildAbsolute(notice?.imageUrl || "", base),
    [notice?.imageUrl, base]
  );

  const CardInner = (
    <div className="w-full rounded-lg overflow-hidden">
      {/* Pure image, no shadows, no overlays */}
      <div className="relative w-full h-40 sm:h-48">
        {src ? (
          <img
            src={src}
            alt={notice?.title || "Notice"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label={notice?.title || "Notice"}>
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
};

export default NoticeCard;
