// src/pages/DownloadTicket.jsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ================= Brand palette ================= */
const PALETTE = {
  primary: "#C74A50",   // Routesbook red
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  seatPillBg: "#FFE9EC",
};

/* Public logo path that works on Vite & CRA (put your file at /public/logo-ticket.png) */
const LOGO_SRC =
  (typeof import.meta !== "undefined" && import.meta?.env) ? "/logo-ticket.png" :
  (typeof process !== "undefined" && process?.env?.PUBLIC_URL) ? `${process.env.PUBLIC_URL}/logo-ticket.png` :
  "/logo-ticket.png";

/* --------- No steps here on the ticket page --------- */
const BookingSteps = () => null;

/* --------- Small banner component --------- */
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
  const [logoLoaded, setLogoLoaded] = useState(false);

  /* Preload logo so it appears in the PDF render */
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoLoaded(true);
    img.onerror = () => setLogoLoaded(false);
    img.crossOrigin = "anonymous";
    img.src = LOGO_SRC;
  }, []);

  /* ---- PayHere params (when coming from return_url) ---- */
  const params = useMemo(() => new URLSearchParams(search), [search]);
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
  const isFailed = statusCode && !isSuccess && !/^pending$/i.test(statusCode || "");

  /* ---- Prefer state, fallback to sessionStorage ---- */
  const [bookingDetails, setBookingDetails] = useState(state?.bookingDetails || null);

  useEffect(() => {
    if (bookingDetails) return;
    try {
      const raw = sessionStorage.getItem("rb_ticket_payload");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.bookingDetails) setBookingDetails(parsed.bookingDetails);
    } catch { /* ignore */ }
  }, [bookingDetails]);

  if (!bookingDetails) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        {isFailed ? (
          <Banner kind="error" title="Payment Failed">
            Your payment couldn’t be completed. If money was deducted, it will be auto-reversed by the bank.
            You can try again from My Bookings.
          </Banner>
        ) : null}
        <h1 className="text-xl font-bold text-red-600 mb-2">No ticket data found</h1>
        <p className="text-gray-700">
          We couldn’t load the ticket locally. This can happen if the return page opened in a new browser/window.
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

  /* ---------- Safe destructuring ---------- */
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
    operator = {}, // if you pass operator info
  } = bookingDetails || {};

  const bookingNo = bookingNoFromState || bookingNoShortFromState || orderId || bookingId || "";
  const totalPrice = Number(priceDetails?.totalPrice || 0);

  /* ---------- PDF download (lightweight & sharp) ---------- */
  const handleDownloadPDF = async () => {
    const el = ticketRef.current;
    if (!el) return;

    // Better print colors
    el.style.webkitPrintColorAdjust = "exact";
    el.style.printColorAdjust = "exact";

    // html2canvas capture
    const canvas = await html2canvas(el, {
      scale: 1.6,               // good balance of size/clarity
      useCORS: true,            // allow logo from /public
      backgroundColor: null,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.9); // JPEG keeps file size low
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;

    const margin = 8; // mm
    const h = Math.min(pdf.internal.pageSize.getHeight() - margin * 2, pdfH);
    pdf.addImage(imgData, "JPEG", margin, margin, pdfW - margin * 2, h, undefined, "FAST");
    pdf.save(
      `ticket-${(bookingNo || passenger.name || "guest").toString().replace(/\s/g, "_")}-${date}.pdf`
    );
  };

  /* --------- QR compact payload --------- */
  const firstNames = passengers.map((p) => p.name).filter(Boolean).slice(0, 3).join(", ");
  const qrText = `
    Ticket
    Booking No: ${bookingNo || "N/A"}
    Owner: ${passenger.name || "N/A"}
    Route: ${bus.from || "N/A"} → ${bus.to || "N/A"}
    Date: ${date} at ${departureTime}
    Seats: ${selectedSeats.join(", ")}
    Pax: ${firstNames || "N/A"}${passengers.length > 3 ? "…" : ""}
  `.trim();

  const subtleText = { color: PALETTE.textSubtle };
  const mainText = { color: PALETTE.text };

  return (
    <div
      className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen"
      style={{ backgroundColor: PALETTE.bg }}
    >
      <BookingSteps currentStep={5} />

      <div className="max-w-3xl mx-auto mt-2 sm:mt-4">
        {/* Payment status banners */}
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
            Your payment could not be completed. If money was deducted, it will be auto-reversed by the bank.
          </Banner>
        ) : null}

        {/* =================== Ticket Card =================== */}
        <div
          ref={ticketRef}
          className="bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden"
          style={{
            backgroundColor: PALETTE.surface,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        >
          {/* ---------- Header strip: logo + booking/meta ---------- */}
          <div
            className="p-5 sm:p-6"
            style={{ backgroundColor: PALETTE.surfaceAlt }}
          >
            <div
              className="flex justify-between items-start gap-4 mb-4 border-b pb-4"
              style={{ borderColor: PALETTE.border }}
            >
              {/* Brand block */}
              <div className="flex items-center gap-3">
                {/* If logo fails, hide the <img> and show text fallback */}
                {logoLoaded ? (
                  <img
                    src={LOGO_SRC}
                    alt="Routesbook"
                    className="h-8 sm:h-10 w-auto"
                    crossOrigin="anonymous"
                    style={{ display: "block" }}
                  />
                ) : (
                  <div
                    className="text-xl sm:text-2xl font-extrabold tracking-tight"
                    style={{ color: PALETTE.primary }}
                  >
                    Routesbook
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-xs font-medium uppercase" style={subtleText}>
                    e-TICKET
                  </p>
                  <p className="text-xs" style={subtleText}>
                    {operator?.name ? `Operator: ${operator.name}` : (bus?.operator || "")}
                  </p>
                </div>
              </div>

              {/* Booking number */}
              <div className="text-right">
                <p className="text-xs font-medium uppercase" style={subtleText}>
                  Booking Number
                </p>
                <p
                  className="text-2xl font-extrabold"
                  style={{ color: PALETTE.primary, lineHeight: 1.1 }}
                >
                  {bookingNo}
                </p>
                <p className="text-[11px] mt-1" style={subtleText}>
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            {/* Route + date + time strip */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[11px] font-medium uppercase" style={subtleText}>
                  Route
                </p>
                <p className="text-lg font-semibold" style={mainText}>
                  {bus.from || "N/A"}
                </p>
                <p className="text-sm" style={subtleText}>
                  to
                </p>
                <p className="text-lg font-semibold" style={mainText}>
                  {bus.to || "N/A"}
                </p>
              </div>
              <div
                className="border-l border-r px-2"
                style={{ borderColor: PALETTE.border }}
              >
                <p className="text-[11px] font-medium uppercase" style={subtleText}>
                  Departure Date
                </p>
                <p
                  className="text-3xl font-extrabold"
                  style={{ color: PALETTE.primary, lineHeight: 1.05 }}
                >
                  {date?.split("-").pop() || "—"}
                </p>
                <p className="text-sm font-semibold" style={mainText}>
                  {date?.slice(0, 7) || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase" style={subtleText}>
                  Departure Time
                </p>
                <p className="text-2xl font-bold" style={{ color: PALETTE.primary }}>
                  {departureTime || "N/A"}
                </p>
                <p className="text-sm" style={subtleText}>
                  Bus: {bus.name || operator?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* ---------- Body grid ---------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 sm:p-6">
            {/* Left (details) */}
            <div className="md:col-span-2 space-y-6">
              {/* Seats & passengers */}
              <div>
                <h3
                  className="font-bold uppercase mb-3 text-sm"
                  style={subtleText}
                >
                  Seats & Passenger Details
                </h3>
                <div className="mt-2 space-y-3">
                  {passengers.length > 0 ? (
                    passengers.map((p, idx) => (
                      <div
                        key={`${p.seat || idx}`}
                        className="flex flex-wrap items-center gap-4 border rounded-lg p-3"
                        style={{ backgroundColor: PALETTE.surface, borderColor: PALETTE.border }}
                      >
                        <span
                          className="font-bold px-3 py-1 rounded-full text-lg"
                          style={{ backgroundColor: PALETTE.seatPillBg, color: PALETTE.primary }}
                        >
                          Seat {p.seat}
                        </span>
                        <span className="text-base font-semibold" style={mainText}>
                          {p.name || "N/A"}
                        </span>
                        <span className="text-sm" style={subtleText}>
                          | {p.gender === "F" ? "Female" : p.gender === "M" ? "Male" : "—"} | Age: {p.age || "—"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={subtleText}>No passenger details provided.</p>
                  )}
                </div>
              </div>

              {/* Boarding & dropping */}
              <div
                className="grid grid-cols-2 gap-4 pt-4 border-t"
                style={{ borderColor: PALETTE.border }}
              >
                <div>
                  <h3 className="font-bold uppercase mb-1 text-sm" style={subtleText}>
                    Boarding Point
                  </h3>
                  <p className="text-base font-semibold" style={mainText}>
                    {boardingPoint.point || "N/A"}
                  </p>
                  <p className="text-sm" style={subtleText}>
                    Time: {boardingPoint.time || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold uppercase mb-1 text-sm" style={subtleText}>
                    Dropping Point
                  </h3>
                  <p className="text-base font-semibold" style={mainText}>
                    {droppingPoint.point || "N/A"}
                  </p>
                  <p className="text-sm" style={subtleText}>
                    Time: {droppingPoint.time || "N/A"}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="pt-4 border-t" style={{ borderColor: PALETTE.border }}>
                <h3 className="font-bold uppercase mb-1 text-sm" style={subtleText}>
                  Booking Contact (Owner)
                </h3>
                <p className="text-base" style={mainText}>{passenger.name || "N/A"}</p>
                <p className="text-sm" style={subtleText}>Mobile: {passenger.mobile || "N/A"}</p>
                <p className="text-sm" style={subtleText}>Email: {passenger.email || "N/A"}</p>
              </div>
            </div>

            {/* Right (QR + fare) */}
            <div
              className="md:col-span-1 flex flex-col items-center justify-start gap-8 p-4 rounded-lg"
              style={{ backgroundColor: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}
            >
              <div className="text-center w-full">
                <h3 className="font-bold text-sm mb-2" style={subtleText}>
                  Scan for Validation
                </h3>
                <div className="inline-block p-2 rounded-lg border bg-white shadow-md">
                  <QRCodeCanvas value={qrText} size={114} />
                </div>
                <p className="text-xs mt-2 break-all" style={subtleText}>
                  ID: <span className="font-semibold" style={{ color: PALETTE.primary }}>{bookingNo}</span>
                </p>
              </div>

              <div className="text-center w-full mt-auto">
                <h3 className="font-bold text-sm mb-1" style={subtleText}>
                  Total Fare Paid
                </h3>
                <p className="text-3xl font-extrabold" style={{ color: PALETTE.primary }}>
                  Rs. {isFinite(totalPrice) ? totalPrice.toFixed(2) : "0.00"}
                </p>
              </div>
            </div>
          </div>

          {/* ---------- Footer note ---------- */}
          <div
            className="text-center border-t pt-4 p-5 sm:p-6"
            style={{ borderColor: PALETTE.border }}
          >
            <p className="text-[11px]" style={subtleText}>
              * Please carry a valid National ID or Passport. The driver may require this for verification.
              <br />
              For support, check your confirmation email or visit <b>My Bookings</b>.
            </p>
          </div>
        </div>

        {/* ---------- Actions ---------- */}
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
