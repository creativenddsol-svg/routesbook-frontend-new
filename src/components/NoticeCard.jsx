// src/components/NoticeCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

/**
 * Safely construct an absolute HTTPS image URL.
 * - Keeps existing https://
 * - Upgrades http:// to https://
 * - Resolves relative URLs against apiClient baseURL (or window location)
 * - Removes trailing "/api" from base paths
 * - Deduplicates slashes
 */
const buildAbsolute = (img, base) => {
  if (!img) return null;
  try {
    // Already absolute?
    if (/^https?:\/\//i.test(img)) {
      return img.replace(/^http:\/\//i, "https://");
    }

    // Resolve against base (apiClient baseURL or current location)
    const u = new URL(
      base || "",
      typeof window !== "undefined" ? window.location.href : "https://example.com"
    );
    const origin = u.origin;

    // Strip trailing "/api" from pathname if present
    const path = (u.pathname || "").replace(/\/api\/?$/i, "");

    // Ensure single leading slash for the image path
    const joined = (img.startsWith("/") ? "" : "/") + img.replace(/^\//, "");

    // Join & normalize (avoid double slashes except after protocol)
    return (origin + path + joined).replace(/([^:]\/)\/+/g, "$1");
  } catch {
    // Fallback to the raw value if URL construction fails
    return img;
  }
};

const NoticeCard = ({ notice, linkTo }) => {
  const base = apiClient?.defaults?.baseURL || "";
  const imgCandidate = notice?.imageUrl || notice?.image || notice?.cover || "";
  const src = useMemo(() => buildAbsolute(imgCandidate, base), [imgCandidate, base]);

  const CardInner = (
    <div className="w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
      {/* Match mobile rail sizing (prevents left overflow, keeps aspect) */}
      <div className="relative w-full h-40 sm:h-48">
        {src ? (
          <img
            src={src}
            alt={notice?.title || "Notice"}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
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
    <Link to={linkTo} aria-label={notice?.title || "View notice"}>
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
};

export default NoticeCard;
