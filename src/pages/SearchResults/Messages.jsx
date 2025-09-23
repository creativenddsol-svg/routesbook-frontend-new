import React from "react";
import { motion } from "framer-motion";
import { FaExclamationCircle } from "react-icons/fa";

const DEFAULT_PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  yellow: "#FFC107",
};

/**
 * Error block with retry button.
 *
 * Props:
 * - message?: string
 * - onRetry?: () => void
 * - PALETTE?: color tokens override
 */
export function ErrorDisplay({
  message,
  onRetry = () => {},
  PALETTE = DEFAULT_PALETTE,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-10 bg-white rounded-2xl shadow-md"
    >
      <FaExclamationCircle
        className="mx-auto text-6xl mb-4"
        style={{ color: PALETTE.yellow }}
      />
      <h3
        className="text-2xl font-bold mb-2"
        style={{ color: PALETTE.textDark }}
      >
        Oops! Something went wrong.
      </h3>
      <p className="max-w-md mx-auto mb-6" style={{ color: PALETTE.textLight }}>
        {message || "We encountered an error. Please try again later."}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-6 py-2.5 font-semibold rounded-lg text-white"
        style={{ backgroundColor: PALETTE.accentBlue }}
      >
        Try Again
      </motion.button>
    </motion.div>
  );
}

/**
 * Empty-state block for no results.
 *
 * Props:
 * - hasActiveFilters: boolean   // whether filters are applied
 * - onReset: () => void         // reset filters handler
 * - PALETTE?: color tokens override
 */
export function NoResultsMessage({
  hasActiveFilters,
  onReset,
  PALETTE = DEFAULT_PALETTE,
}) {
  const title = hasActiveFilters
    ? "No Buses Match Your Filters"
    : "No Buses Available";
  const message = hasActiveFilters
    ? "Try adjusting or resetting your filters."
    : "Unfortunately, no buses were found for this route on the selected date.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-10 bg-white rounded-2xl shadow-md"
    >
      <FaExclamationCircle
        className="mx-auto text-6xl mb-4"
        style={{ color: `${PALETTE.primaryRed}50` }}
      />
      <h3 className="text-2xl font-bold mb-2" style={{ color: PALETTE.textDark }}>
        {title}
      </h3>
      <p className="max-w-md mx-auto mb-6" style={{ color: PALETTE.textLight }}>
        {message}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="px-6 py-2.5 font-semibold rounded-lg text-white"
        style={{ backgroundColor: PALETTE.accentBlue }}
      >
        Reset All Filters
      </motion.button>
    </motion.div>
  );
}
