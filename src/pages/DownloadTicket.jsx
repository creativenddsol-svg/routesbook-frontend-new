// src/pages/DownloadTicket.jsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ====== Brand + Artboard settings (Canva/Photoshop-like) ====== */
const BRAND = {
  // Matched to RedBus colors from the image
  red: "#C5162E",
  redDark: "#9F1023",
  ink: "#111316",
  inkSub: "#6B7280",
  line: "#E6E8EB",
  paper: "#FFFFFF",
  paperAlt: "#FAFBFC",
  chip: "#FFF2F4",
  shadow: "0 10px 35px rgba(10,10,10,0.10)",
  greyHeader: "#F2F2F2", // For the top email header
};

const LOGO = "/images/redbus-logo.png"; // Use a RedBus-style logo here
const WATERMARK = "/logo-watermark.png"; // optional large faint logo

/* No steps here */
const BookingSteps = () => null;

const DownloadTicket = () => {
  const { state, search } = useLocation();
  const navigate = useNavigate();
  const artboardRef = useRef(null);
  const [logoOk, setLogoOk] = useState(false);

  useEffect(() => {
    // Note: You should replace LOGO with your actual logo path and ensure CORS is handled if loading external
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
  // Using sample data/fallbacks to match the image content
  const {
    bus = {},
    operator = {},
    passenger = { name: "Dhilip Christopher", email: "dhilipchristopher23@gmail.com", mobile: "8754440418" }, // Mock data
    passengers = [{ name: "Mr Paranthaman", seat: "52" }, { name: "Mr Anand", seat: "50" }, { name: "Mr Dhilip", seat: "51" }], // Mock data
    selectedSeats = [],
    boardingPoint = { point: "Koyambedu", landmark: "Location", time: "21:30" }, // Mock data
    droppingPoint = { point: "SRM Bus Stand", landmark: "Next to CMBT Bus Stand", address: "no.1/100 feet road" }, // Mock data
    priceDetails = {},
    departureTime = "21:45",
    date = "2025-10-30",
    bookingNo: bookingNoFromState,
    bookingNoShort: bookingNoShortFromState,
    bookingId = "TK7N98677943", // Mock data
    pnr = "RBA3CB698", // Mock data
  } = bookingDetails || {};

  const bookingNo = bookingNoFromState || bookingNoShortFromState || orderId || bookingId || "TK7N98677943";
  const opName = operator?.name || bus?.operator || "SRM Transports"; // Mock data
  const routeFrom = bus?.from || "Chennai"; // Mock data
  const routeTo = bus?.to || "Udankudi"; // Mock data
  const paxCount = passengers?.length || selectedSeats?.length || 3; // Mock data
  const totalPrice = Number(priceDetails?.totalPrice || 3021); // Mock data
  const journeyDate = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || "Saturday, June 24, 2017"; // Mock data

  // QR compact payload
  const qrText = `Ticket|${bookingNo}|${routeFrom}->${routeTo}|${date} ${departureTime}|Seats:${passengers.map(p => p.seat).join(",")}|Pax:${paxCount}|Owner:${passenger.name||"-"}`;

  // ---- Export: A4, Canva-like crisp ----
  const downloadPDF = async () => {
    const el = artboardRef.current;
    if (!el) return;
    el.style.webkitPrintColorAdjust = "exact";
    el.style.printColorAdjust = "exact";
    const canvas = await html2canvas(el, {
      scale: 2,        // higher for print crispness
      useCORS: true,
      backgroundColor: null,
      scrollX: 0,
      scrollY: 0,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });
    const img = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "JPEG", 0, 0, w, h, undefined, "FAST");
    pdf.save(`ticket-${(bookingNo || passenger.name || "guest").replace(/\s/g, "_")}-${date}.pdf`);
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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .header-top {
            background: ${BRAND.greyHeader};
            color: ${BRAND.inkSub};
            font-size: 11px;
        }
        .label {
            text-transform: capitalize; 
            font-size: 12px; 
            color: ${BRAND.inkSub};
            font-weight: 500;
        }
        .value { 
            color: ${BRAND.ink}; 
            font-size: 15px; 
            font-weight: 600;
        }
        .chip {
          border: 1px solid ${BRAND.line};
          background: ${BRAND.chip};
          color: ${BRAND.red};
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 13px;
          display: inline-block;
          white-space: nowrap;
        }
      `}</style>

      {/* ACTION BAR */}
      <div className="no-print max-w-4xl mx-auto mb-4 px-4 flex gap-2 justify-end">
        <button onClick={printNow} className="px-4 py-2 rounded bg-gray-900 text-white">🖨 Print</button>
        <button onClick={downloadPDF} className="px-4 py-2 rounded" style={{ background: BRAND.red, color: "#fff" }}>📄 Download PDF</button>
        <button onClick={() => navigate("/my-bookings")} className="px-4 py-2 rounded border border-gray-300 bg-white">My Bookings</button>
      </div>

      {/* ======== A4 ARTBOARD (RedBus Style) ======== */}
      <div className="sheet" ref={artboardRef}>
        {/* Optional faint watermark */}
        <div
          className="watermark"
          style={{ backgroundImage: `url(${WATERMARK})` }}
        />

        {/* 1. TOP EMAIL HEADER */}
        <div className="header-top px-8 py-3 flex justify-between items-center border-b" style={{ borderColor: BRAND.line }}>
          <div className="flex items-center gap-1">
            <span className="text-[12px] text-gray-700">GMAIL</span>
            <span className="text-[11px] text-gray-500">•</span>
            <span className="font-semibold text-[12px]">{passenger.email}</span>
            <span className="text-[11px] text-gray-500">with</span>
            <span className="font-semibold text-[12px]">{passenger.name} &lt;{passenger.email}&gt;</span>
          </div>
          <div className="font-semibold text-[12px] text-gray-700">{passenger.name} &lt;{passenger.email}&gt;</div>
        </div>

        {/* 2. TICKET CANCELATION/INFO ROW */}
        <div className="px-8 py-3 flex justify-between items-start border-b" style={{ borderColor: BRAND.line }}>
          <div>
            <div className="text-[13px] text-gray-800 font-medium">
              **redBus Ticket** - **{bookingNo}** with **Free Cancellation till 24Jun2017 09:45 AM**
            </div>
            <div className="text-[11px] text-gray-500">1 message</div>
          </div>
          <div className="text-right text-[11px] text-gray-500">
            Fri, Jun 23, 2017 at 9:25 PM
          </div>
        </div>

        {/* 3. E-TICKET BANNER */}
        <div className="px-8 py-4 flex justify-between items-end border-b" style={{ borderColor: BRAND.line }}>
          <div className="flex items-center gap-4">
            {logoOk ? (
              <img src={LOGO} alt="redBus" className="h-6 w-auto" />
            ) : (
              <div className="text-3xl font-extrabold text-red-600">redBus.in</div>
            )}
            <div className="text-2xl font-extrabold text-gray-800 border-l pl-4" style={{ borderColor: BRAND.line }}>
              eTICKET
            </div>
            <div className="text-[11px] text-gray-500 italic ml-4">
              Free Cancellation allowed for this booking till **24Jun2017 09:45 AM**
            </div>
          </div>

          <div className="text-right text-[12px] text-gray-600">
            <div className="text-[11px]">Need help with your trip?</div>
            <div>Booking Point Ph. **{passenger.mobile}**</div>
            <div>**{opName}**-Customer Care</div>
            <div className="text-[11px] text-red-600 cursor-pointer">Write to us **here**</div>
          </div>
        </div>

        {/* 4. ROUTE & TICKET IDs */}
        <div className="px-8 py-4 flex justify-between items-center text-gray-800" style={{ borderBottom: `1px solid ${BRAND.line}` }}>
          <div className="flex items-center text-2xl font-extrabold">
            {routeFrom} <span className="text-xl mx-2 text-gray-500">→</span> {routeTo}
          </div>
          <div className="text-sm font-semibold">{journeyDate}</div>
          <div className="text-right text-[12px]">
            <div className="font-medium text-gray-600">Ticket No: **{bookingNo}**</div>
            <div className="font-medium text-gray-600">PNR No: **{pnr}**</div>
          </div>
        </div>

        {/* 5. SCHEDULE GRID */}
        <div className="px-8 py-4 grid grid-cols-5 gap-4 text-center border-b" style={{ borderColor: BRAND.line }}>
          <div className="text-[13px] font-semibold text-gray-700">{opName}</div>
          <div>
            <div className="value">{boardingPoint.time || "—"}</div>
            <div className="label">Reporting time</div>
          </div>
          <div>
            <div className="value">{departureTime || "—"}</div>
            <div className="label">Departure time</div>
          </div>
          <div>
            <div className="value">{paxCount}</div>
            <div className="label">Number of Passengers</div>
          </div>
          <div className="text-[13px] font-semibold text-gray-700">{opName}</div>
        </div>

        {/* 6. POINT DETAILS GRID */}
        <div className="px-8 py-4 grid grid-cols-5 gap-4 text-left border-b" style={{ borderColor: BRAND.line }}>
          <div>
            <div className="label">Boarding point details</div>
          </div>
          <div>
            <div className="value">{boardingPoint.point || "—"}</div>
            <div className="label">Location</div>
          </div>
          <div>
            <div className="value">{droppingPoint.landmark || "Next to CMBT Bus Stand"}</div>
            <div className="label">Next to CMBT Bus Stand.opp</div>
          </div>
          <div>
            <div className="value">{droppingPoint.address || "no.1/100 feet road"}</div>
            <div className="label">Address</div>
          </div>
          <div>
            <div className="value">{opName}</div>
            <div className="label">Operator/Bus Stop</div>
          </div>
        </div>

        {/* 7. PASSENGER & TOTAL FARE */}
        <div className="px-8 pt-4">
          <table className="min-w-full divide-y" style={{ borderColor: BRAND.line }}>
            <thead className="text-left text-[11px] text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-2 w-1/4">Name</th>
                <th className="py-2 w-1/6">Seat No.</th>
                <th className="py-2 w-1/6">Gender</th>
                <th className="py-2 w-1/6">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: BRAND.line }}>
              {passengers.length ? passengers.map((p, i) => (
                <tr key={i} className="text-[13px] text-gray-700">
                  <td className="py-1.5 font-semibold">{p.name || "Passenger"}</td>
                  <td className="py-1.5"><span className="chip">{p.seat ?? "—"}</span></td>
                  <td className="py-1.5">{p.gender === "F" ? "Female" : (p.gender === "M" ? "Male" : "Sleeper(2x2)")}</td>
                  <td className="py-1.5">{p.age || "—"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-4 text-[12px] text-gray-500">No passenger details provided.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-end mt-4">
            <div className="text-[12px] text-gray-500 font-medium max-w-sm">
              NOTE: This operator accepts mTicket, you need not carry a print out
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-700">Total Fare : <span className="text-2xl font-extrabold text-red-600">Rs. {isFinite(totalPrice) ? totalPrice.toFixed(2) : "0.00"}</span></div>
              <div className="text-[10px] italic text-gray-500">(Rs. 171 inclusive of service tax and service charge, if any)</div>
            </div>
          </div>
        </div>

        {/* 8. OFFER BANNER */}
        <div className="px-8 py-5 mt-6 border-y" style={{ borderColor: BRAND.line }}>
          <div className="flex items-center justify-between p-3 rounded-md" style={{ background: BRAND.paperAlt }}>
            <div className="flex items-center gap-4">
              {/* This is where an image of the RedBus logo on a yellow background would go */}
              <div className="text-4xl font-extrabold text-red-600">redBus</div> 
              <div className="text-base font-bold text-gray-800">Upto 50% Off on Hotel Booking</div>
              <div className="text-sm font-medium text-gray-600">Offer Code: **YOUR BUS TIN**</div>
            </div>
            <button className="px-4 py-2 rounded text-white font-bold text-sm" style={{ background: BRAND.redDark }}>BOOK NOW</button>
          </div>
        </div>
        
        {/* 9. TERMS AND CONDITIONS */}
        <div className="px-8 py-6">
          <div className="text-xs font-semibold mb-2" style={{ color: BRAND.ink }}>Terms & Conditions</div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px] leading-relaxed" style={{ color: BRAND.inkSub }}>
            <ol className="list-none space-y-2">
              <li className="font-semibold text-gray-700">redBus responsibilities include:</li>
              <li>(1) Issuing a valid ticket (that will be accepted by the bus operator) for its network of bus operators</li>
              <li>(2) Providing refund and support in case of cancellation</li>
              <li>(3) Providing customer support and information in case of any delays / inconvenience.</li>
              <li className="font-semibold text-gray-700">redBus responsibilities do not include:</li>
              <li>(1) The bus operator's bus not departing / reaching on time.</li>
              <li>(2) The bus operator's employees' behaviour.</li>
              <li>(3) The bus operator's bus seats etc not being up to the customer's expectation.</li>
              <li>(4) The bus operator cancelling the trip due to unavoidable reasons.</li>
              <li>(5) The baggage of the customer getting lost / stolen / damaged.</li>
              <li>(6) The bus operator changing a customer's seat at the last minute to accommodate other passengers.</li>
              <li>(7) The customer waiting at the wrong boarding point.</li>
              <li>(8) The operator asking for extra fare and denying boarding.</li>
            </ol>
            <ol className="list-none space-y-2">
              <li className="font-semibold text-gray-700">Terms & Conditions continued:</li>
              <li>(1) Passengers are required to furnish the following at the time of boarding the bus: (a) A copy of the ticket (A print out of the ticket or the print out of the ticket e-mail). (b) A valid identity proof</li>
              <li>(2) Failing to do so, passengers may not be allowed to board the bus.</li>
              <li>(3) Change of bus: In case the bus operator changes the type of bus due to unavoidable circumstances, redBus will immediately inform the customer.</li>
              <li>(4) Amenities for this bus as shown on redBus have been configured and provided by the bus operator.</li>
              <li>(5) Cancellation and refund: All cancellations and refunds are subject to the operator's policy.</li>
              <li>(6) In case a booking confirmation e-mail and sms gets delayed or fails because of technical reasons or as a result of incorrect e-mail ID / phone number provided by the user etc, a ticket will be considered 'booked' as long as the ticket shows up on the confirmation page of redBus.in</li>
              <li>(7) Grievances and claims are subject to the bus journey should be reported to redBus support team within 10 days of journey.</li>
              <li>(8) Please note the following regarding the luggage policy for your journey: (a) For the luggage policy, please check with the bus operator. (b) For personal item such as a laptop bag, handbag, or briefcase of upto 5 kgs, the passenger may take it inside the bus. (c) Carrying prohibited items like firearms, ammunition, drugs, liquor, smuggled goods etc. and any other items which are likely to offend co-passengers is prohibited.</li>
              <li>(9) Bus Operator reserves the right to deny boarding or charge additional money for any item which exceeds the allowed weight/dimensions.</li>
            </ol>
          </div>
        </div>

      </div>
      {/* ======== /A4 ARTBOARD ======== */}
    </div>
  );
};

export default DownloadTicket;
