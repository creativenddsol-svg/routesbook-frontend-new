// src/pages/Home/index.jsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { FaLongArrowAltRight, FaArrowRight } from "react-icons/fa";

import Footer from "../../components/Footer";
import HolidaysSection from "../../components/HolidaysSection";
import NoticesSection from "../../components/NoticesSection";
import WhatsNewSection from "../../components/WhatsNewSection";

/* -------- Shared core (state, helpers, palette, layout) -------- */
import {
  useHomeCore,
  PALETTE,
  SECTION_WRAP,
  SECTION_INNER,
  toLocalYYYYMMDD,
} from "./_core";

/* -------- Split views -------- */
import HomeDesktop from "./HomeDesktop";
import HomeMobile from "./HomeMobile";

const Home = () => {
  const core = useHomeCore();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen min-h-[100svh] font-sans"
      style={{ backgroundColor: PALETTE.bgLight, minHeight: "100dvh" }}
    >
      {/* Top safe-area for iOS notch */}
      <div
        className="lg:hidden"
        style={{
          height: "env(safe-area-inset-top)",
          backgroundColor: "#ffffff",
        }}
      />

      <Toaster position="top-right" />

      {/* ===== Desktop Hero ===== */}
      <div
        className="hidden lg:block w-screen relative left-1/2 ml-[-50vw] overflow-hidden pb-20 lg:pb-40"
        style={{
          backgroundImage: "url('/images/wer.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/10 to-transparent" />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"
        />
        <div className="relative z-10 px-4 pt-16 sm:pt-24">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Sri Lanka No:1 Bus Ticket Booking Platform
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                Travel Smart with Routesbook.lk - Book Instantly
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== Search Widget (split views) ===== */}
      <div className={`${SECTION_WRAP}`}>
        <div className={`${SECTION_INNER} relative z-20 mt-4 lg:-mt-32`}>
          {/* Desktop card & controls */}
          <HomeDesktop
            {...{
              from: core.from,
              setFrom: core.setFrom,
              to: core.to,
              setTo: core.setTo,
              date: core.date,
              setDate: core.setDate,
              fromOptions: core.fromOptions,
              toOptions: core.toOptions,
              recent: core.recent,
              selectStyles: core.selectStyles,
              todayStr: core.todayStr,
              tomorrowStr: core.tomorrowStr,
              desktopDateAnchorRef: core.desktopDateAnchorRef,
              calOpen: core.calOpen,
              setCalOpen: core.setCalOpen,
              handleSearch: core.handleSearch,
              swapLocations: core.swapLocations,
            }}
          />

          {/* Mobile card & controls */}
          <HomeMobile
            {...{
              from: core.from,
              setFrom: core.setFrom,
              to: core.to,
              setTo: core.setTo,
              date: core.date,
              setDate: core.setDate,
              todayStr: core.todayStr,
              tomorrowStr: core.tomorrowStr,
              mobileDateAnchorRef: core.mobileDateAnchorRef,
              calOpen: core.calOpen,
              setCalOpen: core.setCalOpen,
              mobilePickerOpen: core.mobilePickerOpen,
              mobilePickerMode: core.mobilePickerMode,
              recent: core.recent,
              fromOptions: core.fromOptions,
              toOptions: core.toOptions,
              openMobilePicker: core.openMobilePicker,
              handleMobilePick: core.handleMobilePick,
              handleSearch: core.handleSearch,
              swapLocations: core.swapLocations,
            }}
          />
        </div>
      </div>

      {/* ===== Upcoming Holidays ===== */}
      <div>
        <HolidaysSection />
      </div>

      {/* ===== Offers / Notices ===== */}
      <div className="-mt-8 sm:-mt-10 md:-mt-12 lg:-mt-16">
        <NoticesSection />
      </div>

      {/* ===== What's New ===== */}
      <WhatsNewSection />

      {/* ===== Popular Routes ===== */}
      <div className={`${SECTION_WRAP}`}>
        <section className={`${SECTION_INNER} py-16`}>
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2
              className="font-heading text-3xl font-bold mb-6"
              style={{ color: PALETTE.textDark }}
            >
              Popular Routes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                "Colombo → Matara",
                "Galle → Colombo",
                "Matara → Colombo",
                "Jaffna → Colombo",
                "Colombo → Katharagama",
                "Badulla → Colombo",
              ].map((route, i) => {
                const [routeFrom, routeTo] = route.split(" → ");

                const pastel = [
                  { bg: "bg-[#FFE8EA]", br: "border-[#F7C4C9]" },
                  { bg: "bg-[#EAF4FF]", br: "border-[#C7E2FF]" },
                  { bg: "bg-[#EAFBF0]", br: "border-[#BFEFD0]" },
                  { bg: "bg-[#FFF1E5]", br: "border-[#F9D6B5]" },
                  { bg: "bg-[#F3EDFF]", br: "border-[#DCCBFF]" },
                  { bg: "bg-[#FFEAF4]", br: "border-[#F7C2DF]" },
                ][i % 6];

                return (
                  <motion.button
                    key={i}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const currentDateForRoute = toLocalYYYYMMDD(new Date());
                      navigate(
                        `/search-results?from=${routeFrom.trim()}&to=${routeTo.trim()}&date=${currentDateForRoute}`
                      );
                    }}
                    className={`group w-full text-left rounded-xl border ${pastel.br} ${pastel.bg} p-4 sm:p-5 shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span
                            className="font-heading text-base sm:text-lg font-semibold truncate"
                            style={{ color: PALETTE.textDark }}
                            title={routeFrom.trim()}
                          >
                            {routeFrom.trim()}
                          </span>
                          <FaLongArrowAltRight className="opacity-60 shrink-0" />
                          <span
                            className="font-heading text-base sm:text-lg font-semibold truncate"
                            style={{ color: PALETTE.textDark }}
                            title={routeTo.trim()}
                          >
                            {routeTo.trim()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center text-[11px] sm:text-xs font-medium px-2 py-1 rounded-full bg-white/70 border border-white/80">
                            Popular this week
                          </span>
                        </div>
                      </div>

                      <div className="ml-3 shrink-0 flex items-center gap-2 text-sm font-medium text-[#6B7280]">
                        <span className="hidden sm:inline">View buses</span>
                        <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ===== Info blocks: Why Choose / How to Book / Offers / FAQ ===== */}
      <div className={`${SECTION_WRAP}`}>
        <section className={`${SECTION_INNER} py-16`}>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* WHY CHOOSE */}
            <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm border-gray-100">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Why choose Routesbook.lk?
              </h2>
              <ul className="mt-5 space-y-4 text-[15px] leading-7 text-gray-700">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-gray-200">
                    {/* bolt */}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill={PALETTE.primaryRed}><path d="M11 21h-1l1-7H7l6-12h1l-1 7h4l-6 12z"/></svg>
                  </span>
                  <p><span className="font-medium text-gray-900">Real-time seats</span> — pick your exact seat before you pay.</p>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-gray-200">
                    {/* shield */}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill={PALETTE.primaryRed}><path d="M12 2l8 4v6c0 5-3.8 9.4-8 10-4.2-.6-8-5-8-10V6l8-4z"/></svg>
                  </span>
                  <p><span className="font-medium text-gray-900">Secure payments</span> — cards & mobile wallets via trusted gateway.</p>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-gray-200">
                    {/* pin */}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill={PALETTE.primaryRed}><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7zm0 9a2 2 0 100-4 2 2 0 000 4z"/></svg>
                  </span>
                  <p><span className="font-medium text-gray-900">Boarding & drop points</span> — choose the closest stops with exact times.</p>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-gray-200">
                    {/* phone */}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill={PALETTE.primaryRed}><path d="M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zm-5 20a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>
                  </span>
                  <p><span className="font-medium text-gray-900">Instant e-ticket</span> — QR/PNR via SMS & email, also in <b>My Bookings</b>.</p>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-gray-200">
                    {/* seat */}
                    <svg viewBox="0 0 24 24" width="14" height="14" fill={PALETTE.primaryRed}><path d="M7 13V6a4 4 0 118 0v7h3a2 2 0 012 2v4h-2v-2H4v2H2v-4a2 2 0 012-2h3z"/></svg>
                  </span>
                  <p><span className="font-medium text-gray-900">Comfort filters</span> — sort by time, price, bus type, and operator.</p>
                </li>
              </ul>
            </div>

            {/* HOW TO BOOK */}
            <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-sm border-gray-100">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                How to book
              </h2>
              <ol className="mt-5 space-y-4 text-[15px] leading-7 text-gray-700">
                {[
                  "Search your route and date, tap ‘Search Buses’.",
                  "Compare buses—filter by time, price, operator.",
                  "Pick your seats on the live seat map.",
                  "Choose boarding & drop points.",
                  "Enter passenger details.",
                  "Pay securely.",
                  "Get your QR e-ticket instantly.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      {i + 1}
                    </span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* OFFERS */}
          <div className="mt-8 rounded-2xl border bg-white p-6 md:p-8 shadow-sm border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              Exclusive offers on Routesbook
            </h3>
            <p className="mt-3 text-[15px] leading-7 text-gray-700">
              Save with seasonal deals and partner promotions. Apply coupons on
              the payment page and watch the fare update instantly.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-8 rounded-2xl border bg-white p-6 md:p-8 shadow-sm border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              FAQs
            </h3>
            <div className="mt-4 space-y-3">
              <details className="group rounded-lg border border-gray-100 p-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900">
                  Do I need to print my ticket?
                  <span className="ml-3 text-gray-400 group-open:rotate-90 transition">
                    <FaArrowRight />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  No. Your QR/PNR e-ticket on your phone is enough.
                </p>
              </details>

              <details className="group rounded-lg border border-gray-100 p-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900">
                  Can I cancel or reschedule?
                  <span className="ml-3 text-gray-400 group-open:rotate-90 transition">
                    <FaArrowRight />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  Yes—based on the operator’s policy. Exact rules are shown
                  before payment.
                </p>
              </details>

              <details className="group rounded-lg border border-gray-100 p-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900">
                  What if my payment fails?
                  <span className="ml-3 text-gray-400 group-open:rotate-90 transition">
                    <FaArrowRight />
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  Any deducted amount is auto-refunded by the gateway. You’ll
                  receive a reference for support.
                </p>
              </details>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      {/* Bottom safe-area */}
      <div
        className="lg:hidden"
        style={{
          height: "env(safe-area-inset-bottom)",
          backgroundColor: PALETTE.bgLight,
        }}
      />
    </div>
  );
};

export default Home;
