// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { toImgURL } from "../api";

/**
 * Wide banner card for “What’s new” (no-crop on mobile/desktop).
 * - Fixed wide aspect so cards never look square
 * - Centers image and uses max-* constraints to avoid any clipping
 */
const WhatsNewCard = ({ item, linkTo }) => {
  const src = toImgURL(item?.imageUrl || item?.image || item?.cover || "");
  const alt = item?.title || "What's new";

  const CardInner = (
    <div className="w-full rounded-xl overflow-hidden shadow-md bg-white">
      {/* Wide aspect box; flex-center so the image can 'fit' without cropping */}
      <div className="relative w-full aspect-[360/170] bg-white flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={alt}
            // ⬇️ Important: no fixed w/h; let it size naturally inside the box
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
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
