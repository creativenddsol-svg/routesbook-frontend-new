// src/pages/SearchResults/components/BookingDeadlineTimer.jsx
import { useEffect, useState } from "react";
import { FaHourglassHalf } from "react-icons/fa";
import { PALETTE } from "../_core";

/* ---------------- BookingDeadlineTimer ---------------- */
const BookingDeadlineTimer = ({
  deadlineTimestamp,
  departureTimestamp,
  onDeadline,
}) => {
  const [timeLeft, setTimeLeft] = useState(deadlineTimestamp - Date.now());

  useEffect(() => {
    if (Date.now() >= deadlineTimestamp || Date.now() >= departureTimestamp) {
      setTimeLeft(0);
      if (
        Date.now() >= deadlineTimestamp &&
        Date.now() < departureTimestamp &&
        onDeadline
      ) {
        onDeadline();
      }
      return;
    }
    const intervalId = setInterval(() => {
      const newTimeLeft = deadlineTimestamp - Date.now();
      if (newTimeLeft <= 0) {
        setTimeLeft(0);
        clearInterval(intervalId);
        if (onDeadline) onDeadline();
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [deadlineTimestamp, departureTimestamp, onDeadline]);

  if (Date.now() >= departureTimestamp) {
    return (
      <p
        className="text-xs font-medium mt-1"
        style={{ color: PALETTE.textLight }}
      >
        <FaHourglassHalf className="inline mr-1" /> Departed
      </p>
    );
  }
  if (timeLeft <= 0) {
    return (
      <p
        className="text-xs font-bold mt-1"
        style={{ color: PALETTE.primaryRed }}
      >
        <FaHourglassHalf className="inline mr-1" /> Booking Closed
      </p>
    );
  }
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  return (
    <div
      className="text-xs font-semibold mt-1 tabular-nums"
      style={{ color: PALETTE.orange }}
    >
      <FaHourglassHalf className="inline mr-1 animate-pulse" />
      Booking closes in: {String(hours).padStart(2, "0")}:
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

export default BookingDeadlineTimer;
