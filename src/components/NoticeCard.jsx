// src/components/NoticeCard.jsx
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

const NoticeCard = ({ notice, linkTo }) => {
  const imageUrl = notice && notice.imageUrl ? notice.imageUrl : "";
  const src = absolutize(imageUrl);

  const Card = (
    <div className="w-[300px] sm:w-[340px] rounded-2xl overflow-hidden shrink-0 snap-start">
      {/* Increased height: aspect ratio from 360/220 → 360/260 (~1.38) */}
      <div className="aspect-[360/260] w-full">
        <img
          src={src}
          alt="Notice"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
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
