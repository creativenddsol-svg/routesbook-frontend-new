// src/components/WhatsNewCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const WhatsNewCard = ({ item, linkTo }) => {
  const { imageUrl } = item || {};

  const CardInner = (
    <div className="w-[300px] sm:w-[340px] rounded-2xl overflow-hidden shrink-0 snap-start">
      {/* Reduced height: aspect-[360/260] → aspect-[360/220] */}
      <div className="aspect-[360/220] w-full">
        <img
          src={imageUrl}
          alt={item?.title || "What's new"}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label="View all What's new">
      {CardInner}
    </Link>
  ) : (
    CardInner
  );
};

export default WhatsNewCard;
