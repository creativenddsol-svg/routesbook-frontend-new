import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import BookingSteps from "../components/BookingSteps";
import SeatLayout from "../components/SeatLayout";
import BookingSummary from "../components/BookingSummary";
import SeatLegend from "../components/SeatLegend";
import BookingPageSkeleton from "../components/BookingPageSkeleton";
import PointSelection from "../components/PointSelection";

const BookingPage = () => {
  const { busId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState({
    status: "loading",
    bus: null,
    bookedSeats: [],
    // NEW: gender map for already-booked seats (used only for coloring)
    seatGenderMap: {},
  });

  const [selectedSeats, setSelectedSeats] = useState([]);
  // NEW: genders for the seats user selects on this page (coloring + pass forward)
  const [selectedSeatGenders, setSelectedSeatGenders] = useState({}); // { "A1":"M"|"F" }

  const [date] = useState(searchParams.get("date") || "");
  const [departureTime] = useState(searchParams.get("departureTime") || "");

  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(null);

  // State for the full price breakdown
  const [basePrice, setBasePrice] = useState(0);
  const [convenienceFee, setConvenienceFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Effect to fetch initial bus and seat availability data
  useEffect(() => {
    if (!busId || !date || !departureTime) {
      setBookingData({
        status: "idle",
        bus: null,
        bookedSeats: [],
        seatGenderMap: {},
      });
      toast.error("Missing booking information. Please go back.");
      return;
    }

    const fetchData = async () => {
      setBookingData({
        status: "loading",
        bus: null,
        bookedSeats: [],
        seatGenderMap: {},
      });
      try {
        const [busRes, seatsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/buses/${busId}`),
          axios.get(
            `http://localhost:5000/api/bookings/booked-seats?busId=${busId}&date=${date}&departureTime=${departureTime}`
          ),
        ]);

        const bus = busRes.data;
        const bookedSeats = Array.isArray(seatsRes.data.bookedSeats)
          ? seatsRes.data.bookedSeats.map(String)
          : [];
        // NEW: gender map returned by backend for coloring booked seats
        const seatGenderMap = seatsRes.data.seatGenderMap || {};

        setBookingData({
          status: "success",
          bus: bus,
          bookedSeats,
          seatGenderMap,
        });
        setSelectedSeats([]); // Reset seat selection on new data load
        setSelectedSeatGenders({}); // Reset genders

        if (bus.boardingPoints?.length > 0)
          setSelectedBoardingPoint(bus.boardingPoints[0]);
        if (bus.droppingPoints?.length > 0)
          setSelectedDroppingPoint(bus.droppingPoints[0]);
      } catch (err) {
        setBookingData({
          status: "error",
          bus: null,
          bookedSeats: [],
          seatGenderMap: {},
        });
        toast.error("Failed to load booking information.");
      }
    };

    fetchData();
  }, [busId, date, departureTime]);

  // Effect to calculate prices whenever selections change
  useEffect(() => {
    if (bookingData.status !== "success" || !bookingData.bus) return;

    const { bus } = bookingData;
    let pricePerSeat = bus.price;

    if (
      selectedBoardingPoint &&
      selectedDroppingPoint &&
      bus.fares?.length > 0
    ) {
      const specificFare = bus.fares.find(
        (f) =>
          f.boardingPoint === selectedBoardingPoint.point &&
          f.droppingPoint === selectedDroppingPoint.point
      );
      if (specificFare) {
        pricePerSeat = specificFare.price;
      }
    }

    const currentBasePrice = pricePerSeat * selectedSeats.length;
    let currentConvenienceFee = 0;

    if (bus.convenienceFee) {
      if (bus.convenienceFee.amountType === "percentage") {
        currentConvenienceFee =
          (currentBasePrice * bus.convenienceFee.value) / 100;
      } else {
        // Calculate fixed convenience fee per seat
        currentConvenienceFee = bus.convenienceFee.value * selectedSeats.length;
      }
    }

    setBasePrice(currentBasePrice);
    setConvenienceFee(currentConvenienceFee);
    setTotalPrice(currentBasePrice + currentConvenienceFee);
  }, [
    selectedSeats,
    selectedBoardingPoint,
    selectedDroppingPoint,
    bookingData,
  ]);

  const handleSeatToggle = (seat) => {
    if (bookingData.bookedSeats.includes(String(seat))) return;

    setSelectedSeats((prev) => {
      const exists = prev.includes(seat);
      const canAdd = !exists && prev.length < 4;

      const next = exists
        ? prev.filter((s) => s !== seat)
        : canAdd
        ? [...prev, seat]
        : (toast.error("You can select a maximum of 4 seats."), prev);

      // NEW: keep selectedSeatGenders in sync (default "M" on add, delete on remove)
      setSelectedSeatGenders((g) => {
        const copy = { ...g };
        if (exists) {
          delete copy[String(seat)];
        } else if (canAdd) {
          if (!copy[String(seat)]) copy[String(seat)] = "M";
        }
        return copy;
      });

      return next;
    });
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat.");
      return;
    }
    if (!selectedBoardingPoint || !selectedDroppingPoint) {
      toast.error("Please select boarding and dropping points.");
      return;
    }

    navigate("/confirm-booking", {
      state: {
        bus: bookingData.bus,
        busId,
        date,
        departureTime, // Pass departureTime to the next step
        selectedSeats,
        // NEW: pass genders so Confirm page can show/adjust before final booking
        seatGenders: selectedSeatGenders,
        priceDetails: { basePrice, convenienceFee, totalPrice }, // Pass the full price object
        selectedBoardingPoint,
        selectedDroppingPoint,
      },
    });
  };

  if (bookingData.status === "loading") {
    return <BookingPageSkeleton />;
  }

  if (bookingData.status === "error" || !bookingData.bus) {
    return (
      <div className="text-center p-8 text-red-500">
        Could not load bus data. Please go back and try again.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <BookingSteps currentStep={2} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
          <SeatLegend />
          <SeatLayout
            seatLayout={bookingData.bus.seatLayout}
            bookedSeats={bookingData.bookedSeats}
            selectedSeats={selectedSeats}
            onSeatClick={handleSeatToggle}
            /* NEW: only for coloring, no UI change */
            bookedSeatGenders={bookingData.seatGenderMap || {}}
            selectedSeatGenders={selectedSeatGenders}
          />
        </div>
        <div className="md:col-span-1 flex flex-col gap-4">
          <PointSelection
            boardingPoints={bookingData.bus.boardingPoints}
            droppingPoints={bookingData.bus.droppingPoints}
            selectedBoardingPoint={selectedBoardingPoint}
            setSelectedBoardingPoint={setSelectedBoardingPoint}
            selectedDroppingPoint={selectedDroppingPoint}
            setSelectedDroppingPoint={setSelectedDroppingPoint}
          />
          <BookingSummary
            bus={bookingData.bus}
            selectedSeats={selectedSeats}
            date={date}
            basePrice={basePrice}
            convenienceFee={convenienceFee}
            totalPrice={totalPrice}
            onProceed={handleProceedToPayment}
            boardingPoint={selectedBoardingPoint}
            droppingPoint={selectedDroppingPoint}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
