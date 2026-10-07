
import { useEffect, useState } from "react";

import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";

import api from "../../services/api";
import "./StudentForm.css";

/* =====================================================
   COURSE, DEPARTMENT AND SEMESTER OPTIONS
===================================================== */

const COURSE_DEPARTMENTS = {
  "B.Tech": ["CSE", "ECE", "ME", "IT", "CE"],
  "M.Tech": ["CSE", "ECE", "ME", "IT", "CE"],
};

const COURSE_SEMESTERS = {
  "B.Tech": [1, 2, 3, 4, 5, 6, 7, 8],
  "M.Tech": [1, 2, 3, 4],
};

/* =====================================================
   INITIAL FORM DATA
===================================================== */

const initialFormData = {
  studentId: "",
  name: "",
  email: "",
  phone: "",
  course: "",
  department: "",
  semester: "",
  college: "ACET",
  address: "Kakinada, AP",
  enrollmentDate: "",
  status: "Active",
};

const FORM_FIELDS = [
  "studentId",
  "name",
  "email",
  "phone",
  "course",
  "department",
  "semester",
  "college",
  "address",
  "enrollmentDate",
];

/* =====================================================
   DATE HELPERS
===================================================== */

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMinimumEnrollmentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
};

/* =====================================================
   STUDENT FORM
===================================================== */

function StudentForm({
  student,
  onClose,
  onStudentAdded,
  onStudentUpdated,
}) {
  const isEditMode = Boolean(student?.id);

  const [formData, setFormData] = useState({
    ...initialFormData,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  /* =====================================================
     DYNAMIC OPTIONS
  ===================================================== */

  const availableDepartments =
    COURSE_DEPARTMENTS[formData.course] || [];

  const availableSemesters =
    COURSE_SEMESTERS[formData.course] || [];

  /* =====================================================
     LOAD EDIT DATA
  ===================================================== */

  useEffect(() => {
    if (!student) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ ...initialFormData });
      setErrors({});
      setTouched({});
      setFormError("");
      return;
    }

    let enrollmentDate = "";

    if (student.enrollmentDate) {
      enrollmentDate = String(
        student.enrollmentDate
      ).slice(0, 10);
    } else if (student.createdAt) {
      enrollmentDate = String(
        student.createdAt
      ).slice(0, 10);
    }

    const course = student.course || "";

    const savedDepartment = String(
      student.department || ""
    ).toUpperCase();

    const validDepartments =
      COURSE_DEPARTMENTS[course] || [];

    const validSemesters =
      COURSE_SEMESTERS[course] || [];

    const savedSemester = String(
      student.semester ?? ""
    );

    setFormData({
      studentId:
        student.studentId ||
        student.rollNumber ||
        "",

      name:
        student.name ||
        student.fullName ||
        "",

      email: student.email || "",
      phone: student.phone || "",
      course,

      department: validDepartments.includes(
        savedDepartment
      )
        ? savedDepartment
        : "",

      semester: validSemesters.includes(
        Number(savedSemester)
      )
        ? savedSemester
        : "",

      college: student.college || "",
      address: student.address || "",
      enrollmentDate,
      status: student.status || "Active",
    });

    setErrors({});
    setTouched({});
    setFormError("");
  }, [student]);

  /* =====================================================
     VALIDATE NAME
  ===================================================== */

  const validateName = (value) => {
    const name = value.trim();

    if (!name) {
      return "Student name is required.";
    }

    if (name.length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (name.length > 60) {
      return "Name cannot exceed 60 characters.";
    }

    if (!/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/.test(name)) {
      return "Enter a valid name using letters and normal name separators.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE STUDENT ID
  ===================================================== */

  const validateStudentId = (value) => {
    const studentId = value.trim();

    if (!studentId) {
      return "Student ID is required.";
    }

    if (studentId.length < 2) {
      return "Student ID must be at least 2 characters.";
    }

    if (studentId.length > 30) {
      return "Student ID cannot exceed 30 characters.";
    }

    if (!/^[A-Za-z0-9_-]+$/.test(studentId)) {
      return "Student ID can contain letters, numbers, - and _ only.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE EMAIL
  ===================================================== */

  const validateEmail = (value) => {
    const email = value.trim().toLowerCase();

    if (!email) {
      return "Email address is required.";
    }

    if (email.length > 120) {
      return "Email cannot exceed 120 characters.";
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailPattern.test(email)) {
      return "Enter a valid email address.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE PHONE
  ===================================================== */

  const validatePhone = (value) => {
    const phone = value.trim();

    if (!phone) {
      return "Phone number is required.";
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE COURSE
  ===================================================== */

  const validateCourse = (value) => {
    if (!value) {
      return "Course is required.";
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        COURSE_DEPARTMENTS,
        value
      )
    ) {
      return "Please select a valid course.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE DEPARTMENT
  ===================================================== */

  const validateDepartment = (
    value,
    course = formData.course
  ) => {
    if (!value) {
      return "Department is required.";
    }

    const department = value.trim().toUpperCase();

    const departments =
      COURSE_DEPARTMENTS[course] || [];

    if (!departments.includes(department)) {
      return "Please select a department for the chosen course.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE SEMESTER
  ===================================================== */

  const validateSemester = (
    value,
    course = formData.course
  ) => {
    if (!value) {
      return "Semester is required.";
    }

    const semesters =
      COURSE_SEMESTERS[course] || [];

    if (!semesters.includes(Number(value))) {
      return "Please select a valid semester.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE COLLEGE
  ===================================================== */

  const validateCollege = (value) => {
    const college = value.trim();

    if (!college) {
      return "College / University is required.";
    }

    if (college.length < 3) {
      return "College / University name is too short.";
    }

    if (college.length > 150) {
      return "College / University name cannot exceed 150 characters.";
    }

    if (!/[A-Za-z]/.test(college)) {
      return "College / University name must contain letters.";
    }

    if (/^(.)\1+$/.test(college.replace(/\s/g, ""))) {
      return "Please enter a valid college name.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE ADDRESS
  ===================================================== */

  const validateAddress = (value) => {
    const address = value.trim();

    if (!address) {
      return "Address is required.";
    }

    if (address.length < 10) {
      return "Please enter a complete address (minimum 10 characters).";
    }

    if (address.length > 250) {
      return "Address cannot exceed 250 characters.";
    }

    if (!/[A-Za-z]/.test(address)) {
      return "Address must contain letters, not only numbers.";
    }

    const normalizedAddress =
      address.replace(/\s/g, "");

    if (/^(.)\1+$/.test(normalizedAddress)) {
      return "Please enter a valid address.";
    }

    if (/^\d+$/.test(address)) {
      return "Address cannot contain numbers only.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE ENROLLMENT DATE
  ===================================================== */

  const validateEnrollmentDate = (value) => {
    if (!value) {
      return "Enrollment date is required.";
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "Select a valid enrollment date from the calendar.";
    }

    const [year, month, day] = value
      .split("-")
      .map(Number);

    const selectedDate = new Date(
      year,
      month - 1,
      day
    );

    const isRealDate =
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month - 1 &&
      selectedDate.getDate() === day;

    if (!isRealDate) {
      return "Enter a valid calendar date.";
    }

    const today = getLocalDateString();
    const minimumDate = getMinimumEnrollmentDate();

    if (value < minimumDate) {
      return "Enrollment date must be within the current month.";
    }

    if (value > today) {
      return "Future enrollment date is not allowed.";
    }

    return "";
  };

  /* =====================================================
     VALIDATE FIELD
  ===================================================== */

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "studentId":
        return validateStudentId(value);

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

      case "semester":
        return validateSemester(value);

      case "college":
        return validateCollege(value);

      case "address":
        return validateAddress(value);

      case "enrollmentDate":
        return validateEnrollmentDate(value);

      default:
        return "";
    }
  };

  /* =====================================================
     HANDLE CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    /* COURSE CHANGE */

    if (name === "course") {
      setFormData((previousData) => ({
        ...previousData,
        course: value,
        department: "",
        semester: "",
      }));

      setErrors((previousErrors) => ({
        ...previousErrors,
        course: "",
        department: "",
        semester: "",
      }));

      setTouched((previousTouched) => ({
        ...previousTouched,
        department: false,
        semester: false,
      }));

      setFormError("");
      return;
    }

    let updatedValue = value;

    if (name === "phone") {
      updatedValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    setFormData((previousData) => ({
      ...previousData,
      [name]: updatedValue,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
    }));

    setFormError("");
  };

  /* =====================================================
     HANDLE BLUR
  ===================================================== */

  const handleBlur = (event) => {
    const { name } = event.target;

    setTouched((previousTouched) => ({
      ...previousTouched,
      [name]: true,
    }));

    const fieldError = validateField(
      name,
      formData[name]
    );

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: fieldError,
    }));
  };

  /* =====================================================
     VALIDATE FORM
  ===================================================== */

  const validateForm = () => {
    const validationErrors = {};

    FORM_FIELDS.forEach((field) => {
      const fieldError = validateField(
        field,
        formData[field]
      );

      if (fieldError) {
        validationErrors[field] = fieldError;
      }
    });

    setErrors(validationErrors);

    const touchedFields = {};

    FORM_FIELDS.forEach((field) => {
      touchedFields[field] = true;
    });

    setTouched(touchedFields);

    return Object.keys(validationErrors).length === 0;
  };

  /* =====================================================
     CHECK DUPLICATE STUDENT ID
  ===================================================== */

  const checkDuplicateStudentId = async () => {
    const studentId = formData.studentId.trim();

    if (!studentId) {
      return false;
    }

    const response = await api.get("/students");

    const students = Array.isArray(response.data)
      ? response.data
      : [];

    const duplicate = students.some((record) => {
      if (
        isEditMode &&
        String(record.id) === String(student.id)
      ) {
        return false;
      }

      return (
        String(record.studentId || "")
          .trim()
          .toLowerCase() === studentId.toLowerCase()
      );
    });

    if (duplicate) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        studentId:
          "This Student ID is already registered.",
      }));
    }

    return duplicate;
  };

  /* =====================================================
     CHECK DUPLICATE EMAIL
  ===================================================== */

  const checkDuplicateEmail = async () => {
    const email = formData.email
      .trim()
      .toLowerCase();

    if (!email) {
      return false;
    }

    const response = await api.get("/students");

    const students = Array.isArray(response.data)
      ? response.data
      : [];

    const duplicate = students.some((record) => {
      if (
        isEditMode &&
        String(record.id) === String(student.id)
      ) {
        return false;
      }

      return (
        String(record.email || "")
          .trim()
          .toLowerCase() === email
      );
    });

    if (duplicate) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        email:
          "This email address is already registered.",
      }));
    }

    return duplicate;
  };

  /* =====================================================
     SUBMIT FORM
  ===================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!validateForm()) {
      setFormError(
        "Please correct the highlighted fields."
      );
      return;
    }

    try {
      setLoading(true);
      setFormError("");

      const duplicateStudentId =
        await checkDuplicateStudentId();

      if (duplicateStudentId) {
        setFormError(
          "Student ID is already registered."
        );
        return;
      }

      const duplicateEmail =
        await checkDuplicateEmail();

      if (duplicateEmail) {
        setFormError(
          "Email address is already registered."
        );
        return;
      }

      const studentData = {
        studentId: formData.studentId.trim(),
        name: formData.name.trim(),
        email: formData.email
          .trim()
          .toLowerCase(),
        phone: formData.phone.trim(),
        course: formData.course.trim(),
        department: formData.department
          .trim()
          .toUpperCase(),

        semester: Number(formData.semester),

        college: formData.college.trim(),
        address: formData.address.trim(),
        enrollmentDate: formData.enrollmentDate,
        status: formData.status || "Active",
        role: "student",
      };

      /* CREATE STUDENT */

      if (!isEditMode) {
        studentData.createdAt =
          new Date().toISOString();

        const response = await api.post(
          "/students",
          studentData
        );

        if (onStudentAdded) {
          onStudentAdded(response.data);
        }

        return;
      }

      /* UPDATE STUDENT */

      const response = await api.put(
        `/students/${student.id}`,
        {
          ...student,
          ...studentData,
        }
      );

      if (onStudentUpdated) {
        onStudentUpdated(response.data);
      }
    } catch (err) {
      console.error(
        "Student form submit error:",
        err
      );

      setFormError(
        err?.response?.data?.message ||
          err?.message ||
          `Unable to ${
            isEditMode ? "update" : "create"
          } student. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     FIELD CLASS
  ===================================================== */

  const getFieldClass = (fieldName) => {
    const hasError = Boolean(errors[fieldName]);
    const isTouched = Boolean(touched[fieldName]);

    if (hasError && isTouched) {
      return "student-form-field has-error";
    }

    if (
      !hasError &&
      isTouched &&
      formData[fieldName]
    ) {
      return "student-form-field is-valid";
    }

    return "student-form-field";
  };

  /* =====================================================
     DATE INPUT: BLOCK MANUAL ENTRY
  ===================================================== */

  const preventManualDateEntry = (event) => {
    if (event.key !== "Tab") {
      event.preventDefault();
    }
  };

  const preventDatePaste = (event) => {
    event.preventDefault();
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="student-form-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        className="student-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-form-title"
      >
        {/* HEADER */}

        <div className="student-form-header">
          <div className="student-form-header-content">
            <div className="student-form-header-icon">
              {isEditMode ? <FiEdit2 /> : <FiUser />}
            </div>

            <div>
              <span className="student-form-label">
                Student Management
              </span>

              <h2 id="student-form-title">
                {isEditMode
                  ? "Edit Student"
                  : "Add Student"}
              </h2>

              <p>
                {isEditMode
                  ? "Update student account information."
                  : "Create a new student account."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="student-form-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close form"
            title="Close"
          >
            <FiX />
          </button>
        </div>

        {/* FORM ERROR */}

        {formError && (
          <div
            className="student-form-error"
            role="alert"
          >
            <FiAlertCircle />
            <span>{formError}</span>
          </div>
        )}

        {/* FORM */}

        <form
          className="student-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="student-form-body">
            {/* BASIC INFORMATION */}

            <div className="student-form-section">
              <div className="student-form-section-header">
                <FiUser />

                <div>
                  <h3>Basic Information</h3>
                  <p>
                    Enter the student's basic details.
                  </p>
                </div>
              </div>

              <div className="student-form-grid">
                {/* STUDENT ID */}

                <div
                  className={getFieldClass("studentId")}
                >
                  <label htmlFor="student-id">
                    Student ID <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiUser />

                    <input
                      id="student-id"
                      name="studentId"
                      type="text"
                      value={formData.studentId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter student ID"
                      maxLength={30}
                      disabled={loading}
                      autoComplete="off"
                      aria-invalid={Boolean(
                        errors.studentId
                      )}
                    />
                  </div>

                  {errors.studentId &&
                    touched.studentId && (
                      <small>
                        {errors.studentId}
                      </small>
                    )}
                </div>

                {/* NAME */}

                <div className={getFieldClass("name")}>
                  <label htmlFor="student-name">
                    Full Name <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiUser />

                    <input
                      id="student-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter full name"
                      maxLength={60}
                      disabled={loading}
                      autoComplete="name"
                      aria-invalid={Boolean(
                        errors.name
                      )}
                    />
                  </div>

                  {errors.name && touched.name && (
                    <small>{errors.name}</small>
                  )}
                </div>

                {/* EMAIL */}

                <div className={getFieldClass("email")}>
                  <label htmlFor="student-email">
                    Email Address <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiMail />

                    <input
                      id="student-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="student@example.com"
                      maxLength={120}
                      disabled={loading}
                      autoComplete="email"
                      aria-invalid={Boolean(
                        errors.email
                      )}
                    />
                  </div>

                  {errors.email && touched.email && (
                    <small>{errors.email}</small>
                  )}
                </div>

                {/* PHONE */}

                <div className={getFieldClass("phone")}>
                  <label htmlFor="student-phone">
                    Phone Number <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiPhone />

                    <input
                      id="student-phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      disabled={loading}
                      autoComplete="tel"
                      inputMode="numeric"
                      aria-invalid={Boolean(
                        errors.phone
                      )}
                    />
                  </div>

                  {errors.phone && touched.phone && (
                    <small>{errors.phone}</small>
                  )}
                </div>
              </div>
            </div>

            {/* ACADEMIC INFORMATION */}

            <div className="student-form-section">
              <div className="student-form-section-header">
                <FiBookOpen />

                <div>
                  <h3>Academic Information</h3>
                  <p>
                    Enter course and institution details.
                  </p>
                </div>
              </div>

              <div className="student-form-grid">
                {/* COURSE */}

                <div className={getFieldClass("course")}>
                  <label htmlFor="student-course">
                    Course <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiBookOpen />

                    <select
                      id="student-course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={loading}
                      aria-invalid={Boolean(
                        errors.course
                      )}
                    >
                      <option value="">
                        Select course
                      </option>

                      {Object.keys(
                        COURSE_DEPARTMENTS
                      ).map((course) => (
                        <option
                          key={course}
                          value={course}
                        >
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  {errors.course && touched.course && (
                    <small>{errors.course}</small>
                  )}
                </div>

                {/* DEPARTMENT */}

                <div
                  className={getFieldClass("department")}
                >
                  <label htmlFor="student-department">
                    Department <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiBookOpen />

                    <select
                      id="student-department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={
                        loading || !formData.course
                      }
                      aria-invalid={Boolean(
                        errors.department
                      )}
                    >
                      <option value="">
                        {!formData.course
                          ? "First select course"
                          : "Select department"}
                      </option>

                      {availableDepartments.map(
                        (department) => (
                          <option
                            key={department}
                            value={department}
                          >
                            {department}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {errors.department &&
                    touched.department && (
                      <small>
                        {errors.department}
                      </small>
                    )}
                </div>

                {/* SEMESTER */}

                <div
                  className={getFieldClass("semester")}
                >
                  <label htmlFor="student-semester">
                    Semester <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiBookOpen />

                    <select
                      id="student-semester"
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={
                        loading || !formData.course
                      }
                      aria-invalid={Boolean(
                        errors.semester
                      )}
                    >
                      <option value="">
                        {!formData.course
                          ? "First select course"
                          : "Select semester"}
                      </option>

                      {availableSemesters.map(
                        (semester) => (
                          <option
                            key={semester}
                            value={semester}
                          >
                            {semester}
                            {semester === 1
                              ? "st"
                              : semester === 2
                              ? "nd"
                              : semester === 3
                              ? "rd"
                              : "th"}{" "}
                            Semester
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {errors.semester &&
                    touched.semester && (
                      <small>
                        {errors.semester}
                      </small>
                    )}
                </div>

                {/* COLLEGE */}

                <div className={getFieldClass("college")}>
                  <label htmlFor="student-college">
                    College / University <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiBookOpen />

                    <input
                      id="student-college"
                      name="college"
                      type="text"
                      value={formData.college}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter college or university"
                      maxLength={150}
                      disabled={loading}
                      aria-invalid={Boolean(
                        errors.college
                      )}
                    />
                  </div>

                  {errors.college && touched.college && (
                    <small>{errors.college}</small>
                  )}
                </div>

                {/* ENROLLMENT DATE */}

                <div
                  className={getFieldClass(
                    "enrollmentDate"
                  )}
                >
                  <label htmlFor="student-enrollment-date">
                    Enrollment Date <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiCalendar />

                    <input
                      id="student-enrollment-date"
                      name="enrollmentDate"
                      type="date"
                      value={formData.enrollmentDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyDown={
                        preventManualDateEntry
                      }
                      onPaste={preventDatePaste}
                      onDrop={preventDatePaste}
                      min={getMinimumEnrollmentDate()}
                      max={getLocalDateString()}
                      disabled={loading}
                      aria-invalid={Boolean(
                        errors.enrollmentDate
                      )}
                    />
                  </div>

                  {errors.enrollmentDate &&
                    touched.enrollmentDate && (
                      <small>
                        {errors.enrollmentDate}
                      </small>
                    )}
                </div>

                {/* STATUS */}

                <div className="student-form-field">
                  <label htmlFor="student-status">
                    Account Status <span>*</span>
                  </label>

                  <div className="student-form-input-wrapper">
                    <FiCheckCircle />

                    <select
                      id="student-status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ADDRESS INFORMATION */}

            <div className="student-form-section">
              <div className="student-form-section-header">
                <FiMapPin />

                <div>
                  <h3>Address Information</h3>
                  <p>
                    Enter the student's current address.
                  </p>
                </div>
              </div>

              <div
                className={getFieldClass("address")}
              >
                <label htmlFor="student-address">
                  Address <span>*</span>
                </label>

                <div className="student-form-textarea-wrapper">
                  <FiMapPin />

                  <textarea
                    id="student-address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter complete address"
                    maxLength={250}
                    rows={4}
                    disabled={loading}
                    aria-invalid={Boolean(
                      errors.address
                    )}
                  />
                </div>

                <div className="student-form-character-count">
                  {formData.address.length}/250
                </div>

                {errors.address && touched.address && (
                  <small>{errors.address}</small>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="student-form-footer">
            <button
              type="button"
              className="student-form-cancel"
              onClick={onClose}
              disabled={loading}
            >
              <FiX />
              Cancel
            </button>

            <button
              type="submit"
              className="student-form-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="student-form-spinner" />
                  {isEditMode
                    ? "Updating..."
                    : "Saving..."}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <FiSave />
                  ) : (
                    <FiUser />
                  )}

                  {isEditMode
                    ? "Update Student"
                    : "Add Student"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentForm;