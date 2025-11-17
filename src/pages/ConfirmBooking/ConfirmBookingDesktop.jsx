// src/pages/ConfirmBooking/ConfirmBookingDesktop.jsx
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

const ConfirmBookingDesktop = ({
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
  /* -------------------- UI -------------------- */
  return (
    <div
      ref={pageTopRef}
      className="min-h-screen text-[16px] md:text-base"
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
          {/* top row: bus title + pills */}
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
              {/* ❌ Seat pill removed from header (only shown in Selected seats section) */}
              <HoldCountdown
                key={`hold-${lockVersion}`}
                busId={bus?._id}
                date={date}
                departureTime={departureTime}
                onExpire={() => {
                  setHoldExpired(true);
                  releaseSeats();
                }}
              />
            </div>
          </div>

          {/* timeline row: boarding → dropping + details */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 text-sm">
            {/* Left: time + vertical track */}
            <div className="flex flex-row sm:flex-col items-center sm:items-center gap-3 sm:gap-2 min-w-[90px]">
              {/* Departure time */}
              <div className="text-left sm:text-center">
                <p
                  className="text-lg font-extrabold tabular-nums"
                  style={{ color: PALETTE.text }}
                >
                  {selectedBoardingPoint?.time || departureTime}
                </p>
                <p
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: PALETTE.textSubtle }}
                >
                  Boarding
                </p>
              </div>

              {/* Vertical connector */}
              <div className="flex-1 flex items-center sm:flex-col">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: PALETTE.text }}
                />
                <div className="h-px sm:w-px sm:h-16 flex-1 bg-gray-300 mx-2 sm:my-2" />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: PALETTE.text }}
                />
              </div>

              {/* Arrival time */}
              <div className="text-left sm:text-center">
                <p
                  className="text-lg font-extrabold tabular-nums"
                  style={{ color: PALETTE.text }}
                >
                  {selectedDroppingPoint?.time || "--:--"}
                </p>
                <p
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: PALETTE.textSubtle }}
                >
                  Dropping
                </p>
              </div>
            </div>

            {/* Right: boarding / dropping / seats text blocks */}
            <div className="flex-1 space-y-4">
              {/* Boarding block */}
              <div>
                <Label>Boarding point</Label>
                <p className="font-medium" style={{ color: PALETTE.text }}>
                  {selectedBoardingPoint?.point || "-"}
                </p>
                {/* ❌ Remove duplicated green date pill under boarding */}
              </div>

              {/* Dropping block */}
              <div>
                <Label>Dropping point</Label>
                <p className="font-medium" style={{ color: PALETTE.text }}>
                  {selectedDroppingPoint?.point || "-"}
                </p>
                {selectedDroppingPoint?.time ? (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: PALETTE.textSubtle }}
                  >
                    Expected arrival{" "}
                    <span className="tabular-nums">
                      {selectedDroppingPoint.time}
                    </span>
                  </p>
                ) : null}
              </div>

              {/* Seats block */}
              <div>
                <Label>Selected seats</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((s) => (
                    <SeatPill key={s}>Seat {s}</SeatPill>
                  ))}
                </div>
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
            <p className="mt-1 text-xs font-medium" style={{ color: "#B91C1C" }}>
              {errors.terms}
            </p>
          ) : null}
        </div>

        {/* Inline mobile CTA */}
        <SectionCard>
          <div className="sm:hidden mt-2">
            <button
              type="button"
              disabled={!termsAccepted || holdExpired}
              onClick={(e) => {
                handleSubmit({ preventDefault: () => {} });
              }}
            >
              <span
                className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: PALETTE.primary }}
              >
                Proceed to Pay
              </span>
            </button>
            <p
              className="mt-2 text-center text-xs"
              style={{ color: PALETTE.textSubtle }}
            >
              Payable Amount:{" "}
              <span
                className="font-bold tabular-nums"
                style={{ color: PALETTE.text }}
              >
                Rs. {prices.total.toFixed(2)}
              </span>
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Sticky bottom CTA — desktop */}
      <div
        className="hidden sm:block fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: PALETTE.surface,
          borderTop: `1px solid ${PALETTE.border}`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs" style={{ color: PALETTE.textSubtle }}>
              Payable Amount
            </p>
            <p
              className="text-xl font-extrabold tabular-nums"
              style={{ color: PALETTE.text }}
            >
              Rs. {prices.total.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            disabled={!termsAccepted || holdExpired}
            onClick={(e) => {
              handleSubmit({ preventDefault: () => {} });
            }}
            className="px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: PALETTE.primary }}
          >
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBookingDesktop;
