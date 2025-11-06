import React from "react";

/** Redbus-style pager: "1/N" chip + tiny gray dots */
const NavDots = ({
  current = 0,   // zero-based
  total = 1,
  onDotClick,    // optional (i) => void
  className = "",
}) => {
  const safe = Math.min(Math.max(0, current), Math.max(0, total - 1));
  return (
    <div className={"w-full flex items-center justify-between gap-3 " + className}>
      {/* left: counter chip */}
      <span
        className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5
                   text-[10px] font-semibold rounded-full
                   bg-[var(--rb-primary,#D84E55)] text-white"
      >
        {safe + 1}/{total}
      </span>

      {/* right: dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === safe;
          return onDotClick ? (
            <button
              key={i}
              aria-label={`Go to card ${i + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-200
                          ${isActive ? "bg-gray-700 scale-110" : "bg-gray-300"}`}
              onClick={() => onDotClick(i)}
            />
          ) : (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full
                          ${isActive ? "bg-gray-700" : "bg-gray-300"}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NavDots;
