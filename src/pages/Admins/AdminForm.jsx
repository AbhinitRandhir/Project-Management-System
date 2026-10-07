
import { useEffect, useMemo, useState } from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";

import api from "../../services/api";
import { useToast } from "../../components/Toast/Toast";

import "./AdminForm.css";

/* =========================================================
   COURSE AND DEPARTMENT OPTIONS
========================================================= */

const COURSE_DEPARTMENTS = {
  "B.Tech": ["CSE", "ECE", "ME", "IT", "CE"],
  "M.Tech": ["CSE", "ECE", "ME", "IT", "CE"],
};

/* =========================================================
   INITIAL FORM DATA
========================================================= */

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  course: "",
  department: "",
  role: "mentor",
  password: "",
  status: "active",
};

/* =========================================================
   ADMIN FORM
========================================================= */

function AdminForm({ selectedAdmin, onClose, onSuccess }) {
  const { error: showError, warning } = useToast();

  const isEditMode = Boolean(selectedAdmin?.id);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* =========================================================
     DEPARTMENT OPTIONS BASED ON COURSE
  ========================================================= */

  const availableDepartments = useMemo(() => {
    return COURSE_DEPARTMENTS[formData.course] || [];
  }, [formData.course]);

  /* =========================================================
     LOAD / RESET FORM
  ========================================================= */

  useEffect(() => {
    if (!selectedAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ ...INITIAL_FORM_DATA });
      setErrors({});
      setSubmitError("");
      setShowPassword(false);
      return;
    }

    const existingCourse = selectedAdmin.course || "";

    const existingDepartment = String(
      selectedAdmin.department || ""
    ).toUpperCase();

    setFormData({
      name: selectedAdmin.name || "",
      email: selectedAdmin.email || "",
      phone: selectedAdmin.phone || "",
      course: existingCourse,
      department: existingDepartment,
      role:
        String(selectedAdmin.role || "").toLowerCase() === "admin"
          ? "admin"
          : "mentor",
      password: "",
      status:
        String(selectedAdmin.status || "").toLowerCase() === "inactive"
          ? "inactive"
          : "active",
    });

    setErrors({});
    setSubmitError("");
    setShowPassword(false);
  }, [selectedAdmin]);

  /* =========================================================
     NAME VALIDATION
  ========================================================= */

  const validateName = (value = formData.name) => {
    const name = value.trim();

    if (!name) {
      return "Name is required.";
    }

    if (name.length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (name.length > 100) {
      return "Name cannot exceed 100 characters.";
    }

    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
      return "Name can contain only letters and single spaces.";
    }

    return "";
  };

  /* =========================================================
     EMAIL VALIDATION
  ========================================================= */

  const validateEmail = (value = formData.email) => {
    const email = value.trim().toLowerCase();

    if (!email) {
      return "Email address is required.";
    }

    if (email.length > 150) {
      return "Email address cannot exceed 150 characters.";
    }

    const emailPattern =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (
      email.includes("..") ||
      email.startsWith(".") ||
      email.includes("@.")
    ) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  /* =========================================================
     PHONE VALIDATION
  ========================================================= */

  const validatePhone = (value = formData.phone) => {
    const phone = value.trim();

    if (!phone) {
      return "Phone number is required.";
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return "Phone number must contain exactly 10 digits.";
    }

    if (!/^[6-9]/.test(phone)) {
      return "Phone number must start with 6, 7, 8 or 9.";
    }

    return "";
  };

  /* =========================================================
     COURSE VALIDATION
  ========================================================= */

  const validateCourse = (value = formData.course) => {
    if (!value) {
      return "Please select a course.";
    }

    if (!Object.prototype.hasOwnProperty.call(COURSE_DEPARTMENTS, value)) {
      return "Please select a valid course.";
    }

    return "";
  };

  /* =========================================================
     DEPARTMENT VALIDATION
  ========================================================= */

  const validateDepartment = (
    value = formData.department,
    course = formData.course
  ) => {
    if (!value) {
      return "Please select a department.";
    }

    const departments = COURSE_DEPARTMENTS[course] || [];

    if (!departments.includes(value.toUpperCase())) {
      return "Please select a department belonging to the selected course.";
    }

    return "";
  };

  /* =========================================================
     PASSWORD CHECKS
  ========================================================= */

  const passwordChecks = useMemo(() => {
    const password = formData.password;

    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9\s]/.test(password),
      noSpace: !/\s/.test(password),
    };
  }, [formData.password]);

  /* =========================================================
     PASSWORD VALIDATION
  ========================================================= */

  const validatePassword = (value = formData.password) => {
    const password = value;

    if (isEditMode && !password) {
      return "";
    }

    if (!password) {
      return "Password is required.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (/\s/.test(password)) {
      return "Password must not contain spaces.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
      return "Password must contain at least one special character.";
    }

    return "";
  };

  /* =========================================================
     VALIDATE FIELD
  ========================================================= */

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "name":
        return validateName(value);

      case "email":
        return validateEmail(value);

      case "phone":
        return validatePhone(value);

      case "course":
        return validateCourse(value);

      case "department":
        return validateDepartment(value);

      case "password":
        return validatePassword(value);

      default:
        return "";
    }
  };

  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    let updatedValue = value;

    if (name === "name") {
      updatedValue = value.replace(/[^A-Za-z ]/g, "");
    }

    if (name === "phone") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    /* -------------------------------------------------------
       COURSE CHANGE
       Reset department because it depends on course.
    ------------------------------------------------------- */

    if (name === "course") {
      setFormData((previousData) => ({
        ...previousData,
        course: updatedValue,
        department: "",
      }));

      setErrors((previousErrors) => ({
        ...previousErrors,
        course: "",
        department: "",
      }));

      setSubmitError("");
      return;
    }

    /* -------------------------------------------------------
       NORMAL FIELD UPDATE
    ------------------------------------------------------- */

    setFormData((previousData) => ({
      ...previousData,
      [name]: updatedValue,
    }));

    const fieldError = validateField(name, updatedValue);

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: fieldError,
    }));

    if (submitError) {
      setSubmitError("");
    }
  };

  /* =========================================================
     COMPLETE FORM VALIDATION
  ========================================================= */

  const validateForm = () => {
    const validationErrors = {};

    const nameError = validateName();
    const emailError = validateEmail();
    const phoneError = validatePhone();
    const courseError = validateCourse();
    const departmentError = validateDepartment();
    const passwordError = validatePassword();

    if (nameError) {
      validationErrors.name = nameError;
    }

    if (emailError) {
      validationErrors.email = emailError;
    }

    if (phoneError) {
      validationErrors.phone = phoneError;
    }

    if (courseError) {
      validationErrors.course = courseError;
    }

    if (departmentError) {
      validationErrors.department = departmentError;
    }

    if (passwordError) {
      validationErrors.password = passwordError;
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  /* =========================================================
     CHECK DUPLICATE EMAIL
  ========================================================= */

  const checkDuplicateEmail = async () => {
    const email = formData.email.trim().toLowerCase();

    const response = await api.get("/admins");

    const admins = Array.isArray(response.data)
      ? response.data
      : [];

    return admins.some(
      (admin) =>
        String(admin.email || "").trim().toLowerCase() === email &&
        String(admin.id) !== String(selectedAdmin?.id)
    );
  };

  /* =========================================================
     BUILD ADMIN DATA
  ========================================================= */

  const buildAdminData = () => {
    const adminData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      course: formData.course,
      department: formData.department.toUpperCase(),
      role: formData.role,
      status: formData.status,
    };

    if (formData.password) {
      adminData.password = formData.password;
    }

    return adminData;
  };

  /* =========================================================
     CREATE ADMIN
  ========================================================= */

  const createAdmin = async () => {
    const adminData = buildAdminData();

    adminData.createdAt = new Date().toISOString();

    await api.post("/admins", adminData);
  };

  /* =========================================================
     UPDATE ADMIN
  ========================================================= */

  const updateAdmin = async () => {
    const adminData = buildAdminData();

    await api.patch(`/admins/${selectedAdmin.id}`, adminData);
  };

  /* =========================================================
     HANDLE SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitError("");

    if (!validateForm()) {
      warning("Please correct the highlighted fields.");
      return;
    }

    try {
      setLoading(true);

      const emailExists = await checkDuplicateEmail();

      if (emailExists) {
        const message = "This email address is already registered.";

        setErrors((previousErrors) => ({
          ...previousErrors,
          email: message,
        }));

        showError(message);
        return;
      }

      if (isEditMode) {
        await updateAdmin();
        onSuccess("Administrator updated successfully.");
        return;
      }

      await createAdmin();
      onSuccess("Administrator created successfully.");
    } catch (error) {
      console.error("Admin form error:", error);

      const message =
        error?.response?.data?.message ||
        `Unable to ${
          isEditMode ? "update" : "create"
        } administrator. Please try again.`;

      setSubmitError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FIELD CLASS
  ========================================================= */

  const getFieldClass = (fieldName) => {
    return errors[fieldName]
      ? "admin-form-input-group admin-form-field-error"
      : "admin-form-input-group";
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <form
      className="admin-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* API / SUBMIT ERROR */}

      {submitError && (
        <div
          className="admin-form-submit-error"
          role="alert"
          aria-live="assertive"
        >
          <FiAlertCircle />
          <span>{submitError}</span>
        </div>
      )}

      {/* ACCOUNT INFORMATION */}

      <section className="admin-form-section">
        <div className="admin-form-section-header">
          <div className="admin-form-section-icon">
            <FiUser />
          </div>

          <div>
            <h3>Account Information</h3>
            <p>Enter the administrator's basic information.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* NAME */}

          <div className={getFieldClass("name")}>
            <label htmlFor="admin-name">
              Full Name <span>*</span>
            </label>

            <div className="admin-form-input-wrapper">
              <FiUser />

              <input
                id="admin-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                autoComplete="name"
                maxLength={100}
                disabled={loading}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "admin-name-error" : undefined
                }
              />
            </div>

            {errors.name && (
              <small id="admin-name-error">{errors.name}</small>
            )}
          </div>

          {/* EMAIL */}

          <div className={getFieldClass("email")}>
            <label htmlFor="admin-email">
              Email Address <span>*</span>
            </label>

            <div className="admin-form-input-wrapper">
              <FiMail />

              <input
                id="admin-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                autoComplete="email"
                maxLength={150}
                disabled={loading}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email ? "admin-email-error" : undefined
                }
              />
            </div>

            {errors.email && (
              <small id="admin-email-error">{errors.email}</small>
            )}
          </div>

          {/* PHONE */}

          <div className={getFieldClass("phone")}>
            <label htmlFor="admin-phone">
              Phone Number <span>*</span>
            </label>

            <div className="admin-form-input-wrapper">
              <FiPhone />

              <input
                id="admin-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone number"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                disabled={loading}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={
                  errors.phone ? "admin-phone-error" : undefined
                }
              />
            </div>

            {errors.phone && (
              <small id="admin-phone-error">{errors.phone}</small>
            )}
          </div>

          {/* COURSE */}

          <div className={getFieldClass("course")}>
            <label htmlFor="admin-course">
              Course <span>*</span>
            </label>

            <div className="admin-form-input-wrapper">
              <FiShield />

              <select
                id="admin-course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                disabled={loading}
                aria-invalid={Boolean(errors.course)}
                aria-describedby={
                  errors.course ? "admin-course-error" : undefined
                }
              >
                <option value="">Select course</option>

                {Object.keys(COURSE_DEPARTMENTS).map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {errors.course && (
              <small id="admin-course-error">{errors.course}</small>
            )}
          </div>

          {/* DEPARTMENT - COURSE DEPENDENT DROPDOWN */}

          <div className={getFieldClass("department")}>
            <label htmlFor="admin-department">
              Department <span>*</span>
            </label>

            <div className="admin-form-input-wrapper">
              <FiShield />

              <select
                id="admin-department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading || !formData.course}
                aria-invalid={Boolean(errors.department)}
                aria-describedby={
                  errors.department
                    ? "admin-department-error"
                    : undefined
                }
              >
                <option value="">
                  {!formData.course
                    ? "First select course"
                    : "Select department"}
                </option>

                {availableDepartments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            {errors.department && (
              <small id="admin-department-error">
                {errors.department}
              </small>
            )}
          </div>
        </div>
      </section>

      {/* ACCESS CONTROL */}

      <section className="admin-form-section">
        <div className="admin-form-section-header">
          <div className="admin-form-section-icon">
            <FiShield />
          </div>

          <div>
            <h3>Access Control</h3>
            <p>Configure role and account status.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* ROLE */}

          <div className="admin-form-input-group">
            <label htmlFor="admin-role">
              Administrator Role <span>*</span>
            </label>

            <div className="admin-form-input-wrapper">
              <FiShield />

              <select
                id="admin-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* STATUS */}

          <div className="admin-form-input-group">
            <label htmlFor="admin-status">
              Account Status <span>*</span>
            </label>

            <div className="admin-form-input-wrapper">
              <FiCheckCircle />

              <select
                id="admin-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}

      <section className="admin-form-section">
        <div className="admin-form-section-header">
          <div className="admin-form-section-icon">
            <FiLock />
          </div>

          <div>
            <h3>Security</h3>

            <p>
              {isEditMode
                ? "Leave password empty to keep the current password."
                : "Create a secure password for this administrator."}
            </p>
          </div>
        </div>

        <div className="admin-form-password-field">
          {/* PASSWORD INPUT */}

          <div className={getFieldClass("password")}>
            <label htmlFor="admin-password">
              Password {!isEditMode && <span>*</span>}
            </label>

            <div className="admin-form-input-wrapper">
              <FiLock />

              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  isEditMode
                    ? "Leave empty to keep current password"
                    : "Enter a strong password"
                }
                autoComplete="new-password"
                maxLength={128}
                disabled={loading}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password
                    ? "admin-password-error"
                    : undefined
                }
              />

              <button
                type="button"
                className="admin-form-password-toggle"
                onClick={() =>
                  setShowPassword((previousValue) => !previousValue)
                }
                disabled={loading}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                title={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {errors.password && (
              <small id="admin-password-error">
                {errors.password}
              </small>
            )}
          </div>

          {/* PASSWORD CHECKLIST */}

          <div className="admin-form-password-hint">
            <div className="admin-form-password-hint-title">
              <FiShield />
              <span>Password Requirements</span>
            </div>

            <div className="admin-form-password-checks">
              <PasswordCheck
                valid={passwordChecks.length}
                text="At least 8 characters"
              />

              <PasswordCheck
                valid={passwordChecks.uppercase}
                text="One uppercase letter"
              />

              <PasswordCheck
                valid={passwordChecks.lowercase}
                text="One lowercase letter"
              />

              <PasswordCheck
                valid={passwordChecks.number}
                text="One number"
              />

              <PasswordCheck
                valid={passwordChecks.special}
                text="One special character"
              />

              <PasswordCheck
                valid={passwordChecks.noSpace}
                text="No spaces"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FORM ACTIONS */}

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-form-cancel-btn"
          onClick={onClose}
          disabled={loading}
        >
          <FiX />
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          className="admin-form-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="admin-form-spinner"
                aria-hidden="true"
              />

              <span>
                {isEditMode ? "Updating..." : "Creating..."}
              </span>
            </>
          ) : (
            <>
              <FiCheckCircle />

              <span>
                {isEditMode ? "Update Admin" : "Create Admin"}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   PASSWORD CHECK COMPONENT
========================================================= */

function PasswordCheck({ valid, text }) {
  return (
    <div
      className={`admin-form-password-check ${
        valid
          ? "password-check-valid"
          : "password-check-invalid"
      }`}
    >
      <span className="password-check-icon" aria-hidden="true">
        {valid ? <FiCheckCircle /> : <FiAlertCircle />}
      </span>

      <span className="password-check-text">{text}</span>
    </div>
  );
}

export default AdminForm;