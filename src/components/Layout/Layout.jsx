
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

import "./Layout.css";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();

  /* =====================================================
     TOGGLE SIDEBAR
  ===================================================== */

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((currentState) => !currentState);
  }, []);

  /* =====================================================
     CLOSE SIDEBAR
  ===================================================== */

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  /* =====================================================
     CLOSE SIDEBAR ON ESCAPE
  ===================================================== */

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [sidebarOpen, closeSidebar]);

  /* =====================================================
     CLOSE SIDEBAR AFTER ROUTE CHANGE
  ===================================================== */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
  }, [location.pathname]);

  /* =====================================================
     BODY SCROLL LOCK
  ===================================================== */

  useEffect(() => {
    const mobileQuery = window.matchMedia(
      "(max-width: 780px)"
    );

    const updateBodyScroll = () => {
      const shouldLock =
        sidebarOpen && mobileQuery.matches;

      document.body.classList.toggle(
        "sidebar-is-open",
        shouldLock
      );
    };

    updateBodyScroll();

    mobileQuery.addEventListener(
      "change",
      updateBodyScroll
    );

    return () => {
      mobileQuery.removeEventListener(
        "change",
        updateBodyScroll
      );

      document.body.classList.remove(
        "sidebar-is-open"
      );
    };
  }, [sidebarOpen]);

  /* =====================================================
     CLOSE SIDEBAR WHEN SWITCHING TO DESKTOP
  ===================================================== */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 780) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="app-layout">

      {/* SIDEBAR */}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}

      {/* MAIN APPLICATION AREA */}

      <div className="app-main-area">

        {/* NAVBAR */}

        <Navbar
          toggleSidebar={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />

        {/* PAGE CONTENT */}

        <main className="app-main">
          <Outlet />
        </main>

        {/* FOOTER */}

        <Footer />

      </div>

    </div>
  );
}

export default Layout;