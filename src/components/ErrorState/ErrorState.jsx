import {
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import "./ErrorState.css";

function ErrorState({
  title = "Something went wrong",
  message = "We could not load the requested information. Please try again.",
  actionLabel = "Try Again",
  onRetry,
}) {
  return (
    <div
      className="error-state"
      role="alert"
      aria-live="assertive"
    >
      <div className="error-state-icon">
        <FiAlertCircle />
      </div>

      <div className="error-state-content">
        <h3 className="error-state-title">
          {title}
        </h3>

        <p className="error-state-message">
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            className="error-state-action"
            onClick={onRetry}
          >
            <FiRefreshCw />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;