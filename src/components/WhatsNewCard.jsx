// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api"; // ✅ shared API client

/* Build absolute URL for images */
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
  const imageUrl = item?.imageUrl || "";
  const title = item?.title || "What's new"; // only used for alt text
  const src = absolutize(imageUrl);

  const ImageOnly = (
    <img
      src={src}
      alt={title}
      className="block w-full h-auto object-contain rounded-xl sm:rounded-2xl"
      loading="lazy"
      decoding="async"
    />
  );

  return linkTo ? (
    <Link to={linkTo} aria-label="View What's new" className="no-underline block">
      {ImageOnly}
    </Link>
  ) : (
    ImageOnly
  );
};

export default WhatsNewCard;
