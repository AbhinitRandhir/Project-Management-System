
import {
  useContext,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiRefreshCw,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

import api from "../../services/api";
import AuthContext from "../../context/AuthContext";

import "./Dashboard.css";

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const getValidDate = (date) => {
  if (!date) return 0;

  const timestamp = new Date(date).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getRecordCourse = (record) =>
  record?.course || record?.courseName || "";

const getRecordDepartment = (record) =>
  record?.department || record?.departmentName || "";

const formatDate = (date) => {
  if (!date) return "Not Available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not Available";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =====================================================
   FETCH DASHBOARD DATA
===================================================== */

const loadDashboardData = async () => {
  const [
    studentsResponse,
    teamsResponse,
    projectsResponse,
    reviewsResponse,
    adminsResponse,
  ] = await Promise.all([
    api.get("/students"),
    api.get("/teams"),
    api.get("/projects"),
    api.get("/reviews"),
    api.get("/admins"),
  ]);

  return {
    students: Array.isArray(studentsResponse.data)
      ? studentsResponse.data
      : [],

    teams: Array.isArray(teamsResponse.data)
      ? teamsResponse.data
      : [],

    projects: Array.isArray(projectsResponse.data)
      ? projectsResponse.data
      : [],

    reviews: Array.isArray(reviewsResponse.data)
      ? reviewsResponse.data
      : [],

    admins: Array.isArray(adminsResponse.data)
      ? adminsResponse.data
      : [],
  };
};

/* =====================================================
   DASHBOARD COMPONENT
===================================================== */

function Dashboard() {
  const {
    currentUser,
    isAdmin,
    canAccessData,
  } = useContext(AuthContext);

  /* ===================================================
     STATES
  =================================================== */

  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  // Keep the header clock current while the dashboard is open.
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const formattedCurrentDate = currentDateTime.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedCurrentTime = currentDateTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  /* ===================================================
     INITIAL DATA FETCH
  =================================================== */

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const data = await loadDashboardData();

        if (!isMounted) return;

        setStudents(data.students);
        setTeams(data.teams);
        setProjects(data.projects);
        setReviews(data.reviews);
        setAdmins(data.admins);
        setError("");
      } catch (err) {
        console.error("Dashboard data error:", err);

        if (isMounted) {
          setError(
            "Unable to load dashboard data. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ===================================================
     REFRESH DASHBOARD
  =================================================== */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      const data = await loadDashboardData();

      setStudents(data.students);
      setTeams(data.teams);
      setProjects(data.projects);
      setReviews(data.reviews);
      setAdmins(data.admins);
    } catch (err) {
      console.error("Dashboard refresh error:", err);

      setError(
        "Unable to refresh dashboard data. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* ===================================================
     ROLE-BASED DATA ACCESS
  =================================================== */

  const hasAccess = (record) =>
    canAccessData(
      getRecordCourse(record),
      getRecordDepartment(record)
    );

  const scopedStudents = students.filter(hasAccess);
  const scopedTeams = teams.filter(hasAccess);
  const scopedProjects = projects.filter(hasAccess);
  const scopedReviews = reviews.filter(hasAccess);

  const scopedAdmins = admins.filter((account) => {
    const role = normalize(account?.role);

    return (
      canAccessData(
        getRecordCourse(account),
        getRecordDepartment(account)
      ) &&
      ["admin", "mentor"].includes(role)
    );
  });

  /* ===================================================
     PROJECT HELPERS
  =================================================== */

  const getProjectName = (project) =>
    project?.projectName ||
    project?.name ||
    "Not Available";

  const getProjectProgress = (project) => {
    const projectReviews = scopedReviews
      .filter(
        (review) =>
          String(review?.projectId) ===
          String(project?.id)
      )
      .sort((a, b) => {
        const dateDifference =
          getValidDate(
            b?.reviewDate || b?.createdAt
          ) -
          getValidDate(
            a?.reviewDate || a?.createdAt
          );

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return (
          Number(b?.reviewNumber || 0) -
          Number(a?.reviewNumber || 0)
        );
      });

    const progress = Number(
      projectReviews[0]?.progress ?? 0
    );

    if (!Number.isFinite(progress)) return 0;

    return Math.min(Math.max(progress, 0), 100);
  };

  /* ===================================================
     TEAM HELPERS
  =================================================== */

  const getTeamName = (project) => {
    if (project?.teamName) {
      return project.teamName;
    }

    const team = scopedTeams.find(
      (item) =>
        String(item?.id) ===
        String(project?.teamId)
    );

    return team?.teamName || "Not Assigned";
  };

  const getTeamLeader = (team) => {
    const leader = scopedStudents.find(
      (student) =>
        String(student?.id) ===
        String(team?.teamLeaderId)
    );

    return (
      leader?.name ||
      team?.teamLeaderName ||
      "Not Available"
    );
  };

  const getMemberCount = (team) => {
    if (Array.isArray(team?.members)) {
      return team.members.length;
    }

    if (Array.isArray(team?.studentIds)) {
      return team.studentIds.length;
    }

    return Number(team?.memberCount || 0);
  };

  /* ===================================================
     REVIEW HELPERS
  =================================================== */

  const getReviewProject = (review) => {
    if (review?.projectName) {
      return review.projectName;
    }

    const project = scopedProjects.find(
      (item) =>
        String(item?.id) ===
        String(review?.projectId)
    );

    return getProjectName(project);
  };

  const getReviewTeam = (review) => {
    if (review?.teamName) {
      return review.teamName;
    }

    const team = scopedTeams.find(
      (item) =>
        String(item?.id) ===
        String(review?.teamId)
    );

    return team?.teamName || "Not Assigned";
  };

  const getReviewRating = (review) => {
    const rating = Number(review?.rating);

    return Number.isFinite(rating) &&
      review?.rating !== "" &&
      review?.rating !== null &&
      review?.rating !== undefined
      ? rating
      : null;
  };

  /* ===================================================
     PROJECT STATUS STATISTICS
  =================================================== */

  const projectStats = {
    inProgress: 0,
    completed: 0,
    notStarted: 0,
  };

  scopedProjects.forEach((project) => {
    const progress = getProjectProgress(project);

    if (progress >= 100) {
      projectStats.completed += 1;
    } else if (progress > 0) {
      projectStats.inProgress += 1;
    } else {
      projectStats.notStarted += 1;
    }
  });

  /* ===================================================
     PROJECT PROGRESS DISTRIBUTION
  =================================================== */

  const progressStats = {
    starting: 0,
    developing: 0,
    progressing: 0,
    nearCompletion: 0,
    completed: 0,
  };

  scopedProjects.forEach((project) => {
    const progress = getProjectProgress(project);

    if (progress <= 25) {
      progressStats.starting += 1;
    } else if (progress <= 50) {
      progressStats.developing += 1;
    } else if (progress <= 75) {
      progressStats.progressing += 1;
    } else if (progress < 100) {
      progressStats.nearCompletion += 1;
    } else {
      progressStats.completed += 1;
    }
  });

  /* ===================================================
     REVIEW STATISTICS
  =================================================== */

  const totalReviewSlots = scopedProjects.length * 5;

  const completedReviews = scopedReviews.length;

  const pendingReviews = Math.max(
    totalReviewSlots - completedReviews,
    0
  );

  /* ===================================================
     RECENT RECORDS
  =================================================== */

  const recentProjects = [...scopedProjects]
    .sort(
      (a, b) =>
        getValidDate(b?.createdAt) -
        getValidDate(a?.createdAt)
    )
    .slice(0, 3);

  const recentTeams = [...scopedTeams]
    .sort(
      (a, b) =>
        getValidDate(b?.createdAt) -
        getValidDate(a?.createdAt)
    )
    .slice(0, 3);

  const recentReviews = [...scopedReviews]
    .sort(
      (a, b) =>
        getValidDate(
          b?.createdAt || b?.reviewDate
        ) -
        getValidDate(
          a?.createdAt || a?.reviewDate
        )
    )
    .slice(0, 3);

  /* ===================================================
     LOADING STATE
  =================================================== */

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loader" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  /* ===================================================
     ERROR STATE
  =================================================== */

  if (error && students.length === 0 &&
      teams.length === 0 &&
      projects.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <div className="dashboard-error-icon">
            <FiAlertCircle />
          </div>

          <h2>Unable to Load Dashboard</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw />
            <span>
              {refreshing ? "Retrying..." : "Try Again"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  /* ===================================================
     MAIN DASHBOARD
  =================================================== */

  return (
    <div className="dashboard-page">

      {/* WELCOME HEADER */}

      <section className="dashboard-header-card">
        <div className="dashboard-header">

          <div className="dashboard-header-content">
            <span className="dashboard-label">
              {isAdmin
                ? "Course Overview"
                : "Department Overview"}
            </span>

            <h1>Project Dashboard</h1>

            <p>
              Welcome back{" "}
              <strong>
                {currentUser?.name || "User"}
              </strong>
              . Here is an overview of your project
              management system.
            </p>

            <p>
              <strong>Course:</strong>{" "}
              {currentUser?.course ||
                currentUser?.courseName ||
                "Not Assigned"}

              {!isAdmin && (
                <>
                  {" | "}
                  <strong>Department:</strong>{" "}
                  {currentUser?.department ||
                    currentUser?.departmentName ||
                    "Not Assigned"}
                </>
              )}
            </p>
          </div>

          <div className="dashboard-header-actions">
            <div
              className="dashboard-current-datetime"
              aria-live="off"
              aria-label={`Current date ${formattedCurrentDate}, current time ${formattedCurrentTime}`}
            >
              <div className="dashboard-current-date">{formattedCurrentDate}</div>
              <div className="dashboard-current-time">{formattedCurrentTime}</div>
            </div>

            <button
              type="button"
              className="dashboard-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw
                className={
                  refreshing
                    ? "dashboard-refreshing"
                    : ""
                }
              />

              <span>
                {refreshing
                  ? "Refreshing..."
                  : "Refresh Data"}
              </span>
            </button>
          </div>

        </div>
      </section>

      {/* KEY STATISTICS */}

      <section
        className={`dashboard-stats ${
          isAdmin ? "dashboard-stats-super" : ""
        }`}
      >

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon students">
            <FiUsers />
          </div>

          <div className="dashboard-stat-content">
            <span>Total Students</span>
            <strong>{scopedStudents.length}</strong>
            <small className="dashboard-stat-description">
              Students registered in the system
            </small>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon teams">
            <FiUserCheck />
          </div>

          <div className="dashboard-stat-content">
            <span>Total Teams</span>
            <strong>{scopedTeams.length}</strong>
            <small className="dashboard-stat-description">
              Teams formed for projects
            </small>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon projects">
            <FiFolder />
          </div>

          <div className="dashboard-stat-content">
            <span>Total Projects</span>
            <strong>{scopedProjects.length}</strong>
            <small className="dashboard-stat-description">
              Team-based projects created
            </small>
          </div>
        </article>

        {isAdmin && (
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon admins">
              <FiShield />
            </div>

            <div className="dashboard-stat-content">
              <span>Course Staff Accounts</span>
              <strong>{scopedAdmins.length}</strong>
              <small className="dashboard-stat-description">
                Admin and mentor accounts
              </small>
            </div>
          </article>
        )}

      </section>

      {/* PROJECT STATUS */}

      <section className="dashboard-panel dashboard-status-section dashboard-status-panel">

        <div className="dashboard-panel-header">
          <div>
            <h2>Project Status Overview</h2>
            <p>
              Track how many projects are underway,
              completed, or yet to begin.
            </p>
          </div>

          <div className="dashboard-panel-header-icon">
            <FiTrendingUp />
          </div>
        </div>

        <div className="dashboard-status-cards">

          <article className="dashboard-status-card">
            <div className="dashboard-status-card-icon active">
              <FiTrendingUp />
            </div>

            <div>
              <span>In Progress</span>
              <strong>{projectStats.inProgress}</strong>
              <small className="dashboard-status-description">
                Work is currently ongoing
              </small>
            </div>
          </article>

          <article className="dashboard-status-card">
            <div className="dashboard-status-card-icon completed">
              <FiCheckCircle />
            </div>

            <div>
              <span>Completed</span>
              <strong>{projectStats.completed}</strong>
              <small className="dashboard-status-description">
                Projects successfully finished
              </small>
            </div>
          </article>

          <article className="dashboard-status-card">
            <div className="dashboard-status-card-icon pending">
              <FiClock />
            </div>

            <div>
              <span>Not Started</span>
              <strong>{projectStats.notStarted}</strong>
              <small className="dashboard-status-description">
                Work has not yet begun
              </small>
            </div>
          </article>

        </div>
      </section>

      {/* PROJECT PROGRESS DISTRIBUTION */}

      <section className="dashboard-panel dashboard-progress-panel">

        <div className="dashboard-panel-header">
          <div>
            <h2>Project Progress Distribution</h2>
            <p>
              Number of projects grouped by their
              latest recorded completion percentage.
            </p>
          </div>

          <div className="dashboard-panel-header-icon">
            <FiBarChart2 />
          </div>
        </div>

        <div className="dashboard-progress-grid">

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon starting">
              <FiClock />
            </div>

            <span>Starting</span>
            <strong>{progressStats.starting}</strong>
            <small>0% – 25% complete</small>
          </div>

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon developing">
              <FiBarChart2 />
            </div>

            <span>Developing</span>
            <strong>{progressStats.developing}</strong>
            <small>26% – 50% complete</small>
          </div>

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon progressing">
              <FiTrendingUp />
            </div>

            <span>Progressing</span>
            <strong>{progressStats.progressing}</strong>
            <small>51% – 75% complete</small>
          </div>

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon near-completion">
              <FiTarget />
            </div>

            <span>Near Completion</span>
            <strong>{progressStats.nearCompletion}</strong>
            <small>76% – 99% complete</small>
          </div>

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon completed">
              <FiCheckCircle />
            </div>

            <span>Completed</span>
            <strong>{progressStats.completed}</strong>
            <small>100% complete</small>
          </div>

        </div>
      </section>

      {/* PROJECT REVIEW TRACKING */}

      <section className="dashboard-panel dashboard-progress-panel dashboard-review-panel">

        <div className="dashboard-panel-header">
          <div>
            <h2>Project Review Tracking</h2>
            <p>
              Monitor submitted reviews and the review
              stages still outstanding. Five review
              stages are planned per project.
            </p>
          </div>

          <div className="dashboard-panel-header-icon">
            <FiCheckCircle />
          </div>
        </div>

        <div
          className="dashboard-progress-grid dashboard-review-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            width: "100%",
          }}
        >

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon completed">
              <FiCheckCircle />
            </div>

            <span>Completed Reviews</span>
            <strong>{completedReviews}</strong>
            <small>Reviews submitted</small>
          </div>

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon developing">
              <FiClock />
            </div>

            <span>Pending Reviews</span>
            <strong>{pendingReviews}</strong>
            <small>Review slots remaining</small>
          </div>

          <div className="dashboard-progress-item">
            <div className="dashboard-progress-icon progressing">
              <FiBarChart2 />
            </div>

            <span>Total Review Slots</span>
            <strong>{totalReviewSlots}</strong>
            <small>Five per project</small>
          </div>

        </div>
      </section>

      {/* RECENT ACTIVITY */}

      <section className="dashboard-panel dashboard-recent-section dashboard-activity-panel">

        <div className="dashboard-section-heading dashboard-activity-heading">
          <h2>Recent Activity</h2>
          <p>
            Latest records from projects, teams,
            and reviews.
          </p>
        </div>

        {/* RECENT PROJECTS */}

        <section className="dashboard-panel dashboard-recent-card">

          <div className="dashboard-panel-header dashboard-section-header">
            <div>
              <h2>Recent Projects</h2>
              <p>
                The three most recently created projects
                and their current progress.
              </p>
            </div>

            <Link
              to="/projects"
              className="dashboard-view-all"
            >
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>

          {recentProjects.length > 0 ? (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Team</th>
                    <th>Progress</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {recentProjects.map((project) => {
                    const progress =
                      getProjectProgress(project);

                    return (
                      <tr key={project.id}>
                        <td>
                          <div className="dashboard-project-name">
                            <strong>
                              {getProjectName(project)}
                            </strong>

                            <span>#{project.id}</span>
                          </div>
                        </td>

                        <td>{getTeamName(project)}</td>

                        <td>
                          <div className="dashboard-progress-value">
                            <div className="dashboard-progress-bar">
                              <span
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>

                            <small>{progress}%</small>
                          </div>
                        </td>

                        <td>
                          {formatDate(project?.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-no-data">
              <FiFolder />
              <p>No project records available.</p>
            </div>
          )}

        </section>

        {/* RECENT TEAMS */}

        <section className="dashboard-panel dashboard-recent-card">

          <div className="dashboard-panel-header dashboard-section-header">
            <div>
              <h2>Recent Teams</h2>
              <p>
                The three most recently created teams,
                their leaders, and member counts.
              </p>
            </div>

            <Link
              to="/teams"
              className="dashboard-view-all"
            >
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>

          {recentTeams.length > 0 ? (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Team Leader</th>
                    <th>Members</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTeams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <div className="dashboard-project-name">
                          <strong>
                            {team?.teamName ||
                              "Not Available"}
                          </strong>

                          <span>#{team.id}</span>
                        </div>
                      </td>

                      <td>{getTeamLeader(team)}</td>
                      <td>{getMemberCount(team)}</td>
                      <td>{formatDate(team?.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-no-data">
              <FiUsers />
              <p>No team records available.</p>
            </div>
          )}

        </section>

        {/* RECENT REVIEWS */}

        <section className="dashboard-panel dashboard-recent-card">

          <div className="dashboard-panel-header dashboard-section-header">
            <div>
              <h2>Recent Reviews</h2>
              <p>
                The three most recently recorded
                project evaluations.
              </p>
            </div>

            <Link
              to="/reviews"
              className="dashboard-view-all"
            >
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>

          {recentReviews.length > 0 ? (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Team</th>
                    <th>Review</th>
                    <th>Rating</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentReviews.map((review) => {
                    const rating =
                      getReviewRating(review);

                    return (
                      <tr key={review.id}>
                        <td>{getReviewProject(review)}</td>
                        <td>{getReviewTeam(review)}</td>

                        <td>
                          Review {review?.reviewNumber || "-"}
                        </td>

                        <td>
                          <span className="dashboard-rating">
                            {rating !== null
                              ? `${rating}/5`
                              : "Not Rated"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            review?.reviewDate ||
                              review?.createdAt
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-no-data">
              <FiFolder />
              <p>No review records available.</p>
            </div>
          )}

        </section>

      </section>
    </div>
  );
}

export default Dashboard;