// src/pages/ConfirmBooking/ConfirmBookingMobile.jsx
import React from "react";
import {
  PALETTE,
  getNiceDate,
  SectionCard,
  Label,
  DatePill,
  AcPill,
  SeatPill,
  TimeGreenPill,
  HoldCountdown,
  RowInput,
  PassengerRow,
} from "./core";

// ✅ no-op replacement so existing JSX does not change
const BookingSteps = () => null;

const ConfirmBookingMobile = ({
  // refs
  pageTopRef,

  // core values
  bus,
  date,
  departureTime,
  selectedBoardingPoint,
  selectedDroppingPoint,
  selectedSeats,
  prices,
  errors,
  holdExpired,
  termsAccepted,
  cameBackFromGateway,
  lockVersion,

  // form state & handlers
  form,
  onChangeForm,
  blurValidateField,

  // passengers
  passengers,
  setPassengerName,
  setPassengerAge,
  setPassengerGender,
  blurValidatePassenger,

  // seat hold controls
  setHoldExpired,
  releaseSeats,

  // terms
  toggleTerms,

  // navigation / actions
  goBackToResults,
  handleSubmit,
}) => {
  return (
    <div
      ref={pageTopRef}
      className="min-h-screen text-[16px] md:text-base" // ✅ ensure stable base size on mobile
      style={{ background: PALETTE.bg }}
    >
      {/* Matte top bar */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: PALETTE.primary,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white text-base font-semibold leading-tight">
              Confirm Booking
            </p>
            <p className="text-white/90 text-xs">
              {bus?.from} → {bus?.to} • {getNiceDate(date, departureTime)}
            </p>
          </div>
          {/* 🆕 explicit back to results button (optional UX helper) */}
          <button
            type="button"
            onClick={goBackToResults}
            className="hidden sm:inline-block px-3 py-1.5 rounded-md text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            Back to Results
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 sm:pb-40">
        <div className="pt-4">
          <BookingSteps currentStep={3} />
        </div>

        {/* 🆕 Show a small banner if user returned from payment with an error/cancel */}
        {cameBackFromGateway ? (
          <div
            className="mt-3 rounded-xl px-3 py-2 text-xs font-medium"
            style={{
              background: "#FEF2F2",
              color: "#991B1B",
              border: "1px solid #FECACA",
            }}
          >
            Payment was cancelled or failed. You can review your details and try
            again.
          </div>
        ) : null}

        {/* Error banner (mobile-friendly) */}
        {errors.name ||
        errors.mobile ||
        errors.nic ||
        errors.email ||
        Object.keys(errors.passengers || {}).length ||
        errors.terms ||
        holdExpired ? (
          <div
            className="mt-3 rounded-xl px-3 py-2 text-xs font-medium"
            style={{
              background: "#FEF2F2",
              color: "#991B1B",
              border: "1px solid #FECACA",
            }}
          >
            {holdExpired
              ? "Your seat hold has expired. Please go back and reselect seats."
              : "Please correct the highlighted fields below."}
          </div>
        ) : null}

        {/* Journey Overview */}
        <SectionCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2
                className="text-lg font-bold truncate"
                style={{ color: PALETTE.text }}
              >
                {bus?.name || "Bus"}
              </h2>
              <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
                {bus?.from} → {bus?.to}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <DatePill>{getNiceDate(date, departureTime)}</DatePill>
              <AcPill>{bus?.busType || "Seating"}</AcPill>
              <SeatPill>
                {selectedSeats?.length} Seat
                {selectedSeats?.length > 1 ? "s" : ""}
              </SeatPill>
              <HoldCountdown
                key={`hold-${lockVersion}`} // 👈 remounts after re-lock to reset timer
                busId={bus?._id}
                date={date}
                departureTime={departureTime}
                onExpire={() => {
                  setHoldExpired(true);
                  releaseSeats(); // proactively release if countdown hits zero
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <Label>Boarding</Label>
              <p className="font-medium" style={{ color: PALETTE.text }}>
                {selectedBoardingPoint.point} <span className="text-xs">at</span>{" "}
                <TimeGreenPill>{selectedBoardingPoint.time}</TimeGreenPill>
              </p>
            </div>
            <div>
              <Label>Dropping</Label>
              <p className="font-medium" style={{ color: PALETTE.text }}>
                {selectedDroppingPoint.point} <span className="text-xs">at</span>{" "}
                <span className="tabular-nums">
                  {selectedDroppingPoint.time}
                </span>
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Selected Seats</Label>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((s) => (
                  <SeatPill key={s}>Seat {s}</SeatPill>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Contact Details */}
        <SectionCard title="Contact Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RowInput
              id="name"
              name="name"
              label="Full Name"
              value={form.name}
              onChange={onChangeForm}
              onBlur={() => blurValidateField("name")}
              autoComplete="name"
              enterKeyHint="next"
              placeholder="e.g., Ramesh Perera"
              required
              error={errors.name}
              maxLength={80}
            />
            <RowInput
              id="mobile"
              name="mobile"
              label="Mobile Number"
              type="tel"
              value={form.mobile}
              onChange={onChangeForm}
              onBlur={() => blurValidateField("mobile")}
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
              placeholder="e.g., 07XXXXXXXX"
              required
              error={errors.mobile}
              maxLength={11}
              pattern="^0\\d{9,10}$"
            />
            <RowInput
              id="nic"
              name="nic"
              label="NIC / Passport"
              value={form.nic}
              onChange={onChangeForm}
              onBlur={() => blurValidateField("nic")}
              autoComplete="off"
              enterKeyHint="next"
              placeholder="e.g., 200012345678"
              required
              error={errors.nic}
              maxLength={20}
            />
            <RowInput
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={form.email}
              onChange={onChangeForm}
              onBlur={() => blurValidateField("email")}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="done"
              placeholder="e.g., ramesh@email.com"
              required
              error={errors.email}
              maxLength={100}
            />
          </div>
        </SectionCard>

        {/* Passenger Details */}
        <SectionCard title="Passenger Details">
          <div className="space-y-4">
            {passengers.map((p, idx) => (
              <PassengerRow
                key={p.seat}
                p={p}
                index={idx}
                onName={setPassengerName}
                onAge={setPassengerAge}
                onGender={setPassengerGender}
                errorsForSeat={errors.passengers?.[p.seat]}
                onBlurName={(seat) => blurValidatePassenger(seat, "name")}
                onBlurAge={(seat) => blurValidatePassenger(seat, "age")}
              />
            ))}
          </div>
        </SectionCard>

        {/* Fare Summary */}
        <SectionCard title="Fare Summary">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span
                className="font-medium"
                style={{ color: PALETTE.textSubtle }}
              >
                Subtotal
              </span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: PALETTE.text }}
              >
                Rs. {prices.basePrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="font-medium"
                style={{ color: PALETTE.textSubtle }}
              >
                Convenience Fee
              </span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: PALETTE.text }}
              >
                Rs. {prices.convenienceFee.toFixed(2)}
              </span>
            </div>
            <hr className="my-3" style={{ borderColor: PALETTE.border }} />
            <div className="flex justify-between text-base">
              <span className="font-bold" style={{ color: PALETTE.text }}>
                Total
              </span>
              <span
                className="tabular-nums font-extrabold"
                style={{ color: PALETTE.text }}
              >
                Rs. {prices.total.toFixed(2)}
              </span>
            </div>
            {holdExpired && (
              <p
                className="text-xs mt-2 font-semibold"
                style={{ color: "#991B1B" }}
              >
                Your seat hold has expired. Please go back and reselect seats.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Terms */}
        <div className="mt-4">
          <label
            className="flex items-center text-sm"
            style={{ color: PALETTE.text }}
          >
            <input
              type="checkbox"
              className="mr-2"
              checked={termsAccepted}
              onChange={toggleTerms}
              required
            />
            I agree to all Terms &amp; Conditions
          </label>
          {errors.terms ? (
            <p
              className="mt-1 text-xs font-medium"
              style={{ color: "#B91C1C" }}
            >
              {errors.terms}
            </p>
          ) : null}
        </div>

        {/* Spacer so content isn't hidden behind sticky bottom sheet */}
        <div className="sm:hidden h-24" />
      </div>

      {/* 🔻 Mobile sticky bottom-sheet CTA (redbus-style) */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[10002] sm:hidden"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom))",
        }}
      >
        <div className="w-full bg-white">
          {/* grab handle, to visually match MobileBottomSheet */}
          <div className="pt-2 flex justify-center">
            <span className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>

          <div className="max-w-6xl mx-auto px-4 pt-2 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">
                  Payable Amount
                </div>
                <div
                  className="text-base font-extrabold tabular-nums"
                  style={{ color: PALETTE.text }}
                >
                  Rs. {prices.total.toFixed(2)}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!termsAccepted || holdExpired}
              onClick={() => {
                handleSubmit({ preventDefault: () => {} });
              }}
              className="mt-3 w-11/12 mx-auto block px-4 py-3 rounded-xl font-bold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: PALETTE.primary }}
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      </div>

      {/* ⛔ NOTE: desktop sticky CTA is intentionally NOT rendered here,
          because index.jsx already shows this component only on mobile (sm:hidden). */}
    </div>
  );
};

export default ConfirmBookingMobile;
