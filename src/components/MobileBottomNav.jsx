import { useState, useRef, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  FaHome,
  FaTicketAlt,
  FaQuestionCircle,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../AuthContext";

const MobileBottomNav = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const sheetRef = useRef(null);

  // close account sheet on outside tap or route changes
  useEffect(() => {
    const onDown = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const tabClasses = (isActive) =>
    [
      "flex flex-col items-center justify-center h-14 w-full select-none",
      "transition-all duration-200 ease-out",
      isActive ? "text-[#d84e55]" : "text-gray-500",
    ].join(" ");

  const IconWrap = ({ active, children }) => (
    <div
      className={[
        "relative grid place-items-center",
        "rounded-xl px-3 py-2",
        active ? "bg-[#d84e55]/10" : "bg-transparent",
      ].join(" ")}
    >
      {children}
      {/* active dot */}
      <span
        className={[
          "absolute -bottom-2 h-1.5 w-1.5 rounded-full",
          active ? "bg-[#d84e55]" : "bg-transparent",
        ].join(" ")}
      />
    </div>
  );

  return (
    <>
      {/* Bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
        style={{
          // respect device safe area
          paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        }}
      >
        {/* blurred card container */}
        <div className="mx-auto max-w-md">
          <div className="mx-3 rounded-2xl border border-white/60 bg-white/90 backdrop-blur shadow-[0_-6px_24px_rgba(0,0,0,0.12)]">
            <ul className="grid grid-cols-4 text-[11px] font-medium">
              {/* Home */}
              <li className="col-span-1">
                <NavLink to="/" className={({ isActive }) => tabClasses(isActive)}>
                  {({ isActive }) => (
                    <>
                      <IconWrap active={isActive}>
                        <FaHome className="text-xl" />
                      </IconWrap>
                      <span className="mt-1">Home</span>
                    </>
                  )}
                </NavLink>
              </li>

              {/* Bookings */}
              <li className="col-span-1">
                <NavLink
                  to="/my-bookings"
                  className={({ isActive }) => tabClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <IconWrap active={isActive}>
                        <FaTicketAlt className="text-xl" />
                      </IconWrap>
                      <span className="mt-1">Bookings</span>
                    </>
                  )}
                </NavLink>
              </li>

              {/* Help */}
              <li className="col-span-1">
                <NavLink
                  to="/help"
                  className={({ isActive }) => tabClasses(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <IconWrap active={isActive}>
                        <FaQuestionCircle className="text-xl" />
                      </IconWrap>
                      <span className="mt-1">Help</span>
                    </>
                  )}
                </NavLink>
              </li>

              {/* Account (opens bottom sheet) */}
              <li className="col-span-1">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className={tabClasses(showMenu)}
                  aria-expanded={showMenu}
                  aria-controls="account-sheet"
                >
                  <IconWrap active={showMenu}>
                    <FaUserCircle className="text-xl" />
                  </IconWrap>
                  <span className="mt-1">Account</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Account bottom sheet (modal) */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* dimmed backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setShowMenu(false)}
          />
          {/* sheet */}
          <div
            id="account-sheet"
            ref={sheetRef}
            className="absolute inset-x-0 bottom-0 max-w-md mx-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="mx-3 rounded-t-2xl bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.22)] border border-t border-gray-100">
              {/* grabber */}
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-12 rounded-full bg-gray-300" />
              </div>

              {/* header */}
              {isLoggedIn ? (
                <div className="px-5 pt-4 pb-3 border-b">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              ) : (
                <div className="px-5 pt-5 pb-3 border-b">
                  <p className="text-sm font-semibold text-gray-900">
                    Welcome
                  </p>
                  <p className="text-xs text-gray-500">
                    Sign in to manage bookings faster
                  </p>
                </div>
              )}

              {/* actions */}
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

              <div className="h-3" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;
