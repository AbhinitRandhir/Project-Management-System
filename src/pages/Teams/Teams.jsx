
import { useEffect, useMemo, useState } from "react";

import {
  FiAlertTriangle,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFilter,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Loader from "../../components/Loader/Loader";
import TeamForm from "./TeamForm";

import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} from "../../services/teamService";

import { getStudents } from "../../services/studentService";

import { useToast } from "../../components/Toast/Toast";
import { useAuth } from "../../context/AuthContext";

import "./Teams.css";

// =========================================================
// HELPER FUNCTIONS
// Defined outside component to avoid recreating functions
// and unnecessary React Hook dependencies.
// =========================================================

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const getTeamMemberIds = (team) => {
  if (!Array.isArray(team?.members)) return [];

  return team.members
    .map((member) =>
      typeof member === "object" ? member?.id : member
    )
    .filter((id) => id !== undefined && id !== null)
    .map(String);
};

const getStudentById = (students, studentId) => {
  return students.find(
    (student) => String(student.id) === String(studentId)
  );
};

const getTeamCourse = (team, students) => {
  if (team?.course) {
    return String(team.course).trim();
  }

  const memberIds = getTeamMemberIds(team);

  const firstStudent = memberIds.length
    ? getStudentById(students, memberIds[0])
    : null;

  return String(firstStudent?.course || "").trim();
};

const getTeamDepartment = (team, students) => {
  if (team?.department) {
    return String(team.department).trim();
  }

  const memberIds = getTeamMemberIds(team);

  const firstStudent = memberIds.length
    ? getStudentById(students, memberIds[0])
    : null;

  return String(firstStudent?.department || "").trim();
};

const getDepartmentLabel = (department) => {
  if (!department) return "Not Available";

  return String(department).toUpperCase();
};

// =========================================================
// TEAMS COMPONENT
// =========================================================

function Teams() {
  // -------------------------------------------------------
  // TOAST
  // -------------------------------------------------------

  const {
    success: showSuccess,
    error: showError,
  } = useToast();

  // -------------------------------------------------------
  // AUTH CONTEXT
  // -------------------------------------------------------

  const auth = useAuth();

  const {
    user,
    currentUser,
    isAdmin,
    isMentor,
    userCourse,
    userDepartment,
  } = auth;

  const loggedInUser = currentUser || user;

  const role = normalize(
    loggedInUser?.role ||
      (isAdmin ? "admin" : isMentor ? "mentor" : "")
  );

  const adminMode = role === "admin" || Boolean(isAdmin);
  const mentorMode = role === "mentor" || Boolean(isMentor);

  const currentCourse = String(
    userCourse || loggedInUser?.course || ""
  ).trim();

  const currentDepartment = String(
    userDepartment || loggedInUser?.department || ""
  ).trim();

  const currentUserId = String(
    loggedInUser?.id || loggedInUser?.adminId || ""
  );

  const currentUserName = String(
    loggedInUser?.name || ""
  ).trim();

  // -------------------------------------------------------
  // STATES
  // -------------------------------------------------------

  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const TEAMS_PER_PAGE = 6;

  const [showForm, setShowForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [viewTeam, setViewTeam] = useState(null);

  const [error, setError] = useState("");

  // -------------------------------------------------------
  // FETCH TEAMS AND STUDENTS
  // -------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [teamsResponse, studentsResponse] =
          await Promise.all([
            getTeams(),
            getStudents(),
          ]);

        if (!isMounted) return;

        const teamData = Array.isArray(teamsResponse?.data)
          ? teamsResponse.data
          : [];

        const studentData = Array.isArray(
          studentsResponse?.data
        )
          ? studentsResponse.data
          : [];

        setTeams(teamData);
        setStudents(studentData);
      } catch (fetchError) {
        console.error("Error fetching teams:", fetchError);

        if (!isMounted) return;

        setError(
          "Unable to load team data. Please check the server."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------
  // TEAM OWNERSHIP
  // -------------------------------------------------------

  const isOwnTeam = (team) => {
    if (!mentorMode) return false;

    const teamMentorId = String(
      team?.mentorId || ""
    ).trim();

    // Prefer mentorId when available.
    if (teamMentorId && currentUserId) {
      return teamMentorId === currentUserId;
    }

    // Legacy fallback when mentorId is missing.
    if (!teamMentorId && currentUserName) {
      return (
        normalize(team?.mentorName) ===
        normalize(currentUserName)
      );
    }

    return false;
  };

  const canManageTeam = (team) => {
    if (adminMode) return true;

    if (mentorMode) {
      return isOwnTeam(team);
    }

    return false;
  };

  // -------------------------------------------------------
  // ROLE-BASED TEAM SCOPE
  // -------------------------------------------------------

  const scopedTeams = useMemo(() => {
    return teams.filter((team) => {
      const course = normalize(
        getTeamCourse(team, students)
      );

      const department = normalize(
        getTeamDepartment(team, students)
      );

      if (adminMode) {
        return (
          !currentCourse ||
          course === normalize(currentCourse)
        );
      }

      if (mentorMode) {
        return (
          course === normalize(currentCourse) &&
          department === normalize(currentDepartment)
        );
      }

      return false;
    });
  }, [
    teams,
    students,
    adminMode,
    mentorMode,
    currentCourse,
    currentDepartment,
  ]);

  // -------------------------------------------------------
  // ROLE-BASED STUDENT SCOPE
  // -------------------------------------------------------

  const scopedStudents = useMemo(() => {
    return students.filter((student) => {
      const course = normalize(student?.course);
      const department = normalize(student?.department);

      if (adminMode) {
        return (
          !currentCourse ||
          course === normalize(currentCourse)
        );
      }

      if (mentorMode) {
        return (
          course === normalize(currentCourse) &&
          department === normalize(currentDepartment)
        );
      }

      return false;
    });
  }, [
    students,
    adminMode,
    mentorMode,
    currentCourse,
    currentDepartment,
  ]);

  // -------------------------------------------------------
  // COURSE OPTIONS
  // -------------------------------------------------------

  const courses = useMemo(() => {
    const values = [
      ...scopedStudents.map(
        (student) => student?.course
      ),
      ...scopedTeams.map(
        (team) => getTeamCourse(team, students)
      ),
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [scopedStudents, scopedTeams, students]);

  // -------------------------------------------------------
  // DEPARTMENT OPTIONS
  // -------------------------------------------------------

  const departments = useMemo(() => {
    const values = [
      ...scopedStudents.map(
        (student) => student?.department
      ),
      ...scopedTeams.map(
        (team) => getTeamDepartment(team, students)
      ),
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [scopedStudents, scopedTeams, students]);

  // -------------------------------------------------------
  // DEPARTMENTS FOR SELECTED COURSE
  // -------------------------------------------------------

  const filteredDepartments = useMemo(() => {
    if (!courseFilter) {
      return departments;
    }

    const values = [
      ...scopedStudents
        .filter(
          (student) =>
            normalize(student?.course) ===
            normalize(courseFilter)
        )
        .map((student) => student?.department),

      ...scopedTeams
        .filter(
          (team) =>
            normalize(
              getTeamCourse(team, students)
            ) === normalize(courseFilter)
        )
        .map((team) =>
          getTeamDepartment(team, students)
        ),
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [
    courseFilter,
    departments,
    scopedStudents,
    scopedTeams,
    students,
  ]);

  // -------------------------------------------------------
  // SEARCH AND FILTER TEAMS
  // -------------------------------------------------------

  const filteredTeams = useMemo(() => {
    const searchValue = normalize(searchTerm);

    return scopedTeams.filter((team) => {
      const leader = getStudentById(
        students,
        team?.teamLeaderId
      );

      const teamName = normalize(team?.teamName);
      const mentorName = normalize(team?.mentorName);
      const leaderName = normalize(leader?.name);

      const department = normalize(
        getTeamDepartment(team, students)
      );

      const course = normalize(
        getTeamCourse(team, students)
      );

      const teamId = normalize(team?.id);

      const matchesSearch =
        !searchValue ||
        teamName.includes(searchValue) ||
        mentorName.includes(searchValue) ||
        leaderName.includes(searchValue) ||
        department.includes(searchValue) ||
        course.includes(searchValue) ||
        teamId.includes(searchValue);

      const matchesDepartment =
        !departmentFilter ||
        department === normalize(departmentFilter);

      const matchesCourse =
        !courseFilter ||
        course === normalize(courseFilter);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesCourse
      );
    });
  }, [
    scopedTeams,
    students,
    searchTerm,
    departmentFilter,
    courseFilter,
  ]);

  // -------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTeams.length / TEAMS_PER_PAGE
    )
  );

  const paginatedTeams = useMemo(() => {
    const startIndex =
      (currentPage - 1) * TEAMS_PER_PAGE;

    return filteredTeams.slice(
      startIndex,
      startIndex + TEAMS_PER_PAGE
    );
  }, [filteredTeams, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [
    searchTerm,
    departmentFilter,
    courseFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePreviousPage = () => {
    setCurrentPage((page) =>
      Math.max(1, page - 1)
    );
  };

  const handleNextPage = () => {
    setCurrentPage((page) =>
      Math.min(totalPages, page + 1)
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  // -------------------------------------------------------
  // TOTAL ASSIGNED STUDENTS
  // -------------------------------------------------------

  const totalAssignedStudents = useMemo(() => {
    const assignedIds = new Set();

    scopedTeams.forEach((team) => {
      getTeamMemberIds(team).forEach((studentId) => {
        assignedIds.add(String(studentId));
      });
    });

    return assignedIds.size;
  }, [scopedTeams]);

  // -------------------------------------------------------
  // TOTAL STUDENTS
  // -------------------------------------------------------

  const totalStudents = scopedStudents.length;

  // -------------------------------------------------------
  // AVAILABLE STUDENTS
  // -------------------------------------------------------

  const availableStudentsCount = useMemo(() => {
    const assignedIds = new Set();

    scopedTeams.forEach((team) => {
      getTeamMemberIds(team).forEach((studentId) => {
        assignedIds.add(String(studentId));
      });
    });

    return scopedStudents.filter((student) => {
      const isActive =
        normalize(student?.status) === "active";

      const isAssigned = assignedIds.has(
        String(student?.id)
      );

      return isActive && !isAssigned;
    }).length;
  }, [scopedStudents, scopedTeams]);

  // -------------------------------------------------------
  // CLEAR FILTERS
  // -------------------------------------------------------

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setCourseFilter("");
    setCurrentPage(1);
  };

  // -------------------------------------------------------
  // OPEN CREATE FORM
  // -------------------------------------------------------

  const handleAddTeam = () => {
    if (!adminMode && !mentorMode) {
      showError(
        "You do not have permission to create teams."
      );
      return;
    }

    setSelectedTeam(null);
    setError("");
    setShowForm(true);
  };

  // -------------------------------------------------------
  // OPEN EDIT FORM
  // -------------------------------------------------------

  const handleEditTeam = (team) => {
    if (!canManageTeam(team)) {
      showError(
        "You do not have permission to edit this team."
      );
      return;
    }

    setSelectedTeam(team);
    setError("");
    setShowForm(true);
  };

  // -------------------------------------------------------
  // CLOSE FORM
  // -------------------------------------------------------

  const handleCloseForm = () => {
    if (submitting) return;

    setShowForm(false);
    setSelectedTeam(null);
  };

  // -------------------------------------------------------
  // SAVE TEAM
  // -------------------------------------------------------

  const handleSaveTeam = async (teamData) => {
    try {
      setSubmitting(true);
      setError("");

      // UPDATE
      if (selectedTeam) {
        if (!canManageTeam(selectedTeam)) {
          throw new Error(
            "You do not have permission to update this team."
          );
        }

        const updatedTeam = {
          ...selectedTeam,
          ...teamData,
          id: selectedTeam.id,
        };

        await updateTeam(
          selectedTeam.id,
          updatedTeam
        );

        setTeams((previousTeams) =>
          previousTeams.map((item) =>
            String(item.id) ===
            String(selectedTeam.id)
              ? updatedTeam
              : item
          )
        );

        showSuccess(
          "Team updated successfully."
        );
      }

      // CREATE
      else {
        if (!adminMode && !mentorMode) {
          throw new Error(
            "You do not have permission to create teams."
          );
        }

        const newTeam = {
          ...teamData,
          createdAt: new Date().toISOString(),
        };

        const response = await createTeam(newTeam);

        const savedTeam =
          response?.data || newTeam;

        setTeams((previousTeams) => [
          ...previousTeams,
          savedTeam,
        ]);

        showSuccess(
          "Team created successfully."
        );
      }

      setShowForm(false);
      setSelectedTeam(null);
    } catch (saveError) {
      console.error(
        "Error saving team:",
        saveError
      );

      console.error(
        "API response:",
        saveError?.response?.data
      );

      const message =
        saveError?.response?.data?.message ||
        saveError?.response?.data?.error ||
        saveError?.message ||
        "Unable to save team. Please try again.";

      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------
  // DELETE TEAM
  // -------------------------------------------------------

  const handleDeleteTeam = (team) => {
    if (submitting || !team?.id) return;

    if (!canManageTeam(team)) {
      showError("You do not have permission to delete this team.");
      return;
    }

    setDeleteConfirmation(team);
  };

  const confirmDeleteTeam = async () => {
    const team = deleteConfirmation;
    if (!team?.id || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      await deleteTeam(team.id);

      setTeams((previousTeams) =>
        previousTeams.filter(
          (item) => String(item.id) !== String(team.id)
        )
      );

      setDeleteConfirmation(null);
      showSuccess(`"${team.teamName}" deleted successfully.`);
    } catch (deleteError) {
      console.error("Error deleting team:", deleteError);
      console.error("API response:", deleteError?.response?.data);

      const message =
        deleteError?.response?.data?.message ||
        deleteError?.response?.data?.error ||
        deleteError?.message ||
        "Unable to delete team. Please try again.";

      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------
  // CSV DOWNLOAD
  // -------------------------------------------------------

  const handleDownloadData = () => {
    if (filteredTeams.length === 0) {
      showError(
        "No team data available to download."
      );
      return;
    }

    const headers = [
      "Team ID",
      "Team Name",
      "Course",
      "Department",
      "Team Size",
      "Team Leader",
      "Mentor",
      "Members",
      "Created Date",
    ];

    const rows = filteredTeams.map((team) => {
      const leader = getStudentById(
        students,
        team?.teamLeaderId
      );

      const memberStudents = getTeamMemberIds(team)
        .map((studentId) =>
          getStudentById(students, studentId)
        )
        .filter(Boolean);

      const members = memberStudents
        .map((student) => student.name)
        .join(", ");

      const createdDate = team?.createdAt
        ? new Date(
            team.createdAt
          ).toLocaleDateString()
        : "";

      return [
        team?.id || "",
        team?.teamName || "",
        getTeamCourse(team, students),
        getDepartmentLabel(
          getTeamDepartment(team, students)
        ),
        memberStudents.length,
        leader?.name || "",
        team?.mentorName || "",
        members,
        createdDate,
      ];
    });

    const escapeCSV = (value) => {
      const text = String(value ?? "");

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(escapeCSV),
      ...rows.map((row) =>
        row.map(escapeCSV)
      ),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "teams-data.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showSuccess(
      "Team data downloaded successfully."
    );
  };

  // =========================================================
  // JSX
  // =========================================================

  return (
    <section className="teams-page">

      {/* HEADER */}

      <div className="teams-page-header">
        <div className="teams-heading">
          <div className="teams-heading-icon">
            <FiUsers />
          </div>

          <div>
            <h1>Teams</h1>

            <p>
              {adminMode
                ? "Create and manage project teams across your course."
                : "View department teams and manage your assigned teams."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="add-team-btn"
          onClick={handleAddTeam}
          disabled={submitting}
        >
          <FiPlus />
          <span>Create Team</span>
        </button>
      </div>

      {/* STATS */}

      <div className="teams-stats">

        <div className="team-stat-card">
          <div className="team-stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total Teams</span>
            <strong>{scopedTeams.length}</strong>
          </div>
        </div>

        <div className="team-stat-card">
          <div className="team-stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Total Students</span>
            <strong>{totalStudents}</strong>
          </div>
        </div>

        <div className="team-stat-card">
          <div className="team-stat-icon">
            <FiUserCheck />
          </div>

          <div>
            <span>Assigned Students</span>
            <strong>{totalAssignedStudents}</strong>
          </div>
        </div>

        <div className="team-stat-card">
          <div className="team-stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Available Students</span>
            <strong>{availableStudentsCount}</strong>
          </div>
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="teams-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* TOOLBAR */}

      <div className="teams-toolbar">

        {/* SEARCH */}

        <div className="teams-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Search by team, mentor, leader or department..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        {/* COURSE FILTER */}

        {adminMode && (
          <div className="team-filter-wrapper">
            <FiFilter />

            <select
              className="team-filter-select"
              value={courseFilter}
              onChange={(event) => {
                setCourseFilter(event.target.value);
                setDepartmentFilter("");
              }}
              aria-label="Filter by course"
            >
              <option value="">All Courses</option>

              {courses.map((course) => (
                <option
                  key={course}
                  value={course}
                >
                  {course}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* DEPARTMENT FILTER */}

        <div className="team-filter-wrapper">
          <FiFilter />

          <select
            className="team-filter-select"
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(event.target.value)
            }
            aria-label="Filter by department"
          >
            <option value="">
              All Departments
            </option>

            {filteredDepartments.map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {getDepartmentLabel(department)}
                </option>
              )
            )}
          </select>
        </div>

        {/* CLEAR FILTERS */}

        {(searchTerm ||
          departmentFilter ||
          courseFilter) && (
          <button
            type="button"
            className="clear-team-search"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        )}

        {/* DOWNLOAD */}

        <button
          type="button"
          className="download-teams-btn"
          onClick={handleDownloadData}
          disabled={filteredTeams.length === 0}
        >
          <FiDownload />
          <span>Download</span>
        </button>

      </div>

      {/* CONTENT */}

      {loading ? (
        <Loader text="Loading teams..." />
      ) : filteredTeams.length === 0 ? (

        <div className="teams-empty">
          <div className="teams-empty-icon">
            <FiUsers />
          </div>

          <h3>
            {scopedTeams.length === 0
              ? "No teams created yet"
              : "No matching teams found"}
          </h3>

          <p>
            {scopedTeams.length === 0
              ? "Create your first student project team."
              : "Try another search term, course or department filter."}
          </p>

          {scopedTeams.length === 0 ? (
            <button
              type="button"
              className="add-team-btn"
              onClick={handleAddTeam}
              disabled={submitting}
            >
              <FiPlus />
              <span>Create First Team</span>
            </button>
          ) : (
            <button
              type="button"
              className="clear-team-search"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

      ) : (

        <>

          {/* TEAM CARDS */}

          <div className="teams-grid">

            {paginatedTeams.map((team) => {
              const leader = getStudentById(
                students,
                team?.teamLeaderId
              );

              const memberStudents = getTeamMemberIds(team)
                .map((studentId) =>
                  getStudentById(students, studentId)
                )
                .filter(Boolean);

              const teamSize =
                Number(team?.teamSize) ||
                memberStudents.length;

              const department = getTeamDepartment(
                team,
                students
              );

              const course = getTeamCourse(
                team,
                students
              );

              const canManage = canManageTeam(team);

              return (
                <article
                  className="team-card"
                  key={team.id}
                >

                  {/* CARD TOP */}

                  <div className="team-card-top">
                    <div className="team-card-icon">
                      <FiUsers />
                    </div>

                    <div className="team-card-actions">

                      <button
                        type="button"
                        className="team-view-btn"
                        onClick={() => setViewTeam(team)}
                        title="View Team"
                        aria-label={`View ${team?.teamName || "team"}`}
                      >
                        <FiEye />
                      </button>

                      {canManage ? (
                        <>
                          <button
                            type="button"
                            className="team-edit-btn"
                            onClick={() =>
                              handleEditTeam(team)
                            }
                            disabled={submitting}
                            title="Edit Team"
                            aria-label="Edit Team"
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            className="team-delete-btn"
                            onClick={() =>
                              handleDeleteTeam(team)
                            }
                            disabled={submitting}
                            title="Delete Team"
                            aria-label="Delete Team"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      ) : (
                        <span className="team-readonly-badge">
                          View Only
                        </span>
                      )}

                    </div>
                  </div>

                  {/* TEAM TITLE */}

                  <div className="team-card-title">
                    <div>
                      <h3>
                        {team?.teamName ||
                          "Unnamed Team"}
                      </h3>

                      <span>
                        {team?.id || "No ID"}
                      </span>
                    </div>

                    <span className="team-department-badge">
                      {getDepartmentLabel(department)}
                    </span>
                  </div>

                  {/* TEAM INFORMATION */}

                  <div className="team-card-info">

                    <div>
                      <span>
                        Course - Department
                      </span>

                      <strong>
                        {course || "Not Available"} -{" "}
                        {getDepartmentLabel(department)}
                      </strong>
                    </div>

                    <div>
                      <span>Team Size</span>

                      <strong>
                        {memberStudents.length} / {teamSize}
                      </strong>
                    </div>

                    <div>
                      <span>Mentor</span>

                      <strong>
                        {team?.mentorName ||
                          "Not Available"}
                      </strong>
                    </div>

                    <div>
                      <span>Team Leader</span>

                      <strong>
                        {leader?.name ||
                          "Not Available"}
                      </strong>
                    </div>

                  </div>

                  {/* TEAM MEMBERS */}

                  <div className="team-members-preview">

                    <div className="team-members-preview-header">
                      <span>Team Members</span>

                      <strong>
                        {memberStudents.length}
                      </strong>
                    </div>

                    <div className="member-avatar-group">

                      {memberStudents
                        .slice(0, 5)
                        .map((student) => (
                          <div
                            className="member-preview-avatar"
                            key={student.id}
                            title={student.name}
                          >
                            {student.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>
                        ))}

                      {memberStudents.length > 5 && (
                        <div className="member-more">
                          +
                          {memberStudents.length - 5}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* CARD FOOTER */}

                  <div className="team-card-footer">
                    <span>
                      {memberStudents.length} Student
                      {memberStudents.length !== 1
                        ? "s"
                        : ""}
                    </span>

                    <span>
                      Created{" "}
                      {team?.createdAt
                        ? new Date(
                            team.createdAt
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                </article>
              );
            })}

          </div>

          {/* PAGINATION */}

          {totalPages > 1 && (
            <div className="teams-pagination">

              <button
                type="button"
                className="teams-pagination-btn"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                Previous
              </button>

              <div className="teams-pagination-pages">
                {pageNumbers.map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`teams-pagination-page ${
                      currentPage === page
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handlePageChange(page)
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
                ))}
              </div>

              <button
                type="button"
                className="teams-pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
              </button>

            </div>
          )}

        </>
      )}

      {/* VIEW TEAM DETAILS MODAL */}
      {viewTeam && (() => {
        const viewMembers = getTeamMemberIds(viewTeam)
          .map((studentId) => getStudentById(students, studentId))
          .filter(Boolean);

        const viewLeader =
          getStudentById(students, viewTeam.teamLeaderId) ||
          viewMembers.find(
            (student) =>
              String(student.id) === String(viewTeam.leaderId)
          );

        const viewCourse = getTeamCourse(viewTeam, students);
        const viewDepartment = getTeamDepartment(viewTeam, students);

        return (
          <div
            className="team-view-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setViewTeam(null);
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              background: "rgba(15, 23, 42, 0.58)",
              backdropFilter: "blur(3px)",
            }}
          >
            <div
              className="team-view-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="team-view-title"
              style={{
                width: "100%",
                maxWidth: "620px",
                maxHeight: "85vh",
                overflowY: "auto",
                padding: "26px",
                borderRadius: "16px",
                background: "var(--bg-card, #fff)",
                color: "var(--text-primary, #172033)",
                border: "1px solid var(--border, #e2e8f0)",
                boxShadow: "0 24px 70px rgba(0,0,0,.24)",
              }}
            >
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:20}}>
                <div>
                  <h2 id="team-view-title" style={{margin:"0 0 5px",fontSize:22}}>
                    {viewTeam.teamName || "Team Details"}
                  </h2>
                  <span style={{color:"var(--text-secondary, #64748b)",fontSize:13}}>
                    Team ID: {viewTeam.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewTeam(null)}
                  aria-label="Close team details"
                  style={{
                    width:38,height:38,borderRadius:9,
                    border:"1px solid var(--border, #e2e8f0)",
                    background:"transparent",color:"inherit",
                    cursor:"pointer",fontSize:20,
                  }}
                >
                  <FiX />
                </button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
                {[
                  ["Course", viewCourse || "Not Available"],
                  ["Department", getDepartmentLabel(viewDepartment)],
                  ["Team Size", `${viewMembers.length} / ${viewTeam.teamSize || viewMembers.length}`],
                  ["Mentor", viewTeam.mentorName || "Not Available"],
                  ["Team Leader", viewLeader?.name || viewTeam.teamLeaderName || "Not Available"],
                  ["Created Date", viewTeam.createdAt ? new Date(viewTeam.createdAt).toLocaleDateString() : "Not Available"],
                ].map(([label, value]) => (
                  <div key={label} style={{padding:14,borderRadius:10,background:"var(--bg-secondary, #f8fafc)",border:"1px solid var(--border, #e2e8f0)"}}>
                    <div style={{fontSize:12,color:"var(--text-secondary, #64748b)",marginBottom:6}}>{label}</div>
                    <strong style={{fontSize:15,fontWeight:600}}>{value}</strong>
                  </div>
                ))}
              </div>

              <div style={{marginTop:22}}>
                <h3 style={{fontSize:16,margin:"0 0 12px"}}>Team Members ({viewMembers.length})</h3>
                <div style={{display:"grid",gap:9}}>
                  {viewMembers.length ? viewMembers.map((student, index) => (
                    <div key={student.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 13px",borderRadius:10,border:"1px solid var(--border, #e2e8f0)"}}>
                      <span style={{width:32,height:32,flexShrink:0,display:"grid",placeItems:"center",borderRadius:"50%",background:"var(--primary-soft, #eaf2fb)",color:"var(--primary, #205a9e)",fontWeight:600}}>
                        {index + 1}
                      </span>
                      <div>
                        <div style={{fontWeight:600}}>{student.name || "Unnamed Student"}</div>
                        <div style={{fontSize:12,color:"var(--text-secondary, #64748b)"}}>
                          Student ID: {student.studentId || student.id}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p style={{color:"var(--text-secondary, #64748b)"}}>No team members found.</p>
                  )}
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"flex-end",marginTop:22}}>
                <button
                  type="button"
                  onClick={() => setViewTeam(null)}
                  style={{padding:"10px 20px",borderRadius:9,border:"1px solid var(--border, #cbd5e1)",background:"transparent",color:"inherit",fontWeight:600,cursor:"pointer"}}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DELETE TEAM CONFIRMATION MODAL */}
      {deleteConfirmation && (
        <div
          className="team-delete-confirm-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !submitting
            ) {
              setDeleteConfirmation(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(15, 23, 42, 0.58)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            className="team-delete-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-delete-confirm-title"
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "28px",
              borderRadius: "16px",
              background: "var(--bg-card, #ffffff)",
              color: "var(--text-primary, #172033)",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.24)",
              border: "1px solid var(--border, #e2e8f0)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: "52px",
                height: "52px",
                display: "grid",
                placeItems: "center",
                marginBottom: "18px",
                borderRadius: "14px",
                background: "#fff1f2",
                color: "#dc2626",
                fontSize: "24px",
              }}
            >
              <FiAlertTriangle />
            </div>

            <h2
              id="team-delete-confirm-title"
              style={{ margin: "0 0 10px", fontSize: "21px" }}
            >
              Delete Team?
            </h2>

            <p
              style={{
                margin: "0",
                lineHeight: 1.65,
                color: "var(--text-secondary, #64748b)",
              }}
            >
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--text-primary, #172033)" }}>
                "{deleteConfirmation.teamName}"
              </strong>
              ? This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "26px",
              }}
            >
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                disabled={submitting}
                style={{
                  padding: "10px 18px",
                  borderRadius: "9px",
                  border: "1px solid var(--border, #cbd5e1)",
                  background: "transparent",
                  color: "var(--text-primary, #334155)",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteTeam}
                disabled={submitting}
                style={{
                  padding: "10px 18px",
                  borderRadius: "9px",
                  border: "1px solid #dc2626",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAM FORM */}

      {showForm && (
        <TeamForm
          team={selectedTeam}
          students={scopedStudents}
          teams={scopedTeams}
          onSubmit={handleSaveTeam}
          onClose={handleCloseForm}
          submitting={submitting}
          isAdmin={adminMode}
          isMentor={mentorMode}
          currentUser={loggedInUser}
          userCourse={currentCourse}
          userDepartment={currentDepartment}
        />
      )}

    </section>
  );
}

export default Teams;