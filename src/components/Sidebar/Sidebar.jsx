
import { useNavigate, NavLink } from "react-router-dom";

import {
  FiGrid,
  FiUsers,
  FiUserPlus,
  FiFolder,
  FiLayers,
  FiShield,
  FiUser,
  FiLogOut,
  FiX,
  FiChevronRight,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

import "./Sidebar.css";

/* =========================================
   REUSABLE SIDEBAR SECTION
========================================= */

function SidebarSection({ title, items, onNavigate }) {
  return (
    <section className="sidebar-section">

      <h3 className="sidebar-menu-title">
        {title}
      </h3>

      <nav className="sidebar-nav" aria-label={title}>

        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "sidebar-link-active" : ""
              }`
            }
          >

            <span className="sidebar-link-icon">
              {item.icon}
            </span>

            <span className="sidebar-link-label">
              {item.label}
            </span>

            <span className="sidebar-link-arrow">
              <FiChevronRight />
            </span>

          </NavLink>
        ))}

      </nav>

    </section>
  );
}

/* =========================================
   SIDEBAR COMPONENT
========================================= */

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const { logout, isAdmin } = useAuth();

  /* =========================================
     NAVIGATION DATA
  ========================================= */

  const mainMenu = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <FiGrid />,
      end: true,
    },
    {
      label: "Students",
      path: "/students",
      icon: <FiUsers />,
    },
    {
      label: "Teams",
      path: "/teams",
      icon: <FiUserPlus />,
    },
    {
      label: "Projects",
      path: "/projects",
      icon: <FiFolder />,
    },
    {
      label: "Reviews",
      path: "/reviews",
      icon: <FiLayers />,
    },
  ];

  const adminMenu = [
    {
      label: "Manage Admins",
      path: "/admins",
      icon: <FiShield />,
    },
  ];

  const accountMenu = [
    {
      label: "My Profile",
      path: "/profile",
      icon: <FiUser />,
    },
  ];

  /* =========================================
     CLOSE SIDEBAR
  ========================================= */

  const handleNavigation = () => {
    onClose?.();
  };

  /* =========================================
     BRAND NAVIGATION
  ========================================= */

  const handleBrandClick = () => {
    navigate("/dashboard");
    handleNavigation();
  };

  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = () => {
    onClose?.();

    logout();

    navigate("/login", {
      replace: true,
    });
  };

  /* =========================================
     RENDER
  ========================================= */

  return (
    <aside
      id="app-sidebar"
      className={`sidebar ${
        isOpen ? "sidebar-open" : ""
      }`}
      aria-label="Main navigation"
      aria-hidden={!isOpen && window.innerWidth <= 780}
    >

      {/* =====================================
          SIDEBAR HEADER
      ===================================== */}

      <div className="sidebar-header">

        {/* Brand */}

        <button
          type="button"
          className="sidebar-brand"
          onClick={handleBrandClick}
          aria-label="Go to dashboard"
        >

          <span className="sidebar-brand-icon">
            <FiLayers />
          </span>

          <span className="sidebar-brand-content">

            <strong>
              ProjectTrack
            </strong>

            <small>
              Management System
            </small>

          </span>

        </button>

        {/* Mobile Close Button */}

        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <FiX />
        </button>

      </div>

      {/* =====================================
          SIDEBAR CONTENT
      ===================================== */}

      <div className="sidebar-content">

        {/* Main Menu */}

        <SidebarSection
          title="Main Menu"
          items={mainMenu}
          onNavigate={handleNavigation}
        />

        {/* Administration - Admin Only */}

        {isAdmin && (
          <SidebarSection
            title="Administration"
            items={adminMenu}
            onNavigate={handleNavigation}
          />
        )}

        {/* Account */}

        <SidebarSection
          title="Account"
          items={accountMenu}
          onNavigate={handleNavigation}
        />

      </div>

      {/* =====================================
          SIDEBAR FOOTER
      ===================================== */}

      <div className="sidebar-footer">

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
        >

          <span className="sidebar-logout-icon">
            <FiLogOut />
          </span>

          <span>
            Logout
          </span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;