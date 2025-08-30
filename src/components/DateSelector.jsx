import { useRef, useEffect, useState } from "react";
import { FaCalendarAlt } from "react-icons/fa";

// Helper function to get a date in YYYY-MM-DD format
const toYYYYMMDD = (dateObj) => dateObj.toISOString().split("T")[0];

// Helper function to get human-readable parts from a date string
const getFormattedDate = (dateString) => {
  if (!dateString) {
    const today = new Date();
    dateString = toYYYYMMDD(today);
  }
  const [year, month, day] = dateString.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));

  return {
    day: dateObj.toLocaleDateString("en-US", {
      day: "2-digit",
      timeZone: "UTC",
    }),
    monthYear: dateObj.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    dayOfWeek: dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }),
  };
};

const DateSelector = ({ selectedDate, setSelectedDate }) => {
  const dateInputRef = useRef(null);
  const [activeButton, setActiveButton] = useState("");

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = toYYYYMMDD(today);
  const tomorrowStr = toYYYYMMDD(tomorrow);
  const formattedDate = getFormattedDate(selectedDate);

  useEffect(() => {
    if (selectedDate === todayStr) {
      setActiveButton("today");
    } else if (selectedDate === tomorrowStr) {
      setActiveButton("tomorrow");
    } else {
      setActiveButton("other");
    }
  }, [selectedDate, todayStr, tomorrowStr]);

  const handleDateButtonClick = (dateType) => {
    if (dateType === "today") {
      setSelectedDate(todayStr);
    } else if (dateType === "tomorrow") {
      setSelectedDate(tomorrowStr);
    } else {
      dateInputRef.current?.showPicker();
    }
  };

  const handleDateInputChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const buttonStyle =
    "font-sans font-semibold text-sm py-3 px-4 w-full rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400";
  const activeButtonSyle = "bg-[#D84E55] text-white shadow-md";
  const inactiveButtonStyle =
    "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50";

  return (
    // This padding ensures the component has its own spacing inside any container
    <div className="p-4 lg:p-6 w-full">
      <div
        className="flex items-center gap-4 mb-4 cursor-pointer"
        onClick={() => dateInputRef.current?.showPicker()}
      >
        <FaCalendarAlt className="text-xl lg:text-2xl text-red-500 flex-shrink-0" />
        <div>
          <p className="font-heading font-bold text-xl lg:text-2xl text-gray-800">
            {formattedDate.day}
          </p>
        </div>
        <div>
          <p className="font-sans font-semibold text-base text-gray-800">
            {formattedDate.monthYear}
          </p>
          <p className="font-sans text-sm text-gray-500">
            {formattedDate.dayOfWeek}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleDateButtonClick("today")}
          className={`${buttonStyle} ${
            activeButton === "today" ? activeButtonSyle : inactiveButtonStyle
          }`}
        >
          Today
        </button>
        <button
          onClick={() => handleDateButtonClick("tomorrow")}
          className={`${buttonStyle} ${
            activeButton === "tomorrow" ? activeButtonSyle : inactiveButtonStyle
          }`}
        >
          Tomorrow
        </button>
        <button
          onClick={() => handleDateButtonClick("other")}
          className={`${buttonStyle} ${
            activeButton === "other" ? activeButtonSyle : inactiveButtonStyle
          }`}
        >
          Other
        </button>
      </div>

      <input
        ref={dateInputRef}
        type="date"
        value={selectedDate}
        onChange={handleDateInputChange}
        min={todayStr}
        className="absolute opacity-0 pointer-events-none"
      />
    </div>
  );
};

export default DateSelector;
