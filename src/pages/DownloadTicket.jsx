// src/pages/DownloadTicket.jsx
import React, { useMemo, useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ====== Brand + Artboard settings ====== */
const BRAND = {
    red: "#C5162E", // primary red
    redDark: "#9F1023",
    ink: "#111316",
    inkSub: "#6B7280",
    line: "#E6E8EB",
    paper: "#FFFFFF",
    paperAlt: "#FAFBFC",
    chip: "#FFF2F4",
    shadow: "0 10px 35px rgba(10,10,10,0.10)",
    greyHeader: "#F2F2F2",
};

// make sure these exist in /public
const LOGO = "/images/logo-ticket.png";
const WATERMARK = "/logo-watermark.png";

// no step UI here
const BookingSteps = () => null;

const DownloadTicket = () => {
    const { state, search } = useLocation();
    const navigate = useNavigate();
    const artboardRef = useRef(null);
    const [logoOk, setLogoOk] = useState(false);

    /* preload logo for canvas/pdf */
    useEffect(() => {
        const img = new Image();
        img.onload = () => setLogoOk(true);
        img.onerror = () => setLogoOk(false);
        img.src = LOGO;
    }, []);

    /* read orderId from URL */
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const orderId = (
        params.get("order_id") ||
        params.get("orderId") ||
        params.get("bookingNo") ||
        params.get("order-no") ||
        ""
    ).trim();

    /* bookingDetails from router state OR session fallback */
    const [bookingDetails, setBookingDetails] = useState(
        state?.bookingDetails || null
    );

    useEffect(() => {
        if (bookingDetails) return;
        try {
            const raw = sessionStorage.getItem("rb_ticket_payload");
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed?.bookingDetails) setBookingDetails(parsed.bookingDetails);
        } catch {
            /* ignore */
        }
    }, [bookingDetails]);

    // handle missing data early
    if (!bookingDetails) {
        return (
            <div className="max-w-xl mx-auto p-6">
                <h1 className="text-xl font-bold text-red-600 mb-2">
                    No ticket data
                </h1>
                <p className="text-gray-700">
                    Open this page from My Bookings or complete payment first.
                </p>
                {orderId && (
                    <p className="text-sm text-gray-600 mt-2">
                        Reference: <b>{orderId}</b>
                    </p>
                )}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={() => navigate("/my-bookings")}
                        className="px-4 py-2 rounded bg-blue-600 text-white"
                    >
                        My Bookings
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-4 py-2 rounded bg-gray-100"
                    >
                        Home
                    </button>
                </div>
            </div>
        );
    }

    /* ===== destructure with safe fallbacks ===== */
    const {
        bus = {},
        operator = { name: "Operator Name" },
        passenger = {
            name: "DILEEPA SANDARUWAN",
            email: "sdileepa98@gmail.com",
            mobile: "0773412262",
        },
        passengers = [
            {
                name: "DILEEPA SANDARUWAN",
                seat: "30",
                gender: "M",
                age: "22",
            },
        ],
        selectedSeats = [],
        boardingPoint = {
            point: "matara",
            time: "19:00",
        },
        // droppingPoint still exists in data but not shown now
        priceDetails = {},
        departureTime = "19:00",
        date = "2025-11-01",
        bookingNo: bookingNoFromState,
        bookingNoShort: bookingNoShortFromState,
        bookingId = "RB202511010004",
        pnr = "RBA30699",
    } = bookingDetails || {};

    // derive fields
    const bookingNo =
        bookingNoFromState ||
        bookingNoShortFromState ||
        orderId ||
        bookingId ||
        "RB202511010004";

    const opName = operator?.name || bus?.operator || "Operator Name";
    const busName = bus?.name || "—"; // <-- from your bus model
    const routeFrom = bus?.from || "Matara";
    const routeTo = bus?.to || "Colombo";

    const paxCount =
        (Array.isArray(passengers) && passengers.length) ||
        (Array.isArray(selectedSeats) && selectedSeats.length) ||
        1;

    const totalPrice = Number(priceDetails?.totalPrice || 1285.2);

    // "1 November 2025" style
    const journeyDate =
        new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }) || "1 November 2025";

    // top-right timestamp (05:14 pm)
    const bookingTimestamp = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    // we no longer show reporting time separately
    const departTime = departureTime || boardingPoint?.time || "—";

    // QR content (future scan usage)
    const qrText = `Ticket|${bookingNo}|${routeFrom}->${routeTo}|${date} ${departTime}|Seats:${passengers
        .map((p) => p.seat)
        .join(",")}|Pax:${paxCount}|Owner:${
        passenger.name || "-"
    }`;

    /* ===== PDF EXPORT (A4) ===== */
    const downloadPDF = async () => {
        const el = artboardRef.current;
        if (!el) return;
        el.style.webkitPrintColorAdjust = "exact";
        el.style.printColorAdjust = "exact";

        const canvas = await html2canvas(el, {
            scale: 2,
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

        pdf.save(
            `ticket-${(bookingNo || passenger.name || "guest")
                .replace(/\s/g, "_")
                .replace(/[^a-zA-Z0-9_\-]/g, "")}-${date}.pdf`
        );
    };

    const printNow = () => window.print();

    return (
        <div className="min-h-screen bg-[#F3F4F7] py-6 print:bg-white">
            {/* Print rules + local styles */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .sheet { box-shadow: none !important; margin: 0 !important; }
                }
                .sheet {
                    width: 794px;           /* A4 width @ 96dpi */
                    min-height: 1123px;     /* A4 height @ 96dpi */
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
                    line-height: 1.2;
                }
                .value {
                    color: ${BRAND.ink};
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1.3;
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
                .watermark {
                    position: absolute;
                    top: 20%;
                    left: 50%;
                    transform: translateX(-50%);
                    opacity: 0.03;
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: 300px 300px;
                    width: 100%;
                    height: 400px;
                    pointer-events: none;
                }
            `}</style>

            {/* Top action buttons (not printed) */}
            <div className="no-print max-w-4xl mx-auto mb-4 px-4 flex gap-2 justify-end">
                <button
                    onClick={printNow}
                    className="px-4 py-2 rounded bg-gray-900 text-white"
                >
                    🖨 Print
                </button>
                <button
                    onClick={downloadPDF}
                    className="px-4 py-2 rounded text-white"
                    style={{ background: BRAND.red }}
                >
                    📄 Download PDF
                </button>
                <button
                    onClick={() => navigate("/my-bookings")}
                    className="px-4 py-2 rounded border border-gray-300 bg-white"
                >
                    My Bookings
                </button>
            </div>

            {/* ======== A4 ARTBOARD ======== */}
            <div className="sheet" ref={artboardRef}>
                {/* faint brand watermark */}
                <div
                    className="watermark"
                    style={{ backgroundImage: `url(${WATERMARK})` }}
                />

                {/* 1. EMAIL-STYLE HEADER BAR */}
                <div
                    className="header-top px-8 py-3 flex justify-between items-center border-b"
                    style={{ borderColor: BRAND.line }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] text-gray-700 font-semibold">
                            {passenger.email}
                        </span>
                        <span className="text-[11px] text-gray-500">to</span>
                        <span className="text-[12px] text-gray-700 font-semibold">
                            {passenger.name}
                        </span>
                    </div>
                    <div className="text-[12px] text-gray-700">
                        {bookingTimestamp}
                    </div>
                </div>

                {/* 2. MAIN TICKET HEADER */}
                <div className="px-8 pt-4 pb-2">
                    <div
                        className="flex justify-between items-start border-b pb-4"
                        style={{ borderColor: BRAND.line }}
                    >
                        {/* Left cluster: logo + eTICKET + cancellation info */}
                        <div className="flex flex-col gap-1">
                            {/* logo row */}
                            <div className="flex items-center gap-4">
                                {logoOk ? (
                                    <img
                                        src={LOGO}
                                        alt="Routesbook"
                                        className="h-6 w-auto"
                                    />
                                ) : (
                                    <div className="text-3xl font-extrabold text-red-600">
                                        Routesbook
                                    </div>
                                )}
                                <div
                                    className="text-2xl font-extrabold text-gray-800 border-l pl-4"
                                    style={{ borderColor: BRAND.line }}
                                >
                                    eTICKET
                                </div>
                            </div>

                            {/* ticket summary line */}
                            <div className="text-[13px] text-gray-800 font-medium mt-1">
                                Routesbook Ticket – {bookingNo} with Free
                                Cancellation till 24 Jan 2017 09:45 AM
                            </div>
                            <div className="text-[11px] text-gray-500 italic mt-1 leading-snug">
                                Free cancellation allowed for this booking
                                until 24 Jan 2017 09:45 AM
                            </div>
                        </div>

                        {/* Right cluster: operator contact + IDs */}
                        <div className="text-right text-[12px] text-gray-600 leading-relaxed">
                            <div className="text-[11px]">
                                Need help with your trip?
                            </div>
                            <div>
                                Booking Point Ph. {passenger.mobile || "—"}
                            </div>
                            <div>{opName} Customer Care</div>
                            <div className="text-[11px] text-red-600 cursor-pointer">
                                Write to us
                            </div>

                            <div className="mt-2">
                                <div className="font-medium text-gray-600">
                                    Ticket No: {bookingNo}
                                </div>
                                <div className="font-medium text-gray-600">
                                    PNR No: {pnr}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. ROUTE + DATE */}
                <div
                    className="px-8 py-4 flex justify-between items-center text-gray-800 border-b"
                    style={{ borderBottom: `1px solid ${BRAND.line}` }}
                >
                    <div className="flex items-center text-2xl font-extrabold">
                        {routeFrom}
                        <span className="text-xl mx-2 text-gray-500">→</span>
                        {routeTo}
                    </div>
                    <div className="text-sm font-semibold">{journeyDate}</div>
                </div>

                {/* 4. SCHEDULE GRID (updated: no Reporting Time) */}
                <div
                    className="px-8 py-4 grid grid-cols-4 gap-4 text-center border-b"
                    style={{ borderColor: BRAND.line }}
                >
                    {/* Departure Time */}
                    <div>
                        <div className="value">{departTime || "—"}</div>
                        <div className="label">Departure Time</div>
                    </div>

                    {/* Pax Count */}
                    <div>
                        <div className="value">{paxCount}</div>
                        <div className="label">Number Of Passengers</div>
                    </div>

                    {/* Operator Name */}
                    <div>
                        <div className="value">{opName || "—"}</div>
                        <div className="label">Operator Name</div>
                    </div>

                    {/* Bus Name */}
                    <div>
                        <div className="value">{busName || "—"}</div>
                        <div className="label">Bus Name</div>
                    </div>
                </div>

                {/* 5. BOARDING DETAILS (updated: remove landmark/address) */}
                <div
                    className="px-8 py-4 grid grid-cols-3 gap-4 text-left border-b"
                    style={{ borderColor: BRAND.line }}
                >
                    {/* col 1 header */}
                    <div>
                        <div className="label">Boarding Point Details</div>
                    </div>

                    {/* col 2 location */}
                    <div>
                        <div className="value">
                            {boardingPoint.point || "—"}
                        </div>
                        <div className="label">Location</div>
                    </div>

                    {/* col 3 time */}
                    <div>
                        <div className="value">
                            {boardingPoint.time || departTime || "—"}
                        </div>
                        <div className="label">Boarding Time</div>
                    </div>
                </div>

                {/* 6. PASSENGER TABLE + TOTAL FARE */}
                <div className="px-8 pt-4">
                    <table
                        className="min-w-full divide-y"
                        style={{ borderColor: BRAND.line }}
                    >
                        <thead className="text-left text-[11px] text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="py-2 w-2/5">Name</th>
                                <th className="py-2 w-1/5">Seat No.</th>
                                <th className="py-2 w-1/5">Gender</th>
                                <th className="py-2 w-1/5">Age</th>
                            </tr>
                        </thead>
                        <tbody
                            className="divide-y"
                            style={{ borderColor: BRAND.line }}
                        >
                            {passengers && passengers.length ? (
                                passengers.map((p, i) => (
                                    <tr
                                        key={i}
                                        className="text-[13px] text-gray-700"
                                    >
                                        <td className="py-1.5 font-semibold">
                                            {p.name || "Passenger"}
                                        </td>
                                        <td className="py-1.5">
                                            <span className="chip">
                                                {p.seat ?? "—"}
                                            </span>
                                        </td>
                                        <td className="py-1.5">
                                            {p.gender || "—"}
                                        </td>
                                        <td className="py-1.5">
                                            {p.age || "—"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="py-4 text-[12px] text-gray-500"
                                    >
                                        No passenger details provided.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="flex justify-between items-end mt-4">
                        <div className="text-[12px] text-gray-500 font-medium max-w-sm leading-snug">
                            NOTE: This operator accepts mTicket. You do not
                            need to carry a printed copy.
                        </div>
                        <div className="text-right leading-tight">
                            <div className="text-sm font-semibold text-gray-700">
                                Total Fare:{" "}
                                <span className="text-2xl font-extrabold text-red-600">
                                    Rs.{" "}
                                    {isFinite(totalPrice)
                                        ? totalPrice.toFixed(2)
                                        : "0.00"}
                                </span>
                            </div>
                            <div className="text-[10px] italic text-gray-500">
                                (Includes service tax / service charge, if any)
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. OFFER STRIP */}
                <div
                    className="px-8 py-5 mt-6 border-y"
                    style={{ borderColor: BRAND.line }}
                >
                    <div
                        className="flex items-center justify-between p-3 rounded-md"
                        style={{ background: BRAND.paperAlt }}
                    >
                        <div className="flex items-center gap-4 flex-wrap">
                            {logoOk ? (
                                <img
                                    src={LOGO}
                                    alt="Routesbook"
                                    className="h-6 w-auto"
                                />
                            ) : (
                                <div className="text-2xl font-extrabold text-red-600">
                                    Routesbook
                                </div>
                            )}

                            <div className="text-base font-bold text-gray-800">
                                Upto 50% Off on Hotel Booking
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                Offer Code: YOUR BUS TIN
                            </div>
                        </div>
                        <button
                            className="px-4 py-2 rounded text-white font-bold text-sm"
                            style={{ background: BRAND.redDark }}
                        >
                            BOOK NOW
                        </button>
                    </div>
                </div>

                {/* 8. TERMS & CONDITIONS */}
                <div className="px-8 py-6">
                    <div
                        className="text-xs font-semibold mb-2"
                        style={{ color: BRAND.ink }}
                    >
                        Terms &amp; Conditions
                    </div>

                    <div
                        className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px] leading-relaxed"
                        style={{ color: BRAND.inkSub }}
                    >
                        <ol className="list-none space-y-2">
                            <li className="font-semibold text-gray-700">
                                Routesbook responsibilities include:
                            </li>
                            <li>
                                (1) Issuing a valid ticket that will be accepted
                                by the listed bus operator(s).
                            </li>
                            <li>
                                (2) Providing refund / support in case of
                                cancellation as per policy.
                            </li>
                            <li>
                                (3) Providing customer support and information
                                in case of delays / inconvenience.
                            </li>

                            <li className="font-semibold text-gray-700 pt-2">
                                Routesbook is not responsible for:
                            </li>
                            <li>
                                (1) The bus not departing / arriving on time.
                            </li>
                            <li>
                                (2) Bus staff behaviour / service quality.
                            </li>
                            <li>
                                (3) Seat / vehicle condition not matching
                                expectation.
                            </li>
                            <li>
                                (4) Trips cancelled by the operator due to
                                unavoidable reasons.
                            </li>
                        </ol>

                        <ol className="list-none space-y-2">
                            <li className="font-semibold text-gray-700">
                                General terms:
                            </li>
                            <li>
                                (1) Carry a copy of this ticket (print or
                                e-ticket) and a valid photo ID.
                            </li>
                            <li>
                                (2) Failure to show ID may result in denied
                                boarding.
                            </li>
                            <li>
                                (3) Baggage is carried at passenger’s risk
                                unless explicitly covered.
                            </li>
                            <li>
                                (4) Please arrive 15–20 minutes before
                                departure.
                            </li>
                            <li>
                                (5) Abusive behavior / intoxication may lead to
                                denied boarding.
                            </li>
                            <li>
                                (6) Contact support through My Bookings for
                                updates, changes, or help.
                            </li>
                            <li>
                                (7) QR misuse or duplication can invalidate
                                boarding.
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
            {/* ======== /A4 ARTBOARD ======== */}
        </div>
    );
};

export default DownloadTicket;
