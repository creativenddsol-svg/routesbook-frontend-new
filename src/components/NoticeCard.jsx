import React from "react";
import { Link } from "react-router-dom";

const NoticeCard = ({ notice, linkTo }) => {
  const { imageUrl } = notice || {};

  const Card = (
    <div className="w-[300px] sm:w-[340px] rounded-2xl overflow-hidden shrink-0 snap-start">
      {/* Increased height: aspect ratio from 360/220 → 360/260 (~1.38) */}
      <div className="aspect-[360/260] w-full">
        <img
          src={imageUrl}
          alt="Notice"
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label="View all notices">
      {Card}
    </Link>
  ) : (
    Card
  );
};

export default NoticeCard;
