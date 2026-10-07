import { createContext, useCallback, useContext, useState } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";

import "./Toast.css";

const ToastContext = createContext(null);

const TOAST_DURATION = 3500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    ({
      message,
      type = "success",
      duration = TOAST_DURATION,
    }) => {
      const id = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          message,
          type,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message) => {
      return showToast({
        message,
        type: "success",
      });
    },
    [showToast]
  );

  const error = useCallback(
    (message) => {
      return showToast({
        message,
        type: "error",
      });
    },
    [showToast]
  );

  const warning = useCallback(
    (message) => {
      return showToast({
        message,
        type: "warning",
      });
    },
    [showToast]
  );

  const info = useCallback(
    (message) => {
      return showToast({
        message,
        type: "info",
      });
    },
    [showToast]
  );

  const value = {
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const toastConfig = {
    success: {
      icon: <FiCheckCircle />,
      title: "Success",
    },

    error: {
      icon: <FiAlertCircle />,
      title: "Error",
    },

    warning: {
      icon: <FiAlertTriangle />,
      title: "Warning",
    },

    info: {
      icon: <FiInfo />,
      title: "Information",
    },
  };

  const config = toastConfig[toast.type] || toastConfig.info;

  return (
    <div
      className={`toast-item toast-${toast.type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">
        {config.icon}
      </div>

      <div className="toast-content">
        <span className="toast-title">
          {config.title}
        </span>

        <p className="toast-message">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={() => onClose(toast.id)}
        aria-label="Close notification"
      >
        <FiX />
      </button>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider"
    );
  }

  return context;
}

export default ToastContext;