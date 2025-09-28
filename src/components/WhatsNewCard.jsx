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



const WhatsNewCard = ({ item, linkTo }) => {

  const imageUrl = item && item.imageUrl ? item.imageUrl : "";

  const title = item && item.title ? item.title : "What's new";

  const src = absolutize(imageUrl);



  const CardInner = (

    <div className="group bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden flex flex-col">

      {/* ✅ Match aspect ratio & padding with Popular Routes */}

      <div className="aspect-[4/3] w-full">

        <img

          src={src}

          alt={title}

          className="w-full h-full object-cover"

          loading="lazy"

          decoding="async"

        />

      </div>

      <div className="p-3 sm:p-4 flex-grow flex items-center justify-center">

        <h3 className="text-sm sm:text-base font-semibold text-gray-800 text-center truncate">

          {title}

        </h3>

      </div>

    </div>

  );



  return linkTo ? (

    <Link to={linkTo} aria-label="View What's new">

      {CardInner}

    </Link>

  ) : (

    CardInner

  );

};



export default WhatsNewCard;
