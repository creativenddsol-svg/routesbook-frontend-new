// src/pages/SearchResults/Messages.jsx
import { motion } from "framer-motion";

const toText = (val) => {
  if (typeof val === "string") return val;
  if (val?.message) return String(val.message);
  try { return JSON.stringify(val); } catch { return String(val); }
};

export function ErrorDisplay({ message, onRetry }) {
  const text = toText(message) || "We encountered an error. Please try again later.";
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="text-center p-10 bg-white rounded-2xl shadow-md">
      <h3 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h3>
      <p className="max-w-md mx-auto mb-6">{text}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-6 py-2.5 font-semibold rounded-lg text-white bg-blue-600">
          Try Again
        </button>
      )}
    </motion.div>
  );
}

export function NoResultsMessage({ hasActiveFilters, onReset }) {
  const title = hasActiveFilters ? "No Buses Match Your Filters" : "No Buses Available";
  const message = hasActiveFilters
    ? "Try adjusting or resetting your filters."
    : "Unfortunately, no buses were found for this route on the selected date.";
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="text-center p-10 bg-white rounded-2xl shadow-md">
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="max-w-md mx-auto mb-6">{message}</p>
      {onReset && (
        <button onClick={onReset} className="px-6 py-2.5 font-semibold rounded-lg text-white bg-blue-600">
          Reset All Filters
        </button>
      )}
    </motion.div>
  );
}
