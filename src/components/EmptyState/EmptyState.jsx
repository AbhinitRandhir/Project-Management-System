import {
  FiInbox,
  FiPlus,
  FiSearch,
} from "react-icons/fi";

import "./EmptyState.css";

function EmptyState({
  title = "No data found",
  message = "There is no information available to display.",
  icon = "inbox",
  actionLabel = "",
  onAction,
  search = false,
}) {
  const icons = {
    inbox: <FiInbox />,
    search: <FiSearch />,
  };

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {search ? (
          <FiSearch />
        ) : (
          icons[icon] || <FiInbox />
        )}
      </div>

      <div className="empty-state-content">
        <h3 className="empty-state-title">
          {title}
        </h3>

        <p className="empty-state-message">
          {message}
        </p>

        {actionLabel && onAction && (
          <button
            type="button"
            className="empty-state-action"
            onClick={onAction}
          >
            <FiPlus />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;