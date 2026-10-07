import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext(null);


/* =========================================================
   INITIAL THEME
========================================================= */

function getInitialTheme() {
  const savedTheme =
    document.documentElement.getAttribute(
      "data-theme"
    );

  if (
    savedTheme === "dark" ||
    savedTheme === "light"
  ) {
    return savedTheme;
  }

  return "light";
}


/* =========================================================
   THEME PROVIDER
========================================================= */

export function ThemeProvider({ children }) {
  const [theme, setTheme] =
    useState(getInitialTheme);


  /* =======================================================
     APPLY THEME
  ======================================================= */

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute(
      "data-theme",
      theme
    );
  }, [theme]);


  /* =======================================================
     TOGGLE THEME
  ======================================================= */

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      return currentTheme === "light"
        ? "dark"
        : "light";
    });
  }, []);


  /* =======================================================
     SET THEME
  ======================================================= */

  const changeTheme = useCallback((newTheme) => {
    if (
      newTheme === "light" ||
      newTheme === "dark"
    ) {
      setTheme(newTheme);
    }
  }, []);


  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = {
    theme,
    setTheme: changeTheme,
    toggleTheme,
  };


  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}


/* =========================================================
   THEME HOOK
========================================================= */

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}


export default ThemeContext;