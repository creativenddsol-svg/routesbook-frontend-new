// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";
// ✅ added: use the shared normalizer
import { toImgURL } from "../api";

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
  // ✅ updated: delegate to the shared helper (handles /uploads and http→https)
  return toImgURL(u);
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
