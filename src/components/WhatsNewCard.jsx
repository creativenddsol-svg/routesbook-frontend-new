// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { toImgURL } from "../api";

/**
 * Image-only banner card, now using h-40 sm:h-48 to match the standard
 * NoticeCard height for a prettier, more consistent look.
 */
const WhatsNewCard = ({ item, linkTo }) => {
  // Core logic remains the same: fetching image URL and title/alt text
  const src = toImgURL(item?.imageUrl || item?.image || item?.cover || "");
  const alt = item?.title || "What's new";

  const CardInner = (
    <div className="w-full rounded-lg overflow-hidden">
      {/* Pure image, fixed height, now using responsive height h-40 sm:h-48 */}
      {/* ✅ FIX: Updated height to match NoticeCard for better consistency. */}
      <div className="relative w-full h-40 sm:h-48">
        {src ? (
          <img
            src={src}
            alt={alt}
            // ✅ Mobile shows full image (object-contain); desktop keeps the previous fill look.
            className="w-full h-full object-contain md:object-cover object-center"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label={alt}>
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
};

export default WhatsNewCard;
