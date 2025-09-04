import React, { useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// A simple component to show the booking steps as we cannot import a separate file.
const BookingSteps = ({ currentStep }) => {
  const steps = ["Search", "Select Bus", "Add Details", "Payment", "Download Ticket"];
  return (
    <div className="flex justify-between items-center mb-6 max-w-lg mx-auto">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${
                index + 1 === currentStep ? "bg-blue-600" : "bg-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-xs mt-1 text-center ${index + 1 === currentStep ? "text-blue-600 font-medium" : "text-gray-500"}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};


const DownloadTicket = () => {
  const { state } = useLocation();
  const ticketRef = useRef();
  const navigate = useNavigate();

  const bookingDetails = state?.bookingDetails;

  // Handle missing booking details with a clean, centered message.
  if (!bookingDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold text-red-600">Ticket Not Found</h1>
          <p className="text-gray-600 mt-2">
            It looks like there's no ticket data to display. Please try
            booking again.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Safe destructuring with defaults to prevent crashes.
  const {
    bus = {},
    passenger = {},
    passengers = [],
    date = "",
    selectedSeats = [],
    priceDetails = {},
    boardingPoint = {},
    droppingPoint = {},
    departureTime = "",
    bookingId = "",
  } = bookingDetails;

  const totalPrice = priceDetails?.totalPrice || 0;

  // Function to download the ticket as a PDF
  const handleDownloadPDF = async () => {
    const element = ticketRef.current;
    if (!element) return;

    // Use a higher scale for better PDF quality
    const canvas = await html2canvas(element, { scale: 3 });
    const imgData = canvas.toDataURL("image/jpeg", 1.0); // Use JPEG for smaller file size

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add padding to the PDF image
    const margin = 10;
    const finalWidth = pdfWidth - 2 * margin;
    const finalHeight = (canvas.height * finalWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", margin, margin, finalWidth, finalHeight);
    pdf.save(
      `ticket-${(passenger.name || "guest").replace(/\s/g, "_")}-${date}.pdf`
    );
  };

  // Professional QR code text, formatted as a JSON string for easy parsing
  const qrData = {
    bookingId: bookingId || null,
    owner: passenger.name || null,
    route: `${bus.from || "N/A"} -> ${bus.to || "N/A"}`,
    date,
    departureTime,
    seats: selectedSeats,
  };

  const qrText = JSON.stringify(qrData, null, 2);

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-100 font-sans">
      <BookingSteps currentStep={5} />

      <div className="max-w-4xl mx-auto mt-6">
        <div
          ref={ticketRef}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden relative"
        >
          {/* Ticket Header Section */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8 rounded-t-3xl relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  E-Ticket
                </h1>
                <p className="text-sm sm:text-lg font-light mt-1 opacity-90">
                  {bus.name || "Bus Operator"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm sm:text-base font-medium">
                  Booking ID
                </span>
                <p className="text-lg sm:text-xl font-bold tracking-wider">
                  {bookingId || "N/A"}
                </p>
              </div>
            </div>
            {/* Dashed line effect */}
            <div className="absolute left-0 right-0 -bottom-3 h-6">
              <div className="w-full h-1 border-t-2 border-dashed border-gray-200"></div>
            </div>
          </div>

          {/* Main Ticket Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8">
            {/* Left 2/3 - Journey & Passenger Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Journey Details */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-base font-bold text-gray-700 mb-2">
                  <span className="inline-block mr-2 text-blue-600">🗓️</span>
                  Journey Details
                </h3>
                <div className="flex justify-between items-center text-gray-800 text-sm sm:text-base">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-500">From</span>
                    <span className="text-lg font-bold">
                      {bus.from || "N/A"}
                    </span>
                    <span className="text-sm">
                      {boardingPoint.point || "N/A"}
                    </span>
                    <span className="text-sm font-semibold">
                      {date || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center mx-4">
                    <span className="font-semibold text-gray-500">
                      Departure
                    </span>
                    <span className="text-lg font-bold">
                      {departureTime || "N/A"}
                    </span>
                    <span className="text-sm text-gray-400">
                      Estimated duration
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-gray-500">To</span>
                    <span className="text-lg font-bold">
                      {bus.to || "N/A"}
                    </span>
                    <span className="text-sm">
                      {droppingPoint.point || "N/A"}
                    </span>
                    <span className="text-sm font-semibold">
                      {droppingPoint.time || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-base font-bold text-gray-700 mb-2">
                  <span className="inline-block mr-2 text-blue-600">👤</span>
                  Passenger Details
                </h3>
                <div className="space-y-2 text-gray-800 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span>Booking Owner:</span>
                    <span className="font-semibold">{passenger.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Contact:</span>
                    <span className="font-semibold">{passenger.mobile || "N/A"}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Email:</span>
                    <span className="font-semibold">{passenger.email || "N/A"}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-600 mb-2">
                    Passengers & Seats
                  </h4>
                  <div className="space-y-3">
                    {passengers.map((p) => (
                      <div
                        key={p.seat}
                        className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 font-bold text-xs px-3 py-1 rounded-full">
                            Seat {p.seat}
                          </span>
                          <span className="font-medium text-gray-900">
                            {p.name || "-"}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm space-x-4">
                          <span>
                            {p.gender === "F" ? "Female" : "Male"}
                          </span>
                          <span>
                            {p.age === "" || p.age == null ? "-" : `${p.age} yrs`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1/3 - QR Code & Price */}
            <div className="md:col-span-1 flex flex-col items-center justify-between space-y-6">
              <div className="flex flex-col items-center text-center">
                <h3 className="font-bold text-gray-700 text-base mb-2">
                  <span className="inline-block mr-2 text-blue-600">📱</span>
                  Scan for Check-In
                </h3>
                <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-inner">
                  <QRCodeCanvas value={qrText} size={150} fgColor="#333" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl w-full text-center">
                <h3 className="font-bold text-gray-700 text-base mb-2">
                  Total Fare
                </h3>
                <p className="text-3xl font-extrabold text-green-700">
                  Rs. {Number(totalPrice).toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl w-full text-sm text-gray-600">
                <h4 className="font-bold text-gray-700 mb-2">
                  Important Information
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Please arrive at least 30 minutes before departure.</li>
                  <li>Have a valid ID for verification.</li>
                  <li>This ticket is non-transferable.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto px-10 py-4 rounded-full text-white font-bold text-lg transition-all duration-300 tracking-wide shadow-xl transform hover:scale-105 bg-gradient-to-r from-green-500 to-teal-600 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            <span className="inline-block mr-2">⬇️</span> Download Ticket (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadTicket;
