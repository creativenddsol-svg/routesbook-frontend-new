// src/pages/lib/utils.js

export const toLocalYYYYMMDD = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getReadableDate = (dateString) => {
  if (!dateString) return "Select Date";
  const [year, month, day] = dateString.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const getMobileDateParts = (dateString) => {
  if (!dateString) return { top: "-- ---", bottom: "" };
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const top = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const bottom = dt.toLocaleDateString("en-GB", { weekday: "short" });
  return { top, bottom };
};

export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "-";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 24 * 60; // handle overnight trips
  const dur = end - start;
  const h = Math.floor(dur / 60);
  const m = dur % 60;
  return `${h}h ${m}m`;
};

export const getDisplayPrice = (bus, from, to) => {
  if (bus?.fares && Array.isArray(bus.fares)) {
    const f = bus.fares.find(
      (fare) => fare.boardingPoint === from && fare.droppingPoint === to
    );
    if (f?.price != null) return f.price;
  }
  return bus?.price ?? 0;
};

