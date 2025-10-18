// src/pages/operator/OperatorBusSeatView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

// ✅ shared API client
import apiClient from "../../api";

// Component Imports
import PointSelection from "../../components/PointSelection";
import SeatLayout from "../../components/SeatLayout";
import SeatLegend from "../../components/SeatLegend";

// Datepicker Imports
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../components/CalendarStyles.css";

// Icon Import
import { Calendar as CalendarIcon } from "lucide-react";

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="calendar-modal-overlay" onClick={onClose}>
      <div className="calendar-modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// --- Helper Functions ---
const toLocalYYYYMMDD = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getScheduledTurnsForDate = (bus, date) => {
  if (!bus || !date)
    return bus
      ? [{ departureTime: bus.departureTime, arrivalTime: bus.arrivalTime, isRotating: false }]
      : [];
  const { rotationSchedule, departureTime, arrivalTime } = bus;
  if (!rotationSchedule || !rotationSchedule.isRotating)
    return [{ departureTime, arrivalTime, isRotating: false }];

  const { startDate, rotationLength, intervals } = rotationSchedule;
  const bookingDate = new Date(date);
  const rotationStartDate = new Date(startDate);
  if (!startDate || !rotationLength || isNaN(bookingDate.getTime()) || isNaN(rotationStartDate.getTime()))
    return [{ departureTime, arrivalTime, isRotating: false }];

  const timeDiff = bookingDate.setHours(0, 0, 0, 0) - rotationStartDate.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  if (dayDiff < 0) return [{ departureTime, arrivalTime, isRotating: false }];

  const dayOffset = dayDiff % rotationLength;
  const daySchedule = intervals.find((i) => i.dayOffset === dayOffset);
  if (daySchedule && daySchedule.turns && daySchedule.turns.length > 0)
    return daySchedule.turns.map((turn) => ({ ...turn, isRotating: true }));

  return [{ departureTime, arrivalTime, isRotating: false }];
};

// --- Date Selection UI Component ---
const DateSelection = ({ selectedDate, onDateChange }) => {
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const selectedDateObj = new Date(selectedDate + "T00:00:00");

  const handleDateClick = (date) => onDateChange(toLocalYYYYMMDD(date));
  const handleCalendarChange = (date) => {
    onDateChange(toLocalYYYYMMDD(date));
    setCalendarOpen(false);
  };

  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  return (
    <>
      <Modal isOpen={isCalendarOpen} onClose={() => setCalendarOpen(false)}>
        <DatePicker selected={selectedDateObj} onChange={handleCalendarChange} minDate={new Date()} inline />
      </Modal>

      <div className="bg-gray-100 p-4 rounded-lg shadow-inner mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Select Departure Date</h3>
          <button onClick={() => setCalendarOpen(true)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <CalendarIcon size={24} className="text-gray-600" />
          </button>
        </div>
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          {dates.map((date, index) => {
            const day = date.toLocaleDateString("en-US", { weekday: "short" });
            const dayOfMonth = date.getDate();
            const isSelected = toLocalYYYYMMDD(date) === selectedDate;

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 min-w-[60px] ${
                  isSelected ? "bg-red-500 text-white shadow-md" : "bg-white hover:bg-blue-50 border border-gray-200"
                }`}
              >
                <span className={`text-sm font-medium ${isSelected ? "text-red-100" : "text-gray-500"}`}>{day}</span>
                <span className={`text-xl font-bold ${isSelected ? "text-white" : "text-gray-800"}`}>{dayOfMonth}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// --- Main Page Component ---
const OperatorBusSeatView = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [date, setDate] = useState(() => toLocalYYYYMMDD(new Date()));
  const [passengerInfo, setPassengerInfo] = useState({ fullName: "", phone: "", nic: "" });
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(null);
  const [saving, setSaving] = useState(false);

  const scheduledTurns = useMemo(() => getScheduledTurnsForDate(bus, date), [bus, date]);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(0);

  useEffect(() => {
    setSelectedTurnIndex(0);
    setSelectedSeats([]);
  }, [date, bus]);

  // Price preview using same fare logic as submission (UI-only)
  const previewTotalPrice = useMemo(() => {
    if (!bus) return 0;
    const count = selectedSeats.length;
    if (count === 0) return 0;

    if (
      selectedBoardingPoint &&
      selectedDroppingPoint &&
      Array.isArray(bus.fares) &&
      bus.fares.length > 0
    ) {
      const specificFare = bus.fares.find(
        (f) => f.boardingPoint === selectedBoardingPoint.point && f.droppingPoint === selectedDroppingPoint.point
      );
      if (specificFare?.price) return Number(specificFare.price) * count;
    }
    return Number(bus.price || 0) * count;
  }, [bus, selectedSeats, selectedBoardingPoint, selectedDroppingPoint]);

  // Fetch bus details
  useEffect(() => {
    const fetchBusDetails = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/operator/buses/${busId}`);
        const fetchedBus = res.data;
        setBus(fetchedBus);
        if (fetchedBus?.boardingPoints?.length) setSelectedBoardingPoint(fetchedBus.boardingPoints[0]);
        if (fetchedBus?.droppingPoints?.length) setSelectedDroppingPoint(fetchedBus.droppingPoints[0]);
      } catch (err) {
        if (err?.response?.status === 401) {
          navigate("/login?redirect=" + encodeURIComponent(location.pathname), { replace: true, state: { from: location } });
          return;
        }
        alert("Failed to load bus information.");
      } finally {
        setLoading(false);
      }
    };
    fetchBusDetails();
  }, [busId, navigate, location]);

  // Fetch booked seats for the selected date + turn
  const fetchTakenSeats = async (theDate, theDepartureTime) => {
    try {
      const res = await apiClient.get(`/operator/bookings/booked-seats`, {
        params: { busId, date: theDate, departureTime: theDepartureTime },
      });
      const arr = Array.isArray(res.data?.bookedSeats) ? res.data.bookedSeats.map(String) : [];
      setBookedSeats(arr);
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/login?redirect=" + encodeURIComponent(location.pathname), {
          replace: true,
          state: { from: location },
        });
        return;
      }
      setBookedSeats([]);
      alert("Failed to load booked seats for the selected trip.");
    }
  };

  useEffect(() => {
    const selectedTurn = scheduledTurns[selectedTurnIndex];
    if (!(date && busId && selectedTurn)) return;
    setBookedSeats([]);
    fetchTakenSeats(date, selectedTurn.departureTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId, date, selectedTurnIndex, scheduledTurns]);

  const toggleSeat = (seat) => {
    const seatStr = String(seat);
    if (bookedSeats.includes(seatStr)) return;
    setSelectedSeats((prev) =>
      prev.includes(seatStr)
        ? prev.filter((s) => s !== seatStr)
        : prev.length < 4
        ? [...prev, seatStr]
        : (alert("You can select a maximum of 4 seats."), prev)
    );
  };

  const handleManualBooking = async () => {
    const selectedTurn = scheduledTurns[selectedTurnIndex];
    if (!selectedTurn) {
      alert("Please select a valid schedule for the booking.");
      return;
    }
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
    if (!selectedBoardingPoint || !selectedDroppingPoint) {
      alert("Please select boarding and dropping points.");
      return;
    }
    if (!passengerInfo.fullName || !passengerInfo.phone) {
      alert("Please enter passenger name and phone number.");
      return;
    }

    try {
      setSaving(true);

      // ✅ Align payload with backend controller
      await apiClient.post(`/operator/bookings/manual`, {
        busId,
        date,
        departureTime: selectedTurn.departureTime,
        selectedSeats: selectedSeats.map(String),
        from: selectedBoardingPoint.point,
        to: selectedDroppingPoint.point,
        passengerInfo,
      });

      alert("Booking created successfully!");
      setSelectedSeats([]);
      setPassengerInfo({ fullName: "", phone: "", nic: "" });

      // Re-fetch from server to include any seats taken in the same second
      await fetchTakenSeats(date, selectedTurn.departureTime);
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/login?redirect=" + encodeURIComponent(location.pathname), {
          replace: true,
          state: { from: location },
        });
        return;
      }
      console.error("Manual booking failed:", err);
      alert(err?.response?.data?.message || "An unknown error occurred during booking.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">Loading bus details...</div>;
  if (!bus) return <div className="p-4">Bus not found.</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Manual Booking for {bus.name}</h2>

      <DateSelection selectedDate={date} onDateChange={setDate} />

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-lg font-semibold text-blue-800 text-center mb-3">
          Select Schedule for {new Date(date + "T00:00:00").toDateString()}
        </p>
        <div className="space-y-2">
          {scheduledTurns.map((turn, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg flex items-center cursor-pointer border-2 ${
                selectedTurnIndex === index ? "bg-blue-100 border-blue-500" : "bg-white border-gray-200"
              }`}
              onClick={() => setSelectedTurnIndex(index)}
            >
              <input
                type="radio"
                name="scheduleTurn"
                checked={selectedTurnIndex === index}
                onChange={() => setSelectedTurnIndex(index)}
                className="h-4 w-4 mr-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-grow">
                Departure: <span className="font-bold">{turn.departureTime || "N/A"}</span> | Arrival:{" "}
                <span className="font-bold">{turn.arrivalTime || "N/A"}</span>
              </div>
              {turn.isRotating && (
                <span className="ml-2 text-xs font-semibold text-white bg-green-600 px-2 py-1 rounded-full align-middle">
                  ROTATING
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <PointSelection
          {...{
            boardingPoints: bus.boardingPoints,
            droppingPoints: bus.droppingPoints,
            selectedBoardingPoint,
            setSelectedBoardingPoint,
            selectedDroppingPoint,
            setSelectedDroppingPoint,
          }}
        />
      </div>

      <div className="mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
        <SeatLegend />
        <SeatLayout
          {...{
            seatLayout: bus.seatLayout,
            bookedSeats,
            selectedSeats,
            onSeatClick: toggleSeat,
            // ✅ avoid undefined gender map in operator view
            bookedSeatGenders: {},
          }}
        />
      </div>

      <div className="mb-6 p-4 border border-blue-200 rounded-md bg-blue-50 text-blue-800">
        <p className="text-lg font-medium">Selected Seats: {selectedSeats.join(", ") || "None"}</p>
        <p className="text-lg font-medium">Total Price: LKR {previewTotalPrice}.00</p>
      </div>

      <div className="mb-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Passenger Details</h3>
        <input
          type="text"
          placeholder="Passenger Full Name"
          value={passengerInfo.fullName}
          onChange={(e) => setPassengerInfo({ ...passengerInfo, fullName: e.target.value })}
          className="w-full border p-2 rounded-md"
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={passengerInfo.phone}
          onChange={(e) => setPassengerInfo({ ...passengerInfo, phone: e.target.value })}
          className="w-full border p-2 rounded-md"
          required
        />
        <input
          type="text"
          placeholder="NIC (Optional)"
          value={passengerInfo.nic}
          onChange={(e) => setPassengerInfo({ ...passengerInfo, nic: e.target.value })}
          className="w-full border p-2 rounded-md"
        />
      </div>

      <button
        onClick={handleManualBooking}
        disabled={saving || selectedSeats.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-md shadow-lg"
      >
        {saving ? "Saving…" : "Confirm Manual Booking"}
      </button>
    </div>
  );
};

export default OperatorBusSeatView;
