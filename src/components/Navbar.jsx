import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaUserCircle,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaBus,
} from "react-icons/fa";

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLinkStyle = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-300 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50${
      isActive ? " text-blue-600 bg-blue-50 font-semibold" : ""
    }`;

  if (loading) return null;

  return (
    <>
      <nav
        key={user?._id || "guest"}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center md:flex hidden"
      >
        <NavLink
          to="/"
          className="flex items-center gap-2 text-2xl font-bold transition-all duration-300"
        >
          <FaBus className="text-red-500" />
          <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Routesbook
          </span>
        </NavLink>

        <div className="md:hidden">
          <button onClick={() => setMenuOpen(true)} className="p-2 rounded-md">
            <FaBars className="text-gray-800" size={22} />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ul className="flex items-center gap-2">
            <li>
              <NavLink to="/" className={getLinkStyle}>
                Home
              </NavLink>
            </li>

            {user && (
              <li>
                <NavLink to="/my-bookings" className={getLinkStyle}>
                  My Bookings
                </NavLink>
              </li>
            )}

            {user?.role === "operator" && (
              <li>
                <NavLink to="/operator/dashboard" className={getLinkStyle}>
                  Operator Dashboard
                </NavLink>
              </li>
            )}

            {user?.role === "admin" && (
              <li>
                <NavLink to="/admin" className={getLinkStyle}>
                  Admin
                </NavLink>
              </li>
            )}
          </ul>

          <div className="w-px h-6 mx-2 bg-gray-200" />

          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((p) => !p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <FaUserCircle size={20} />
                <span className="text-sm font-medium">{user.name}</span>
                <FaChevronDown
                  size={12}
                  className={`transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-500 rounded-md hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="px-4 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="px-4 py-1.5 text-sm font-medium rounded-md shadow-sm hover:shadow-md bg-blue-600 text-white"
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </nav>
      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[100] md:hidden transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
        <div className="relative w-full max-w-xs h-full bg-white ml-auto flex flex-col justify-between py-6 px-4">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold">Routesbook</span>
              <button onClick={() => setMenuOpen(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            {/* Mobile links */}
            <div className="flex flex-col gap-2">
              <NavLink
                to="/"
                onClick={() => setMenuOpen(false)}
                className="p-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-100 text-left"
              >
                Home
              </NavLink>
              {user && (
                <NavLink
                  to="/my-bookings"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-100 text-left"
                >
                  My Bookings
                </NavLink>
              )}
              {user?.role === "operator" && (
                <NavLink
                  to="/operator/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-100 text-left"
                >
                  Operator Dashboard
                </NavLink>
              )}
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-100 text-left"
                >
                  Admin
                </NavLink>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMenuOpen(false);
                  }}
                  className="p-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-100 text-left"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="p-3 text-base font-medium text-red-500 rounded-lg hover:bg-red-50 text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <hr className="my-2" />
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="p-3 text-base font-medium text-center text-white bg-blue-600 rounded-lg"
                >
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
