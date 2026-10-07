import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "../components/Layout/Layout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/Login/Login";

import Dashboard from "../pages/Dashboard/Dashboard";
import Admins from "../pages/Admins/Admins";
import Students from "../pages/Students/Students";
import Teams from "../pages/Teams/Teams";
import Projects from "../pages/Projects/Projects";
import ProjectDetails from "../pages/Projects/ProjectDetails";
import Reviews from "../pages/Reviews/Reviews";
import Profile from "../pages/Profile/Profile";

function AppRoutes() {
  return (
    <Routes>
      {/* DEFAULT ROUTE */}
      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* PUBLIC ROUTE */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* PROTECTED ROUTES: ADMIN + MENTOR */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["admin", "mentor"]}
          />
        }
      >
        <Route element={<Layout />}>
          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* STUDENT RECORDS */}
          <Route
            path="/students"
            element={<Students />}
          />

          {/* TEAM MANAGEMENT */}
          <Route
            path="/teams"
            element={<Teams />}
          />

          {/* PROJECT MANAGEMENT */}
          <Route
            path="/projects"
            element={<Projects />}
          />

          <Route
            path="/projects/:id"
            element={<ProjectDetails />}
          />

          {/* REVIEWS */}
          <Route
            path="/reviews"
            element={<Reviews />}
          />

          {/* PROFILE */}
          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* ADMIN MANAGEMENT: ADMIN ONLY */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
              />
            }
          >
            <Route
              path="/admins"
              element={<Admins />}
            />
          </Route>
        </Route>
      </Route>

      {/* UNKNOWN ROUTES */}
      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}

export default AppRoutes;