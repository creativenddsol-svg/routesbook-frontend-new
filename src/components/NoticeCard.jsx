// src/components/NoticeCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

/* Build absolute URL for images (kept) */
const API_ORIGIN = (function () {
  try {
    const base =
      (apiClient && apiClient.defaults && apiClient.defaults.baseURL) || "";
    const u = new URL(base);
    const pathname = u && u.pathname ? u.pathname : "";
    const path = pathname.replace(/\/api\/?$/, "");
    return u.origin + path;
  } catch (e) {
    return "";
  }
})();
function absolutize(u) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (!API_ORIGIN) return u;
  if (u.charAt(0) === "/") return API_ORIGIN + u;
  return API_ORIGIN + "/" + u;
}

const NoticeCard = ({ notice, linkTo }) => {
  const imageUrl = notice?.imageUrl || "";
  const src = absolutize(imageUrl);

  const Card = (
    <div
      className="
        w-[86vw] max-w-[360px] sm:w-[340px]
        rounded-3xl overflow-hidden shrink-0 snap-start
        ring-1 ring-black/5 bg-white
      "
    >
      {/* Taller aspect on mobile for app-feel */}
      <div className="relative aspect-[16/10] w-full">
        <img
          src={src}
          alt="Notice"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {/* App-like gradient + text slots (render only if provided) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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
        {notice?.link && (
          <div className="absolute right-2 bottom-2">
            <div className="px-3 py-1.5 text-[12px] font-semibold rounded-full bg-white/90 text-gray-900 ring-1 ring-black/10">
              Know more →
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label="View all notices">
      {Card}
    </Link>
  ) : (
    Card
  );
};

export default NoticeCard;
