import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#0F172A",
  textLight: "#475569",
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

const PrivacyPolicy = () => {
  const lastUpdated = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }, []);

  useEffect(() => {
    document.title = "Privacy Policy | Routesbook.lk";
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
              <span className="text-gray-700">Privacy Policy</span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                  Privacy Policy
                </h1>
                <p className="mt-2 text-sm sm:text-base" style={{ color: PALETTE.textLight }}>
                  How Routesbook.lk collects, uses, and protects your information.
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
        {/* Important note */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Important</div>
              <p className="mt-1 text-sm text-gray-700">
                Replace the <b>[YOUR BUSINESS NAME / ADDRESS / PHONE]</b> placeholders with your real details
                before submitting to PayHere.
              </p>
            </div>
            <Link
              to="/terms"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: PALETTE.primaryRed }}
            >
              View Terms
            </Link>
          </div>
        </div>

        {/* TOC */}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">On this page</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              ["info-we-collect", "Information we collect"],
              ["how-we-use", "How we use your information"],
              ["sharing", "Sharing your information"],
              ["payments", "Payments (PayHere)"],
              ["security", "Security"],
              ["retention", "Data retention"],
              ["rights", "Your rights"],
              ["contact", "Contact us"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="hover:underline" style={{ color: PALETTE.accentBlue }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-5 pb-16">
          <SectionCard id="info-we-collect" title="1) Information we collect">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <b>Account details</b> such as name, email, phone number, and password (encrypted).
              </li>
              <li>
                <b>Booking details</b> such as routes, dates, boarding/drop points, seat numbers, passenger details you enter.
              </li>
              <li>
                <b>Technical data</b> such as IP address, device/browser info, and logs to improve reliability and prevent abuse.
              </li>
              <li>
                <b>Support messages</b> and records when you contact us.
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="how-we-use" title="2) How we use your information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide ticket booking services and display your bookings.</li>
              <li>To confirm bookings via email/SMS and help with support requests.</li>
              <li>To prevent fraud, abuse, and unauthorized access.</li>
              <li>To improve the platform (performance, UX, and reliability).</li>
            </ul>
          </SectionCard>

          <SectionCard id="sharing" title="3) Sharing your information">
            <p>
              We do not sell your personal data. We may share information only when needed to provide the service:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <b>Payment processing:</b> with PayHere to complete online payments.
              </li>
              <li>
                <b>Messaging:</b> with email/SMS providers to send OTPs and booking confirmations.
              </li>
              <li>
                <b>Operators:</b> relevant booking details may be shared with the bus operator to fulfill your trip.
              </li>
              <li>
                <b>Legal requirements:</b> if required by law or to protect users and our platform.
              </li>
            </ul>
          </SectionCard>

          <SectionCard id="payments" title="4) Payments (PayHere)">
            <p>
              When you pay online, payment handling is done through PayHere. We receive payment confirmation details such as
              payment reference IDs and status for reconciliation and support. We do not store full card details on Routesbook.lk.
            </p>
          </SectionCard>

          <SectionCard id="security" title="5) Security">
            <ul className="list-disc pl-5 space-y-2">
              <li>HTTPS encryption in transit (where supported by your browser).</li>
              <li>Access controls and secure authentication.</li>
              <li>Monitoring and logging to detect suspicious activity.</li>
            </ul>
          </SectionCard>

          <SectionCard id="retention" title="6) Data retention">
            <p>
              We retain booking and payment reference data for as long as necessary to provide services, meet legal/accounting
              obligations, and handle disputes/refunds. You may request deletion of your account (subject to required retention).
            </p>
          </SectionCard>

          <SectionCard id="rights" title="7) Your rights">
            <ul className="list-disc pl-5 space-y-2">
              <li>Request access to your personal information.</li>
              <li>Request corrections of inaccurate data.</li>
              <li>Request account deletion (subject to legal/accounting needs).</li>
            </ul>
          </SectionCard>

          <SectionCard id="contact" title="8) Contact us">
            <p>
              Email: <a className="font-semibold hover:underline" href="mailto:support@routesbook.lk" style={{ color: PALETTE.accentBlue }}>
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

export default PrivacyPolicy;
