// src/pages/Payment.jsx
import { useLocation, useNavigate } from "react-router-dom";
import BookingSteps from "../components/BookingSteps";
import {
  FaBus,
  FaMapMarkerAlt,
  FaUserCircle,
  FaUsers,
  FaMale,
  FaFemale,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaArrowDown,
  FaPhone,
  FaIdCard,
  FaEnvelope,
} from "react-icons/fa";

// ✅ Use shared apiClient instead of axios
import apiClient from "../api";

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    bus,
    selectedSeats = [],
    date,
    passenger,
    priceDetails,
    selectedBoardingPoint,
    selectedDroppingPoint,
    departureTime,
    passengers = [],
    seatGenders = {},
  } = state || {};

  // Error state for incomplete data
  if (!bus || !priceDetails || !passenger || !departureTime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="text-center bg-white p-8 rounded-xl shadow-md border">
          <FaExclamationTriangle className="mx-auto text-5xl text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-red-600">Booking Error</h1>
          <p className="text-gray-700 mt-2">
            Your booking details are incomplete. Please start over.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-transform hover:scale-105"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const handleFakePayment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to complete the booking.");
        navigate("/login");
        return;
      }

      const seatAllocations =
        passengers.length > 0
          ? passengers.map((p) => ({ seat: String(p.seat), gender: p.gender }))
          : selectedSeats.map((s) => ({
              seat: String(s),
              gender: seatGenders[String(s)] || "M",
            }));

      const bookingPayload = {
        busId: bus._id,
        date,
        departureTime,
        passenger,
        selectedSeats: selectedSeats.map(String),
        passengers,
        seatAllocations,
        boardingPoint: selectedBoardingPoint,
        droppingPoint: selectedDroppingPoint,
      };

      // ✅ Use apiClient so it picks up your .env baseURL
      const res = await apiClient.post("/bookings", bookingPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Payment successful (simulated)");
      navigate("/download-ticket", {
        state: {
          bookingDetails: { ...state, bookingId: res?.data?.booking?._id },
        },
      });
    } catch (err) {
      console.error("Booking error:", err.response?.data || err.message);
      alert(
        `Payment failed: ${
          err.response?.data?.message || "Could not complete booking."
        }`
      );
    }
  };

  const InfoCard = ({ icon, title, children }) => (
    <div className="bg-white shadow-md rounded-xl p-6 border">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3 mb-4">
        {icon} {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <BookingSteps currentStep={4} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left Column: Details broken into cards */}
          <div className="lg:col-span-7 space-y-6">
            <InfoCard
              icon={<FaBus className="text-red-500" />}
              title="Journey Details"
            >
              <div className="text-gray-800">
                <p className="text-xl font-semibold">{bus.name}</p>
                <p className="text-sm text-gray-500">{bus.busType}</p>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Route:</span>
                <span className="font-medium text-gray-800">
                  {bus.from} to {bus.to}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Date & Time:</span>
                <span className="font-medium text-gray-800">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  at {departureTime}
                </span>
              </div>
            </InfoCard>

            <InfoCard
              icon={<FaMapMarkerAlt className="text-red-500" />}
              title="Boarding & Dropping Points"
            >
              <div className="flex items-start gap-4">
                <FaMapMarkerAlt className="text-green-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Boarding From</p>
                  <p className="font-semibold text-gray-800">
                    {selectedBoardingPoint.point} at {selectedBoardingPoint.time}
                  </p>
                </div>
              </div>
              <div className="pl-2">
                <FaArrowDown className="text-gray-300" />
              </div>
              <div className="flex items-start gap-4">
                <FaMapMarkerAlt className="text-red-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Dropping At</p>
                  <p className="font-semibold text-gray-800">
                    {selectedDroppingPoint.point} at{" "}
                    {selectedDroppingPoint.time}
                  </p>
                </div>
              </div>
            </InfoCard>

            {/* Passenger Information */}
            <InfoCard
              icon={<FaUsers className="text-red-500" />}
              title="Passenger Information"
            >
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                  Primary Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <FaUserCircle className="text-gray-400" />
                    <span className="font-medium">{passenger.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-gray-400" />
                    <span className="font-medium">{passenger.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaIdCard className="text-gray-400" />
                    <span className="font-medium">{passenger.nic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-gray-400" />
                    <span className="font-medium">{passenger.email}</span>
                  </div>
                </div>
              </div>

              <hr className="border-dashed" />

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">
                  Travellers
                </h4>
                <ul className="space-y-3">
                  {passengers.map((p) => (
                    <li
                      key={p.seat}
                      className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-red-800 bg-red-100 rounded-full w-8 h-8 flex items-center justify-center">
                          {p.seat}
                        </span>
                        <span className="font-medium text-gray-700">
                          {p.name || "-"}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                          p.gender === "F"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-violet-100 text-violet-800"
                        }`}
                      >
                        {p.gender === "F" ? <FaFemale /> : <FaMale />}
                        <span>{p.gender === "F" ? "Female" : "Male"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </InfoCard>
          </div>

          {/* Right Column: Fare Summary + Pay */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-white shadow-md rounded-xl p-6 border">
                <h3 className="text-xl font-bold border-b pb-3 mb-4 text-gray-800 flex items-center gap-3">
                  <FaMoneyBillWave className="text-green-500" />
                  Fare Summary
                </h3>
                <div className="space-y-2 text-gray-800 font-medium">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rs. {priceDetails.basePrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Convenience Fee</span>
                    <span>Rs. {priceDetails.convenienceFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold text-2xl mt-2 pt-2 border-t">
                    <span>Total Payable</span>
                    <span>Rs. {priceDetails.totalPrice?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleFakePayment}
                  className="w-full py-3.5 rounded-lg text-white font-semibold text-lg transition-all duration-300 shadow-lg bg-red-600 hover:bg-red-700 hover:scale-[1.02]"
                >
                  Pay Rs. {priceDetails.totalPrice.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
