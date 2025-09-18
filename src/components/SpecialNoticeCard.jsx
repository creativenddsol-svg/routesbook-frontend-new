// src/components/SpecialNoticeCard.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import apiClient from "../api"; // ✅ NEW: use baseURL to build absolute image URLs

const AR_MAP = {
  "16:9": "pb-[56.25%]",
  "4:3": "pb-[75%]",
  golden: "pb-[61.8%]",
};

/* ---------- Build absolute URL for images ---------- */
const API_ORIGIN = (() => {
  try {
    const u = new URL(apiClient.defaults.baseURL || "");
    // strip trailing /api if present
    const path = u.pathname?.replace(/\/api\/?$/, "") || "";
    return `${u.origin}${path}`;
  } catch {
    return "";
  }
})();
const absolutize = (u) => {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (!API_ORIGIN) return u;
  if (u.startsWith("/")) return `${API_ORIGIN}${u}`;
  return `${API_ORIGIN}/${u}`;
};

const SpecialNoticeCard = ({ notice, aspect = "4:3", linkTo }) => {
  const cardVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  const pbClass = AR_MAP[aspect] || AR_MAP["4:3"];
  const imgSrc = absolutize(notice?.imageUrl); // ✅ ensure correct host even behind Vercel/Cloudflare

  // ✅ In-app navigation branch
  if (linkTo) {
    return (
      <Link
        to={linkTo}
        aria-label="View all special notices"
        className="block cursor-pointer"
      >
        <motion.div
          className={`relative w-full ${pbClass} rounded-2xl overflow-hidden ring-1 ring-black/5 bg-white shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-300 pointer-events-auto`}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          title={notice?.title}
        >
          {/* ✅ updated: use computed absolute URL */}
          <img
            src={imgSrc}
            alt={notice?.title || "Special notice"}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {notice?.label ? (
            <div className="absolute left-2 top-2 pointer-events-none">
              <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-white/85 text-gray-900 ring-1 ring-black/10">
                {notice.label}
              </span>
            </div>
          ) : null}
        </motion.div>
      </Link>
    );
  }

  // 🔗 Default: external link (unchanged)
  return (
    <motion.a
      href={notice?.link || "#"}
      target={notice?.link ? "_blank" : undefined}
      rel={notice?.link ? "noopener noreferrer" : undefined}
      className={`relative block w-full ${pbClass} rounded-2xl overflow-hidden 
                  ring-1 ring-black/5 bg-white shadow-sm 
                  hover:shadow-md hover:-translate-y-[2px] transition-all duration-300`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      title={notice?.title}
    >
      {/* ✅ updated: use computed absolute URL */}
      <img
        src={imgSrc}
        alt={notice?.title || "Special notice"}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {notice?.label ? (
        <div className="absolute left-2 top-2">
          <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-white/85 text-gray-900 ring-1 ring-black/10">
            {notice.label}
          </span>
        </div>
      ) : null}
      {notice?.link ? (
        <div className="absolute right-2 bottom-2">
          <span className="px-3 py-1.5 text-[12px] font-semibold rounded-full bg-white/85 text-gray-900 ring-1 ring-black/10">
            View ›
          </span>
        </div>
      ) : null}
    </motion.a>
  );
};

export const SpecialNoticeSkeleton = () => (
  <div className="bg-gray-200 rounded-2xl w-full pb-[75%] animate-pulse shadow-sm relative" />
);

export default SpecialNoticeCard;
