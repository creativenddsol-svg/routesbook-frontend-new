// src/pages/DownloadTicket.jsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import apiClient from "../api"; // 🔌 we'll try to fetch by bookingNo if needed

// removed step guide bar
const BookingSteps = () => null; // no-op so existing JSX stays unchanged

const Banner = ({ kind = "success", title, children }) => {
  const isSuccess = kind === "success";
  const bg = isSuccess ? "bg-green-50" : "bg-red-50";
  const border = isSuccess ? "border-green-200" : "border-red-200";
  const text = isSuccess ? "text-green-800" : "text-red-800";
  return (
    <div className={`rounded-lg border ${bg} ${border} p-3 mb-4`}>
      <p className={`font-semibold ${text}`}>{title}</p>
      {children ? <p className="text-sm mt-1">{children}</p> : null}
    </div>
  );
};

const DownloadTicket = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const ticketRef = useRef();

  // ── PayHere return params (when coming from return_url)
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const orderId = params.get("order_id") || params.get("bookingNo") || "";
  const statusCode = params.get("status_code") || params.get("status") || "";
  const paymentId = params.get("payment_id") || "";
  const method = params.get("method") || "";

  const isSuccess = statusCode === "2" || /^success$/i.test(statusCode || "");
  const isFailed =
    statusCode && !isSuccess && !/^pending$/i.test(statusCode || "");

  // If we navigated here with state (from app) use it first.
  const [bookingDetails, setBookingDetails] = useState(
    state?.bookingDetails || null
  );
  const [loading, setLoading] = useState(false);

  // Try to fetch booking by order_id (bookingNo) if we don't already have it.
  useEffect(() => {
    let ignore = false;

    const fetchByBookingNo = async (no) => {
      const tryEndpoints = [
        // Add or keep the ones your backend actually supports; failures are ignored.
        `/payhere/booking/${encodeURIComponent(no)}`,
        `/bookings/by-no/${encodeURIComponent(no)}`,
        `/bookings/lookup?bookingNo=${encodeURIComponent(no)}`,
      ];
      for (const url of tryEndpoints) {
        try {
          const { data } = await apiClient.get(url);
          const bk =
            data?.booking || data?.data?.booking || data?.result || data;
          if (bk && typeof bk === "object") return bk;
        } catch {
          // move on to the next endpoint
        }
      }
      return null;
    };

    (async () => {
      if (bookingDetails) return;
      if (!orderId) return;
      setLoading(true);
      const bk = await fetchByBookingNo(orderId);
      if (!ignore && bk) {
        // normalize into the shape this page expects
        setBookingDetails({
          bus: bk.bus || {},
          passenger:
            bk.passengerInfo || {
              name: bk?.passenger?.name,
              email: bk?.passenger?.email,
              mobile: bk?.passenger?.mobile,
              nic: bk?.passenger?.nic,
            },
          passengers: bk.passengers || [],
          date: bk.date,
          selectedSeats: bk.selectedSeats || [],
          priceDetails: {
            totalPrice: bk.totalAmount,
            basePrice: bk.totalAmount - (bk.convenienceFee || 0),
            convenienceFee: bk.convenienceFee || 0,
          },
          boardingPoint: { point: bk.from, time: "" },
          droppingPoint: { point: bk.to, time: "" },
          departureTime: bk.departureTime || "",
          bookingId: bk._id,
          bookingNo: bk.bookingNo || no,
          bookingNoShort: bk.bookingNoShort,
          booking: bk,
        });
      }
      if (!ignore) setLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [bookingDetails, orderId]);

  // Handle missing booking details (after optional fetch)
  if (!bookingDetails && !loading) {
    return (
      <div className="text-center p-6">
        {isFailed ? (
          <Banner kind="error" title="Payment Failed">
            Your payment could not be completed. Please try again or contact
            support.
          </Banner>
        ) : null}
        <h1 className="text-xl font-bold text-red-600">No ticket data found</h1>
        <p className="text-gray-700 mt-2">
          We couldn’t find details for this ticket.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
          <button
            onClick={() => navigate("/my-bookings")}
            className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            My Bookings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-700">Fetching your booking…</p>
      </div>
    );
  }

  // ✅ Safe destructuring with defaults to prevent crashes
  const {
    bus = {},
    passenger = {}, // booking owner (contact)
    passengers = [], // per-seat passengers [{ seat, name, age, gender }]
    date = "",
    selectedSeats = [],
    priceDetails = {},
    boardingPoint = {},
    droppingPoint = {},
    departureTime = "",
    bookingId = "",
    // support booking numbers passed through state or fetched
    bookingNo: bookingNoFromState,
    bookingNoShort: bookingNoShortFromState,
    booking, // sometimes we may get the whole booking object
  } = bookingDetails || {};

  // ---------- Prefer full booking number for display / QR / filenames ----------
  const bookingNo =
    bookingNoFromState ||
    bookingNoShortFromState ||
    booking?.bookingNo ||
    booking?.bookingNoShort ||
    orderId || // fall back to orderId from query
    ""; // keep empty string if not available

  const totalPrice = Number(priceDetails?.totalPrice || 0);

  const handleDownloadPDF = async () => {
    const element = ticketRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pageHeight = pdf.internal.pageSize.getHeight();
    let finalHeight = pdfHeight;

    if (pdfHeight > pageHeight - 20) {
      finalHeight = pageHeight - 20;
    }

    pdf.addImage(imgData, "PNG", 10, 10, pdfWidth - 20, finalHeight);
    pdf.save(
      `ticket-${(bookingNo || bookingId || passenger.name || "guest")
        .toString()
        .replace(/\s/g, "_")}-${date}.pdf`
    );
  };

  // Compact QR text: includes booking number/id, route, date/time, seats, and the first passenger names
  const firstNames = passengers
    .map((p) => p.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const qrText = `
    Ticket
    Booking No: ${bookingNo || "N/A"}
    Booking ID: ${bookingId || "N/A"}
    Owner: ${passenger.name || "N/A"}
    Route: ${bus.from || "N/A"} → ${bus.to || "N/A"}
    Date: ${date} at ${departureTime}
    Seats: ${selectedSeats.join(", ")}
    Passengers: ${firstNames || "N/A"}${passengers.length > 3 ? "…" : ""}
  `.trim();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <BookingSteps currentStep={5} />

      <div className="max-w-3xl mx-auto mt-2 sm:mt-4">
        {/* 🎉 Payment banners when arriving from PayHere */}
        {isSuccess ? (
          <Banner kind="success" title="Payment Successful 🎉">
            {paymentId ? (
              <>
                Payment ID: <span className="font-semibold">{paymentId}</span>
                {method ? ` • Method: ${method}` : ""}
              </>
            ) : (
              "Your booking has been confirmed."
            )}
          </Banner>
        ) : isFailed ? (
          <Banner kind="error" title="Payment Failed">
            Your payment could not be completed. If money was deducted, it will
            be auto-reversed by the bank. You can try again from My Bookings.
          </Banner>
        ) : null}

        <div
          ref={ticketRef}
          className="bg-white border-2 border-dashed border-gray-300 shadow-sm p-4 sm:p-6 rounded-lg overflow-hidden"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed pb-3 sm:pb-4 mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-snug break-words">
              Your Ticket
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Thank you for booking with us!
            </p>

            {/* Booking No prominently (preferred over ID) */}
            {(bookingNo || bookingId) && (
              <div className="flex flex-col items-center gap-1 mt-2">
                {bookingNo && (
                  <p className="text-xs sm:text-sm font-semibold text-gray-700 break-all">
                    Booking No:&nbsp;
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-900">
                      {bookingNo}
                    </span>
                  </p>
                )}
                {bookingId && (
                  <p className="text-[11px] sm:text-xs text-gray-400 break-all">
                    Booking ID: {bookingId}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-sm sm:text-base">
            {/* Left 2/3 */}
            <div className="md:col-span-2 space-y-4">
              {/* Contact / Owner */}
              <div>
                <h3 className="font-bold text-gray-700">
                  Contact (Booking Owner)
                </h3>
                <p className="text-gray-800 break-words">
                  {passenger.name || "N/A"}
                </p>
                <p className="text-gray-600 break-words">
                  {passenger.mobile || "N/A"}
                </p>
                <p className="text-gray-600 break-words">
                  {passenger.email || "N/A"}
                </p>
                {passenger.nic && (
                  <p className="text-gray-600 break-words">{passenger.nic}</p>
                )}
              </div>

              {/* Per-seat passengers */}
              <div>
                <h3 className="font-bold text-gray-700">
                  Passenger Details (Per Seat)
                </h3>
                {passengers.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {passengers.map((p) => (
                      <div
                        key={p.seat}
                        className="flex flex-wrap items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2"
                      >
                        <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">
                          Seat {p.seat}
                        </span>
                        <span className="break-words">
                          <strong>Name:</strong> {p.name || "-"}
                        </span>
                        <span>
                          <strong>Gender:</strong>{" "}
                          {p.gender === "F" ? "Female" : "Male"}
                        </span>
                        <span>
                          <strong>Age:</strong>{" "}
                          {p.age === "" || p.age == null ? "-" : p.age}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No passenger details provided.</p>
                )}
              </div>

              {/* Journey */}
              <div>
                <h3 className="font-bold text-gray-700">Journey Details</h3>
                <p className="text-gray-800">
                  {bus.name || "N/A"} {bus.busType ? `(${bus.busType})` : ""}
                </p>
                <p className="break-words">
                  <strong>Route:</strong> {bus.from || "N/A"} → {bus.to || "N/A"}
                </p>
                <p>
                  <strong>Date:</strong> {date || "N/A"}
                </p>
                <p>
                  <strong>Departure Time:</strong> {departureTime || "N/A"}
                </p>
              </div>

              {/* Boarding / Dropping */}
              <div>
                <h3 className="font-bold text-gray-700">Boarding & Dropping</h3>
                <p className="break-words">
                  <strong>From:</strong> {boardingPoint.point || "N/A"} (
                  {boardingPoint.time || "N/A"})
                </p>
                <p className="break-words">
                  <strong>To:</strong> {droppingPoint.point || "N/A"} (
                  {droppingPoint.time || "N/A"})
                </p>
              </div>
            </div>

            {/* Right 1/3 */}
            <div className="flex flex-col items-center justify-between text-center gap-6">
              <div>
                <h3 className="font-bold text-gray-700">Scan QR Code</h3>
                <div className="inline-block p-2 bg-white border rounded-lg mt-2">
                  {/* Base size works well; wrapper ensures centering on small screens */}
                  <QRCodeCanvas value={qrText} size={128} />
                </div>
                {bookingNo && (
                  <p className="text-xs text-gray-500 mt-1 break-all">
                    Encodes Booking No:{" "}
                    <span className="font-semibold">{bookingNo}</span>
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-bold text-gray-700">Selected Seats</h3>
                <p className="text-xl sm:text-2xl font-bold text-pink-600 break-words">
                  {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="text-center border-t-2 border-dashed pt-4 mt-6">
            <p className="text-xs sm:text-sm text-gray-500">Total Fare</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700">
              Rs. {totalPrice.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 mb-4 sm:mb-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="w-full py-3 rounded-lg text-white font-bold text-base sm:text-lg transition-all duration-300 tracking-wide shadow-lg bg-gradient-to-r from-green-500 to-teal-500 hover:scale-[1.02] hover:shadow-xl"
          >
            📄 Download Ticket (PDF)
          </button>

          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full py-3 rounded-lg font-semibold bg-white border hover:bg-gray-50"
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadTicket;
