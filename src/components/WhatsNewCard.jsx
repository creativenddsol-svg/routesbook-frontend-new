// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { toImgURL } from "../api";

/**
 * Image-only banner card, identical in structure to NoticeCard:
 * - Fixed height of h-40
 * - Rounded corners + overflow hidden
 */
const WhatsNewCard = ({ item, linkTo }) => {
  // We continue to use toImgURL as the NoticeCard example relies on internal logic (buildAbsolute/apiClient)
  const src = toImgURL(item?.imageUrl || item?.image || item?.cover || "");
  const alt = item?.title || "What's new";

  const CardInner = (
    <div className="w-full rounded-lg overflow-hidden">
      {/* Pure image, fixed height, matching NoticeCard */}
      <div className="relative w-full h-40">
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
