import { useState, useRef, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  FaHome,
  FaTicketAlt,
  FaQuestionCircle,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../AuthContext"; // Ensure this path is correct

const MobileBottomNav = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Close the account menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItemClasses = (isActive) =>
    `flex flex-col items-center justify-center pt-2 pb-1 w-full transition duration-300 ease-in-out ${
      isActive
        ? "text-[#d84e55] border-t-4 border-[#d84e55]"
        : "text-gray-500 border-t-4 border-transparent"
    }`;

  const iconSize = "text-2xl mb-1";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.1)] z-50 lg:hidden">
      <div className="max-w-md mx-auto">
        <ul className="flex justify-around items-start text-xs">
          {/* Home */}
          <li className="flex-1">
            <NavLink
              to="/"
              className={({ isActive }) => menuItemClasses(isActive)}
            >
              <FaHome className={iconSize} />
              <span>Home</span>
            </NavLink>
          </li>

          {/* Bookings */}
          <li className="flex-1">
            <NavLink
              to="/my-bookings"
              className={({ isActive }) => menuItemClasses(isActive)}
            >
              <FaTicketAlt className={iconSize} />
              <span>Bookings</span>
            </NavLink>
          </li>

          {/* Help */}
          <li className="flex-1">
            <NavLink
              to="/help"
              className={({ isActive }) => menuItemClasses(isActive)}
            >
              <FaQuestionCircle className={iconSize} />
              <span>Help</span>
            </NavLink>
          </li>

          {/* Account */}
          <li className="flex-1 relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className={menuItemClasses(showMenu)}
            >
              <FaUserCircle className={iconSize} />
              <span>Account</span>
            </button>

            {showMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-lg rounded-lg z-50 min-w-[180px] text-sm overflow-hidden">
                {isLoggedIn ? (
                  <>
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <p className="font-semibold text-gray-800">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      My Profile
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
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
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
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
                      className="block w-full text-left px-4 py-3 hover:bg-gray-100"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        navigate("/signup");
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-gray-100"
                    >
                      Signup
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
