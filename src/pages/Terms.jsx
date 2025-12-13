import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  border: "#E5E7EB",
};

const Container = ({ children }) => (
  <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-white">
    {children}
  </span>
);

const SectionCard = ({ id, title, children }) => (
  <section id={id} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 shadow-sm">
    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
    <div className="mt-3 text-[15px] leading-7 text-gray-700">{children}</div>
  </section>
);

const Terms = () => {
  const lastUpdated = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }, []);

  useEffect(() => {
    document.title = "Terms & Conditions | Routesbook.lk";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div
        className="w-full border-b"
        style={{
          borderColor: PALETTE.border,
          background:
            "linear-gradient(135deg, rgba(216,78,85,0.10) 0%, rgba(58,134,255,0.10) 100%)",
        }}
      >
        <Container>
          <div className="py-10 sm:py-12">
            <div className="flex items-center gap-3 text-sm">
              <Link to="/" className="text-blue-700 hover:underline">
                Home
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700">Terms & Conditions</span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                  Terms & Conditions
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  These terms govern your use of Routesbook.lk and its booking services.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge>Last updated: {lastUpdated}</Badge>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        {/* Quick action */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-700">
              Also read our <Link to="/privacy-policy" className="font-semibold hover:underline" style={{ color: PALETTE.accentBlue }}>Privacy Policy</Link>{" "}
              and <Link to="/refund-policy" className="font-semibold hover:underline" style={{ color: PALETTE.accentBlue }}>Refund Policy</Link>.
            </p>
            <Link
              to="/refund-policy"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: PALETTE.primaryRed }}
            >
              Refund Policy
            </Link>
          </div>
        </div>

        {/* TOC */}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">On this page</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              ["about", "About Routesbook.lk"],
              ["accounts", "Accounts & eligibility"],
              ["bookings", "Bookings & tickets"],
              ["changes", "Schedule changes & cancellations"],
              ["payments", "Payments"],
              ["conduct", "User conduct"],
              ["liability", "Liability & disclaimers"],
              ["law", "Governing law"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="hover:underline" style={{ color: PALETTE.accentBlue }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-5 pb-16">
          <SectionCard id="about" title="1) About Routesbook.lk">
            <p>
              Routesbook.lk is an online platform that helps users search buses, select seats (where available), and book tickets
              offered by bus operators. Routesbook.lk may act as a booking facilitator; the transport service itself is provided by
              the operator.
            </p>
          </SectionCard>

          <SectionCard id="accounts" title="2) Accounts & eligibility">
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate information and keep your account secure.</li>
              <li>You are responsible for actions taken through your account.</li>
              <li>We may suspend accounts involved in fraud, abuse, or policy violations.</li>
            </ul>
          </SectionCard>

          <SectionCard id="bookings" title="3) Bookings & tickets">
            <ul className="list-disc pl-5 space-y-2">
              <li>Ticket availability and seat maps are subject to operator system updates and real-time demand.</li>
              <li>
                A booking is confirmed only after successful payment and confirmation (ticket ID/QR/PNR).
              </li>
              <li>Passengers must carry required identification if the operator requests it.</li>
            </ul>
          </SectionCard>

          <SectionCard id="changes" title="4) Schedule changes & cancellations">
            <ul className="list-disc pl-5 space-y-2">
              <li>Operators may change departure times, boarding points, or cancel trips due to operational reasons.</li>
              <li>
                If an operator cancels a trip, eligible refunds will be handled according to the <Link to="/refund-policy" className="font-semibold hover:underline" style={{ color: PALETTE.accentBlue }}>Refund Policy</Link>.
              </li>
              <li>
                Passenger cancellations (if allowed) may be subject to time windows and fees.
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="payments" title="5) Payments">
            <ul className="list-disc pl-5 space-y-2">
              <li>Online payments are processed via payment gateways (e.g., PayHere).</li>
              <li>We store only payment references/status for reconciliation; we do not store full card details.</li>
              <li>Prices may include ticket fare + service/convenience fees (if applicable).</li>
            </ul>
          </SectionCard>

          <SectionCard id="conduct" title="6) User conduct">
            <ul className="list-disc pl-5 space-y-2">
              <li>Do not attempt to misuse the platform, bypass security, or disrupt bookings.</li>
              <li>Do not provide false details or attempt fraudulent chargebacks.</li>
            </ul>
          </SectionCard>

          <SectionCard id="liability" title="7) Liability & disclaimers">
            <p>
              Routesbook.lk provides the platform “as is”. We work to keep services stable, but we cannot guarantee uninterrupted
              access. The operator is responsible for the transport service. Routesbook.lk is not responsible for operator delays,
              traffic issues, or events beyond reasonable control.
            </p>
          </SectionCard>

          <SectionCard id="law" title="8) Governing law">
            <p>
              These terms are governed by the laws of Sri Lanka. Any disputes will be handled according to applicable laws and
              procedures.
            </p>
          </SectionCard>

          <SectionCard id="contact" title="9) Contact">
            <p>
              Email:{" "}
              <a className="font-semibold hover:underline" href="mailto:support@routesbook.lk" style={{ color: PALETTE.accentBlue }}>
                support@routesbook.lk
              </a>
            </p>
            <p className="mt-2">
              Business name: <b>[YOUR BUSINESS NAME]</b>
              <br />
              Address: <b>[YOUR BUSINESS ADDRESS]</b>
              <br />
              Phone: <b>[YOUR BUSINESS PHONE]</b>
            </p>
          </SectionCard>

          <div className="text-xs text-gray-500">
            This page is provided for general information and does not constitute legal advice.
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Terms;
