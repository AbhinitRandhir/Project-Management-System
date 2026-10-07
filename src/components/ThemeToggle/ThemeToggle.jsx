import { FiMoon, FiSun } from "react-icons/fi";

import { useTheme } from "../../context/ThemeContext";

import "./ThemeToggle.css";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={
        theme === "light"
          ? "Switch to dark mode"
          : "Switch to light mode"
      }
    >
      {theme === "light" ? (
        <FiMoon />
      ) : (
        <FiSun />
      )}
    </button>
  );
}

export default ThemeToggle;