// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api"; // ✅ use shared API client (baseURL includes /api)

/* Build absolute URL for images (no optional chaining) */
const API_ORIGIN = (function () {
  try {
    const base = (apiClient && apiClient.defaults && apiClient.defaults.baseURL) || "";
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

const WhatsNewCard = ({ item, linkTo }) => {
  const imageUrl = item && item.imageUrl ? item.imageUrl : "";
  const title = item && item.title ? item.title : "What's new";
  const src = absolutize(imageUrl);

  const CardInner = (
    <div className="w-[300px] sm:w-[340px] rounded-2xl overflow-hidden shrink-0 snap-start">
      {/* Reduced height: aspect-[360/260] → aspect-[360/220] */}
      <div className="aspect-[360/220] w-full">
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label="View all What's new">
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
};

export default WhatsNewCard;
