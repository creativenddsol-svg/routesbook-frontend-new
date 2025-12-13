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

const RefundPolicy = () => {
  const lastUpdated = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }, []);

  useEffect(() => {
    document.title = "Refund & Cancellation Policy | Routesbook.lk";
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
              <span className="text-gray-700">Refund Policy</span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                  Refund & Cancellation Policy
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  Clear rules for cancellations, refunds, failed payments, and operator cancellations.
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
        {/* Highlight */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Recommended setup (edit if your business rules differ)</div>
          <p className="mt-2 text-sm text-gray-700">
            If you already have exact cancellation windows in your system, update the percentages/times below to match your real rules.
            PayHere reviewers prefer clear, consistent policies.
          </p>
        </div>

        <div className="mt-6 space-y-5 pb-16">
          <SectionCard id="overview" title="1) Overview">
            <p>
              This policy applies to tickets booked through Routesbook.lk. The transport service is provided by the bus operator,
              so some cancellations/refunds depend on the operator’s rules and trip status.
            </p>
          </SectionCard>

          <SectionCard id="passenger-cancel" title="2) Passenger cancellation (before departure)">
            <p className="mb-3">
              If cancellation is allowed for your ticket, refunds are calculated based on the time remaining before the scheduled
              departure. (You can adjust these numbers.)
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b">Time before departure</th>
                    <th className="text-left p-3 border-b">Refund (example)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">More than 24 hours</td>
                    <td className="p-3">90% of ticket fare (service fee may be non-refundable)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">12–24 hours</td>
                    <td className="p-3">75% of ticket fare</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">6–12 hours</td>
                    <td className="p-3">50% of ticket fare</td>
                  </tr>
                  <tr>
                    <td className="p-3">Less than 6 hours / No-show</td>
                    <td className="p-3">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-sm text-gray-700">
              <b>Note:</b> Operator rules may override the above. If your booking page shows a different policy, that policy applies.
            </p>
          </SectionCard>

          <SectionCard id="operator-cancel" title="3) Operator cancellation / trip not operated">
            <ul className="list-disc pl-5 space-y-2">
              <li>If the operator cancels the trip, eligible passengers will receive a full refund of the ticket fare.</li>
              <li>If alternative arrangements are offered, you may choose to accept or request a refund (where applicable).</li>
            </ul>
          </SectionCard>

          <SectionCard id="failed" title="4) Payment failed / amount deducted">
            <p>
              If your payment fails but your bank/mobile wallet shows a deduction, the payment gateway/bank usually reverses it
              automatically. If the amount is not reversed within a reasonable time, contact us with your payment reference and booking details.
            </p>
          </SectionCard>

          <SectionCard id="how" title="5) How refunds are processed">
            <ul className="list-disc pl-5 space-y-2">
              <li>Refunds are processed back to the original payment method where possible.</li>
              <li>Processing time depends on the gateway and bank (typically several business days).</li>
              <li>We may request a ticket ID/booking ID and payment reference to verify the claim.</li>
            </ul>
          </SectionCard>

          <SectionCard id="fees" title="6) Convenience / service fees">
            <p>
              Where a convenience/service fee is charged, it may be non-refundable unless the trip is cancelled by the operator
              or required by applicable law. (Adjust this statement to match your business rule.)
            </p>
          </SectionCard>

          <SectionCard id="contact" title="7) Contact for cancellations/refunds">
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

export default RefundPolicy;
