// src/pages/DownloadTicket.jsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ====== Brand + Artboard settings (Canva/Photoshop-like) ====== */
const BRAND = {
  red: "#C5162E",
  redDark: "#9F1023",
  ink: "#111316",
  inkSub: "#6B7280",
  line: "#E6E8EB",
  paper: "#FFFFFF",
  paperAlt: "#FAFBFC",
  chip: "#FFF2F4",
  shadow: "0 10px 35px rgba(10,10,10,0.10)",
};

const LOGO = "/images/logo-ticket.png";          // 512–1024px PNG / SVG
const WATERMARK = "/logo-watermark.png";  // optional large faint logo

/* No steps here */
const BookingSteps = () => null;

const DownloadTicket = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const artboardRef = useRef(null);
  const [logoOk, setLogoOk] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoOk(true);
    img.onerror = () => setLogoOk(false);
    img.src = LOGO;
  }, []);

  // Read PayHere params (kept for completeness)
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const orderId = (
    params.get("order_id") ||
    params.get("orderId") ||
    params.get("bookingNo") ||
    params.get("order-no") ||
    ""
  ).trim();

  // Prefer state, fallback to sessionStorage (like before)
  const [bookingDetails, setBookingDetails] = useState(state?.bookingDetails || null);
  useEffect(() => {
    if (bookingDetails) return;
    try {
      const raw = sessionStorage.getItem("rb_ticket_payload");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.bookingDetails) setBookingDetails(parsed.bookingDetails);
    } catch {}
  }, [bookingDetails]);

  if (!bookingDetails) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-bold text-red-600 mb-2">No ticket data</h1>
        <p className="text-gray-700">Open from My Bookings or complete payment first.</p>
        {orderId && <p className="text-sm text-gray-600 mt-2">Reference: <b>{orderId}</b></p>}
        <div className="mt-4 flex gap-2">
          <button onClick={() => navigate("/my-bookings")} className="px-4 py-2 rounded bg-blue-600 text-white">My Bookings</button>
          <button onClick={() => navigate("/")} className="px-4 py-2 rounded bg-gray-100">Home</button>
        </div>
      </div>
    );
  }

  // ----- Safe destructuring -----
  const {
    bus = {},
    operator = {},
    passenger = {},
    passengers = [],
    selectedSeats = [],
    boardingPoint = {},
    droppingPoint = {},
    priceDetails = {},
    departureTime = "",
    date = "",
    bookingNo: bookingNoFromState,
    bookingNoShort: bookingNoShortFromState,
    bookingId = "",
    pnr,
  } = bookingDetails || {};

  const bookingNo = bookingNoFromState || bookingNoShortFromState || orderId || bookingId || "";
  const opName = operator?.name || bus?.operator || bus?.name || "—";
  const routeFrom = bus?.from || "—";
  const routeTo = bus?.to || "—";
  const paxCount = passengers?.length || selectedSeats?.length || 1;
  const totalPrice = Number(priceDetails?.totalPrice || 0);

  // QR compact payload
  const firstNames = passengers.map((p) => p.name).filter(Boolean).slice(0, 3).join(", ");
  const qrText = `Ticket|${bookingNo}|${routeFrom}->${routeTo}|${date} ${departureTime}|Seats:${selectedSeats.join(",")}|Pax:${paxCount}|Owner:${passenger.name||"-"}`;

  // ---- Export: A4, Canva-like crisp ----
  const downloadPDF = async () => {
    const el = artboardRef.current;
    if (!el) return;
    el.style.webkitPrintColorAdjust = "exact";
    el.style.printColorAdjust = "exact";
    const canvas = await html2canvas(el, {
      scale: 2,       // higher for print crispness
      useCORS: true,
      backgroundColor: null,
    });
    const img = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "JPEG", 0, 0, w, h, undefined, "FAST");
    pdf.save(`ticket-${(bookingNo || passenger.name || "guest").replace(/\s/g,"_")}-${date}.pdf`);
  };

  const printNow = () => window.print();

  return (
    <div className="min-h-screen bg-[#F3F4F7] py-6 print:bg-white">
      {/* Local styles dedicated to this artboard (precise print rules) */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; }
        }
        .sheet {
          width: 794px;   /* A4 width @ 96dpi */
          min-height: 1123px; /* A4 height @ 96dpi */
          margin: 0 auto;
          background: ${BRAND.paper};
          box-shadow: ${BRAND.shadow};
          position: relative;
        }
        .band {
          background: linear-gradient(90deg, ${BRAND.red} 0%, ${BRAND.redDark} 100%);
        }
        .watermark {
          position: absolute; inset: 0; pointer-events: none;
          background-position: center 35%;
          background-repeat: no-repeat;
          background-size: 60%;
          opacity: 0.045;
          mix-blend-mode: multiply;
        }
        .perf {
          background-image: radial-gradient(${BRAND.line} 2px, transparent 2px);
          background-size: 10px 10px;
          background-position: center;
          height: 14px;
          opacity: 0.9;
        }
        .chip {
          border: 1px solid ${BRAND.line};
          background: ${BRAND.chip};
          color: ${BRAND.red};
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 13px;
        }
        .label {
          text-transform: uppercase; letter-spacing: .08em; font-size: 11px; color: ${BRAND.inkSub};
        }
        .value { color: ${BRAND.ink}; font-size: 15px; }
      `}</style>

      {/* ACTION BAR */}
      <div className="no-print max-w-4xl mx-auto mb-4 px-4 flex gap-2 justify-end">
        <button onClick={printNow} className="px-4 py-2 rounded bg-gray-900 text-white">🖨 Print</button>
        <button onClick={downloadPDF} className="px-4 py-2 rounded" style={{background: BRAND.red, color:"#fff"}}>📄 Download PDF</button>
        <button onClick={() => navigate("/my-bookings")} className="px-4 py-2 rounded border border-gray-300 bg-white">My Bookings</button>
      </div>

      {/* ======== A4 ARTBOARD (like a Canva design) ======== */}
      <div className="sheet" ref={artboardRef}>
        {/* Optional faint watermark */}
        <div
          className="watermark"
          style={{
            backgroundImage: `url(${WATERMARK})`,
          }}
        />

        {/* Brand band header */}
        <div className="band text-white px-8 py-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {logoOk ? (
                <img src={LOGO} alt="Routesbook" className="h-11 w-auto" />
              ) : (
                <div className="text-3xl font-extrabold">Routesbook</div>
              )}
              <div className="ml-2">
                <div className="text-[12px] tracking-[0.15em] font-semibold opacity-90">E-TICKET</div>
                <div className="text-sm opacity-90">Operator: {opName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-90 tracking-[0.15em]">BOOKING NUMBER</div>
              <div className="text-3xl font-extrabold leading-tight">{bookingNo}</div>
              <div className="text-[11px] opacity-90 mt-1">
                {pnr ? <>PNR: <b>{pnr}</b> • </> : null}
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Big route line */}
          <div className="mt-8">
            <div className="text-[15px] opacity-95">Route</div>
            <div className="text-[40px] leading-none font-extrabold -mt-1">
              {routeFrom} <span className="opacity-80 text-[28px] px-2">→</span> {routeTo}
            </div>
            <div className="mt-2 text-sm opacity-95 flex items-center gap-3">
              <span className="label !text-white !opacity-90">Journey Date</span>
              <span className="font-semibold text-white/95">{new Date(date).toLocaleDateString() || date || "—"}</span>
              <span className="label !text-white !opacity-90 ml-6">Departure</span>
              <span className="font-semibold text-white/95">{departureTime || "—"}</span>
              <span className="label !text-white !opacity-90 ml-6">Passengers</span>
              <span className="font-semibold text-white/95">{paxCount}</span>
            </div>
          </div>
        </div>

        {/* Perf line (tear) */}
        <div className="perf" />

        {/* Body content */}
        <div className="px-8 py-8">
          {/* Grid: details left, stub right */}
          <div className="grid grid-cols-12 gap-10">
            {/* LEFT 8/12 — detailed panel */}
            <div className="col-span-12 md:col-span-8">
              {/* Boarding details (table cards) */}
              <div className="mb-6">
                <div className="label mb-2">Boarding point details</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="rounded-xl border p-4" style={{borderColor: BRAND.line, background: BRAND.paperAlt}}>
                    <div className="label mb-1">Location</div>
                    <div className="value font-semibold">{boardingPoint.point || "—"}</div>
                    {boardingPoint.time && <div className="text-[12px]" style={{color: BRAND.inkSub}}>Time: {boardingPoint.time}</div>}
                  </div>
                  <div className="rounded-xl border p-4" style={{borderColor: BRAND.line, background: BRAND.paperAlt}}>
                    <div className="label mb-1">Landmark</div>
                    <div className="value font-semibold">{boardingPoint.landmark || "—"}</div>
                  </div>
                  <div className="rounded-xl border p-4" style={{borderColor: BRAND.line, background: BRAND.paperAlt}}>
                    <div className="label mb-1">Address</div>
                    <div className="value font-semibold">{boardingPoint.address || "—"}</div>
                  </div>
                </div>
              </div>

              {/* Passenger rows (seat chips) */}
              <div className="mb-6">
                <div className="label mb-2">Seats & passenger details</div>
                <div className="flex flex-col gap-3">
                  {passengers.length ? passengers.map((p, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
                         style={{borderColor: BRAND.line, background: BRAND.paper}}>
                      <span className="chip">Seat {p.seat ?? "—"}</span>
                      <span className="value font-semibold">{p.name || "Passenger"}</span>
                      <span className="text-[12px]" style={{color: BRAND.inkSub}}>
                        {p.gender ? `• ${p.gender === "F" ? "Female" : "Male"}` : ""} {p.age ? `• Age ${p.age}` : ""}
                      </span>
                    </div>
                  )) : (
                    <div className="text-[14px]" style={{color: BRAND.inkSub}}>No passenger details provided.</div>
                  )}
                </div>
              </div>

              {/* Dropping + Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-xl border p-4" style={{borderColor: BRAND.line}}>
                  <div className="label mb-1">Dropping point</div>
                  <div className="value font-semibold">{droppingPoint.point || "—"}</div>
                  <div className="text-[12px]" style={{color: BRAND.inkSub}}>Time: {droppingPoint.time || "—"}</div>
                </div>
                <div className="rounded-xl border p-4" style={{borderColor: BRAND.line}}>
                  <div className="label mb-1">Booking contact (Owner)</div>
                  <div className="value font-semibold">{passenger.name || "—"}</div>
                  <div className="text-[12px]" style={{color: BRAND.inkSub}}>Mobile: {passenger.mobile || "—"}</div>
                  <div className="text-[12px]" style={{color: BRAND.inkSub}}>Email: {passenger.email || "—"}</div>
                </div>
              </div>

              {/* Note */}
              <div className="mt-6 text-[12.5px]" style={{color: BRAND.inkSub}}>
                <b>Note:</b> This operator accepts m-Ticket. Carry a valid National ID/Passport. Arrive 15–20 minutes early.
              </div>
            </div>

            {/* RIGHT 4/12 — detachable stub style */}
            <div className="col-span-12 md:col-span-4">
              <div className="rounded-2xl border p-16 relative overflow-hidden" style={{borderColor: BRAND.line, background: BRAND.paperAlt}}>
                {/* Decorative corner circles to mimic perforation */}
                <div className="absolute -left-6 top-10 w-12 h-12 rounded-full bg-white border" style={{borderColor: BRAND.line}}/>
                <div className="absolute -left-6 bottom-10 w-12 h-12 rounded-full bg-white border" style={{borderColor: BRAND.line}}/>
                <div className="absolute -right-6 top-10 w-12 h-12 rounded-full bg-white border" style={{borderColor: BRAND.line}}/>
                <div className="absolute -right-6 bottom-10 w-12 h-12 rounded-full bg-white border" style={{borderColor: BRAND.line}}/>

                <div className="text-center">
                  <div className="label mb-2">Scan for validation</div>
                  <div className="inline-block p-6 bg-white rounded-xl border shadow-sm" style={{borderColor: BRAND.line}}>
                    <QRCodeCanvas value={qrText} size={132} />
                  </div>
                  <div className="mt-3 text-[12px]" style={{color: BRAND.inkSub}}>
                    ID: <b style={{color: BRAND.red}}>{bookingNo}</b>
                  </div>
                </div>

                <div className="h-px my-8" style={{background: BRAND.line}} />

                <div className="text-center">
                  <div className="label mb-1">Total Fare</div>
                  <div className="text-[30px] font-extrabold" style={{color: BRAND.red}}>
                    Rs. {isFinite(totalPrice) ? totalPrice.toFixed(2) : "0.00"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms (small, designer spacing) */}
          <div className="mt-10">
            <div className="text-[13px] font-semibold mb-2" style={{color: BRAND.ink}}>Terms & Conditions</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12.5px]" style={{color: BRAND.inkSub}}>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Routesbook is a ticketing agent; buses are operated by respective operators.</li>
                <li>m-Ticket and a valid photo ID are mandatory for boarding.</li>
                <li>Reporting & departure times are operator-provided and may vary.</li>
                <li>Cancellations and refunds follow the operator’s policy.</li>
                <li>Baggage is carried at passenger’s risk unless explicitly covered.</li>
              </ol>
              <ol className="list-decimal ml-5 space-y-1" start={6}>
                <li>Abusive behavior/intoxication may lead to denied boarding.</li>
                <li>Please arrive 15–20 minutes before departure.</li>
                <li>Contact support via My Bookings for changes and help.</li>
                <li>Taxes & platform fees included when applicable.</li>
                <li>QR misuse or duplication can invalidate boarding.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      {/* ======== /A4 ARTBOARD ======== */}
    </div>
  );
};

export default DownloadTicket;
