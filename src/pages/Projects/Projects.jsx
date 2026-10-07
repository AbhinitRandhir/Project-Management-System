
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiAlertTriangle,
  FiBookOpen,
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
import ProjectForm from "./ProjectForm";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../services/projectService";

import { getTeams } from "../../services/teamService";
import { getStudents } from "../../services/studentService";
import { getReviews } from "../../services/reviewService";

import { useToast } from "../../components/Toast/Toast";
import { useAuth } from "../../context/AuthContext";

import "./Projects.css";

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const sameValue = (a, b) =>
  normalize(a) === normalize(b);

const getMemberId = (member) => {
  if (typeof member === "object" && member !== null) {
    return member.id ?? member.studentId;
  }

  return member;
};

/* =========================================================
   PROJECTS COMPONENT
========================================================= */

function Projects() {
  const navigate = useNavigate();

  const { success: showSuccess, error: showError } = useToast();

  const {
    currentUser,
    isAdmin,
    isMentor,
    userCourse,
    userDepartment,
  } = useAuth();

  /* =========================================================
     CURRENT USER DETAILS
  ========================================================= */

  const currentUserId = String(
    currentUser?.id ?? currentUser?._id ?? ""
  );

  const currentUserName = normalize(currentUser?.name);

  const courseScope =
    userCourse || currentUser?.course || "";

  const departmentScope =
    userDepartment || currentUser?.department || "";

  /* =========================================================
     STATES
  ========================================================= */

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [deleteConfirmation, setDeleteConfirmation] =
    useState(null);

  const [error, setError] = useState("");

  /* =========================================================
     FETCH DATA
  ========================================================= */

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          projectsResponse,
          teamsResponse,
          studentsResponse,
          reviewsResponse,
        ] = await Promise.all([
          getProjects(),
          getTeams(),
          getStudents(),
          getReviews(),
        ]);

        if (!isMounted) return;

        setProjects(
          Array.isArray(projectsResponse?.data)
            ? projectsResponse.data
            : []
        );

        setTeams(
          Array.isArray(teamsResponse?.data)
            ? teamsResponse.data
            : []
        );

        setStudents(
          Array.isArray(studentsResponse?.data)
            ? studentsResponse.data
            : []
        );

        setReviews(
          Array.isArray(reviewsResponse?.data)
            ? reviewsResponse.data
            : []
        );
      } catch (fetchError) {
        if (!isMounted) return;

        console.error("Error fetching projects:", fetchError);

        const message =
          fetchError?.response?.data?.message ||
          fetchError?.response?.data?.error ||
          "Unable to load project data. Please check the server.";

        setError(message);
        showError(message);
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
  }, [showError]);

  /* =========================================================
     STUDENT LOOKUP
  ========================================================= */

  const getStudent = (studentId) => {
    if (!studentId) return null;

    return students.find(
      (student) =>
        String(student.id) === String(studentId)
    );
  };

  /* =========================================================
     TEAM LOOKUP
  ========================================================= */

  const getTeam = (teamId) => {
    if (!teamId) return null;

    return teams.find(
      (team) =>
        String(team.id) === String(teamId)
    );
  };

  /* =========================================================
     TEAM MEMBER IDS
  ========================================================= */

  const getTeamMemberIds = (team) => {
    if (!team) return [];

    if (Array.isArray(team.members)) {
      return team.members
        .map(getMemberId)
        .filter(
          (id) =>
            id !== undefined &&
            id !== null &&
            id !== ""
        )
        .map(String);
    }

    if (Array.isArray(team.memberIds)) {
      return team.memberIds
        .filter(Boolean)
        .map(String);
    }

    if (Array.isArray(team.studentIds)) {
      return team.studentIds
        .filter(Boolean)
        .map(String);
    }

    return [];
  };

  /* =========================================================
     TEAM LEADER
  ========================================================= */

  const getTeamLeaderId = (team) => {
    if (!team) return "";

    return (
      team.teamLeaderId ||
      team.leaderId ||
      team.teamLeader?.id ||
      team.leader?.id ||
      ""
    );
  };

  const getTeamLeader = (team) => {
    if (!team) return null;

    const leaderId = getTeamLeaderId(team);
    const student = getStudent(leaderId);

    if (student) return student;

    if (team.teamLeader?.name) {
      return team.teamLeader;
    }

    if (team.leader?.name) {
      return team.leader;
    }

    if (team.teamLeaderName) {
      return { name: team.teamLeaderName };
    }

    return null;
  };

  /* =========================================================
     TEAM COURSE
  ========================================================= */

  const getTeamCourse = (team) => {
    if (team?.course) {
      return String(team.course).trim();
    }

    const memberIds = getTeamMemberIds(team);

    if (memberIds.length === 0) return "";

    return String(
      getStudent(memberIds[0])?.course || ""
    ).trim();
  };

  /* =========================================================
     TEAM DEPARTMENT
  ========================================================= */

  const getTeamDepartment = (team) => {
    if (team?.department) {
      return String(team.department).trim();
    }

    const memberIds = getTeamMemberIds(team);

    if (memberIds.length === 0) return "";

    return String(
      getStudent(memberIds[0])?.department || ""
    ).trim();
  };

  /* =========================================================
     TEAM MENTOR
  ========================================================= */

  const getTeamMentor = (team) => {
    if (!team) return "";

    return team.mentorName || team.mentor || "";
  };

  /* =========================================================
     MENTOR OWNERSHIP
  ========================================================= */

  const isOwnTeam = (team) => {
    if (!isMentor || !team) return false;

    const teamMentorId = String(team.mentorId ?? "");

    if (currentUserId && teamMentorId) {
      return teamMentorId === currentUserId;
    }

    return (
      currentUserName !== "" &&
      normalize(getTeamMentor(team)) === currentUserName
    );
  };

  /* =========================================================
     PROJECT TEAM
  ========================================================= */

  const getProjectTeam = (project) => {
    if (!project) return null;

    return getTeam(project.teamId);
  };

  /* =========================================================
     PROJECT COURSE
  ========================================================= */

  const getProjectCourse = (project) => {
    const team = getProjectTeam(project);

    if (team) {
      return getTeamCourse(team);
    }

    return String(project?.course || "").trim();
  };

  /* =========================================================
     PROJECT DEPARTMENT
  ========================================================= */

  const getProjectDepartment = (project) => {
    const team = getProjectTeam(project);

    if (team) {
      return getTeamDepartment(team);
    }

    return String(project?.department || "").trim();
  };

  /* =========================================================
     PROJECT PERMISSION
  ========================================================= */

  const canManageProject = (project) => {
    if (!project) return false;

    const projectCourse = getProjectCourse(project);
    const projectDepartment = getProjectDepartment(project);

    if (isAdmin) {
      return (
        Boolean(courseScope) &&
        sameValue(projectCourse, courseScope)
      );
    }

    if (isMentor) {
      const team = getProjectTeam(project);

      return (
        Boolean(courseScope) &&
        Boolean(departmentScope) &&
        sameValue(projectCourse, courseScope) &&
        sameValue(projectDepartment, departmentScope) &&
        isOwnTeam(team)
      );
    }

    return false;
  };

  /* =========================================================
     ROLE-BASED DATA
  ========================================================= */

  const scopedTeams = teams.filter((team) => {
    const teamCourse = getTeamCourse(team);
    const teamDepartment = getTeamDepartment(team);

    if (isAdmin) {
      return (
        Boolean(courseScope) &&
        sameValue(teamCourse, courseScope)
      );
    }

    if (isMentor) {
      return (
        Boolean(courseScope) &&
        Boolean(departmentScope) &&
        sameValue(teamCourse, courseScope) &&
        sameValue(teamDepartment, departmentScope)
      );
    }

    return false;
  });

  const scopedProjects = projects.filter((project) => {
    const projectCourse = getProjectCourse(project);
    const projectDepartment = getProjectDepartment(project);

    if (isAdmin) {
      return (
        Boolean(courseScope) &&
        sameValue(projectCourse, courseScope)
      );
    }

    if (isMentor) {
      return (
        Boolean(courseScope) &&
        Boolean(departmentScope) &&
        sameValue(projectCourse, courseScope) &&
        sameValue(projectDepartment, departmentScope)
      );
    }

    return false;
  });

  /* =========================================================
     DEPARTMENT FILTER OPTIONS
  ========================================================= */

  const departments = [
    ...new Set(
      scopedTeams
        .map(getTeamDepartment)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  /* =========================================================
     FILTER PROJECTS
  ========================================================= */

  const searchValue = normalize(searchTerm);

  const filteredProjects = scopedProjects.filter((project) => {
    const team = getProjectTeam(project);
    const leader = getTeamLeader(team);

    const projectName = normalize(project.projectName);
    const projectId = normalize(project.id);

    const teamName = normalize(
      team?.teamName ||
      team?.name ||
      project.teamName
    );

    const teamId = normalize(
      team?.id || project.teamId
    );

    const mentorName = normalize(
      getTeamMentor(team) || project.mentorName
    );

    const leaderName = normalize(
      leader?.name || project.teamLeaderName
    );

    const department = normalize(
      getProjectDepartment(project)
    );

    const matchesSearch =
      !searchValue ||
      projectName.includes(searchValue) ||
      projectId.includes(searchValue) ||
      teamName.includes(searchValue) ||
      teamId.includes(searchValue) ||
      mentorName.includes(searchValue) ||
      leaderName.includes(searchValue) ||
      department.includes(searchValue);

    const matchesDepartment =
      !departmentFilter ||
      sameValue(department, departmentFilter);

    return matchesSearch && matchesDepartment;
  });

  /* =========================================================
     AVAILABLE TEAMS
     ONE TEAM = ONE PROJECT
  ========================================================= */

  const projectTeamIds = new Set(
    scopedProjects
      .map((project) => project.teamId)
      .filter(
        (id) =>
          id !== undefined &&
          id !== null &&
          id !== ""
      )
      .map(String)
  );

  const availableTeams = scopedTeams.filter((team) => {
    const alreadyHasProject = projectTeamIds.has(
      String(team.id)
    );

    if (alreadyHasProject) return false;

    if (isMentor) {
      return isOwnTeam(team);
    }

    return isAdmin;
  });

  /* =========================================================
     PROJECT PROGRESS
  ========================================================= */

  const getLatestReview = (project) => {
    if (!project?.id) return null;

    const projectReviews = reviews
      .filter(
        (review) =>
          String(review.projectId) === String(project.id)
      )
      .sort((a, b) => {
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

    return projectReviews[0] || null;
  };

  const getProgress = (project) => {
    const latestReview = getLatestReview(project);

    const progress = Number(
      latestReview?.progress ?? 0
    );

    if (Number.isNaN(progress)) return 0;

    return Math.min(100, Math.max(0, progress));
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return "#16a34a";
    if (progress >= 70) return "#2563eb";
    if (progress >= 40) return "#d97706";

    return "#dc2626";
  };

  /* =========================================================
     STATS
  ========================================================= */

  const totalProjects = scopedProjects.length;

  const completedProjects = scopedProjects.filter(
    (project) => getProgress(project) >= 100
  ).length;

  const inProgressProjects = scopedProjects.filter(
    (project) => {
      const progress = getProgress(project);

      return progress > 0 && progress < 100;
    }
  ).length;

  /* =========================================================
     FILTER HANDLERS
  ========================================================= */

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
  };

  /* =========================================================
     CREATE PROJECT
  ========================================================= */

  const handleAddProject = () => {
    if (availableTeams.length === 0) {
      showError(
        "No available teams. Create a team first or check existing projects."
      );

      return;
    }

    setSelectedProject(null);
    setError("");
    setShowForm(true);
  };

  /* =========================================================
     EDIT PROJECT
  ========================================================= */

  const handleEditProject = (project) => {
    if (!canManageProject(project)) {
      showError("You are not allowed to edit this project.");
      return;
    }

    setSelectedProject(project);
    setError("");
    setShowForm(true);
  };

  /* =========================================================
     CLOSE FORM
  ========================================================= */

  const handleCloseForm = () => {
    if (submitting) return;

    setShowForm(false);
    setSelectedProject(null);
    setError("");
  };

  /* =========================================================
     SAVE PROJECT
  ========================================================= */

  const handleSaveProject = async (projectData) => {
    try {
      setSubmitting(true);
      setError("");

      if (!projectData?.teamId) {
        const message = "Please select a team.";

        setError(message);
        showError(message);

        return false;
      }

      const selectedTeam = getTeam(projectData.teamId);

      if (!selectedTeam) {
        const message = "Selected team was not found.";

        setError(message);
        showError(message);

        return false;
      }

      const teamCourse = getTeamCourse(selectedTeam);
      const teamDepartment = getTeamDepartment(selectedTeam);

      /* CHECK COURSE ACCESS */

      if (
        !courseScope ||
        !sameValue(teamCourse, courseScope)
      ) {
        const message =
          "You cannot create a project for this course.";

        setError(message);
        showError(message);

        return false;
      }

      /* CHECK MENTOR DEPARTMENT AND OWNERSHIP */

      if (isMentor) {
        if (
          !sameValue(teamDepartment, departmentScope) ||
          !isOwnTeam(selectedTeam)
        ) {
          const message =
            "You can manage projects only for your own teams.";

          setError(message);
          showError(message);

          return false;
        }
      }

      /* CHECK EDIT PERMISSION */

      if (
        selectedProject &&
        !canManageProject(selectedProject)
      ) {
        const message =
          "You are not allowed to update this project.";

        setError(message);
        showError(message);

        return false;
      }

      /* ONE TEAM = ONE PROJECT */

      const duplicateProject = projects.find(
        (project) =>
          String(project.teamId) ===
            String(selectedTeam.id) &&
          String(project.id) !==
            String(selectedProject?.id)
      );

      if (duplicateProject) {
        const message =
          "This team already has a project.";

        setError(message);
        showError(message);

        return false;
      }

      const teamLeader = getTeamLeader(selectedTeam);
      const teamLeaderId = getTeamLeaderId(selectedTeam);

      const teamName =
        selectedTeam.teamName ||
        selectedTeam.name ||
        "";

      const mentorName = getTeamMentor(selectedTeam);

      /* UPDATE PROJECT */

      if (selectedProject) {
        const updatedProject = {
          ...selectedProject,
          ...projectData,
          id: selectedProject.id,
          teamId: selectedTeam.id,
          teamName,
          course: teamCourse,
          department: teamDepartment,
          teamLeaderId,
          teamLeaderName:
            teamLeader?.name ||
            selectedTeam.teamLeaderName ||
            "",
          mentorName,
          reviewCount:
            Number(selectedProject.reviewCount) || 0,
          updatedAt: new Date().toISOString(),
        };

        await updateProject(
          selectedProject.id,
          updatedProject
        );

        setProjects((previousProjects) =>
          previousProjects.map((project) =>
            String(project.id) ===
            String(selectedProject.id)
              ? updatedProject
              : project
          )
        );

        showSuccess("Project updated successfully.");

        setShowForm(false);
        setSelectedProject(null);

        return true;
      }

      /* CREATE PROJECT */

      const newProject = {
        ...projectData,
        teamId: selectedTeam.id,
        teamName,
        course: teamCourse,
        department: teamDepartment,
        teamLeaderId,
        teamLeaderName:
          teamLeader?.name ||
          selectedTeam.teamLeaderName ||
          "",
        mentorName,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };

      const response = await createProject(newProject);

      const savedProject = response?.data || newProject;

      setProjects((previousProjects) => [
        ...previousProjects,
        savedProject,
      ]);

      showSuccess("Project created successfully.");

      setShowForm(false);
      setSelectedProject(null);

      return true;
    } catch (saveError) {
      console.error("Error saving project:", saveError);

      const message =
        saveError?.response?.data?.message ||
        saveError?.response?.data?.error ||
        saveError?.message ||
        "Unable to save project. Please try again.";

      setError(message);
      showError(message);

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     DELETE PROJECT
  ========================================================= */

  const handleDeleteProject = (project) => {
    if (submitting || !project?.id) return;

    if (!canManageProject(project)) {
      showError("You are not allowed to delete this project.");
      return;
    }

    setDeleteConfirmation(project);
  };

  const cancelDeleteProject = () => {
    if (submitting) return;

    setDeleteConfirmation(null);
  };

  const confirmDeleteProject = async () => {
    if (!deleteConfirmation?.id || submitting) return;

    if (!canManageProject(deleteConfirmation)) {
      showError("You are not allowed to delete this project.");
      setDeleteConfirmation(null);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const projectId = deleteConfirmation.id;

      await deleteProject(projectId);

      setProjects((previousProjects) =>
        previousProjects.filter(
          (project) =>
            String(project.id) !== String(projectId)
        )
      );

      showSuccess(
        `"${deleteConfirmation.projectName || "Project"}" deleted successfully.`
      );

      setDeleteConfirmation(null);
    } catch (deleteError) {
      console.error("Error deleting project:", deleteError);

      const message =
        deleteError?.response?.data?.message ||
        deleteError?.response?.data?.error ||
        deleteError?.message ||
        "Unable to delete project. Please try again.";

      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     VIEW PROJECT
  ========================================================= */

  const handleViewProject = (project) => {
    if (!project?.id) {
      showError("Project ID is not available.");
      return;
    }

    navigate(`/projects/${project.id}`);
  };

  /* =========================================================
     DEPARTMENT LABEL
  ========================================================= */

  const getDepartmentLabel = (department) => {
    if (!department) return "N/A";

    return String(department).toUpperCase();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <section className="projects-page">

      {/* HEADER */}

      <div className="projects-page-header">
        <div className="projects-heading">
          <div className="projects-heading-icon">
            <FiBookOpen />
          </div>

          <div>
            <h1>Projects</h1>
            <p>Manage team-based student projects</p>
          </div>
        </div>

        <button
          type="button"
          className="add-project-btn"
          onClick={handleAddProject}
          disabled={
            submitting ||
            availableTeams.length === 0
          }
          title={
            availableTeams.length === 0
              ? "No available teams"
              : "Create Project"
          }
        >
          <FiPlus />
          <span>Create Project</span>
        </button>
      </div>

      {/* STATS */}

      <div className="projects-stats">

        <div className="project-stat-card">
          <div className="project-stat-icon">
            <FiBookOpen />
          </div>

          <div>
            <span>Total Projects</span>
            <strong>{totalProjects}</strong>
          </div>
        </div>

        <div className="project-stat-card">
          <div className="project-stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Available Teams</span>
            <strong>{availableTeams.length}</strong>
          </div>
        </div>

        <div className="project-stat-card">
          <div className="project-stat-icon">
            <FiUserCheck />
          </div>

          <div>
            <span>In Progress</span>
            <strong>{inProgressProjects}</strong>
          </div>
        </div>

        <div className="project-stat-card">
          <div className="project-stat-icon">
            <FiBookOpen />
          </div>

          <div>
            <span>Completed</span>
            <strong>{completedProjects}</strong>
          </div>
        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="projects-error">
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

      <div className="projects-toolbar">

        <div className="projects-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Search project, team, mentor or leader..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <div className="project-filter-wrapper">
          <FiFilter />

          <select
            className="project-filter-select"
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(event.target.value)
            }
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>

            {departments.map((department) => (
              <option
                key={department}
                value={department}
              >
                {getDepartmentLabel(department)}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || departmentFilter) && (
          <button
            type="button"
            className="clear-project-search"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* PROJECT CONTENT */}

      {loading ? (
        <Loader text="Loading projects..." />
      ) : filteredProjects.length === 0 ? (

        <div className="projects-empty">
          <div className="projects-empty-icon">
            <FiBookOpen />
          </div>

          <h3>
            {scopedProjects.length === 0
              ? "No projects created yet"
              : "No matching projects found"}
          </h3>

          <p>
            {scopedProjects.length === 0
              ? availableTeams.length > 0
                ? "Create a project for one of your available teams."
                : "Create a team first before creating a project."
              : "Try another search term or department filter."}
          </p>

          {scopedProjects.length === 0 &&
          availableTeams.length > 0 ? (
            <button
              type="button"
              className="add-project-btn"
              onClick={handleAddProject}
            >
              <FiPlus />
              <span>Create First Project</span>
            </button>
          ) : (
            scopedProjects.length > 0 && (
              <button
                type="button"
                className="clear-project-search"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )
          )}
        </div>

      ) : (

        <div className="projects-grid">

          {filteredProjects.map((project) => {
            const team = getProjectTeam(project);
            const leader = getTeamLeader(team);

            const department =
              getProjectDepartment(project);

            const memberIds =
              getTeamMemberIds(team);

            const progress = getProgress(project);

            const projectReviews = reviews.filter(
              (review) =>
                String(review.projectId) ===
                String(project.id)
            );

            const reviewCount = Math.min(
              5,
              projectReviews.length
            );

            const progressColor =
              getProgressColor(progress);

            const canManage =
              canManageProject(project);

            return (
              <article
                className="project-card"
                key={project.id}
              >

                {/* CARD TOP */}

                <div className="project-card-top">
                  <div className="project-card-icon">
                    <FiBookOpen />
                  </div>

                  <div className="project-card-actions">

                    <button
                      type="button"
                      className="project-view-btn"
                      onClick={() =>
                        handleViewProject(project)
                      }
                      disabled={submitting}
                      title="View Project"
                      aria-label="View Project"
                    >
                      <FiEye />
                    </button>

                    {canManage && (
                      <button
                        type="button"
                        className="project-edit-btn"
                        onClick={() =>
                          handleEditProject(project)
                        }
                        disabled={submitting}
                        title="Edit Project"
                        aria-label="Edit Project"
                      >
                        <FiEdit2 />
                      </button>
                    )}

                    {canManage && (
                      <button
                        type="button"
                        className="project-delete-btn"
                        onClick={() =>
                          handleDeleteProject(project)
                        }
                        disabled={submitting}
                        title="Delete Project"
                        aria-label="Delete Project"
                      >
                        <FiTrash2 />
                      </button>
                    )}

                  </div>
                </div>

                {/* TITLE */}

                <div className="project-card-title">
                  <div>
                    <h3>
                      {project.projectName ||
                        "Unnamed Project"}
                    </h3>

                    <span>
                      {project.id || "No ID"}
                    </span>
                  </div>

                  <span className="project-department-badge">
                    {getDepartmentLabel(department)}
                  </span>
                </div>

                {/* TEAM */}

                <div className="project-team-info">
                  <div className="project-team-header">
                    <span>Team</span>

                    <strong>
                      {team?.teamName ||
                        team?.name ||
                        project.teamName ||
                        "Not Available"}
                    </strong>
                  </div>

                  <div className="project-team-id">
                    {team?.id ||
                      project.teamId ||
                      "No Team ID"}
                  </div>
                </div>

                {/* INFORMATION */}

                <div className="project-card-info">

                  <div>
                    <span>Team Leader</span>

                    <strong>
                      {leader?.name ||
                        project.teamLeaderName ||
                        "Not Available"}
                    </strong>
                  </div>

                  <div>
                    <span>Mentor</span>

                    <strong>
                      {getTeamMentor(team) ||
                        project.mentorName ||
                        "Not Available"}
                    </strong>
                  </div>

                  <div>
                    <span>Members</span>
                    <strong>{memberIds.length}</strong>
                  </div>

                  <div>
                    <span>Reviews</span>
                    <strong>{reviewCount} / 5</strong>
                  </div>

                </div>

                {/* PROGRESS */}

                <div className="project-progress-section">
                  <div className="project-progress-header">
                    <span>Project Progress</span>

                    <strong
                      style={{ color: progressColor }}
                    >
                      {progress}%
                    </strong>
                  </div>

                  <div className="project-progress-bar">
                    <div
                      className="project-progress-fill"
                      style={{
                        width: `${progress}%`,
                        background: progressColor,
                      }}
                    />
                  </div>
                </div>

                {/* FOOTER */}

                <div className="project-card-footer">
                  <span>
                    {memberIds.length} Student
                    {memberIds.length !== 1 ? "s" : ""}
                  </span>

                  <span>
                    {project.createdAt
                      ? `Created ${new Date(
                          project.createdAt
                        ).toLocaleDateString()}`
                      : "Created -"}
                  </span>
                </div>

              </article>
            );
          })}

        </div>
      )}

      {/* PROJECT FORM */}

      {showForm && (
        <ProjectForm
          project={selectedProject}
          teams={
            selectedProject
              ? scopedTeams
              : availableTeams
          }
          projects={scopedProjects}
          students={students}
          onSubmit={handleSaveProject}
          onClose={handleCloseForm}
          submitting={submitting}
        />
      )}

      {/* DELETE CONFIRMATION */}

      {deleteConfirmation && (
        <div className="project-delete-overlay">
          <div className="project-delete-modal">

            <div className="project-delete-icon">
              <FiAlertTriangle />
            </div>

            <div className="project-delete-content">
              <h3>Delete Project?</h3>

              <p>
                Are you sure you want to delete{" "}
                <strong>
                  "{deleteConfirmation.projectName || "this project"}"
                </strong>
                ?
              </p>

              <span>
                This action cannot be undone.
              </span>
            </div>

            <div className="project-delete-actions">

              <button
                type="button"
                className="project-delete-cancel"
                onClick={cancelDeleteProject}
                disabled={submitting}
              >
                <FiX />
                Cancel
              </button>

              <button
                type="button"
                className="project-delete-confirm"
                onClick={confirmDeleteProject}
                disabled={submitting}
              >
                <FiTrash2 />

                {submitting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>
        </div>
      )}

    </section>
  );
}

export default Projects;