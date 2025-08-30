// Layout.jsx
import Navbar from "./Navbar";
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const Layout = ({ children }) => {
  const [showNavbar, setShowNavbar] = useState(true);
  const [isNavbarAnimating, setIsNavbarAnimating] = useState(false);
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);
  const [headerActualHeight, setHeaderActualHeight] = useState(0);

  const location = useLocation();
  const applyScrollHide = location.pathname.includes("/search");

  useEffect(() => {
    if (headerRef.current) {
      setHeaderActualHeight(headerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (!applyScrollHide) {
      setShowNavbar(true); // Ensure Navbar is always visible on other pages
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const hideThreshold = 250; // Increased threshold: Hide Navbar after scrolling down this far
      const showThreshold = 50; // Show Navbar when scrolling up to this point (closer to top)

      // Scrolling down
      if (
        currentScrollY > lastScrollY.current &&
        currentScrollY > hideThreshold
      ) {
        setShowNavbar(false);
      }
      // Scrolling up AND current scroll position is above the show threshold
      else if (
        currentScrollY < lastScrollY.current &&
        currentScrollY <= showThreshold
      ) {
        setShowNavbar(true);
      }
      // If at the very top of the page, ensure Navbar is visible
      else if (currentScrollY === 0) {
        setShowNavbar(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [applyScrollHide]);

  // Effect to track Navbar animation state (remains the same)
  useEffect(() => {
    let timeoutId;
    if (applyScrollHide) {
      setIsNavbarAnimating(true);
      timeoutId = setTimeout(() => {
        setIsNavbarAnimating(false);
      }, 300); // Match this with your CSS transition duration (0.3s)
    } else {
      setIsNavbarAnimating(false);
    }
    return () => clearTimeout(timeoutId);
  }, [showNavbar, applyScrollHide]);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type.name === "SearchResults") {
      return React.cloneElement(child, {
        showNavbar,
        headerHeight: headerActualHeight,
        isNavbarAnimating,
      });
    }
    return child;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <header
        ref={headerRef}
        className={`w-full z-50 transition-transform duration-300 ease-in-out`}
        style={{
          backgroundColor: "#FFFFFF",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          boxShadow: showNavbar ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
          transform: showNavbar ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <Navbar />
      </header>

      <main style={{ paddingTop: `${headerActualHeight}px` }}>
        {childrenWithProps}
      </main>
    </div>
  );
};

export default Layout;
