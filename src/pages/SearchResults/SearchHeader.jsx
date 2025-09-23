import { useMemo, useRef } from "react";
import Select from "react-select";
import { FaExchangeAlt, FaSearch, FaCalendarAlt } from "react-icons/fa";

/**
 * Desktop sticky search bar for Search Results page.
 *
 * Props expected (from index.jsx):
 * - from, to, date
 * - fromOptions, toOptions  // [{value,label}]
 * - onChangeFrom(v), onChangeTo(v), onChangeDate(v)
 * - onSwap()                // swap from/to values
 * - onSubmit()              // run the search (will also release seats upstream)
 * - getReadableDate(dateStr: 'YYYY-MM-DD') -> '23 Sep 2025'
 * - PALETTE                 // colors object
 */
export default function SearchHeader({
  from,
  to,
  date,
  fromOptions = [],
  toOptions = [],
  onChangeFrom,
  onChangeTo,
  onChangeDate,
  onSwap,
  onSubmit,
  getReadableDate,
  PALETTE = {
    primaryRed: "#D84E55",
    accentBlue: "#3A86FF",
    textDark: "#1A1A1A",
    textLight: "#4B5563",
    borderLight: "#E9ECEF",
    white: "#FFFFFF",
    datePillBg: "#FFF9DB",
  },
}) {
  const dateInputRef = useRef(null);

  const selectStyles = useMemo(
    () => ({
      control: (p) => ({
        ...p,
        border: "none",
        boxShadow: "none",
        backgroundColor: "transparent",
        minHeight: "auto",
        height: "auto",
        cursor: "pointer",
      }),
      valueContainer: (p) => ({ ...p, padding: 0 }),
      placeholder: (p) => ({
        ...p,
        color: PALETTE.textLight,
        fontSize: 16,
        fontWeight: 500,
      }),
      singleValue: (p) => ({
        ...p,
        color: PALETTE.textDark,
        fontSize: 18,
        fontWeight: 600,
      }),
      menu: (p) => ({
        ...p,
        borderRadius: 12,
        boxShadow:
          "0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }),
      option: (p, state) => ({
        ...p,
        backgroundColor: state.isSelected
          ? PALETTE.primaryRed
          : state.isFocused
          ? "#FEE2E2"
          : PALETTE.white,
        color: state.isSelected ? PALETTE.white : PALETTE.textDark,
        cursor: "pointer",
        padding: "12px 16px",
        transition: "background-color .15s ease",
      }),
      menuPortal: (p) => ({ ...p, zIndex: 9999 }),
    }),
    [PALETTE]
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, []);

  const selectedFrom = useMemo(
    () => (from ? { value: from, label: from } : null),
    [from]
  );
  const selectedTo = useMemo(
    () => (to ? { value: to, label: to } : null),
    [to]
  );

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onSubmit && onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white border rounded-2xl shadow-sm px-4 py-3"
      style={{ borderColor: PALETTE.borderLight }}
    >
      <div className="grid grid-cols-12 gap-3 items-stretch">
        {/* FROM */}
        <div className="col-span-5 xl:col-span-4">
          <label className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textLight }}>
            From
          </label>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
               style={{ borderColor: PALETTE.borderLight }}>
            <Select
              value={selectedFrom}
              onChange={(opt) => onChangeFrom && onChangeFrom(opt?.value ?? "")}
              options={fromOptions}
              placeholder="Select city"
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          </div>
        </div>

        {/* SWAP */}
        <div className="col-span-2 xl:col-span-1 flex items-end justify-center">
          <button
            type="button"
            onClick={onSwap}
            className="w-10 h-10 rounded-xl border flex items-center justify-center"
            aria-label="Swap cities"
            title="Swap"
            style={{ borderColor: PALETTE.borderLight, color: PALETTE.accentBlue }}
          >
            <FaExchangeAlt />
          </button>
        </div>

        {/* TO */}
        <div className="col-span-5 xl:col-span-4">
          <label className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textLight }}>
            To
          </label>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
               style={{ borderColor: PALETTE.borderLight }}>
            <Select
              value={selectedTo}
              onChange={(opt) => onChangeTo && onChangeTo(opt?.value ?? "")}
              options={toOptions}
              placeholder="Select city"
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          </div>
        </div>

        {/* DATE */}
        <div className="col-span-7 xl:col-span-2">
          <label className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textLight }}>
            Date
          </label>
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker()}
            className="w-full h-[44px] rounded-xl border flex items-center justify-between px-3 font-semibold"
            style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark, background: PALETTE.white }}
          >
            <span className="flex items-center gap-2">
              <FaCalendarAlt />
              {getReadableDate ? getReadableDate(date) : date}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: PALETTE.datePillBg }}>
              Change
            </span>
          </button>
          {/* hidden native input */}
          <input
            ref={dateInputRef}
            type="date"
            value={date || todayStr}
            min={todayStr}
            onChange={(e) => onChangeDate && onChangeDate(e.target.value)}
            className="sr-only pointer-events-none"
            aria-hidden
            tabIndex={-1}
          />
        </div>

        {/* SEARCH */}
        <div className="col-span-5 xl:col-span-1 flex items-end">
          <button
            type="submit"
            className="w-full h-[44px] rounded-xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: PALETTE.accentBlue }}
          >
            <FaSearch /> Search
          </button>
        </div>
      </div>

      {/* tiny breadcrumb-ish helper */}
      <div className="mt-2 text-[11px]" style={{ color: PALETTE.textLight }}>
        Bus Ticket <span className="mx-1 text-gray-400">›</span> {from || "—"} to {to || "—"} Bus
      </div>
    </form>
  );
}
