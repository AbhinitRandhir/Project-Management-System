
import { useNavigate, useLocation } from "react-router-dom";

import {
  FiMenu,
  FiX,
  FiLogOut,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

import ThemeToggle from "../ThemeToggle/ThemeToggle";

import { useToast } from "../Toast/Toast";

import "./Navbar.css";

/* =========================================
   PAGE TITLES & SUBTITLES
========================================= */

const pageInfo = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Welcome to ProjectTrack",
  },

  "/students": {
    title: "Student Management",
    subtitle: "Manage student records",
  },

  "/teams": {
    title: "Team Management",
    subtitle: "Manage teams and members",
  },

  "/projects": {
    title: "Project Management",
    subtitle: "Track and manage projects",
  },

  "/reviews": {
    title: "Review Management",
    subtitle: "Monitor project reviews",
  },

  "/results": {
    title: "Result Management",
    subtitle: "View student and team results",
  },

  "/profile": {
    title: "My Profile",
    subtitle: "Manage your account",
  },
};

function Navbar({ toggleSidebar, isSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentUser,
    logout,
  } = useAuth();

  const { success } = useToast();

  /* =========================================
     DYNAMIC PAGE INFORMATION
  ========================================= */

  const currentPath =
    location.pathname.replace(/\/+$/, "") || "/";

  const currentPage = pageInfo[currentPath] || {
    title: "ProjectTrack",
    subtitle: "Team-Based Project Management System",
  };

  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = () => {
    logout();

    success("Logged out successfully.");

    navigate("/login", {
      replace: true,
    });
  };

  /* =========================================
     PROFILE
  ========================================= */

  const goToProfile = () => {
    navigate("/profile");
  };

  /* =========================================
     USER DETAILS
  ========================================= */

  const userName =
    currentUser?.name || "User";

  const roleLabels = {
    admin: "Admin",
    mentor: "Mentor",
  };

  const userRole =
    roleLabels[currentUser?.role] || "User";

  const avatarLetter =
    userName.charAt(0).toUpperCase();

  /* =========================================
     RENDER
  ========================================= */

  return (
    <header className="navbar">

      {/* =====================================
          LEFT SECTION
      ===================================== */}

      <div className="navbar-left">

        {/* Mobile Menu Toggle */}

        <button
          type="button"
          className={`navbar-menu-btn ${
            isSidebarOpen ? "navbar-menu-btn-open" : ""
          }`}
          onClick={toggleSidebar}
          aria-label={
            isSidebarOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          title={
            isSidebarOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
        >
          {isSidebarOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Dynamic Page Identity */}

        <div className="navbar-title">

          <span className="navbar-title-main">
            {currentPage.title}
          </span>

          <span className="navbar-title-sub">
            {currentPage.subtitle}
          </span>

        </div>

      </div>

      {/* =====================================
          RIGHT SECTION
      ===================================== */}

      <div className="navbar-right">

        {/* Theme Toggle */}

        <div className="navbar-theme-wrapper">
          <ThemeToggle />
        </div>

        {/* Profile */}

        <button
          type="button"
          className="navbar-profile"
          onClick={goToProfile}
          aria-label="Open profile"
          title="Profile"
        >

          <div className="navbar-avatar">
            {avatarLetter}
          </div>

          <div className="navbar-user-info">

            <strong>
              {userName}
            </strong>

            <span>
              {userRole}
            </span>

          </div>

        </button>

        {/* Logout */}

        <button
          type="button"
          className="
            navbar-icon-btn
            navbar-logout-btn
          "
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <FiLogOut />
        </button>

      </div>

    </header>
  );
}

export default Navbar;