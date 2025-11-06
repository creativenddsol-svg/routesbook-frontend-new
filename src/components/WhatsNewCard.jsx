// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { toImgURL } from "../api";

/**
 * Wide banner card for “What’s new”.
 * - Uses the same wide aspect as your Admin preview (approx 360:170),
 *   so it won’t look square on mobile rails.
 * - Keeps object-cover to avoid letterboxing and match Notices look.
 */
const WhatsNewCard = ({ item, linkTo }) => {
  const src = toImgURL(item?.imageUrl || item?.image || item?.cover || "");
  const alt = item?.title || "What's new";

  const CardInner = (
    <div className="w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
      {/* Wide banner aspect (same feel as Admin preview) */}
      <div className="relative w-full aspect-[360/170]">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
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
