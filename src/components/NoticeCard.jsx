// src/components/NoticeCard.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

// Build absolute https URL safely
const buildAbsolute = (img, base) => {
  if (!img) return null;
  try {
    // Check if the URL already has http or https.
    // FIX: Using string regex notation and escaping slashes for safe deployment.
    if (/^https?:\/\//i.test(img)) 
      // Replace http:// with https://
      return img.replace(/^http:\/\//i, "https://"); 

    const u = new URL(
      base || "",
      typeof window !== "undefined"
        ? window.location.href
        : "https://example.com"
    );
    const origin = u.origin;
    
    // Remove /api/ from the path if present.
    // FIX: Escaping slashes.
    const path = (u.pathname || "").replace(/\/api\/?$/i, ""); 
    
    // Join the path and the image URL correctly.
    const joined = (img.startsWith("/") ? "" : "/") + img.replace(/^\//, "");
    
    // Clean up double slashes (except after the colon in 'http://')
    // FIX: Escaping slashes.
    return (origin + path + joined).replace(/([^:]\/)\/+/g, "$1");
  } catch {
    // Fallback if URL construction fails
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
    <div className="w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
      {/* Pure image, fixed height (h-40 sm:h-48 is a good, consistent size) */}
      <div className="relative w-full h-40 sm:h-48">
        {src ? (
          <img
            src={src} // This is the final URL from buildAbsolute
            alt={notice?.title || "Notice"}
            className="w-full h-full object-cover" 
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
            {/* This fallback div shows "No Image" if 'src' is null/empty */}
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
