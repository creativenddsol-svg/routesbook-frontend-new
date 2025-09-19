import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

// Build absolute https URL safely
const buildAbsolute = (img, base) => {
  if (!img) return null;
  try {
    if (/^https?:\/\//i.test(img)) return img.replace(/^http:\/\//i, "https://");
    const u = new URL(base || "", typeof window !== "undefined" ? window.location.href : "https://example.com");
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
  const src = useMemo(() => buildAbsolute(notice?.imageUrl || "", base), [notice?.imageUrl, base]);

  const CardInner = (
    <div className="w-[86vw] max-w-[360px] sm:w-[340px] rounded-3xl overflow-hidden shrink-0 snap-start ring-1 ring-black/5 bg-white">
      {/* Fixed height so it always shows even without aspect plugin */}
      <div
        className="
          relative w-full h-[210px] sm:h-[220px]
          bg-gray-200
          bg-center bg-cover
        "
        style={src ? { backgroundImage: `url("${src}")` } : undefined}
      >
        {/* App-like overlay */}
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
