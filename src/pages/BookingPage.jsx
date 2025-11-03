// src/pages/BookingPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import BookingSteps from "../components/BookingSteps";
import SeatLayout from "../components/SeatLayout";
import BookingSummary from "../components/BookingSummary";
import SeatLegend from "../components/SeatLegend";
import BookingPageSkeleton from "../components/BookingPageSkeleton";
import PointSelection from "../components/PointSelection";
// ✅ Use shared API client
import apiClient, { getClientId } from "../api";

/* ---------------- Small helpers (auth + keepalive) ---------------- */
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

const BookingPage = () => {
  const { busId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [bookingData, setBookingData] = useState({
    status: "loading",
    bus: null,
    bookedSeats: [],
    seatGenderMap: {},
  });

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedSeatGenders, setSelectedSeatGenders] = useState({}); // { "A1":"M"|"F" }

  const [date] = useState(searchParams.get("date") || "");
  const [departureTime] = useState(searchParams.get("departureTime") || "");

  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(null);

  const [basePrice, setBasePrice] = useState(0);
  const [convenienceFee, setConvenienceFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // keep latest for cleanup on unmount
  const latestSeatsRef = useRef([]);
  const latestBusRef = useRef(null);
  useEffect(() => {
    latestSeatsRef.current = selectedSeats.map(String);
  }, [selectedSeats]);
  useEffect(() => {
    latestBusRef.current = bookingData.bus;
  }, [bookingData.bus]);

  // Fetch bus + booked seats
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
          apiClient.get(`/buses/${busId}`),
          apiClient.get(
            `/bookings/booked-seats?busId=${busId}&date=${date}&departureTime=${departureTime}`
          ),
        ]);

        const bus = busRes.data;
        const bookedSeats = Array.isArray(seatsRes.data.bookedSeats)
          ? seatsRes.data.bookedSeats.map(String)
          : [];
        const seatGenderMap = seatsRes.data.seatGenderMap || {};

        setBookingData({
          status: "success",
          bus,
          bookedSeats,
          seatGenderMap,
        });
        setSelectedSeats([]);
        setSelectedSeatGenders({});

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

  // Price calculation
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
        currentConvenienceFee =
          bus.convenienceFee.value * selectedSeats.length;
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

  /* ---------------- Lock / Release seats ---------------- */
  const lockSeat = async (seatStr) => {
    const token = getAuthToken();
    const payload = {
      busId,
      date,
      departureTime,
      seats: [String(seatStr)],
      clientId: getClientId(),
    };
    try {
      const res = await apiClient.post(
        "/bookings/lock",
        payload,
        buildAuthConfig(token)
      );
      return res?.data?.ok;
    } catch (e) {
      // allow guest fallback on 400/401, otherwise treat as failure
      if (e?.response?.status === 400 || e?.response?.status === 401) {
        return true; // skipped lock but keep optimistic UX
      }
      return false;
    }
  };

  const releaseSeats = async (seatsToRelease) => {
    if (!seatsToRelease?.length) return;
    const token = getAuthToken();
    const payload = {
      busId,
      date,
      departureTime,
      seats: seatsToRelease.map(String),
      clientId: getClientId(),
    };
    try {
      await apiClient.delete("/bookings/release", {
        ...buildAuthConfig(token),
        data: payload,
      });
    } catch {
      /* no-op */
    }
  };

  // Keepalive backup (fires on refresh/close)
  const keepaliveReleaseAll = () => {
    try {
      const token = getAuthToken();
      const baseURL =
        (apiClient && apiClient.defaults && apiClient.defaults.baseURL) || "";
      const url = (path) =>
        baseURL ? `${baseURL.replace(/\/+$/, "")}${path}` : `${path}`;

      const payload = {
        busId,
        date,
        departureTime,
        seats: latestSeatsRef.current.map(String),
        clientId: getClientId(),
      };

      if (!payload.seats.length) return;

      fetch(url("/bookings/release"), {
        method: "DELETE",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch {
      /* swallow */
    }
  };

  // Handle seat toggle (optimistic with server reconciliation)
  const handleSeatToggle = async (seat) => {
    if (bookingData.bookedSeats.includes(String(seat))) return;

    const seatStr = String(seat);
    const already = selectedSeats.includes(seatStr);

    // UNSELECT: optimistic remove + release
    if (already) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seatStr));
      setSelectedSeatGenders((g) => {
        const copy = { ...g };
        delete copy[seatStr];
        return copy;
      });
      releaseSeats([seatStr]);
      return;
    }

    // SELECT: guard for max 4
    if (selectedSeats.length >= 4) {
      toast.error("You can select a maximum of 4 seats.");
      return;
    }

    // optimistic add
    setSelectedSeats((prev) => [...prev, seatStr]);
    setSelectedSeatGenders((g) => ({ ...g, [seatStr]: g[seatStr] || "M" }));

    // try to lock; if fail, revert
    const ok = await lockSeat(seatStr);
    if (!ok) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seatStr));
      setSelectedSeatGenders((g) => {
        const copy = { ...g };
        delete copy[seatStr];
        return copy;
      });
      toast.error("Sorry, that seat was just locked by another user.");
    }
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

    // prevent unmount cleanup from releasing seats during handoff
    sessionStorage.setItem("rb_skip_release_on_unmount", "1");

    const handoff = {
      bus: bookingData.bus,
      busId,
      date,
      departureTime,
      selectedSeats,
      seatGenders: selectedSeatGenders,
      priceDetails: { basePrice, convenienceFee, totalPrice },
      selectedBoardingPoint,
      selectedDroppingPoint,
      clientId: getClientId(),
    };

    // persist a restore copy (defensive)
    try {
      sessionStorage.setItem(
        "rb_confirm_draft",
        JSON.stringify({ ...handoff, formDraft: null, passengersDraft: null })
      );
      sessionStorage.setItem("rb_restore_payload", JSON.stringify(handoff));
    } catch {}

    navigate("/confirm-booking", { state: handoff });
  };

  // Release on unmount (unless we intentionally hand off to confirm)
  useEffect(() => {
    const cleanup = () => {
      const skip = sessionStorage.getItem("rb_skip_release_on_unmount");
      if (skip === "1") {
        sessionStorage.removeItem("rb_skip_release_on_unmount");
        return;
        // handoff owns the locks now
      }
      // best-effort API release + keepalive backup
      const seatsToRelease = latestSeatsRef.current;
      if (seatsToRelease.length) {
        releaseSeats(seatsToRelease);
        keepaliveReleaseAll();
      }
    };

    const onPageHide = () => keepaliveReleaseAll();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") keepaliveReleaseAll();
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onPageHide);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
