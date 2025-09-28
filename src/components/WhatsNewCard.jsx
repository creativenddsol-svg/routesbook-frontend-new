// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

/* Build absolute URL for images */
const API_ORIGIN = (function () {
  try {
    const base = (apiClient && apiClient.defaults && apiClient.defaults.baseURL) || "";
    const u = new URL(base);
    const path = (u.pathname || "").replace(/\/api\/?$/, "");
    return u.origin + path;
  } catch {
    return "";
  }
})();

function absolutize(u) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (!API_ORIGIN) return u;
  return u.charAt(0) === "/" ? API_ORIGIN + u : API_ORIGIN + "/" + u;
}

const WhatsNewCard = ({ item, linkTo }) => {
  const src = absolutize(item?.imageUrl || "");
  const alt = item?.title || "What's new";

  // Fixed heights match your rail: 225px (mobile), 255px (sm+)
  const ImageOnly = (
    <img
      src={src}
      alt={alt}
      className="block w-full h-[225px] sm:h-[255px] object-contain"
      loading="lazy"
      decoding="async"
    />
  );

  return linkTo ? (
    <Link to={linkTo} aria-label="View What's new" className="block no-underline">
      {ImageOnly}
    </Link>
  ) : (
    ImageOnly
  );
};

export default WhatsNewCard;
