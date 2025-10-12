// src/pages/PaymentFailed.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Banner = ({ title, children }) => (
  <div className="rounded-lg border bg-red-50 border-red-200 p-3 mb-4">
    <p className="font-semibold text-red-800">{title}</p>
    {children ? <p className="text-sm mt-1">{children}</p> : null}
  </div>
);

export default function PaymentFailed() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const orderId = (params.get("order_id") || params.get("bookingNo") || "").trim();

  // If we came from PayHere, remember that we returned from the gateway.
  // (ConfirmBooking can optionally look at this flag if you’ve added that logic.)
  try {
    sessionStorage.setItem("rb_back_from_gateway", "1");
  } catch {}

  // Try to rebuild the payload we saved before redirecting to the gateway
  const restore = (() => {
    let base = null;

    // 1) Primary restore payload saved when leaving ConfirmBooking
    try {
      const raw = sessionStorage.getItem("rb_restore_payload");
      if (raw) base = JSON.parse(raw);
    } catch {}

    // 2) Fallback to minimal info from the ticket payload (if any)
    if (!base) {
      try {
        const raw = sessionStorage.getItem("rb_ticket_payload");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.bookingDetails) {
            const b = parsed.bookingDetails;
            base = {
              bus: b.bus,
              date: b.date,
              departureTime: b.departureTime,
              selectedSeats: b.selectedSeats,
              selectedBoardingPoint: b.boardingPoint,
              selectedDroppingPoint: b.droppingPoint,
              priceDetails: b.priceDetails,
            };
          }
        }
      } catch {}
    }

    // 3) Merge in the user's in-page inputs saved as a draft
    try {
      const draftRaw = sessionStorage.getItem("rb_confirm_draft");
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        // If we only have the draft, use it as the base;
        // otherwise, merge form/passenger inputs into the base payload.
        if (!base) {
          base = {
            bus: draft.bus,
            selectedSeats: draft.selectedSeats,
            date: draft.date,
            priceDetails: draft.priceDetails,
            selectedBoardingPoint: draft.selectedBoardingPoint,
            selectedDroppingPoint: draft.selectedDroppingPoint,
            departureTime: draft.departureTime,
            seatGenders: draft.seatGenders,
            formDraft: draft.formDraft,
            passengersDraft: draft.passengersDraft,
          };
        } else {
          base = {
            ...base,
            seatGenders: base.seatGenders || draft.seatGenders,
            formDraft: draft.formDraft || base.formDraft,
            passengersDraft: draft.passengersDraft || base.passengersDraft,
          };
        }
      }
    } catch {}

    // Persist the merged payload so a later resume still has everything.
    try {
      if (base) sessionStorage.setItem("rb_restore_payload", JSON.stringify(base));
    } catch {}

    return base;
  })();

  const goResume = () => {
    if (restore) {
      navigate("/confirm-booking", { state: restore, replace: true });
    } else {
      navigate("/my-bookings");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto mt-4">
        <Banner title="Payment was cancelled or failed">
          {orderId ? (
            <>
              We received a return with order no.&nbsp;
              <span className="font-semibold">{orderId}</span>. If any deduction
              happened, the bank will auto-reverse it. You can try paying again from
              “My Bookings” or resume your booking now.
            </>
          ) : (
            "If any deduction happened, the bank will auto-reverse it. You can try again."
          )}
        </Banner>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-700 mb-4">What would you like to do next?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={goResume}
              className="w-full py-3 rounded-lg text-white font-semibold bg-rose-600 hover:bg-rose-700"
            >
              Resume Booking
            </button>
            <button
              onClick={() => navigate("/my-bookings")}
              className="w-full py-3 rounded-lg font-semibold bg-white border hover:bg-gray-50"
            >
              Go to My Bookings
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 underline"
            >
              Back to Home
            </button>
          </div>
        </div>

        {orderId ? (
          <p className="text-xs text-gray-400 mt-4 text-center">Ref: {orderId}</p>
        ) : null}
      </div>
    </div>
  );
}
