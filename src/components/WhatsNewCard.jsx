import React from "react";
import { Link } from "react-router-dom";
import apiClient from "../api"; // ✅ use shared API client (baseURL includes /api)

/* Build absolute URL for images (no optional chaining) */
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

/**
 * Helper component to render an SVG based on the card title, 
 * or use the provided imageUrl if available.
 */
const CardIllustration = ({ title = "", imageUrl }) => {
  const src = absolutize(imageUrl);

  // If a specific illustration URL is provided, use it
  if (src) {
    return (
      <img
        src={src}
        alt={`${title} illustration`}
        className="w-full h-full object-contain"
        loading="lazy"
        decoding="async"
        // onError: You might want a fallback here if the URL fails to load
      />
    );
  }

  // --- Placeholder Logic for demonstration (replace with your custom SVGs) ---
  const svgClasses = "w-12 h-12";
  let illustrationSvg = (
    <svg className={`${svgClasses} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  ); // Default: Clock/Time

  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('cancellation') || lowerTitle.includes('refund')) {
    illustrationSvg = (
      <svg className={`${svgClasses} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    ); // Cross
  } else if (lowerTitle.includes('timing') || lowerTitle.includes('live')) {
    illustrationSvg = (
      <svg className={`${svgClasses} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.75a6 6 0 11-6-6h6a6 6 0 016 6z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"></path></svg>
    ); // Dashboard/Speed
  } else if (lowerTitle.includes('assurance') || lowerTitle.includes('secure')) {
    illustrationSvg = (
      <svg className={`${svgClasses} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.617 10.617a9 9 0 11-12.617-12.617 9 9 0 0112.617 12.617z"></path></svg>
    ); // Checkmark
  }

  return illustrationSvg;
};

const WhatsNewCard = ({ item, linkTo }) => {
  // Destructure with fallbacks, assuming a rich item structure
  const title = item?.title || "What's new";
  const description = item?.description || "Read about the latest features and updates.";
  const buttonText = item?.buttonText || "Know More";
  const imageUrl = item?.imageUrl || "";
  const baseColor = item?.color || 'indigo'; // Fallback to a default color

  // Determine Tailwind color classes dynamically
  const bgColorClass = `bg-${baseColor}-600`;
  const bgIllustrationClass = `bg-${baseColor}-50`;
  const btnColorClass = `text-${baseColor}-200 hover:text-white`;
  
  const CardInner = (
    <div
      className={`
        relative w-full h-[260px] p-6 pt-10 // Fixed height helps maintain layout consistency
        ${bgColorClass} // Primary background color (e.g., bg-red-600)
        rounded-3xl 
        overflow-hidden cursor-pointer shrink-0 snap-start
        shadow-xl hover:shadow-2xl transition-shadow duration-300 // Key shadow for the modern card look
      `}
    >
      {/* 1. The integrated, "matte" illustration area (lighter background layer) */}
      <div
        className={`
          absolute bottom-0 right-0 
          w-full h-2/3 
          ${bgIllustrationClass} // Light background color (e.g., bg-red-50)
        `}
      />

      {/* 2. Illustration/Icon area - positioned to break the card frame slightly */}
      <div 
        className="absolute bottom-4 right-4 p-4 rounded-xl bg-white/50 backdrop-blur-sm shadow-md"
      >
        <CardIllustration title={title} imageUrl={imageUrl} />
      </div>

      {/* 3. Card Content (always on top, relative z-10) */}
      <div className="relative z-10 text-white flex flex-col justify-between h-full">
        <div>
          <h3 className="text-2xl font-bold mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-sm font-medium opacity-80 mb-4 line-clamp-2">
            {description}
          </p>
        </div>
        <div className="flex justify-start">
            <span
              className={`
                text-sm font-semibold inline-flex items-center 
                ${btnColorClass} // Button text color (e.g., text-red-200)
                transition-colors duration-200
                group-hover:translate-x-0.5
              `}
            >
              {buttonText} &rarr;
            </span>
        </div>
      </div>
    </div>
  );

  return linkTo ? (
    <Link to={linkTo} aria-label={`View details for ${title}`} className="group">
      {CardInner}
    </Link>
  ) : (
    <div className="group">
      {CardInner}
    </div>
  );
};

export default WhatsNewCard;
