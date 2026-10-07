import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

/* =====================================================
   DEFAULT ALLOWED ROLES
===================================================== */

const DEFAULT_ROLES = ["admin", "mentor"];

/* =====================================================
   PROTECTED ROUTE
===================================================== */

function ProtectedRoute({
  allowedRoles = DEFAULT_ROLES,
}) {
  const { currentUser, isAuthenticated } = useAuth();

  /* =====================================================
     AUTHENTICATION CHECK
  ===================================================== */

  if (!isAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* =====================================================
     ROLE AUTHORIZATION CHECK
  ===================================================== */

  const userRole = currentUser.role?.toLowerCase();

  if (!allowedRoles.includes(userRole)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  /* =====================================================
     ACCESS GRANTED
  ===================================================== */

  return <Outlet />;
}

export default ProtectedRoute;