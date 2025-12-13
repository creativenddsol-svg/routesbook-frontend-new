import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaEnvelope,
} from "react-icons/fa";
import { Link } from "react-router-dom";

/* Match Home.jsx theme tokens */
const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#FFFFFF",
  borderLight: "#E0E0E0",
  white: "#FFFFFF",
};

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-14 bg-white border-t" style={{ borderColor: PALETTE.borderLight }}>
      {/* Top accent strip */}
      <div
        className="h-1 w-full"
        style={{
          background:
            `linear-gradient(90deg, ${PALETTE.primaryRed} 0%, ${PALETTE.accentBlue} 100%)`,
        }}
      />

      <div className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚌</span>
              <h2 className="font-heading text-xl font-bold" style={{ color: PALETTE.textDark }}>
                Routesbook
                <span style={{ color: PALETTE.primaryRed }}>.</span>lk
              </h2>
            </div>

            <p className="mt-3 text-sm leading-relaxed" style={{ color: PALETTE.textLight }}>
              Book bus tickets across Sri Lanka with comfort and confidence.
              Real-time seats, trusted operators, and secure payments.
            </p>

            {/* Social */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="h-10 w-10 rounded-full border flex items-center justify-center transition hover:shadow-sm"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaFacebookF style={{ color: PALETTE.textLight }} />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="h-10 w-10 rounded-full border flex items-center justify-center transition hover:shadow-sm"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaInstagram style={{ color: PALETTE.textLight }} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="h-10 w-10 rounded-full border flex items-center justify-center transition hover:shadow-sm"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaTwitter style={{ color: PALETTE.textLight }} />
              </a>
              <a
                href="mailto:support@routesbook.lk"
                aria-label="Email"
                className="h-10 w-10 rounded-full border flex items-center justify-center transition hover:shadow-sm"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaEnvelope style={{ color: PALETTE.textLight }} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: PALETTE.textDark }}>
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/my-bookings"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/operators"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Bus Operators
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: PALETTE.textDark }}>
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/login"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Signup
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="transition hover:underline"
                  style={{ color: PALETTE.textLight }}
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: PALETTE.textDark }}>
              Contact
            </h3>

            <div className="rounded-xl border p-4 bg-white" style={{ borderColor: PALETTE.borderLight }}>
              <p className="text-sm font-medium" style={{ color: PALETTE.textDark }}>
                Need help?
              </p>
              <p className="mt-1 text-sm" style={{ color: PALETTE.textLight }}>
                Email us anytime:
              </p>

              <a
                href="mailto:support@routesbook.lk"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: PALETTE.primaryRed }}
              >
                <FaEnvelope />
                support@routesbook.lk
              </a>

              <div className="mt-4 text-xs" style={{ color: PALETTE.textLight }}>
                For payment compliance, please review our Privacy, Terms, and Refund policies.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderColor: PALETTE.borderLight, color: PALETTE.textLight }}
        >
          <div>© {year} Routesbook.lk. All rights reserved.</div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/privacy-policy" className="hover:underline">
              Privacy
            </Link>
            <Link to="/terms" className="hover:underline">
              Terms
            </Link>
            <Link to="/refund-policy" className="hover:underline">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
