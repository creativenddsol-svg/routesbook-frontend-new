import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSteps from "../components/BookingSteps";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaBus,
  FaCalendarAlt,
  FaChair,
  FaMapMarkerAlt,
  FaMale,
  FaFemale,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";

const ConfirmBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    bus,
    selectedSeats,
    date,
    priceDetails,
    selectedBoardingPoint,
    selectedDroppingPoint,
    departureTime,
    seatGenders,
  } = location.state || {};

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    nic: "",
    email: "",
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const initialPassengers = useMemo(() => {
    return (selectedSeats || []).map((seatNo) => ({
      seat: String(seatNo),
      name: "",
      age: "",
      gender: seatGenders?.[String(seatNo)] === "F" ? "F" : "M",
    }));
  }, [selectedSeats, seatGenders]);

  const [passengers, setPassengers] = useState(initialPassengers);

  const setPassenger = (seat, patch) => {
    setPassengers((prev) =>
      prev.map((p) => (p.seat === String(seat) ? { ...p, ...patch } : p))
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!bus || !selectedSeats || !date || !priceDetails) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-600 font-semibold">
          Booking details are incomplete. Please start again.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.nic || !form.email) {
      alert("Please fill in all contact details.");
      return;
    }
    for (const p of passengers) {
      if (!p.name || !p.gender) {
        alert(
          `Please fill in the Name and Gender for the passenger in seat ${p.seat}.`
        );
        return;
      }
    }
    if (!termsAccepted) {
      alert("You must agree to the Terms & Conditions to proceed.");
      return;
    }

    const seatGendersOut = {};
    passengers.forEach((p) => {
      seatGendersOut[p.seat] = p.gender;
    });

    navigate("/payment", {
      state: {
        bus,
        selectedSeats,
        date,
        departureTime,
        passenger: form,
        priceDetails,
        selectedBoardingPoint,
        selectedDroppingPoint,
        passengers: passengers.map(({ seat, name, age, gender }) => ({
          seat,
          name,
          age: age === "" ? undefined : Number(age),
          gender,
        })),
        seatGenders: seatGendersOut,
      },
    });
  };

  // ✅ UPDATED: FormInput component now has floating label logic
  const FormInput = ({ icon, label, ...props }) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        {...props}
        className="peer w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 focus:border-red-500 transition placeholder-transparent"
        placeholder=" "
      />
      <label
        htmlFor={props.id}
        className="absolute left-10 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all 
                   peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base 
                   peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 
                   peer-focus:text-sm peer-focus:text-red-600"
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <BookingSteps currentStep={3} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                <FaUserCircle className="text-red-500" />
                Contact Details (for E-ticket/SMS)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ✅ UPDATED: Switched from "placeholder" to "label" and added "id" */}
                <FormInput
                  icon={<FaUser />}
                  id="name"
                  name="name"
                  type="text"
                  label="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  icon={<FaPhone />}
                  id="mobile"
                  name="mobile"
                  type="tel"
                  label="Mobile Number"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  icon={<FaIdCard />}
                  id="nic"
                  name="nic"
                  type="text"
                  label="NIC / Passport"
                  value={form.nic}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  icon={<FaEnvelope />}
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                <FaUsers className="text-red-500" />
                Passenger Details
              </h2>
              <div className="space-y-4">
                {passengers.map((p, index) => (
                  <div
                    key={p.seat}
                    className="border rounded-lg p-4 bg-gray-50/70"
                  >
                    <p className="font-semibold text-gray-700 mb-3">
                      Passenger {index + 1} -{" "}
                      <span className="text-red-500">Seat {p.seat}</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        {/* ✅ UPDATED: Switched from "placeholder" to "label" and added unique "id" */}
                        <FormInput
                          type="text"
                          id={`p-name-${p.seat}`}
                          label="Name"
                          value={p.name}
                          onChange={(e) =>
                            setPassenger(p.seat, { name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        {/* ✅ UPDATED: Switched from "placeholder" to "label" and added unique "id" */}
                        <FormInput
                          type="number"
                          id={`p-age-${p.seat}`}
                          min="0"
                          label="Age"
                          value={p.age}
                          onChange={(e) =>
                            setPassenger(p.seat, { age: e.target.value })
                          }
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-3">
                        <button
                          onClick={() => setPassenger(p.seat, { gender: "M" })}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
                            p.gender === "M"
                              ? "bg-violet-500 text-white border-violet-500"
                              : "bg-white hover:bg-violet-50"
                          }`}
                        >
                          <FaMale /> Male
                        </button>
                        <button
                          onClick={() => setPassenger(p.seat, { gender: "F" })}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
                            p.gender === "F"
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-white hover:bg-pink-50"
                          }`}
                        >
                          <FaFemale /> Female
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary (UNCHANGED) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-white shadow-md rounded-xl p-6 border">
                <h3 className="text-xl font-bold border-b pb-3 mb-4 text-gray-800">
                  Journey Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <FaBus className="text-gray-400 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">{bus.name}</p>
                      <p className="text-gray-500">
                        {bus.from} to {bus.to}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaCalendarAlt className="text-gray-400 mt-1" />
                    <p className="font-medium text-gray-700">
                      {new Date(date + "T00:00:00").toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}{" "}
                      at {departureTime}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaChair className="text-gray-400 mt-1" />
                    <p className="font-medium text-gray-700">
                      Seats:{" "}
                      <span className="font-bold text-red-500">
                        {selectedSeats.join(", ")}
                      </span>
                    </p>
                  </div>
                </div>
                <hr className="my-4 border-dashed" />
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-green-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Boarding Point
                      </p>
                      <p className="text-gray-600">
                        {selectedBoardingPoint.point} at{" "}
                        <span className="font-bold">
                          {selectedBoardingPoint.time}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-red-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        Dropping Point
                      </p>
                      <p className="text-gray-600">
                        {selectedDroppingPoint.point} at{" "}
                        <span className="font-bold">
                          {selectedDroppingPoint.time}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <hr className="my-4" />
                <div className="space-y-2 text-gray-800 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rs. {priceDetails.basePrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Fee</span>
                    <span>Rs. {priceDetails.convenienceFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold text-xl mt-2 pt-2 border-t">
                    <span>Total Price</span>
                    <span>Rs. {priceDetails.totalPrice?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-4">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={() => setTermsAccepted(!termsAccepted)}
                      className="h-4 w-4 mr-2 form-checkbox rounded text-red-600 focus:ring-red-500"
                      required
                    />
                    I agree to the{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      className="text-red-500 underline ml-1"
                    >
                      Terms & Conditions
                    </a>
                  </label>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-lg text-white font-semibold text-lg transition-all duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
                  disabled={!termsAccepted}
                >
                  Proceed to Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBooking;
