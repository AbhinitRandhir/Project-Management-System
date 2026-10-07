import { FiLoader } from "react-icons/fi";

import "./Loader.css";

function Loader({
  text = "Loading...",
  fullPage = false,
  size = "medium",
}) {
  return (
    <div
      className={`project-loader ${
        fullPage
          ? "project-loader-full-page"
          : "project-loader-inline"
      } project-loader-${size}`}
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >
      <div className="project-loader-content">
        <div className="project-loader-icon">
          <FiLoader aria-hidden="true" />
        </div>

        {text && (
          <p className="project-loader-text">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

export default Loader;