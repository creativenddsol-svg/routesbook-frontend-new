// src/components/NoticeCard.jsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

// ---- Robust absolute URL builder (forces https if needed) ----
const buildAbsolute = (img, base) => {
  if (!img) return null;
  try {
    // if already absolute
    if (/^https?:\/\//i.test(img)) {
      // upgrade http -> https to avoid mixed-content on vercel (https)
      return img.replace(/^http:\/\//i, "https://");
    }
    // api base (e.g., https://.../api)  -> origin without /api
    const u = new URL(base || "", typeof window !== "undefined" ? window.location.href : "https://example.com");
    const origin = u.origin;
    const path = (u.pathname || "").replace(/\/api\/?$/i, "");
    // ensure 1 slash between parts
    const joined =
      (img.startsWith("/") ? "" : "/") +
      img.replace(/^\//, "");
    return (origin + path + joined).replace(/([^:]\/)\/+/g, "$1");
  } catch {
    return img;
  }
};

const NoticeCard = ({ notice, linkTo }) => {
  const [errored, setErrored] = useState(false);

  const base = apiClient?.defaults?.baseURL || "";
  const src = useMemo(
    () => buildAbsolute(notice?.imageUrl || "", base),
    [notice?.imageUrl, base]
  );

  const CardInner = (
    <div className="w-[86vw] max-w-[360px] sm:w-[340px] rounded-3xl overflow-hidden shrink-0 snap-start ring-1 ring-black/5 bg-white">
      <div className="relative aspect-[16/10] w-full">
        {/* Image (or graceful placeholder if error/empty) */}
        {!errored && src ? (
          <img
            src={src}
            alt={notice?.title || "Notice"}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}

        {/* Overlay content (optional) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
        {(notice?.label || notice?.title || notice?.subtitle) && (
          <div className="absolute left-3 right-3 bottom-3 text-white">
            {notice?.label && (
              <span className="inline-block mb-2 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/85 text-gray-900">
                {notice.label}
              </span>
            )}
            {notice?.title && (
              <div className="text-[16px] font-bold leading-snug line-clamp-2">
                {notice.title}
              </div>
            )}
            {notice?.subtitle && (
              <div className="text-[12px] opacity-95 line-clamp-1">
                {notice.subtitle}
              </div>
            )}
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
