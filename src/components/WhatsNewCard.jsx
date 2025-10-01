// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { toImgURL } from "../api";

/**
 * Minimal, image-first banner card:
 * - No padding/shadow/background color
 * - Rounded corners + overflow hidden
 * - Consistent 16:9 banner aspect (like Abhibus)
 * - Image shown as-is (no tint), with subtle hover zoom
 */
const WhatsNewCard = ({ item, linkTo }) => {
  const src = toImgURL(item?.imageUrl || item?.image || item?.cover || "");
  const alt = item?.title || "What's new";

  const Card = (
    <div
      className="
        group relative w-full overflow-hidden rounded-xl
        aspect-[16/9]               /* keep uniform banner shape */
      "
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="
            h-full w-full object-cover
            transition-transform duration-300
            group-hover:scale-[1.03]  /* soft zoom on hover */
          "
        />
      ) : (
        <div className="h-full w-full bg-gray-100" />
      )}

      {/* Optional bottom text if provided (kept minimal; no tint on image) */}
      {(item?.title || item?.subtitle) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 sm:p-3">
          {item?.title && (
            <div className="inline-flex rounded-md bg-white/90 px-2 py-1 text-[12px] font-semibold text-gray-900">
              {item.title}
            </div>
          )}
          {item?.subtitle && (
            <div className="mt-1 inline-flex rounded-md bg-white/85 px-2 py-0.5 text-[11px] text-gray-700">
              {item.subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label={alt} className="block no-underline">
      {Card}
    </Link>
  ) : (
    Card
  );
};

export default WhatsNewCard;
