
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiFilter,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/Toast";

import AdminForm from "./AdminForm";
import "./Admins.css";

const INITIAL_FILTERS = {
  search: "",
  role: "all",
  status: "all",
  course: "all",
  department: "all",
};

function Admins() {
  const navigate = useNavigate();

  const { currentUser, logout } = useAuth();
  const { success, error: showError } = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [modalType, setModalType] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* =========================================================
     FETCH ADMINS
  ========================================================= */

  const fetchAdmins = useCallback(async (showPageLoader = true) => {
    try {
      if (showPageLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get("/admins");

      const adminData = Array.isArray(response.data)
        ? response.data
        : [];

      setAdmins(adminData);
    } catch (err) {
      console.error("Fetch admins error:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to load administrators. Please try again.";

      setError(message);
    } finally {
      if (showPageLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  /* =========================================================
     INITIAL FETCH
  ========================================================= */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdmins();
  }, [fetchAdmins]);

  /* =========================================================
     MODAL BODY SCROLL LOCK
  ========================================================= */

  useEffect(() => {
    if (!modalType) {
      document.body.classList.remove("admin-modal-open");
      return undefined;
    }

    document.body.classList.add("admin-modal-open");

    return () => {
      document.body.classList.remove("admin-modal-open");
    };
  }, [modalType]);

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape" || !modalType || deleteLoading) {
        return;
      }

      setModalType(null);
      setSelectedAdmin(null);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalType, deleteLoading]);

  /* =========================================================
     COURSE OPTIONS
  ========================================================= */

  const availableCourses = useMemo(() => {
    return [
      ...new Set(
        admins
          .map((admin) => String(admin.course || "").trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [admins]);

  /* =========================================================
     DEPARTMENT OPTIONS
  ========================================================= */

  const availableDepartments = useMemo(() => {
    return [
      ...new Set(
        admins
          .filter(
            (admin) =>
              filters.course === "all" ||
              String(admin.course || "").toLowerCase() ===
                filters.course.toLowerCase()
          )
          .map((admin) => String(admin.department || "").trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [admins, filters.course]);

  /* =========================================================
     FILTERED ADMINS
  ========================================================= */

  const filteredAdmins = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return admins.filter((admin) => {
      const name = String(admin.name || "").toLowerCase();
      const email = String(admin.email || "").toLowerCase();
      const phone = String(admin.phone || "").toLowerCase();
      const course = String(admin.course || "").toLowerCase();
      const department = String(admin.department || "").toLowerCase();
      const role = String(admin.role || "").toLowerCase();
      const status = String(admin.status || "").toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        course.includes(search) ||
        department.includes(search);

      const matchesRole =
        filters.role === "all" ||
        role === filters.role.toLowerCase();

      const matchesStatus =
        filters.status === "all" ||
        status === filters.status.toLowerCase();

      const matchesCourse =
        filters.course === "all" ||
        course === filters.course.toLowerCase();

      const matchesDepartment =
        filters.department === "all" ||
        department === filters.department.toLowerCase();

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesCourse &&
        matchesDepartment
      );
    });
  }, [admins, filters]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const total = admins.length;

    const adminCount = admins.filter(
      (admin) =>
        String(admin.role || "").toLowerCase() === "admin"
    ).length;

    const mentorCount = admins.filter(
      (admin) =>
        String(admin.role || "").toLowerCase() === "mentor"
    ).length;

    const active = admins.filter(
      (admin) =>
        String(admin.status || "").toLowerCase() === "active"
    ).length;

    const inactive = admins.filter(
      (admin) =>
        String(admin.status || "").toLowerCase() === "inactive"
    ).length;

    return {
      total,
      admins: adminCount,
      mentors: mentorCount,
      normalAdmins: mentorCount,
      active,
      inactive,
    };
  }, [admins]);

  /* =========================================================
     FILTER HANDLERS
  ========================================================= */

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
      ...(name === "course" ? { department: "all" } : {}),
    }));
  };

  const handleSearchChange = (event) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      search: event.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    await fetchAdmins(false);
    success("Administrator list refreshed.");
  };

  /* =========================================================
     MODALS
  ========================================================= */

  const openAddModal = () => {
    setSelectedAdmin(null);
    setModalType("form");
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setModalType("form");
  };

  const openViewModal = (admin) => {
    setSelectedAdmin(admin);
    setModalType("view");
  };

  const openDeleteModal = (admin) => {
    setSelectedAdmin(admin);
    setModalType("delete");
  };

  const closeModal = () => {
    if (deleteLoading) {
      return;
    }

    setModalType(null);
    setSelectedAdmin(null);
  };

  /* =========================================================
     FORM SUCCESS
  ========================================================= */

  const handleFormSuccess = async (message) => {
    closeModal();

    await fetchAdmins(false);

    success(message || "Administrator saved successfully.");
  };

  /* =========================================================
     DELETE ADMIN
  ========================================================= */

  const handleDelete = async () => {
    if (!selectedAdmin?.id || deleteLoading) {
      return;
    }

    const selectedRole = String(
      selectedAdmin.role || ""
    ).toLowerCase();

    if (selectedRole === "admin") {
      const adminCount = admins.filter(
        (admin) =>
          String(admin.role || "").toLowerCase() === "admin"
      ).length;

      if (adminCount <= 1) {
        showError(
          "You cannot delete the last Admin. At least one Admin must remain."
        );
        return;
      }
    }

    try {
      setDeleteLoading(true);

      const deletingCurrentUser =
        String(selectedAdmin.id) === String(currentUser?.id);

      await api.delete(`/admins/${selectedAdmin.id}`);

      setAdmins((previousAdmins) =>
        previousAdmins.filter(
          (admin) =>
            String(admin.id) !== String(selectedAdmin.id)
        )
      );

      if (deletingCurrentUser) {
        success("Your administrator account has been deleted.");

        setModalType(null);
        setSelectedAdmin(null);

        logout();

        navigate("/login", { replace: true });
        return;
      }

      success("Administrator deleted successfully.");

      setModalType(null);
      setSelectedAdmin(null);
    } catch (err) {
      console.error("Delete admin error:", err);

      const message =
        err?.response?.data?.message ||
        "Unable to delete administrator. Please try again.";

      showError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (value) => {
    if (!value) {
      return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCreatedDate = (admin) => {
    return (
      admin?.createdAt ||
      admin?.createdDate ||
      admin?.created_at ||
      admin?.date ||
      null
    );
  };

  /* =========================================================
     ROLE
  ========================================================= */

  const getRoleLabel = (role) => {
    return String(role || "").toLowerCase() === "admin"
      ? "Admin"
      : "Mentor";
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusLabel = (status) => {
    return String(status || "").toLowerCase() === "inactive"
      ? "Inactive"
      : "Active";
  };

  /* =========================================================
     INITIALS
  ========================================================= */

  const getInitials = (name) => {
    if (!name) {
      return "A";
    }

    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="admins-page">
        <div className="admins-page-header">
          <div className="admins-page-header-content">
            <div className="admins-page-title">
              <div className="admins-page-title-icon">
                <FiShield />
              </div>

              <div>
                <h1>Administrator Management</h1>
                <p>
                  Manage administrator accounts, roles and access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="admins-loading-state">
          <div className="admins-loading-spinner" />
          <h3>Loading administrators</h3>
          <p>
            Please wait while administrator data is being loaded.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error && admins.length === 0) {
    return (
      <div className="admins-page">
        <div className="admins-page-header">
          <div className="admins-page-header-content">
            <div className="admins-page-title">
              <div className="admins-page-title-icon">
                <FiShield />
              </div>

              <div>
                <h1>Administrator Management</h1>
                <p>
                  Manage administrator accounts, roles and access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="admins-error-state">
          <div className="admins-state-icon">
            <FiAlertCircle />
          </div>

          <h3>Unable to load administrators</h3>
          <p>{error}</p>

          <button
            type="button"
            className="admins-retry-btn"
            onClick={() => fetchAdmins()}
          >
            <FiRefreshCw />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="admins-page">
      {/* PAGE HEADER */}

      <div className="admins-page-header">
        <div className="admins-page-header-content">
          <div className="admins-page-title">
            <div className="admins-page-title-icon">
              <FiShield />
            </div>

            <div>
              <h1>Administrator Management</h1>
              <p>
                Manage administrator accounts, roles and access.
              </p>
            </div>
          </div>

          <div className="admins-page-header-actions">
            <button
              type="button"
              className="admins-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh administrators"
            >
              <FiRefreshCw
                className={
                  refreshing ? "admins-refresh-spinning" : ""
                }
              />

              <span>
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            <button
              type="button"
              className="admins-add-btn"
              onClick={openAddModal}
            >
              <FiPlus />
              <span>Add Administrator</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="admins-summary">
        <div className="admins-summary-card">
          <div className="admins-summary-icon">
            <FiUsers />
          </div>

          <div className="admins-summary-content">
            <span className="admins-summary-label">
              Total Administrators
            </span>
            <strong>{summary.total}</strong>
          </div>
        </div>

        <div className="admins-summary-card">
          <div className="admins-summary-icon admins-summary-admin">
            <FiShield />
          </div>

          <div className="admins-summary-content">
            <span className="admins-summary-label">Admins</span>
            <strong>{summary.admins}</strong>
          </div>
        </div>

        <div className="admins-summary-card">
          <div className="admins-summary-icon admins-summary-admin">
            <FiUser />
          </div>

          <div className="admins-summary-content">
            <span className="admins-summary-label">Mentors</span>
            <strong>{summary.mentors}</strong>
          </div>
        </div>

        <div className="admins-summary-card">
          <div className="admins-summary-icon admins-summary-active">
            <FiCheckCircle />
          </div>

          <div className="admins-summary-content">
            <span className="admins-summary-label">
              Active Accounts
            </span>
            <strong>{summary.active}</strong>
          </div>
        </div>

        <div className="admins-summary-card">
          <div className="admins-summary-icon admins-summary-inactive">
            <FiAlertCircle />
          </div>

          <div className="admins-summary-content">
            <span className="admins-summary-label">
              Inactive Accounts
            </span>
            <strong>{summary.inactive}</strong>
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}

      <div className="admins-toolbar">
        <div className="admins-search-box">
          <FiSearch />

          <input
            type="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, phone or department..."
            aria-label="Search administrators"
          />

          {filters.search && (
            <button
              type="button"
              className="admins-search-clear"
              onClick={() =>
                setFilters((previousFilters) => ({
                  ...previousFilters,
                  search: "",
                }))
              }
              aria-label="Clear search"
              title="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="admins-filter-group">
          <div className="admins-filter-item">
            <FiShield />

            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="admins-filter-item">
            <FiShield />

            <select
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
              aria-label="Filter by course"
            >
              <option value="all">All Courses</option>

              {availableCourses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="admins-filter-item">
            <FiShield />

            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>

              {availableDepartments.map((department) => (
                <option key={department} value={department}>
                  {department.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="admins-filter-item">
            <FiCheckCircle />

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {(filters.search ||
            filters.role !== "all" ||
            filters.status !== "all" ||
            filters.course !== "all" ||
            filters.department !== "all") && (
            <button
              type="button"
              className="admins-clear-filter-btn"
              onClick={clearFilters}
            >
              <FiFilter />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* RESULT INFO */}

      <div className="admins-result-info">
        <div>
          Showing <strong>{filteredAdmins.length}</strong> of{" "}
          <strong>{admins.length}</strong> administrators
        </div>

        {(filters.search ||
          filters.role !== "all" ||
          filters.status !== "all" ||
          filters.course !== "all" ||
          filters.department !== "all") && (
          <span>Filtered results</span>
        )}
      </div>

      {/* EMPTY STATE OR ADMIN GRID */}

      {filteredAdmins.length === 0 ? (
        <div className="admins-empty-state">
          <div className="admins-state-icon">
            {admins.length === 0 ? <FiUsers /> : <FiSearch />}
          </div>

          <h3>
            {admins.length === 0
              ? "No administrators found"
              : "No matching administrators"}
          </h3>

          <p>
            {admins.length === 0
              ? "There are currently no administrator accounts."
              : "Try changing your search or filter criteria."}
          </p>

          {admins.length === 0 ? (
            <button
              type="button"
              className="admins-empty-add-btn"
              onClick={openAddModal}
            >
              <FiPlus />
              <span>Add Administrator</span>
            </button>
          ) : (
            <button
              type="button"
              className="admins-empty-add-btn"
              onClick={clearFilters}
            >
              <FiFilter />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="admins-grid">
          {filteredAdmins.map((admin) => {
            const isCurrentUser =
              String(admin.id) === String(currentUser?.id);

            const isActive =
              String(admin.status || "").toLowerCase() === "active";

            const createdDate = getCreatedDate(admin);

            const roleClass =
              String(admin.role || "").toLowerCase() === "admin"
                ? "admin-role-admin"
                : "admin-role-mentor";

            return (
              <article className="admin-card" key={admin.id}>
                {/* CARD HEADER */}

                <div className="admin-card-header">
                  <div className="admin-card-profile">
                    <div className="admin-card-avatar">
                      {admin.image ? (
                        <img
                          src={admin.image}
                          alt={admin.name || "Administrator"}
                        />
                      ) : (
                        <span>{getInitials(admin.name)}</span>
                      )}
                    </div>

                    <div className="admin-card-name-area">
                      <h3>
                        {admin.name || "Unnamed Administrator"}
                      </h3>

                      {isCurrentUser && (
                        <span className="admin-current-user">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`admin-status-badge ${
                      isActive
                        ? "admin-status-active"
                        : "admin-status-inactive"
                    }`}
                  >
                    <span className="admin-status-dot" />
                    {getStatusLabel(admin.status)}
                  </span>
                </div>

                {/* ROLE */}

                <div className="admin-card-role">
                  <span className={`admin-role-badge ${roleClass}`}>
                    <FiShield />
                    {getRoleLabel(admin.role)}
                  </span>
                </div>

                {/* INFORMATION */}

                <div className="admin-card-info">
                  <div className="admin-card-info-item">
                    <div className="admin-card-info-icon">
                      <FiMail />
                    </div>

                    <div>
                      <span>Email</span>
                      <strong title={admin.email || "Not available"}>
                        {admin.email || "Not available"}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-card-info-item">
                    <div className="admin-card-info-icon">
                      <FiPhone />
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>
                        {admin.phone || "Not available"}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-card-info-item">
                    <div className="admin-card-info-icon">
                      <FiShield />
                    </div>

                    <div>
                      <span>Course - Department</span>
                      <strong>
                        {admin.course || "Not available"} -{" "}
                        {admin.department || "Not available"}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-card-info-item">
                    <div className="admin-card-info-icon">
                      <FiCalendar />
                    </div>

                    <div>
                      <span>Created</span>
                      <strong>{formatDate(createdDate)}</strong>
                    </div>
                  </div>
                </div>

                {/* ADMIN ID */}

                <div className="admin-card-id">
                  <span>Admin ID</span>
                  <code>{admin.id || "N/A"}</code>
                </div>

                {/* ACTIONS */}

                <div className="admin-card-actions">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-view"
                    onClick={() => openViewModal(admin)}
                    title="View administrator"
                  >
                    <FiEye />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    className="admin-action-btn admin-action-edit"
                    onClick={() => openEditModal(admin)}
                    title="Edit administrator"
                  >
                    <FiEdit2 />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    className="admin-action-btn admin-action-delete"
                    onClick={() => openDeleteModal(admin)}
                    title={
                      isCurrentUser
                        ? "Delete your account"
                        : "Delete administrator"
                    }
                  >
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}

      {modalType === "form" && (
        <div
          className="admin-form-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-form-modal-title"
          >
            <div className="admin-form-modal-header">
              <div className="admin-form-modal-title">
                <div className="admin-form-modal-icon">
                  {selectedAdmin ? <FiEdit2 /> : <FiPlus />}
                </div>

                <div>
                  <h2 id="admin-form-modal-title">
                    {selectedAdmin
                      ? "Edit Administrator"
                      : "Add Administrator"}
                  </h2>

                  <p>
                    {selectedAdmin
                      ? "Update administrator account details and access."
                      : "Create a new administrator account."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="admin-form-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="admin-form-modal-body">
              <AdminForm
                selectedAdmin={selectedAdmin}
                onClose={closeModal}
                onSuccess={handleFormSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}

      {modalType === "view" && selectedAdmin && (
        <div
          className="admin-details-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-details-title"
          >
            <div className="admin-details-header">
              <div>
                <h2 id="admin-details-title">
                  Administrator Details
                </h2>
                <p>
                  Complete administrator account information.
                </p>
              </div>

              <button
                type="button"
                className="admin-details-close"
                onClick={closeModal}
                aria-label="Close details"
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <div className="admin-details-profile">
              <div className="admin-details-avatar">
                {selectedAdmin.image ? (
                  <img
                    src={selectedAdmin.image}
                    alt={selectedAdmin.name || "Administrator"}
                  />
                ) : (
                  <span>{getInitials(selectedAdmin.name)}</span>
                )}
              </div>

              <div className="admin-details-profile-info">
                <h3>
                  {selectedAdmin.name || "Unnamed Administrator"}
                </h3>

                <p>
                  {selectedAdmin.email || "No email available"}
                </p>

                <div className="admin-details-profile-badges">
                  <span
                    className={`admin-role-badge ${
                      String(selectedAdmin.role || "").toLowerCase() ===
                      "admin"
                        ? "admin-role-admin"
                        : "admin-role-mentor"
                    }`}
                  >
                    <FiShield />
                    {getRoleLabel(selectedAdmin.role)}
                  </span>

                  <span
                    className={`admin-status-badge ${
                      String(
                        selectedAdmin.status || ""
                      ).toLowerCase() === "active"
                        ? "admin-status-active"
                        : "admin-status-inactive"
                    }`}
                  >
                    <span className="admin-status-dot" />
                    {getStatusLabel(selectedAdmin.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-details-grid">
              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiUser />
                </div>
                <div>
                  <span>Full Name</span>
                  <strong>
                    {selectedAdmin.name || "Not available"}
                  </strong>
                </div>
              </div>

              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiMail />
                </div>
                <div>
                  <span>Email Address</span>
                  <strong>
                    {selectedAdmin.email || "Not available"}
                  </strong>
                </div>
              </div>

              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiPhone />
                </div>
                <div>
                  <span>Phone Number</span>
                  <strong>
                    {selectedAdmin.phone || "Not available"}
                  </strong>
                </div>
              </div>

              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiShield />
                </div>
                <div>
                  <span>Course - Department</span>
                  <strong>
                    {selectedAdmin.course || "Not available"} -{" "}
                    {selectedAdmin.department || "Not available"}
                  </strong>
                </div>
              </div>

              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiShield />
                </div>
                <div>
                  <span>Administrator Role</span>
                  <strong>
                    {getRoleLabel(selectedAdmin.role)}
                  </strong>
                </div>
              </div>

              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiCheckCircle />
                </div>
                <div>
                  <span>Account Status</span>
                  <strong>
                    {getStatusLabel(selectedAdmin.status)}
                  </strong>
                </div>
              </div>

              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiCalendar />
                </div>
                <div>
                  <span>Created Date</span>
                  <strong>
                    {formatDate(getCreatedDate(selectedAdmin))}
                  </strong>
                </div>
              </div>

              <div className="admin-details-item">
                <div className="admin-details-item-icon">
                  <FiShield />
                </div>
                <div>
                  <span>Administrator ID</span>
                  <strong className="admin-details-id">
                    {selectedAdmin.id || "Not available"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="admin-details-footer">
              <button
                type="button"
                className="admin-details-edit"
                onClick={() => openEditModal(selectedAdmin)}
              >
                <FiEdit2 />
                <span>Edit Administrator</span>
              </button>

              <button
                type="button"
                className="admin-details-close-btn"
                onClick={closeModal}
              >
                <FiX />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {modalType === "delete" && selectedAdmin && (
        <div
          className="admin-delete-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleteLoading
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
          >
            <div className="admin-delete-icon">
              <FiTrash2 />
            </div>

            <div className="admin-delete-content">
              <h2 id="admin-delete-title">
                Delete Administrator?
              </h2>

              <p>
                You are about to permanently delete
                <strong>
                  {" "}
                  {selectedAdmin.name || "this administrator"}
                </strong>
                .
              </p>

              {String(selectedAdmin.id) ===
                String(currentUser?.id) && (
                <div className="admin-delete-self-warning">
                  <FiAlertCircle />
                  <span>
                    This is your own administrator account. You
                    will be logged out after deletion.
                  </span>
                </div>
              )}

              <p className="admin-delete-description">
                This action cannot be undone. All account
                information associated with this administrator
                will be removed.
              </p>
            </div>

            <div className="admin-delete-actions">
              <button
                type="button"
                className="admin-delete-cancel"
                onClick={closeModal}
                disabled={deleteLoading}
              >
                <FiX />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                className="admin-delete-confirm"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className="admin-delete-loader" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    <span>Delete Administrator</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admins;