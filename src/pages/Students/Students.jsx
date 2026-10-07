import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFilter,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiTrash2,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiUserX,
  FiX,
} from "react-icons/fi";

import api from "../../services/api";
import { useToast } from "../../components/Toast/Toast";
import StudentForm from "./StudentForm";
import { useAuth } from "../../context/AuthContext";

import "./Students.css";

function Students() {
  const { isAdmin, isMentor, userCourse, userDepartment } = useAuth();
  const canManageStudents = isAdmin;

  const {
    success,
    error: showError,
    warning,
  } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // PAGINATION
  const STUDENTS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  /* =====================================================
     FETCH STUDENTS
     IMPORTANT: students are stored in /students.
  ===================================================== */

  const fetchStudents = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const response = await api.get("/students");
      const studentList = Array.isArray(response?.data) ? response.data : [];

      const normalize = (value) => String(value ?? "").trim().toLowerCase();
      const scopedStudents = studentList.filter((student) => {
        const courseMatches = normalize(student?.course) === normalize(userCourse);
        if (isAdmin) return courseMatches;
        if (isMentor) {
          return courseMatches && normalize(student?.department) === normalize(userDepartment);
        }
        return false;
      });

      setStudents(scopedStudents);
    } catch (err) {
      console.error("Fetch students error:", err);
      const message = err?.response?.data?.message || err?.message || "Unable to load student records.";
      setStudents([]);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isMentor, userCourse, userDepartment, showError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();
  }, [fetchStudents]);

  /* =====================================================
     AVAILABLE COURSES
  ===================================================== */

  const availableCourses = useMemo(() => {
    const courses = students
      .map((student) => student?.course)
      .filter(
        (course) =>
          typeof course === "string" &&
          course.trim() !== ""
      );

    return [...new Set(courses)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [students]);

  /* =====================================================
     AVAILABLE DEPARTMENTS
  ===================================================== */

  const availableDepartments = useMemo(() => {
    const departments = students
      .filter(
        (student) =>
          courseFilter === "all" ||
          student?.course === courseFilter
      )
      .map((student) => student?.department)
      .filter(
        (department) =>
          typeof department === "string" &&
          department.trim() !== ""
      );

    return [...new Set(departments)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [students, courseFilter]);

  /* =====================================================
     FILTER STUDENTS
  ===================================================== */

  const filteredStudents = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return students.filter((student) => {
      const searchableValues = [
        student?.studentId,
        student?.id,
        student?.name,
        student?.fullName,
        student?.email,
        student?.phone,
        student?.course,
        student?.department,
        student?.semester,
        student?.college,
        student?.address,
      ];

      const matchesSearch =
        !searchText ||
        searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(searchText)
        );

      const normalizedStatus = String(
        student?.status || ""
      )
        .trim()
        .toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        normalizedStatus === statusFilter;

      const matchesCourse =
        courseFilter === "all" ||
        student?.course === courseFilter;

      const matchesDepartment =
        departmentFilter === "all" ||
        student?.department === departmentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCourse &&
        matchesDepartment
      );
    });
  }, [
    students,
    search,
    statusFilter,
    courseFilter,
    departmentFilter,
  ]);

  // Reset to first page whenever search/filter changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, statusFilter, courseFilter, departmentFilter]);

  // PAGINATED STUDENTS
  const totalPages = Math.ceil(
    filteredStudents.length / STUDENTS_PER_PAGE
  );

  const paginatedStudents = useMemo(() => {
    const startIndex =
      (currentPage - 1) * STUDENTS_PER_PAGE;

    return filteredStudents.slice(
      startIndex,
      startIndex + STUDENTS_PER_PAGE
    );
  }, [filteredStudents, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationStart =
    filteredStudents.length === 0
      ? 0
      : (currentPage - 1) * STUDENTS_PER_PAGE + 1;

  const paginationEnd = Math.min(
    currentPage * STUDENTS_PER_PAGE,
    filteredStudents.length
  );

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) =>
      String(student?.status || "")
        .trim()
        .toLowerCase() === "active"
  ).length;

  const inactiveStudents = students.filter(
    (student) =>
      String(student?.status || "")
        .trim()
        .toLowerCase() === "inactive"
  ).length;

  /* =====================================================
     ADD
  ===================================================== */

  const handleAddStudent = () => {
    if (!canManageStudents) return;
    setViewStudent(null);
    setEditingStudent(null);
    setShowStudentForm(true);
  };

  /* =====================================================
     EDIT
  ===================================================== */

  const handleEdit = (student) => {
    if (!canManageStudents) return;
    if (!student?.id) {
      showError("Student ID is missing.");
      return;
    }

    setViewStudent(null);
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  /* =====================================================
     VIEW
  ===================================================== */

  const handleView = (student) => {
    if (!student) {
      return;
    }

    setViewStudent(student);
  };

  /* =====================================================
     CLOSE FORM
  ===================================================== */

  const handleCloseForm = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
  };

  /* =====================================================
     STUDENT ADDED
  ===================================================== */

  const handleStudentAdded = (newStudent) => {
    if (!newStudent) {
      return;
    }

    setStudents((currentStudents) => [
      ...currentStudents,
      newStudent,
    ]);

    handleCloseForm();
    success("Student added successfully.");
  };

  /* =====================================================
     STUDENT UPDATED
  ===================================================== */

  const handleStudentUpdated = (updatedStudent) => {
    if (!updatedStudent) {
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        String(student.id) ===
        String(updatedStudent.id)
          ? updatedStudent
          : student
      )
    );

    handleCloseForm();
    success("Student updated successfully.");
  };

  /* =====================================================
     DELETE STUDENT
     IMPORTANT: delete from /students/:id
  ===================================================== */

  const handleDelete = (student) => {
    if (!canManageStudents || !student?.id || deleteLoading) return;
    setStudentToDelete(student);
  };

  const handleCancelDelete = () => {
    if (deleteLoading) return;
    setStudentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!canManageStudents || !studentToDelete?.id || deleteLoading) return;

    const student = studentToDelete;

    try {
      setDeleteLoading(true);
      await api.delete(`/students/${student.id}`);

      setStudents((currentStudents) =>
        currentStudents.filter((item) => String(item.id) !== String(student.id))
      );

      if (String(viewStudent?.id) === String(student.id)) {
        setViewStudent(null);
      }

      setStudentToDelete(null);
      success("Student deleted successfully.");
    } catch (err) {
      console.error("Delete student error:", err);
      showError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete student."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCourseFilter("all");
    setDepartmentFilter("all");
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatEnrollmentDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     INITIAL
  ===================================================== */

  const getInitial = (name) => {
    if (!name) {
      return "S";
    }

    return String(name)
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  /* =====================================================
     CSV HELPERS
  ===================================================== */

  const escapeCsvValue = (value) => {
    const stringValue = String(value ?? "");

    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const createStudentCsv = (studentList) => {
    const headers = [
      "Student ID",
      "Student Name",
      "Email",
      "Phone",
      "Course",
      "Department",
      "Semester",
      "College / University",
      "Address",
      "Enrollment Date",
      "Status",
    ];

    const rows = studentList.map((student) => [
      student?.studentId ||
        student?.id ||
        "N/A",

      student?.name ||
        student?.fullName ||
        "N/A",

      student?.email || "N/A",

      student?.phone || "N/A",

      student?.course || "N/A",

      student?.department || "N/A",

      student?.semester || "N/A",

      student?.college || "N/A",

      student?.address || "N/A",

      formatEnrollmentDate(
        student?.enrollmentDate ||
          student?.createdAt
      ),

      String(student?.status || "")
        .toLowerCase() === "active"
        ? "Active"
        : "Inactive",
    ]);

    return [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      ),
    ].join("\n");
  };

  /* =====================================================
     DOWNLOAD ALL
  ===================================================== */

  const handleDownloadStudents = () => {
    if (!canManageStudents) return;
    if (!students.length) {
      warning(
        "There are no student records to download."
      );
      return;
    }

    const csvContent = createStudentCsv(students);
    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Students_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    success(
      `${students.length} student record(s) downloaded successfully.`
    );
  };

  /* =====================================================
     DOWNLOAD FILTERED
  ===================================================== */

  const handleDownloadFiltered = () => {
    if (!canManageStudents) return;
    if (!filteredStudents.length) {
      warning(
        "No student records available to download."
      );
      return;
    }

    const csvContent =
      createStudentCsv(filteredStudents);

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Students_Filtered_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    success(
      `${filteredStudents.length} filtered student record(s) downloaded.`
    );
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="students-page">

      {/* PAGE HEADER */}
      <div className="students-page-header">
        <div className="students-heading">
          <span className="students-page-label">
            Student Management
          </span>

          <h1>Students</h1>

          <p>
            {canManageStudents
              ? "Manage student records across your course."
              : "View student records for your assigned department."}
          </p>
        </div>

        <div className="students-header-actions">
          {canManageStudents && <button
            type="button"
            className="download-students-button"
            onClick={handleDownloadStudents}
            disabled={
              loading ||
              students.length === 0
            }
            title="Download all student data"
          >
            <FiDownload />
            <span>Download Students</span>
          </button>}

          {canManageStudents && <button
            type="button"
            className="add-student-button"
            onClick={handleAddStudent}
          >
            <FiPlus />
            <span>Add Student</span>
          </button>}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="students-error">
          <div className="students-error-content">
            <FiAlertCircle />

            <div>
              <strong>
                Unable to load students
              </strong>

              <span>{error}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchStudents()}
          >
            <FiRefreshCw />
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="student-stat-grid">
        <div className="student-stat-card">
          <div className="student-stat-icon blue">
            <FiUsers />
          </div>

          <div className="student-stat-content">
            <span>Total Students</span>
            <strong>{totalStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon green">
            <FiUserCheck />
          </div>

          <div className="student-stat-content">
            <span>Active Students</span>
            <strong>{activeStudents}</strong>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="student-stat-icon red">
            <FiUserX />
          </div>

          <div className="student-stat-content">
            <span>Inactive Students</span>
            <strong>{inactiveStudents}</strong>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="students-table-card">

        {/* TABLE HEADER */}
        <div className="students-table-header">
          <div className="students-table-title">
            <h2>{isAdmin ? "Course Students" : "Department Students"}</h2>

            <p>
              Showing{" "}
              <strong>
                {filteredStudents.length === 0
                  ? 0
                  : paginationStart}
              </strong>
              {filteredStudents.length > 0 && "–"}
              {filteredStudents.length > 0 && (
                <strong>{paginationEnd}</strong>
              )}
              {" of "}
              <strong>
                {filteredStudents.length}
              </strong>{" "}
              students
            </p>
          </div>

          {/* FILTERS */}
          <div className="students-filters">

            {/* SEARCH */}
            <div className="student-search">
              <FiSearch />

              <input
                type="text"
                value={search}
                placeholder="Search students..."
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                aria-label="Search students"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search-button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* COURSE */}
            <div className="student-filter-control">
              <FiBookOpen />

              <select
                value={courseFilter}
                onChange={(event) => {
                  setCourseFilter(event.target.value);
                  setDepartmentFilter("all");
                }}
                aria-label="Filter by course"
              >
                <option value="all">
                  All Courses
                </option>

                {availableCourses.map((course) => (
                  <option
                    key={course}
                    value={course}
                  >
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {/* DEPARTMENT */}
            <div className="student-filter-control">
              <FiBookOpen />

              <select
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(event.target.value)
                }
                aria-label="Filter by department"
              >
                <option value="all">
                  All Departments
                </option>

                {availableDepartments.map((department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}
            <div className="student-filter-control">
              <FiFilter />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                aria-label="Filter by status"
              >
                <option value="all">
                  All Status
                </option>

                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            {/* FILTERED DOWNLOAD */}
            {canManageStudents && <button
              type="button"
              className="download-filtered-button"
              onClick={handleDownloadFiltered}
              disabled={
                filteredStudents.length === 0
              }
              title="Download currently filtered students"
            >
              <FiDownload />
              <span>Download</span>
            </button>}

            {/* CLEAR FILTERS */}
            {(search ||
              statusFilter !== "all" ||
              courseFilter !== "all" ||
              departmentFilter !== "all") && (
              <button
                type="button"
                className="clear-filters-button"
                onClick={clearFilters}
                title="Clear all filters"
              >
                <FiRotateCcw />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* TABLE BODY */}
        <div className="students-table-wrapper">

          {/* LOADING */}
          {loading && (
            <div className="students-state">
              <div className="students-loader" />
              <p>Loading students...</p>
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            !error &&
            filteredStudents.length === 0 && (
              <div className="students-state">
                <div className="state-icon">
                  <FiUsers />
                </div>

                <h3>No students found</h3>

                <p>
                  {search ||
                  statusFilter !== "all" ||
                  courseFilter !== "all" ||
                  departmentFilter !== "all"
                    ? "No students match your current search or filters."
                    : "No student records are available yet."}
                </p>

                {(search ||
                  statusFilter !== "all" ||
                  courseFilter !== "all" ||
              departmentFilter !== "all") && (
                  <button
                    type="button"
                    className="empty-clear-button"
                    onClick={clearFilters}
                  >
                    <FiRotateCcw />
                    Clear Filters
                  </button>
                )}

                {canManageStudents && !search &&
                  statusFilter === "all" &&
                  courseFilter === "all" &&
                  departmentFilter === "all" && (
                    <button
                      type="button"
                      className="empty-add-button"
                      onClick={handleAddStudent}
                    >
                      <FiUserPlus />
                      Add First Student
                    </button>
                  )}
              </div>
            )}

          {/* TABLE */}
          {!loading &&
            !error &&
            filteredStudents.length > 0 && (
              <div className="table-scroll">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Contact</th>
                      <th>Course</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>
                        College / University
                      </th>
                      <th>Enrollment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedStudents.map(
                      (student) => {
                        const studentName =
                          student?.name ||
                          student?.fullName ||
                          "N/A";

                        const isActive =
                          String(
                            student?.status || ""
                          )
                            .trim()
                            .toLowerCase() ===
                          "active";

                        return (
                          <tr
                            key={student.id}
                          >
                            {/* STUDENT */}
                            <td>
                              <div className="student-info">
                                <div className="student-avatar">
                                  {getInitial(
                                    studentName
                                  )}
                                </div>

                                <div className="student-name-block">
                                  <strong
                                    title={
                                      studentName
                                    }
                                  >
                                    {studentName}
                                  </strong>

                                  <span>
                                    {student?.studentId ||
                                      `ID: ${student?.id}`}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* CONTACT */}
                            <td>
                              <div className="student-contact">
                                <span className="student-email">
                                  <FiMail />
                                  {student?.email ||
                                    "N/A"}
                                </span>

                                <span className="student-phone">
                                  <FiPhone />
                                  {student?.phone ||
                                    "N/A"}
                                </span>
                              </div>
                            </td>

                            {/* COURSE */}
                            <td>
                              <span className="course-badge">
                                <FiBookOpen />
                                {student?.course ||
                                  "N/A"}
                              </span>
                            </td>

                            {/* DEPARTMENT */}
                            <td>
                              <span className="course-badge">
                                <FiBookOpen />
                                {student?.department ||
                                  "N/A"}
                              </span>
                            </td>

                            {/* SEMESTER */}
                            <td>
                              <span className="course-badge">
                                <FiBookOpen />
                                {student?.semester ||
                                  "N/A"}
                              </span>
                            </td>

                            {/* COLLEGE */}
                            <td>
                              <div className="student-college">
                                <span
                                  title={
                                    student?.college ||
                                    "N/A"
                                  }
                                >
                                  {student?.college ||
                                    "N/A"}
                                </span>

                                {student?.address && (
                                  <small
                                    title={
                                      student.address
                                    }
                                  >
                                    <FiMapPin />
                                    {
                                      student.address
                                    }
                                  </small>
                                )}
                              </div>
                            </td>

                            {/* ENROLLMENT */}
                            <td>
                              <span className="enrollment-date">
                                <FiCalendar />
                                {formatEnrollmentDate(
                                  student?.enrollmentDate ||
                                    student?.createdAt
                                )}
                              </span>
                            </td>

                            {/* STATUS */}
                            <td>
                              <span
                                className={`student-status ${
                                  isActive
                                    ? "active"
                                    : "inactive"
                                }`}
                              >
                                <span className="status-dot" />

                                {isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            {/* ACTIONS */}
                            <td>
                              <div className="student-actions">
                                <button
                                  type="button"
                                  className="student-action view"
                                  title="View Student"
                                  aria-label="View Student"
                                  onClick={() =>
                                    handleView(
                                      student
                                    )
                                  }
                                >
                                  <FiEye />
                                </button>

                                {canManageStudents && <button
                                  type="button"
                                  className="student-action edit"
                                  title="Edit Student"
                                  aria-label="Edit Student"
                                  onClick={() =>
                                    handleEdit(
                                      student
                                    )
                                  }
                                >
                                  <FiEdit2 />
                                </button>}

                                {canManageStudents && <button
                                  type="button"
                                  className="student-action delete"
                                  title="Delete Student"
                                  aria-label="Delete Student"
                                  onClick={() =>
                                    handleDelete(
                                      student
                                    )
                                  }
                                  disabled={
                                    deleteLoading
                                  }
                                >
                                  <FiTrash2 />
                                </button>}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      {/* PAGINATION */}
      {!loading &&
        !error &&
        filteredStudents.length > 0 &&
        totalPages > 1 && (
          <div className="students-pagination">
            <div className="students-pagination-info">
              Showing{" "}
              <strong>{paginationStart}</strong>
              {"–"}
              <strong>{paginationEnd}</strong>
              {" of "}
              <strong>{filteredStudents.length}</strong>
              {" students"}
            </div>

            <div className="students-pagination-controls">
              <button
                type="button"
                className="students-pagination-button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(page - 1, 1)
                  )
                }
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                Previous
              </button>

              <div className="students-pagination-pages">
                {getPaginationPages().map(
                  (page, index) =>
                    page === "..." ? (
                      <span
                        key={`dots-${index}`}
                        className="students-pagination-dots"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        className={`students-pagination-page ${
                          currentPage === page
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setCurrentPage(page)
                        }
                        aria-label={`Go to page ${page}`}
                        aria-current={
                          currentPage === page
                            ? "page"
                            : undefined
                        }
                      >
                        {page}
                      </button>
                    )
                )}
              </div>

              <button
                type="button"
                className="students-pagination-button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(page + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        )}

      {/* ADD / EDIT FORM */}
      {canManageStudents && showStudentForm && (
        <StudentForm
          student={editingStudent}
          onClose={handleCloseForm}
          onStudentAdded={handleStudentAdded}
          onStudentUpdated={handleStudentUpdated}
        />
      )}

      {/* VIEW STUDENT */}
      {viewStudent && (
        <div
          className="student-view-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewStudent(null);
            }
          }}
        >
          <div className="student-view-modal">

            {/* HEADER */}
            <div className="student-view-header">
              <div>
                <span className="student-view-label">
                  STUDENT DETAILS
                </span>

                <h2>
                  {viewStudent.name ||
                    viewStudent.fullName ||
                    "Student"}
                </h2>

                <p>
                  {viewStudent.studentId ||
                    `ID: ${viewStudent.id}`}
                </p>
              </div>

              <button
                type="button"
                className="student-view-close"
                onClick={() =>
                  setViewStudent(null)
                }
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            {/* BODY */}
            <div className="student-view-body">
              <div className="student-view-avatar">
                {getInitial(
                  viewStudent.name ||
                    viewStudent.fullName
                )}
              </div>

              <div className="student-view-grid">

                <div className="student-view-item">
                  <span>
                    <FiUser />
                    Full Name
                  </span>

                  <strong>
                    {viewStudent.name ||
                      viewStudent.fullName ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiUser />
                    Student ID
                  </span>

                  <strong>
                    {viewStudent.studentId ||
                      viewStudent.id ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiMail />
                    Email
                  </span>

                  <strong>
                    {viewStudent.email ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiPhone />
                    Mobile
                  </span>

                  <strong>
                    {viewStudent.phone ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiBookOpen />
                    Course
                  </span>

                  <strong>
                    {viewStudent.course ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiBookOpen />
                    Department
                  </span>

                  <strong>
                    {viewStudent.department ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiBookOpen />
                    Semester
                  </span>

                  <strong>
                    {viewStudent.semester ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiUsers />
                    College / University
                  </span>

                  <strong>
                    {viewStudent.college ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item full">
                  <span>
                    <FiMapPin />
                    Address
                  </span>

                  <strong>
                    {viewStudent.address ||
                      "N/A"}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiCalendar />
                    Enrollment Date
                  </span>

                  <strong>
                    {formatEnrollmentDate(
                      viewStudent.enrollmentDate ||
                        viewStudent.createdAt
                    )}
                  </strong>
                </div>

                <div className="student-view-item">
                  <span>
                    <FiCheckCircle />
                    Account Status
                  </span>

                  <strong>
                    <span
                      className={`student-view-status ${
                        String(
                          viewStudent.status ||
                            ""
                        )
                          .trim()
                          .toLowerCase() ===
                        "active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      <span className="status-dot" />

                      {String(
                        viewStudent.status ||
                          ""
                      )
                        .trim()
                        .toLowerCase() ===
                      "active"
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </strong>
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="student-view-footer">
              <button
                type="button"
                className="student-view-cancel"
                onClick={() =>
                  setViewStudent(null)
                }
              >
                Close
              </button>

              {canManageStudents && <button
                type="button"
                className="student-view-edit"
                onClick={() =>
                  handleEdit(viewStudent)
                }
              >
                <FiEdit2 />
                Edit Student
              </button>}
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {studentToDelete && (
        <div
          className="student-delete-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleteLoading) {
              handleCancelDelete();
            }
          }}
        >
          <div
            className="student-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-delete-title"
            aria-describedby="student-delete-description"
          >
            <div className="student-delete-header">
              <div className="student-delete-icon">
                <FiTrash2 />
              </div>

              <button
                type="button"
                className="student-delete-close"
                onClick={handleCancelDelete}
                disabled={deleteLoading}
                aria-label="Close delete confirmation"
              >
                <FiX />
              </button>
            </div>

            <div className="student-delete-content">
              <h2 id="student-delete-title">Delete Student</h2>
              <p id="student-delete-description">
                Are you sure you want to delete{" "}
                <strong>
                  {studentToDelete.name || studentToDelete.fullName || "this student"}
                </strong>
                ?
              </p>
              <span className="student-delete-warning">
                This action cannot be undone. The student record will be permanently removed.
              </span>
            </div>

            <div className="student-delete-footer">
              <button
                type="button"
                className="student-delete-cancel"
                onClick={handleCancelDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="student-delete-confirm"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className="student-delete-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Delete Student
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

export default Students;
