import React from "react";
import { Check } from "lucide-react";

// A new, cleaner, and more integrated booking progress component.
const BookingProgressTracker = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "Select Bus" },
    { id: 2, label: "Select Seats" },
    { id: 3, label: "Passenger Details" },
    { id: 4, label: "Payment" },
    { id: 5, label: "Get Ticket" },
  ];

  return (
    // This container has no background or borders.
    // It's designed to sit seamlessly on your page.
    // py-8 adds vertical spacing from other page elements.
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 font-sans">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div className="flex flex-col items-center w-32 md:w-40">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ease-in-out ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500" // Completed: Green background and border
                      : isActive
                      ? "bg-white border-blue-500 scale-110" // Active: White background, blue border, slightly larger
                      : "bg-white border-gray-300" // Pending: White background, gray border
                  }`}
                  style={{
                    boxShadow: isActive
                      ? `0 0 12px rgba(59, 130, 246, 0.5)`
                      : "none", // Glow effect for active step
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  ) : (
                    <span
                      className={`text-lg font-bold ${
                        isActive ? "text-blue-500" : "text-gray-400"
                      }`}
                    >
                      {step.id}
                    </span>
                  )}
                </div>
                <div className="text-center mt-3">
                  <p
                    className={`text-sm md:text-base font-semibold transition-colors duration-300 ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-xs text-gray-400 transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    Current Step
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 rounded-full mx-2 transition-colors duration-500 ease-in-out bg-gray-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: isCompleted ? "100%" : "0%",
                      transition: "width 0.5s ease-in-out",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BookingProgressTracker;
