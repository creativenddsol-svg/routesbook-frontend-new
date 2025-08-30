import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaEnvelope,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#0F172A] text-[#D1D5DB] pt-12 pb-6 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-[#1F2937] pb-10">
        {/* Logo and Description */}
        <div>
          <h2 className="text-xl font-bold text-white mb-2">🚌 Routesbook</h2>
          <p className="text-sm text-[#9CA3AF]">
            Book bus tickets across Sri Lanka with comfort and confidence.
            Trusted by thousands every day.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-[#1E90FF]">
                Home
              </Link>
            </li>
            <li>
              <Link to="/my-bookings" className="hover:text-[#1E90FF]">
                My Bookings
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-[#1E90FF]">
                Admin Dashboard
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-[#1E90FF]">
                Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/login" className="hover:text-[#1E90FF]">
                Login
              </Link>
            </li>
            <li>
              <Link to="/signup" className="hover:text-[#1E90FF]">
                Signup
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-[#1E90FF]">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#1E90FF]">
                Terms & Conditions
              </a>
            </li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Contact Us</h3>
          <p className="text-sm text-[#9CA3AF] mb-4">support@routesbook.lk</p>
          <div className="flex gap-4 text-lg">
            <a href="#" className="hover:text-[#1E90FF]">
              <FaFacebookF />
            </a>
            <a href="#" className="hover:text-pink-500">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-sky-400">
              <FaTwitter />
            </a>
            <a
              href="mailto:support@routesbook.lk"
              className="hover:text-[#10B981]"
            >
              <FaEnvelope />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="text-center text-xs text-[#9CA3AF] mt-6">
        © {new Date().getFullYear()} Routesbook.lk. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
