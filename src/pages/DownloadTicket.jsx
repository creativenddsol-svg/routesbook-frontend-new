// src/pages/DownloadTicket.jsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ================= Brand palette & fonts ================= */
const PALETTE = {
  primary: "#C5162E",   // deeper redBus-like
  primaryDark: "#A01325",
  ink: "#1D232A",
  inkSub: "#5B6676",
  bg: "#F7F7F9",
  surface: "#FFFFFF",
  border: "#E6E8EB",
  faint: "#F2F4F7",
  chip: "#FFF4F5",
};

const LOGO_SRC = "/logo-ticket.png";

/* ───────────────── No steps bar on ticket ─────────────── */
const BookingSteps = () => null;

/* ──────────────── Small banner for PayHere state ───────── */
const Banner = ({ kind = "success", title, children }) => {
  const isSuccess = kind === "success";
  const bg = isSuccess ? "bg-green-50" : "bg-red-50";
  const border = isSuccess ? "border-green-200" : "border-red-200";
  const text = isSuccess ? "text-green-800" : "text-red-800";
  return (
    <div className={`rounded-md border ${bg} ${border} p-3 mb-4`}>
      <p className={`font-semibold ${text}`}>{title}</p>
      {children ? <p className="text-sm mt-1">{children}</p> : null}
    </div>
  );
};

const Row = ({ label, value, strong=false, align="left" }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-wide" style={{color: PALETTE.inkSub}}>
      {label}
    </span>
    <span
      className={`${strong ? "font-semibold" : ""} text-[15px]`}
      style={{color: PALETTE.ink, textAlign: align}}
    >
      {value || "—"}
    </span>
  </div>
);

const DownloadTicket = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const ticketRef = useRef();
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Preload logo for html2canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoLoaded(true);
    img.onerror = () => setLogoLoaded(false);
    img.crossOrigin = "anonymous";
    img.src = LOGO_SRC;
  }, []);

  /* ---- PayHere return params ---- */
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
  const isFailed  = statusCode && !isSuccess && !/^pending$/i.test(statusCode || "");

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
            If money was deducted, it will be auto-reversed by the bank. Try again from My Bookings.
          </Banner>
        ) : null}
        <h1 className="text-xl font-bold text-red-600 mb-2">No ticket data found</h1>
        <p className="text-gray-700">
          This can happen if the payment return opened in a new window without session data.
        </p>
        {orderId ? (
          <p className="mt-2 text-sm text-gray-600">
            Reference:&nbsp;<span className="font-semibold">{orderId}</span>
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/my-bookings")}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to My Bookings
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
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
    operator = {},
    passenger = {},
    passengers = [],
    date = "",
    selectedSeats = [],
    priceDetails = {},
    boardingPoint = {},
    droppingPoint = {},
    departureTime = "",
    reportingTime, // if you have one
    bookingId = "",
    bookingNo: bookingNoFromState,
    bookingNoShort: bookingNoShortFromState,
    pnr, // optional
  } = bookingDetails || {};

  const bookingNo = bookingNoFromState || bookingNoShortFromState || orderId || bookingId || "";
  const totalPrice = Number(priceDetails?.totalPrice || 0);
  const paxCount = passengers?.length || selectedSeats?.length || 1;
  const opName = operator?.name || bus?.operator || bus?.name || "—";
  const routeFrom = bus?.from || "—";
  const routeTo   = bus?.to || "—";

  /* ---------- PDF: sharp & light ---------- */
  const handleDownloadPDF = async () => {
    const el = ticketRef.current;
    if (!el) return;
    el.style.webkitPrintColorAdjust = "exact";
    el.style.printColorAdjust = "exact";

    const canvas = await html2canvas(el, { scale: 1.65, useCORS: true, backgroundColor: null });
    const img = canvas.toDataURL("image/jpeg", 0.9);
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    const margin = 8;
    const drawH = Math.min(pdf.internal.pageSize.getHeight() - margin * 2, h);
    pdf.addImage(img, "JPEG", margin, margin, w - margin * 2, drawH, undefined, "FAST");
    pdf.save(`ticket-${(bookingNo || passenger.name || "guest").toString().replace(/\s/g, "_")}-${date}.pdf`);
  };

  /* ---------- QR payload ---------- */
  const firstNames = passengers.map((p) => p.name).filter(Boolean).slice(0, 3).join(", ");
  const qrText = `Ticket
Booking: ${bookingNo}
Owner: ${passenger.name || "N/A"}
Route: ${routeFrom} -> ${routeTo}
Date: ${date} at ${departureTime || "-"}
Seats: ${selectedSeats.join(", ") || "-"}
Pax: ${paxCount} (${firstNames}${passengers.length > 3 ? "…" : ""})`;

  /* ========================== UI ========================== */
  return (
    <div className="min-h-screen" style={{ backgroundColor: PALETTE.bg }}>
      <BookingSteps currentStep={5} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {isSuccess ? (
          <Banner kind="success" title="Payment Successful 🎉">
            {paymentId ? <>Payment ID: <b>{paymentId}</b>{method ? ` • Method: ${method}` : ""}</> : "Your booking has been confirmed."}
          </Banner>
        ) : isFailed ? (
          <Banner kind="error" title="Payment Failed">
            If money was deducted, it will be auto-reversed by the bank. You can try again from My Bookings.
          </Banner>
        ) : null}

        {/* ===== Ticket Card ===== */}
        <div
          ref={ticketRef}
          className="rounded-lg shadow-[0_3px_16px_rgba(0,0,0,0.07)] overflow-hidden border"
          style={{ backgroundColor: PALETTE.surface, borderColor: PALETTE.border }}
        >
          {/* Top info bar like redBus */}
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: PALETTE.border, background: PALETTE.faint }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {logoLoaded ? (
                  <img src={LOGO_SRC} alt="Routesbook" className="h-7 sm:h-8 w-auto" crossOrigin="anonymous" />
                ) : (
                  <div className="text-2xl font-extrabold" style={{ color: PALETTE.primary }}>Routesbook</div>
                )}
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: PALETTE.primary }}>
                    eTICKET
                  </div>
                  <div className="text-[12px]" style={{ color: PALETTE.inkSub }}>
                    {opName !== "—" ? `Operator: ${opName}` : "Online Bus Ticket"}
                  </div>
                </div>
              </div>

              <div className="text-right leading-tight">
                <div className="text-[11px] uppercase tracking-wide" style={{ color: PALETTE.inkSub }}>
                  Booking Number
                </div>
                <div className="text-2xl font-extrabold" style={{ color: PALETTE.primary }}>
                  {bookingNo}
                </div>
                <div className="text-[11px]" style={{ color: PALETTE.inkSub }}>
                  {pnr ? <>PNR: <b>{pnr}</b> • </> : null}
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Route banner */}
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: PALETTE.border }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[15px]" style={{ color: PALETTE.ink }}>
                <span className="font-semibold text-[18px]">{routeFrom}</span>
                <span className="px-1.5 text-[12px] uppercase tracking-wide" style={{ color: PALETTE.inkSub }}>&rarr;</span>
                <span className="font-semibold text-[18px]">{routeTo}</span>
              </div>
              <div className="text-[15px]" style={{ color: PALETTE.ink }}>
                <span className="font-medium">{new Date(date).toLocaleDateString() || date || "—"}</span>
              </div>
            </div>
          </div>

          {/* Operator row (like redBus’s strip) */}
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: PALETTE.border }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Row label="Bus / Operator" value={opName} strong />
              <Row label="Reporting time" value={reportingTime || (departureTime ? departureTime : "-")} />
              <Row label="Departure time" value={departureTime || "-"} />
              <Row label="No. of Passengers" value={String(paxCount)} align="right" />
            </div>
          </div>

          {/* Boarding details table */}
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: PALETTE.border }}>
            <div className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: PALETTE.inkSub }}>
              Boarding point details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[14px]">
              <div className="rounded-md border p-3" style={{ borderColor: PALETTE.border }}>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: PALETTE.inkSub }}>Location</div>
                <div className="font-medium" style={{ color: PALETTE.ink }}>{boardingPoint.point || "—"}</div>
              </div>
              <div className="rounded-md border p-3" style={{ borderColor: PALETTE.border }}>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: PALETTE.inkSub }}>Landmark</div>
                <div className="font-medium" style={{ color: PALETTE.ink }}>{boardingPoint.landmark || "—"}</div>
              </div>
              <div className="rounded-md border p-3" style={{ borderColor: PALETTE.border }}>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: PALETTE.inkSub }}>Address</div>
                <div className="font-medium" style={{ color: PALETTE.ink }}>{boardingPoint.address || "—"}</div>
              </div>
            </div>
          </div>

          {/* Passenger row like redBus (names + seats) */}
          <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: PALETTE.border }}>
            <div className="flex flex-wrap gap-3">
              {passengers.length ? passengers.map((p, idx) => (
                <div key={`${p.seat || idx}`} className="flex items-center gap-2 rounded-md border px-3 py-2"
                     style={{ borderColor: PALETTE.border, background: "#fff" }}>
                  <span className="px-2 py-0.5 text-[12px] rounded-full font-semibold"
                        style={{ background: PALETTE.chip, color: PALETTE.primary, border: `1px solid ${PALETTE.border}` }}>
                    Seat {p.seat ?? "—"}
                  </span>
                  <span className="text-[14px] font-medium" style={{ color: PALETTE.ink }}>
                    {p.name || "Passenger"}
                  </span>
                  <span className="text-[12px]" style={{ color: PALETTE.inkSub }}>
                    {p.gender ? `• ${p.gender === "F" ? "Female" : "Male"}` : ""} {p.age ? `• Age ${p.age}` : ""}
                  </span>
                </div>
              )) : (
                <div className="text-[14px]" style={{ color: PALETTE.inkSub }}>No passenger details provided.</div>
              )}
            </div>
            <div className="mt-3 text-[12px]" style={{ color: PALETTE.inkSub }}>
              <b>NOTE:</b> This operator accepts m-Ticket; no printout needed. Carry a valid ID.
            </div>
          </div>

          {/* Fare + QR panel (side-by-side on desktop) */}
          <div className="px-5 sm:px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: contact + drop info */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-md border p-3" style={{ borderColor: PALETTE.border }}>
                    <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: PALETTE.inkSub }}>
                      Dropping Point
                    </div>
                    <div className="font-medium text-[15px]" style={{ color: PALETTE.ink }}>
                      {droppingPoint.point || "—"}
                    </div>
                    <div className="text-[12px]" style={{ color: PALETTE.inkSub }}>
                      Time: {droppingPoint.time || "—"}
                    </div>
                  </div>
                  <div className="rounded-md border p-3" style={{ borderColor: PALETTE.border }}>
                    <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: PALETTE.inkSub }}>
                      Booking Contact (Owner)
                    </div>
                    <div className="font-medium text-[15px]" style={{ color: PALETTE.ink }}>
                      {passenger.name || "—"}
                    </div>
                    <div className="text-[12px]" style={{ color: PALETTE.inkSub }}>
                      Mobile: {passenger.mobile || "—"}
                    </div>
                    <div className="text-[12px]" style={{ color: PALETTE.inkSub }}>
                      Email: {passenger.email || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: QR + Fare */}
              <div className="rounded-md border p-4 flex flex-col items-center justify-between"
                   style={{ borderColor: PALETTE.border, background: PALETTE.faint }}>
                <div className="text-center">
                  <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: PALETTE.inkSub }}>
                    Scan for validation
                  </div>
                  <div className="inline-block p-2 bg-white rounded-md border shadow-sm">
                    <QRCodeCanvas value={qrText} size={116} />
                  </div>
                  <div className="mt-2 text-[12px]" style={{ color: PALETTE.inkSub }}>
                    ID: <b style={{ color: PALETTE.primary }}>{bookingNo}</b>
                  </div>
                </div>
                <div className="text-center mt-5">
                  <div className="text-[12px] uppercase tracking-wide mb-1" style={{ color: PALETTE.inkSub }}>
                    Total Fare
                  </div>
                  <div className="text-[26px] font-extrabold" style={{ color: PALETTE.primary }}>
                    Rs. {isFinite(totalPrice) ? totalPrice.toFixed(2) : "0.00"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tear line */}
          <div className="px-5 sm:px-6">
            <div className="border-t border-dashed" style={{ borderColor: PALETTE.border }} />
          </div>

          {/* Terms & Conditions – compact like redBus */}
          <div className="px-5 sm:px-6 py-5">
            <div className="text-[13px] font-semibold mb-2" style={{ color: PALETTE.ink }}>
              Terms and Conditions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]" style={{ color: PALETTE.inkSub }}>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Routesbook is a ticketing agent; it does not operate buses.</li>
                <li>m-Ticket with a valid photo ID is mandatory at boarding.</li>
                <li>Reporting/Departure times are provided by the operator and may vary.</li>
                <li>Operator is responsible for amenities, delays, and route changes.</li>
                <li>Refunds/Cancellations are governed by the operator’s policy.</li>
              </ol>
              <ol className="list-decimal ml-5 space-y-1" start={6}>
                <li>Baggage is carried at passenger’s risk unless stated otherwise.</li>
                <li>Abusive behavior or intoxication may result in denied boarding.</li>
                <li>Please arrive at the boarding point 15–20 minutes early.</li>
                <li>Contact support via My Bookings for changes and help.</li>
                <li>GST/Service charges are included where applicable.</li>
              </ol>
            </div>
            <div className="mt-3 text-[12px]" style={{ color: PALETTE.inkSub }}>
              * Carry your National ID/Passport. The driver may require verification.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="w-full py-3 rounded-md text-white font-semibold tracking-wide shadow-sm hover:shadow transition"
            style={{ backgroundColor: PALETTE.primary }}
          >
            📄 Download Ticket (PDF)
          </button>
          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full py-3 rounded-md font-semibold border hover:bg-gray-50 transition"
            style={{ borderColor: PALETTE.border, color: PALETTE.ink, background: "#fff" }}
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadTicket;
