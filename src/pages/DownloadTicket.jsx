// src/pages/DownloadTicket.jsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Your defined color palette
const PALETTE = {
  primary: "#C74A50",
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pink: "#E05B88",
  seatPillBg: "#FFE9EC",
  // Note: Only primary colors used are defined here for simplicity
};

// no step guide bar
const BookingSteps = () => null;

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

  // Accept a few common aliases just in case
  const orderId = (
    params.get("order_id") ||
    params.get("orderId") ||
    params.get("bookingNo") ||
    params.get("order-no") ||
    ""
  ).trim();

  const statusCode = params.get("status_code") || params.get("status") || "";
  const paymentId = params.get("payment_id") || "";
  const method = params.get("method") || "";

  const isSuccess = statusCode === "2" || /^success$/i.test(statusCode || "");
  const isFailed =
    statusCode && !isSuccess && !/^pending$/i.test(statusCode || "");

  // 1) Prefer history.state pushed by your app
  const [bookingDetails, setBookingDetails] = useState(
    state?.bookingDetails || null
  );

  // 2) Fallback to sessionStorage payload saved in ConfirmBooking
  useEffect(() => {
    if (bookingDetails) return;
    try {
      const raw = sessionStorage.getItem("rb_ticket_payload");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.bookingDetails) {
        setBookingDetails(parsed.bookingDetails);
        // Keep it for reloads. If you want one-time, uncomment below:
        // sessionStorage.removeItem("rb_ticket_payload");
      }
    } catch {
      /* ignore */
    }
  }, [bookingDetails]);

  // If we still couldn't find data, show a friendly screen with CTAs
  if (!bookingDetails) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        {isFailed ? (
          <Banner kind="error" title="Payment Failed">
            Your payment couldn’t be completed. If money was deducted, it will
            be auto-reversed by the bank. You can try again from My Bookings.
          </Banner>
        ) : null}
        <h1 className="text-xl font-bold text-red-600 mb-2">
          No ticket data found
        </h1>
        <p className="text-gray-700">
          We couldn’t load the ticket locally. This can happen if the return
          page opened in a new browser/window (no session data).
        </p>
        {orderId ? (
          <p className="mt-2 text-sm text-gray-600">
            Reference:&nbsp;<span className="font-semibold">{orderId}</span>
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/my-bookings")}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to My Bookings
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  // ✅ Safe destructuring
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
    bookingNo: bookingNoFromState,
    bookingNoShort: bookingNoShortFromState,
  } = bookingDetails || {};

  // Prefer full booking number
  const bookingNo =
    bookingNoFromState ||
    bookingNoShortFromState ||
    orderId ||
    bookingId ||
    "";

  const totalPrice = Number(priceDetails?.totalPrice || 0);

  // ----------------------------------------------------------------------
  // 💾 PDF SIZE REDUCTION IMPLEMENTATION (Using JPEG and lower scale)
  // ----------------------------------------------------------------------
  const handleDownloadPDF = async () => {
    const element = ticketRef.current;
    if (!element) return;

    // Use scale 1.5 (instead of 2) for smaller image size, but good quality
    const canvas = await html2canvas(element, { scale: 1.5 });
    // Use JPEG compression (0.9 quality) instead of lossless PNG for size reduction
    const imgData = canvas.toDataURL("image/jpeg", 0.9);

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    const pageHeight = pdf.internal.pageSize.getHeight();
    let finalHeight = pdfHeight;
    if (pdfHeight > pageHeight - 20) {
      finalHeight = pageHeight - 20;
    }

    // Pass 'JPEG' as the format
    pdf.addImage(imgData, "JPEG", 10, 10, pdfWidth - 20, finalHeight);
    pdf.save(
      `ticket-${(bookingNo || bookingId || passenger.name || "guest")
        .toString()
        .replace(/\s/g, "_")}-${date}.pdf`
    );
  };
  // ----------------------------------------------------------------------

  // Compact QR text
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

  // Tailwind classes with your custom color palette (using inline styles for non-default colors)
  const subtleText = `text-[${PALETTE.textSubtle}]`;
  const mainText = `text-[${PALETTE.text}]`;
  const seatBg = `bg-[${PALETTE.seatPillBg}]`;

  return (
    <div className={`p-4 sm:p-6 max-w-7xl mx-auto min-h-screen`} style={{ backgroundColor: PALETTE.bg }}>
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
          className="bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden"
          style={{ backgroundColor: PALETTE.surface }}
        >
          {/* PROFESSIONAL HEADER: Logo, Title, and Booking No */}
          <div className={`p-5 sm:p-6`} style={{ backgroundColor: PALETTE.surfaceAlt }}>
            <div className="flex justify-between items-start mb-4 border-b pb-4" style={{ borderColor: PALETTE.border }}>
              {/* BRANDING */}
              <div className="text-xl font-bold" style={{ color: PALETTE.primary }}>
                [Your Bus Booking Platform]
              </div>
              
              {/* PRIMARY INFO BLOCK: BOOKING NO */}
              <div className="text-right">
                <p className={`text-sm font-medium ${subtleText}`}>Booking Number</p>
                <p className="text-2xl font-extrabold" style={{ color: PALETTE.primary }}>
                  {bookingNo}
                </p>
              </div>
            </div>

            {/* KEY JOURNEY DETAILS STRIP */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-xs font-medium uppercase ${subtleText}`}>Route</p>
                <p className={`text-lg font-semibold ${mainText}`}>{bus.from || "N/A"}</p>
                <p className={`text-sm ${subtleText}`}>to</p>
                <p className={`text-lg font-semibold ${mainText}`}>{bus.to || "N/A"}</p>
              </div>
              <div className="border-l border-r px-2" style={{ borderColor: PALETTE.border }}>
                <p className={`text-xs font-medium uppercase ${subtleText}`}>Departure Date</p>
                <p className="text-3xl font-extrabold" style={{ color: PALETTE.primary }}>
                  {date.split("-").pop() || "N/A"}
                </p>
                <p className={`text-sm font-semibold ${mainText}`}>{date.slice(0, 7) || "N/A"}</p>
              </div>
              <div>
                <p className={`text-xs font-medium uppercase ${subtleText}`}>Departure Time</p>
                <p className="text-2xl font-bold" style={{ color: PALETTE.primary }}>
                  {departureTime || "N/A"}
                </p>
                <p className={`text-sm ${subtleText}`}>
                  Bus: {bus.name || "N/A"}
                </p>
              </div>
            </div>
          </div>


          {/* MAIN CONTENT GRID & QR CODE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 sm:p-6">
            {/* LEFT 2/3: Details */}
            <div className="md:col-span-2 space-y-6">

              {/* SEATS & PASSENGERS */}
              <div>
                <h3 className={`font-bold uppercase mb-3 text-sm ${subtleText}`}>
                  Seats & Passenger Details
                </h3>
                <div className="mt-2 space-y-3">
                  {passengers.length > 0 ? (
                    passengers.map((p) => (
                      <div
                        key={p.seat}
                        className={`flex flex-wrap items-center gap-4 border rounded-lg p-3`}
                        style={{ backgroundColor: PALETTE.surface, borderColor: PALETTE.border }}
                      >
                        <span
                          className={`font-bold px-3 py-1 rounded-full text-lg`}
                          style={{ backgroundColor: seatBg, color: PALETTE.primary }}
                        >
                          Seat {p.seat}
                        </span>
                        <span className={`text-base font-semibold ${mainText}`}>
                          {p.name || "N/A"}
                        </span>
                        <span className={`text-sm ${subtleText}`}>
                          | {p.gender === "F" ? "Female" : "Male"} | Age: {p.age || "-"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={`${subtleText}`}>No passenger details provided.</p>
                  )}
                </div>
              </div>

              {/* BOARDING & DROPPING POINTS */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: PALETTE.border }}>
                <div>
                  <h3 className={`font-bold uppercase mb-1 text-sm ${subtleText}`}>Boarding Point</h3>
                  <p className={`text-base font-semibold ${mainText}`}>{boardingPoint.point || "N/A"}</p>
                  <p className={`text-sm ${subtleText}`}>Time: {boardingPoint.time || "N/A"}</p>
                </div>
                <div>
                  <h3 className={`font-bold uppercase mb-1 text-sm ${subtleText}`}>Dropping Point</h3>
                  <p className={`text-base font-semibold ${mainText}`}>{droppingPoint.point || "N/A"}</p>
                  <p className={`text-sm ${subtleText}`}>Time: {droppingPoint.time || "N/A"}</p>
                </div>
              </div>

              {/* CONTACT/OWNER */}
              <div className="pt-4 border-t" style={{ borderColor: PALETTE.border }}>
                <h3 className={`font-bold uppercase mb-1 text-sm ${subtleText}`}>Booking Contact (Owner)</h3>
                <p className={`text-base ${mainText}`}>{passenger.name || "N/A"}</p>
                <p className={`text-sm ${subtleText}`}>Mobile: {passenger.mobile || "N/A"}</p>
                <p className={`text-sm ${subtleText}`}>Email: {passenger.email || "N/A"}</p>
              </div>
            </div>

            {/* RIGHT 1/3: QR Code & Fare */}
            <div className="md:col-span-1 flex flex-col items-center justify-start gap-8 p-4 rounded-lg"
                 style={{ backgroundColor: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}>
              
              {/* QR CODE */}
              <div className="text-center w-full">
                <h3 className={`font-bold text-sm ${subtleText} mb-2`}>Scan for Validation</h3>
                <div className="inline-block p-2 rounded-lg border bg-white shadow-md">
                  <QRCodeCanvas value={qrText} size={110} />
                </div>
                <p className={`text-xs mt-2 ${subtleText} break-all`}>
                  ID: <span className="font-semibold" style={{ color: PALETTE.primary }}>{bookingNo}</span>
                </p>
              </div>
              
              {/* TOTAL FARE */}
              <div className="text-center w-full mt-auto">
                <h3 className={`font-bold text-sm ${subtleText} mb-1`}>Total Fare Paid</h3>
                <p className="text-3xl font-extrabold" style={{ color: PALETTE.primary }}>
                  Rs. {totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER: Important Note */}
          <div className="text-center border-t pt-4 p-5 sm:p-6" style={{ borderColor: PALETTE.border }}>
            <p className={`text-xs ${subtleText}`}>
              * Please carry a valid National ID or Passport. The driver may require this for verification.
              <br />
              For support, please check your confirmation email or visit the 'My Bookings' section.
            </p>
          </div>

        </div>

        {/* Actions */}
        <div className="mt-6 mb-4 sm:mb-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="w-full py-3 rounded-lg text-white font-bold text-base sm:text-lg transition-all duration-300 tracking-wide shadow-lg hover:scale-[1.02] hover:shadow-xl"
            style={{ backgroundColor: PALETTE.primary }}
          >
            📄 Download Ticket (PDF)
          </button>

          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full py-3 rounded-lg font-semibold border hover:bg-gray-50"
            style={{ backgroundColor: PALETTE.surface, borderColor: PALETTE.border, color: PALETTE.text }}
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadTicket;
