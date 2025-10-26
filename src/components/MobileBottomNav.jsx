import { useState, useRef, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  FaHome,
  FaListUl, // Used for Bookings (lines icon)
  FaHeadset, // Used for Help (support/headset icon)
  FaRegUserCircle, // Updated for Account (unfilled circle icon)
} from "react-icons/fa";
// Removed FaUserCircle as it is now FaRegUserCircle
import { useAuth } from "../AuthContext";

/** Keep this in sync with the bar height in Tailwind classes below */
const NAV_HEIGHT_PX = 64; // 16 * 4

const MobileBottomNav = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const sheetRef = useRef(null);

  // Add bottom padding to the page so content never hides behind the bar
  useEffect(() => {
    const safeInset =
      typeof window !== "undefined"
        ? parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--sat-safe-bottom"
            ) || "0",
            10
          )
        : 0;
    const oldPadding = document.body.style.paddingBottom;
    // use env(safe-area-inset-bottom) via CSS var fallback trick
    document.body.style.paddingBottom = `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`;
    return () => {
      document.body.style.paddingBottom = oldPadding;
    };
  }, []);

  // Close bottom sheet when tapping outside
  useEffect(() => {
    const onDown = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Updated tab classes to match RedBus styling: lighter gray when inactive, red when active.
  const tabClasses = (isActive) =>
    [
      "flex flex-col items-center justify-center h-16 w-full select-none",
      "transition-colors duration-150 ease-out",
      // RedBus active color
      isActive ? "text-[#d84e55]" : "text-gray-500",
      "text-[10px] font-medium" // Adjusted text style for better look
    ].join(" ");

  // The Indicator component is removed as the RedBus UI doesn't show a top bar indicator.
  // const Indicator = ({ active }) => (...)

  return (
    <>
      {/* --- Bottom navigation (full-width, aligned with screen) --- */}
      <nav
        // Removed 'border-t border-gray-200' for a cleaner app-like look
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white shadow-[0_-4px_14px_rgba(0,0,0,0.08)]"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="navigation"
        aria-label="Primary"
      >
        <ul className="grid grid-cols-4">
          {/* Home */}
          <li className="relative">
            <NavLink to="/" className={({ isActive }) => tabClasses(isActive)}>
              {({ isActive }) => (
                <>
                  <FaHome className="text-[24px]" />
                  <span className="mt-0.5">Home</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Bookings - Lines icon */}
          <li className="relative">
            <NavLink
              to="/my-bookings"
              className={({ isActive }) => tabClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  <FaListUl className="text-[24px]" />
                  <span className="mt-0.5">Bookings</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Help - Headset icon */}
          <li className="relative">
            <NavLink
              to="/help"
              className={({ isActive }) => tabClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  <FaHeadset className="text-[24px]" />
                  <span className="mt-0.5">Help</span>
                </>
              )}
            </NavLink>
          </li>

          {/* Account (opens sheet) - Updated to unfilled icon */}
          <li className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className={tabClasses(showMenu)}
              aria-expanded={showMenu}
              aria-controls="account-sheet"
            >
              {/* Using FaRegUserCircle for the unfilled look */}
              <FaRegUserCircle className="text-[24px]" />
              <span className="mt-0.5">Account</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* --- Account Bottom Sheet (full-width, aligned) --- */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setShowMenu(false)}
          />
          {/* sheet */}
          <div
            id="account-sheet"
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t border-gray-100 shadow-[0_-20px_40px_rgba(0,0,0,0.2)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex justify-center pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>

            {isLoggedIn ? (
              <div className="px-5 pt-3 pb-2 border-b">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            ) : (
              <div className="px-5 pt-4 pb-2 border-b">
                <p className="text-sm font-semibold text-gray-900">Welcome</p>
                <p className="text-xs text-gray-500">
                  Sign in to manage bookings faster
                </p>
              </div>
            )}

            <div className="p-2">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100"
                  >
                    My Profile
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => {
                        navigate("/admin");
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100"
                    >
                      Admin Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                      navigate("/");
                    }}
                    className="w-full text-left px-4 py-3 mt-1 rounded-xl text-red-600 hover:bg-red-50 active:bg-red-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate("/login");
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/signup");
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 mt-1 rounded-xl hover:bg-gray-50 active:bg-gray-100"
                  >
                    Signup
                  </button>
                </>
              )}
            </div>

            <div className="h-2" />
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
