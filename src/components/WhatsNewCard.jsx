// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api"; // ✅ shared API client

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
  const title = item && item.title ? item.title : "What's new"; // used for alt only
  const src = absolutize(imageUrl);

  const ImageOnly = (
    <div className="rounded-xl sm:rounded-2xl overflow-hidden border-0 bg-white">
      {/* Keep the rail tidy with fixed ratio; image shown exactly as uploaded via object-contain */}
      <div className="aspect-[4/3] w-full">
        <img
          src={src}
          alt={title}                /* accessible; not visible */
          className="block w-full h-full object-contain bg-white"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label="View What's new" className="no-underline">
      {ImageOnly}
    </Link>
  ) : (
    ImageOnly
  );
};

export default WhatsNewCard;
