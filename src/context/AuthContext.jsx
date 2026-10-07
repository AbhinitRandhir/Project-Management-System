import {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext(null);

const AUTH_USER_KEY = "projecttrack_current_user";

/* =====================================================
   GET STORED USER
===================================================== */

function getStoredUser() {
  try {
    const storedUser = sessionStorage.getItem(
      AUTH_USER_KEY
    );

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Unable to restore logged-in user:",
      error
    );

    sessionStorage.removeItem(AUTH_USER_KEY);

    return null;
  }
}

/* =====================================================
   AUTH PROVIDER
===================================================== */

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] =
    useState(getStoredUser);

  /* =====================================================
     LOGIN
  ===================================================== */

  const login = (user) => {
    setCurrentUser(user);

    sessionStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify(user)
    );
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const logout = () => {
    setCurrentUser(null);

    sessionStorage.removeItem(AUTH_USER_KEY);
  };

  /* =====================================================
     UPDATE CURRENT USER
  ===================================================== */

  const updateCurrentUser = (updatedUser) => {
    setCurrentUser(updatedUser);

    sessionStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify(updatedUser)
    );
  };

  /* =====================================================
     AUTHENTICATION
  ===================================================== */

  const isAuthenticated = Boolean(currentUser);

  /* =====================================================
     ROLE CHECK
  ===================================================== */

  const isAdmin =
    currentUser?.role === "admin";

  const isMentor =
    currentUser?.role === "mentor";

  /* =====================================================
     USER SCOPE
  ===================================================== */

  const userCourse = currentUser?.course || null;

  const userDepartment =
    currentUser?.department || null;

  /* =====================================================
     COURSE ACCESS
  ===================================================== */

  const hasCourseAccess = (course) => {
    if (!currentUser || !course) {
      return false;
    }

    return (
      String(userCourse).toLowerCase() ===
      String(course).toLowerCase()
    );
  };

  /* =====================================================
     DEPARTMENT ACCESS
  ===================================================== */

  const hasDepartmentAccess = (
    course,
    department
  ) => {
    if (!currentUser || !course || !department) {
      return false;
    }

    return (
      hasCourseAccess(course) &&
      String(userDepartment).toLowerCase() ===
        String(department).toLowerCase()
    );
  };

  /* =====================================================
     ROLE-BASED DATA ACCESS
  ===================================================== */

  const canAccessData = (course, department) => {
    if (!currentUser || !course) {
      return false;
    }

    // Admin can access all departments
    // within their own course.
    if (isAdmin) {
      return hasCourseAccess(course);
    }

    // Mentor can access only their
    // own course and department.
    if (isMentor) {
      return hasDepartmentAccess(
        course,
        department
      );
    }

    return false;
  };

  /* =====================================================
     CONTEXT VALUE
  ===================================================== */

  const value = {
    currentUser,

    login,
    logout,
    updateCurrentUser,

    isAuthenticated,
    isAdmin,
    isMentor,

    userCourse,
    userDepartment,

    hasCourseAccess,
    hasDepartmentAccess,
    canAccessData,
  };

  /* =====================================================
     PROVIDER
  ===================================================== */

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =====================================================
   AUTH HOOK
===================================================== */

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;