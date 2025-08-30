import React from "react";
import PropTypes from "prop-types";
import {
  FaBus,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaChair,
  FaArrowRight,
} from "react-icons/fa";

const BookingSummary = ({
  bus,
  selectedSeats,
  date,
  basePrice,
  convenienceFee,
  totalPrice,
  onProceed,
  boardingPoint,
  droppingPoint,
}) => {
  const getReadableDate = (dateString) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("-").map(Number);
    // Use UTC to prevent timezone off-by-one errors
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const hasSelection =
    selectedSeats.length > 0 && boardingPoint && droppingPoint;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 h-full flex flex-col shadow-sm">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">
        Booking Summary
      </h3>

      {/* Main Content Area */}
      <div className="flex-grow space-y-4">
        {/* Bus and Journey Info */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <FaBus className="text-gray-400" />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{bus.name}</p>
              <p className="text-gray-500">
                {bus.from} <FaArrowRight className="inline mx-1 text-xs" />{" "}
                {bus.to}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-gray-400" />
            <p className="text-gray-600 font-medium">{getReadableDate(date)}</p>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-dashed border-gray-200" />

        {/* Boarding and Dropping Points */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="text-green-500 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Boarding Point</p>
              {boardingPoint ? (
                <p className="text-gray-600">
                  <span className="font-bold">{boardingPoint.time}</span> -{" "}
                  {boardingPoint.point}
                </p>
              ) : (
                <p className="text-red-500">Please select a point</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="text-red-500 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Dropping Point</p>
              {droppingPoint ? (
                <p className="text-gray-600">
                  <span className="font-bold">{droppingPoint.time}</span> -{" "}
                  {droppingPoint.point}
                </p>
              ) : (
                <p className="text-red-500">Please select a point</p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-dashed border-gray-200" />

        {/* Selected Seats */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FaChair className="text-gray-400" />
            <h4 className="font-semibold text-gray-800 text-sm">
              Selected Seats ({selectedSeats.length})
            </h4>
          </div>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((seat) => (
                <span
                  key={seat}
                  className="bg-gray-100 text-gray-800 font-semibold px-3 py-1 text-xs rounded-full"
                >
                  {seat}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No seats selected</p>
          )}
        </div>
      </div>

      {/* Footer with Price and Button */}
      <div className="mt-auto pt-4">
        {/* Price Breakdown */}
        {selectedSeats.length > 0 && (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {basePrice?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Convenience Fee</span>
              <span>Rs. {convenienceFee?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold text-base mt-2 pt-2 border-t border-dashed">
              <span>Total Price</span>
              <span>Rs. {totalPrice?.toFixed(2) || "0.00"}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onProceed}
          disabled={!hasSelection}
          className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-base"
          style={{
            backgroundColor: hasSelection ? "#DC2626" : "#9CA3AF",
          }}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

// Adding PropTypes for better component contract and error checking
BookingSummary.propTypes = {
  bus: PropTypes.object.isRequired,
  selectedSeats: PropTypes.arrayOf(PropTypes.string).isRequired,
  date: PropTypes.string.isRequired,
  basePrice: PropTypes.number.isRequired,
  convenienceFee: PropTypes.number.isRequired,
  totalPrice: PropTypes.number.isRequired,
  onProceed: PropTypes.func.isRequired,
  boardingPoint: PropTypes.object,
  droppingPoint: PropTypes.object,
};

export default BookingSummary;
