
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiCode,
  FiEdit2,
  FiFileText,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Loader from "../../components/Loader/Loader";

import { getProjectById } from "../../services/projectService";
import { getTeamById } from "../../services/teamService";
import { getStudents } from "../../services/studentService";
import { getReviews } from "../../services/reviewService";

import { useAuth } from "../../context/AuthContext";

import "./ProjectDetails.css";

/* =========================================================
   HELPERS
========================================================= */

const getId = (value) =>
  value === undefined || value === null
    ? ""
    : String(value);

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const getMemberIds = (team) => {
  if (!team) return [];

  if (Array.isArray(team.members)) {
    return team.members
      .map((member) =>
        typeof member === "object" && member !== null
          ? member.id || member.studentId
          : member
      )
      .filter(Boolean)
      .map(String);
  }

  if (Array.isArray(team.memberIds)) {
    return team.memberIds.filter(Boolean).map(String);
  }

  if (Array.isArray(team.studentIds)) {
    return team.studentIds.filter(Boolean).map(String);
  }

  return [];
};

const getLeaderId = (team) =>
  team?.teamLeaderId ||
  team?.leaderId ||
  team?.teamLeader?.id ||
  team?.leader?.id ||
  "";

const getDate = (date) => {
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

const getInitials = (name) => {
  if (!name) return "NA";

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const getProgressValue = (review) => {
  const value = Number(review?.progress ?? 0);

  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, value));
};

/* =========================================================
   PROJECT DETAILS
========================================================= */

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    user,
    isAdmin,
    isMentor,
    userCourse,
    userDepartment,
    hasDepartmentAccess,
  } = useAuth();

  const [project, setProject] = useState(null);
  const [team, setTeam] = useState(null);
  const [students, setStudents] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD PROJECT DETAILS
  ========================================================= */

  useEffect(() => {
    let active = true;

    const loadProjectDetails = async () => {
      try {
        setLoading(true);
        setError("");

        setProject(null);
        setTeam(null);
        setStudents([]);
        setReviews([]);

        const projectResponse = await getProjectById(id);
        const projectData = projectResponse?.data;

        if (!projectData) {
          throw new Error("Project not found.");
        }

        if (!active) return;

        setProject(projectData);

        const requests = await Promise.allSettled([
          projectData.teamId
            ? getTeamById(projectData.teamId)
            : Promise.resolve({ data: null }),

          getStudents(),

          getReviews(),
        ]);

        if (!active) return;

        const [teamResult, studentResult, reviewResult] =
          requests;

        if (teamResult.status === "fulfilled") {
          setTeam(teamResult.value?.data || null);
        } else {
          console.error(
            "Unable to load team:",
            teamResult.reason
          );
        }

        if (studentResult.status === "fulfilled") {
          const studentData = studentResult.value?.data;

          setStudents(
            Array.isArray(studentData) ? studentData : []
          );
        } else {
          console.error(
            "Unable to load students:",
            studentResult.reason
          );
        }

        if (reviewResult.status === "fulfilled") {
          const allReviews = Array.isArray(
            reviewResult.value?.data
          )
            ? reviewResult.value.data
            : [];

          const projectReviews = allReviews.filter(
            (review) =>
              getId(review.projectId) === getId(projectData.id)
          );

          setReviews(projectReviews);
        } else {
          console.error(
            "Unable to load reviews:",
            reviewResult.reason
          );
        }
      } catch (requestError) {
        if (!active) return;

        console.error(
          "Unable to load project details:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load project details."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadProjectDetails();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Project ID is missing.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  /* =========================================================
     TEAM MEMBERS
  ========================================================= */

  const memberIds = getMemberIds(team);

  const members = memberIds
    .map((memberId) =>
      students.find(
        (student) => getId(student.id) === getId(memberId)
      )
    )
    .filter(Boolean);

  /* =========================================================
     TEAM LEADER
  ========================================================= */

  const leader = students.find(
    (student) =>
      getId(student.id) === getId(getLeaderId(team))
  );

  const leaderName =
    leader?.name ||
    team?.teamLeaderName ||
    project?.teamLeaderName ||
    "Not Available";

  /* =========================================================
     REVIEW HISTORY
  ========================================================= */

  const sortedReviews = [...reviews].sort((a, b) => {
    const dateA = new Date(
      a.reviewDate || a.createdAt || 0
    ).getTime();

    const dateB = new Date(
      b.reviewDate || b.createdAt || 0
    ).getTime();

    if (dateB !== dateA) {
      return dateB - dateA;
    }

    return (
      Number(b.reviewNumber || 0) -
      Number(a.reviewNumber || 0)
    );
  });

  const latestReview = sortedReviews[0] || null;

  const progress = getProgressValue(latestReview);

  const progressColor =
    progress >= 100
      ? "#16a34a"
      : progress >= 70
        ? "#2563eb"
        : progress >= 40
          ? "#d97706"
          : "#dc2626";

  const projectStatus =
    progress >= 100
      ? "Completed"
      : progress > 0
        ? "In Progress"
        : "Not Started";

  const reviewCount =
    reviews.length > 0
      ? reviews.length
      : Number(project?.reviewCount ?? 0);

  /* =========================================================
     ROLE-BASED EDIT PERMISSION
  ========================================================= */

  const projectCourse =
    team?.course || project?.course || "";

  const projectDepartment =
    team?.department || project?.department || "";

  const isOwnTeam = () => {
    if (!team || !isMentor) return false;

    const currentMentorId = getId(user?.id);
    const assignedMentorId = getId(team.mentorId);

    if (currentMentorId && assignedMentorId) {
      return currentMentorId === assignedMentorId;
    }

    return (
      normalize(team.mentorName) === normalize(user?.name)
    );
  };

  const hasScopeAccess = () => {
    if (isAdmin) {
      return (
        Boolean(userCourse) &&
        normalize(projectCourse) === normalize(userCourse)
      );
    }

    if (isMentor) {
      if (typeof hasDepartmentAccess === "function") {
        return hasDepartmentAccess(
          projectCourse,
          projectDepartment
        );
      }

      return (
        normalize(projectCourse) === normalize(userCourse) &&
        normalize(projectDepartment) ===
          normalize(userDepartment)
      );
    }

    return false;
  };

  const canEditProject =
    hasScopeAccess() &&
    (isAdmin || (isMentor && isOwnTeam()));

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleBack = () => {
    navigate("/projects");
  };

  const handleEdit = () => {
    if (!canEditProject) return;

    navigate("/projects", {
      state: {
        editProject: project,
      },
    });
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="project-details-page-state">
        <Loader />
      </div>
    );
  }

  /* =========================================================
     ERROR STATE
  ========================================================= */

  if (error || !project) {
    return (
      <div className="project-details-page-state">
        <div className="project-details-error">
          <div className="project-details-error-icon">
            <FiX />
          </div>

          <h2>Project Not Found</h2>

          <p>
            {error ||
              "The requested project could not be found."}
          </p>

          <button
            type="button"
            className="project-details-back-btn"
            onClick={handleBack}
          >
            <FiArrowLeft />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="project-details-page">

      {/* PAGE HEADER */}

      <div className="project-details-page-header">
        <button
          type="button"
          className="project-details-back-btn"
          onClick={handleBack}
        >
          <FiArrowLeft />
          Back to Projects
        </button>

        {canEditProject && (
          <button
            type="button"
            className="project-details-edit-page-btn"
            onClick={handleEdit}
          >
            <FiEdit2 />
            Edit Project
          </button>
        )}
      </div>

      {/* MAIN CARD */}

      <div className="project-details-card">

        {/* PROJECT HEADER */}

        <div className="project-details-header">
          <div className="project-details-header-content">
            <div className="project-details-title-icon">
              <FiFileText />
            </div>

            <div>
              <span className="project-details-id">
                Project ID: {project.id}
              </span>

              <h1>
                {project.projectName || "Untitled Project"}
              </h1>

              <p>Project and team information</p>
            </div>
          </div>

          <button
            type="button"
            className="project-details-close"
            onClick={handleBack}
            title="Close"
            aria-label="Close project details"
          >
            <FiX />
          </button>
        </div>

        {/* PROGRESS */}

        <div className="project-details-progress-section">
          <div className="project-details-progress-header">
            <div>
              <span>Project Progress</span>

              <strong style={{ color: progressColor }}>
                {progress}%
              </strong>
            </div>

            <span
              className={`project-details-status project-status-${projectStatus
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {projectStatus}
            </span>
          </div>

          <div className="project-details-progress-track">
            <div
              className="project-details-progress-fill"
              style={{
                width: `${progress}%`,
                background: progressColor,
              }}
            />
          </div>

          <div className="project-details-progress-footer">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* PROJECT INFORMATION */}

        <div className="project-details-section">
          <div className="project-details-section-title">
            <FiFileText />
            <h2>Project Information</h2>
          </div>

          <div className="project-details-info-grid">
            <div className="project-details-info-item">
              <span>Project Name</span>
              <strong>
                {project.projectName || "Not Available"}
              </strong>
            </div>

            <div className="project-details-info-item">
              <span>Project ID</span>
              <strong>{project.id || "Not Available"}</strong>
            </div>

            <div className="project-details-info-item">
              <span>Team Name</span>
              <strong>
                {team?.teamName ||
                  project.teamName ||
                  "Not Available"}
              </strong>
            </div>

            <div className="project-details-info-item">
              <span>Team ID</span>
              <strong>
                {team?.id ||
                  project.teamId ||
                  "Not Available"}
              </strong>
            </div>

            <div className="project-details-info-item">
              <span>Course</span>
              <strong>
                {projectCourse || "Not Available"}
              </strong>
            </div>

            <div className="project-details-info-item">
              <span>Department</span>
              <strong>
                {projectDepartment || "Not Available"}
              </strong>
            </div>

            <div className="project-details-info-item">
              <span>Mentor</span>
              <strong>
                {team?.mentorName ||
                  project.mentorName ||
                  "Not Available"}
              </strong>
            </div>

            <div className="project-details-info-item">
              <span>Team Leader</span>
              <strong>{leaderName}</strong>
            </div>

            <div className="project-details-info-item">
              <span>Created Date</span>
              <strong>{getDate(project.createdAt)}</strong>
            </div>

            <div className="project-details-info-item">
              <span>Updated Date</span>
              <strong>{getDate(project.updatedAt)}</strong>
            </div>

            <div className="project-details-info-item">
              <span>Reviews</span>
              <strong>{reviewCount} / 5</strong>
            </div>
          </div>
        </div>

        {/* TECHNOLOGIES */}

        <div className="project-details-section">
          <div className="project-details-section-title">
            <FiCode />
            <h2>Technologies</h2>
          </div>

          {Array.isArray(project.technologies) &&
          project.technologies.length > 0 ? (
            <div className="project-details-technologies">
              {project.technologies.map(
                (technology, index) => (
                  <span key={`${technology}-${index}`}>
                    {technology}
                  </span>
                )
              )}
            </div>
          ) : (
            <p className="project-details-no-data">
              No technologies available.
            </p>
          )}
        </div>

        {/* TEAM MEMBERS */}

        <div className="project-details-section">
          <div className="project-details-section-title">
            <FiUsers />
            <h2>Team Members</h2>

            <span className="project-details-section-count">
              {members.length}
            </span>
          </div>

          {members.length > 0 ? (
            <div className="project-details-members">
              {members.map((student) => {
                const isLeader =
                  getId(student.id) === getId(getLeaderId(team));

                return (
                  <div
                    className="project-member-item"
                    key={student.id}
                  >
                    <div className="project-member-avatar">
                      {getInitials(student.name)}
                    </div>

                    <div className="project-member-info">
                      <strong>
                        {student.name || "Unknown Student"}
                      </strong>

                      <span>
                        Student ID:{" "}
                        {student.studentId || "Not Available"}
                      </span>
                    </div>

                    {isLeader && (
                      <span className="project-member-leader">
                        <FiUserCheck />
                        Leader
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="project-details-empty-members">
              <FiUsers />
              <p>No team members available.</p>
            </div>
          )}
        </div>

        {/* REVIEW HISTORY */}

        <div className="project-details-section">
          <div className="project-details-section-title">
            <FiCheckCircle />
            <h2>Review History</h2>

            <span className="project-details-section-count">
              {reviewCount} / 5
            </span>
          </div>

          {sortedReviews.length > 0 ? (
            <div className="project-review-history">
              {[...sortedReviews]
                .sort(
                  (a, b) =>
                    Number(a.reviewNumber || 0) -
                    Number(b.reviewNumber || 0)
                )
                .map((review) => (
                  <div
                    className="project-review-item"
                    key={review.id}
                  >
                    <div className="project-review-number">
                      {review.reviewNumber || "-"}
                    </div>

                    <div className="project-review-content">
                      <div className="project-review-top">
                        <strong>
                          Review {review.reviewNumber || "-"}
                        </strong>

                        <span>
                          {getProgressValue(review)}%
                        </span>
                      </div>

                      <p>
                        <FiCalendar />
                        {getDate(review.reviewDate)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="project-details-empty-reviews">
              <FiCheckCircle />
              <p>No reviews available yet.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="project-details-footer">
          <button
            type="button"
            className="project-details-close-btn"
            onClick={handleBack}
          >
            <FiArrowLeft />
            Back to Projects
          </button>

          {canEditProject && (
            <button
              type="button"
              className="project-details-edit-btn"
              onClick={handleEdit}
            >
              <FiEdit2 />
              Edit Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;