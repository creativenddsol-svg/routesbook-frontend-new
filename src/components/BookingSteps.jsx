import React from "react";
import { CheckCircle } from "lucide-react";

const BookingSteps = ({ currentStep }) => {
  const steps = [
    { id: 1, label: "Select Bus", shortLabel: "Bus", icon: "map" },
    { id: 2, label: "", shortLabel: "Seats", icon: "chair" }, // MODIFIED: Changed label to empty string
    { id: 3, label: "Passenger Details", shortLabel: "Details", icon: "user" },
    { id: 4, label: "Payment", shortLabel: "Payment", icon: "credit-card" },
    { id: 5, label: "Download Ticket", shortLabel: "Ticket", icon: "ticket" },
  ];

  const getStepIcon = (iconName) => {
    // SVG icon definitions remain the same...
    switch (iconName) {
      case "map":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 6l-6-3-6 3v12l6-3 6 3 6-3V3l-6 3zM9 4.2l4 2v9.6l-4-2V4.2zM3 7.8l4-2v9.6l-4 2V7.8zm16 9.6l-4-2V5.8l4 2v9.6z" />
          </svg>
        );
      case "chair":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 2h12c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v6h12V4H6zm-4 8h20v2H2v-2zm4 4h12v4h2v-4h2v6H2v-6h2v4h2v-4z" />
          </svg>
        );
      case "user":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm0 2c2.69 0 5.77 1.28 6 2H6c.2-.72 3.3-2 6-2z" />
          </svg>
        );
      case "credit-card":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 2v2H4V6h16zM4 18v-6h16v6H4zm2-4h12v2H6v-2z" />
          </svg>
        );
      case "ticket":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 10V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 100 4v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 100-4zm-2-4v3h-2V6h2zM4 6h12v3H4V6zm0 12v-3h2v3H4zm14 0H8v-3h10v3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const activeBlueRGB = "59, 130, 246"; // blue-500

  return (
    <div className="sticky top-14 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm font-sans">
      <div className="w-full max-w-6xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <style jsx>{`
          @keyframes pulse-glow {
            0%,
            100% {
              box-shadow: 0 0 0 0 rgba(${activeBlueRGB}, 0.4);
            }
            50% {
              box-shadow: 0 0 0 6px rgba(${activeBlueRGB}, 0);
            }
          }
          .animate-pulse-glow {
            animation: pulse-glow 2s ease-out infinite;
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Unified Mobile and Desktop View */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center text-center w-20">
                  <div
                    className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white animate-pulse-glow"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      getStepIcon(step.icon)
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs md:text-sm font-medium tracking-wide transition-colors duration-300 ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }`}
                  >
                    {/* Responsive Label */}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 md:mx-4 transition-colors duration-500 rounded-full ${
                      isCompleted ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Step Title - more integrated */}
        <div className="text-center mt-5 animate-fade-in-up" aria-live="polite">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
            {steps.find((s) => s.id === currentStep)?.label}
          </h2>
          {/* MODIFIED: Changed comment syntax from HTML to JSX */}
          {/* <p className="text-sm text-gray-500 mt-1">
            Please complete the details for Step {currentStep} of {steps.length}
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default BookingSteps;
