
import { useState } from "react";

import {
  FiAlertTriangle,
  FiBookOpen,
  FiChevronDown,
  FiSave,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import "./ProjectForm.css";
import { useToast } from "../../components/Toast/Toast";

function ProjectForm({
  project = null,
  teams = [],
  projects = [],
  students = [],
  onSubmit,
  onClose,
  submitting = false,
}) {
  const isEditMode = Boolean(project);

  const { error: showError } = useToast();

  const [formData, setFormData] = useState({
    projectName: project?.projectName || "",
    teamId: project?.teamId
      ? String(project.teamId)
      : "",
    technologies: Array.isArray(project?.technologies)
      ? project.technologies.join(", ")
      : project?.technologies || "",
  });

  const [errors, setErrors] = useState({});
  const [submitConfirmation, setSubmitConfirmation] =
    useState(null);

  /* =====================================================
     HELPERS
  ===================================================== */

  const getStudent = (studentId) => {
    return students.find(
      (student) =>
        String(student?.id) === String(studentId)
    );
  };

  const getTeamName = (team) => {
    if (!team) return "";

    return (
      team.teamName ||
      team.name ||
      "Unnamed Team"
    );
  };

  const getTeamMemberIds = (team) => {
    if (!team) return [];

    if (Array.isArray(team.members)) {
      return team.members
        .map((member) => {
          if (
            typeof member === "object" &&
            member !== null
          ) {
            return member.id || member.studentId;
          }

          return member;
        })
        .filter(Boolean);
    }

    if (Array.isArray(team.memberIds)) {
      return team.memberIds.filter(Boolean);
    }

    if (Array.isArray(team.studentIds)) {
      return team.studentIds.filter(Boolean);
    }

    return [];
  };

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

  const getTeamLeaderName = (team) => {
    if (!team) return "";

    if (team.teamLeaderName) {
      return team.teamLeaderName;
    }

    if (team.teamLeader?.name) {
      return team.teamLeader.name;
    }

    if (team.leader?.name) {
      return team.leader.name;
    }

    const leader = getStudent(
      getTeamLeaderId(team)
    );

    return leader?.name || "";
  };

  const getTeamDepartment = (team) => {
    if (!team) return "";

    if (team.department) {
      return team.department;
    }

    const memberIds = getTeamMemberIds(team);
    const firstMember = getStudent(memberIds[0]);

    return firstMember?.department || "";
  };

  const getTeamMentor = (team) => {
    if (!team) return "";

    return team.mentorName || team.mentor || "";
  };

  const getInitials = (name = "") => {
    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  /* =====================================================
     AVAILABLE TEAMS

     One Team = One Project

     While editing, the current project's team
     remains available.
  ===================================================== */

  const availableTeams = teams.filter((team) => {
    const alreadyHasProject = projects.some(
      (existingProject) =>
        String(existingProject?.teamId) ===
          String(team?.id) &&
        String(existingProject?.id) !==
          String(project?.id)
    );

    return !alreadyHasProject;
  });

  /* =====================================================
     SELECTED TEAM
  ===================================================== */

  const selectedTeam = teams.find(
    (team) =>
      String(team?.id) === String(formData.teamId)
  );

  const selectedTeamMembers = selectedTeam
    ? getTeamMemberIds(selectedTeam)
        .map((memberId) => getStudent(memberId))
        .filter(Boolean)
    : [];

  const selectedTeamLeader = selectedTeam
    ? getStudent(getTeamLeaderId(selectedTeam)) || {
        name: getTeamLeaderName(selectedTeam),
      }
    : null;

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateForm = () => {
    const newErrors = {};

    const projectName = formData.projectName.trim();
    const teamId = formData.teamId;
    const technologies = formData.technologies.trim();

    /* Project Name */

    if (!projectName) {
      newErrors.projectName =
        "Project name is required.";
    } else if (projectName.length < 3) {
      newErrors.projectName =
        "Project name must be at least 3 characters.";
    }

    /* Team */

    if (!teamId) {
      newErrors.teamId =
        "Please select a team.";
    }

    /* Technologies */

    if (!technologies) {
      newErrors.technologies =
        "Please enter at least one technology.";
    }

    /* One Team = One Project */

    if (teamId) {
      const duplicateProject = projects.find(
        (existingProject) =>
          String(existingProject?.teamId) ===
            String(teamId) &&
          String(existingProject?.id) !==
            String(project?.id)
      );

      if (duplicateProject) {
        newErrors.teamId =
          "This team already has a project.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =====================================================
     SUBMIT

     Validate -> Prepare Data -> Confirmation
  ===================================================== */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (submitting) return;

    const isValid = validateForm();

    if (!isValid) {
      showError(
        "Please fix the highlighted fields."
      );
      return;
    }

    if (!selectedTeam) {
      showError(
        "Selected team could not be found."
      );
      return;
    }

    const technologies = formData.technologies
      .split(",")
      .map((technology) => technology.trim())
      .filter(Boolean);

    const projectData = {
      projectName: formData.projectName.trim(),
      teamId: selectedTeam.id,
      technologies,
    };

    setSubmitConfirmation(projectData);
  };

  /* =====================================================
     CONFIRM SUBMIT
  ===================================================== */

  const confirmProjectSubmit = async () => {
    if (!submitConfirmation || submitting) return;

    try {
      const result = await onSubmit(
        submitConfirmation
      );

      if (result === false) {
        return;
      }

      setSubmitConfirmation(null);
    } catch (error) {
      console.error(
        "Project submit error:",
        error
      );

      showError(
        error?.response?.data?.message ||
          "Unable to save project. Please try again."
      );
    }
  };

  /* =====================================================
     CANCEL CONFIRMATION
  ===================================================== */

  const cancelConfirmation = () => {
    if (submitting) return;

    setSubmitConfirmation(null);
  };

  /* =====================================================
     CLOSE FORM
  ===================================================== */

  const handleClose = () => {
    if (submitting) return;

    setSubmitConfirmation(null);
    onClose();
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      {/* =================================================
          FORM OVERLAY
      ================================================= */}

      <div className="project-form-overlay">
        <div className="project-form-modal">

          {/* =============================================
              HEADER
          ============================================= */}

          <div className="project-form-header">
            <div className="project-form-title-row">

              <div className="project-form-title-icon">
                <FiBookOpen />
              </div>

              <div>
                <h2>
                  {isEditMode
                    ? "Edit Project"
                    : "Create Project"}
                </h2>

                <p>
                  {isEditMode
                    ? "Update project information"
                    : "Create a project for an existing team"}
                </p>
              </div>

            </div>

            <button
              type="button"
              className="project-form-close"
              onClick={handleClose}
              disabled={submitting}
              aria-label="Close project form"
            >
              <FiX />
            </button>
          </div>

          {/* =============================================
              FORM
          ============================================= */}

          <form
            className="project-form"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* =========================================
                PROJECT ID
            ========================================= */}

            {isEditMode && (
              <div className="project-form-group">
                <label htmlFor="projectId">
                  Project ID
                </label>

                <input
                  id="projectId"
                  type="text"
                  value={project?.id || ""}
                  readOnly
                  className="project-readonly-input"
                />

                <small className="project-form-help">
                  Project ID is generated automatically.
                </small>
              </div>
            )}

            {/* =========================================
                PROJECT NAME
            ========================================= */}

            <div className="project-form-group">
              <label htmlFor="projectName">
                Project Name
                <span className="required">*</span>
              </label>

              <input
                id="projectName"
                name="projectName"
                type="text"
                placeholder="Enter project name"
                value={formData.projectName}
                onChange={handleChange}
                disabled={submitting}
                className={
                  errors.projectName
                    ? "input-error"
                    : ""
                }
              />

              {errors.projectName && (
                <span className="project-field-error">
                  {errors.projectName}
                </span>
              )}
            </div>

            {/* =========================================
                TEAM
            ========================================= */}

            <div className="project-form-group">
              <label htmlFor="teamId">
                Team
                <span className="required">*</span>
              </label>

              <div className="project-select-wrapper">
                <select
                  id="teamId"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleChange}
                  disabled={
                    submitting ||
                    availableTeams.length === 0
                  }
                  className={
                    errors.teamId
                      ? "input-error"
                      : ""
                  }
                >
                  <option value="">
                    Select Team
                  </option>

                  {availableTeams.length > 0 ? (
                    availableTeams.map((team) => (
                      <option
                        key={team.id}
                        value={String(team.id)}
                      >
                        {getTeamName(team)}
                        {team.teamId
                          ? ` (${team.teamId})`
                          : ""}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No available teams
                    </option>
                  )}
                </select>

                <FiChevronDown className="project-select-icon" />
              </div>

              {errors.teamId && (
                <span className="project-field-error">
                  {errors.teamId}
                </span>
              )}

              <small className="project-form-help">
                Each team can have only one project.
              </small>
            </div>

            {/* =========================================
                SELECTED TEAM PREVIEW
            ========================================= */}

            {selectedTeam && (
              <div className="project-team-preview">

                <div className="project-team-preview-header">

                  <div className="project-team-preview-icon">
                    <FiUsers />
                  </div>

                  <div>
                    <h3>
                      {getTeamName(selectedTeam)}
                    </h3>

                    <p>
                      {selectedTeam.teamId
                        ? `Team ID: ${selectedTeam.teamId}`
                        : `ID: ${selectedTeam.id}`}
                    </p>
                  </div>

                </div>

                {/* Team Basic Information */}

                <div className="project-team-preview-grid">

                  <div className="project-team-preview-item">
                    <span>Department</span>

                    <strong>
                      {getTeamDepartment(selectedTeam) ||
                        "N/A"}
                    </strong>
                  </div>

                  <div className="project-team-preview-item">
                    <span>Mentor</span>

                    <strong>
                      {getTeamMentor(selectedTeam) ||
                        "N/A"}
                    </strong>
                  </div>

                  <div className="project-team-preview-item">
                    <span>Team Leader</span>

                    <strong>
                      {selectedTeamLeader?.name ||
                        "N/A"}
                    </strong>
                  </div>

                  <div className="project-team-preview-item">
                    <span>Members</span>

                    <strong>
                      {selectedTeamMembers.length}
                    </strong>
                  </div>

                </div>

                {/* Team Members */}

                {selectedTeamMembers.length > 0 && (
                  <div className="project-team-members">

                    <div className="project-team-members-title">
                      <FiUsers />
                      <span>Team Members</span>
                    </div>

                    <div className="project-team-member-list">

                      {selectedTeamMembers.map((student) => (
                        <div
                          className="project-team-member"
                          key={student.id}
                        >

                          <div className="project-member-avatar">
                            {getInitials(student.name)}
                          </div>

                          <div className="project-member-info">
                            <strong>
                              {student.name}
                            </strong>

                            <span>
                              {student.studentId ||
                                student.id}
                            </span>
                          </div>

                          {String(
                            getTeamLeaderId(selectedTeam)
                          ) === String(student.id) && (
                            <span className="project-leader-badge">
                              <FiUserCheck />
                              Leader
                            </span>
                          )}

                        </div>
                      ))}

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* =========================================
                TECHNOLOGIES
            ========================================= */}

            <div className="project-form-group">
              <label htmlFor="technologies">
                Technologies
                <span className="required">*</span>
              </label>

              <input
                id="technologies"
                name="technologies"
                type="text"
                placeholder="React, Node.js, MongoDB"
                value={formData.technologies}
                onChange={handleChange}
                disabled={submitting}
                className={
                  errors.technologies
                    ? "input-error"
                    : ""
                }
              />

              {errors.technologies && (
                <span className="project-field-error">
                  {errors.technologies}
                </span>
              )}

              <small className="project-form-help">
                Separate multiple technologies with commas.
              </small>
            </div>

            {/* =========================================
                REVIEW INFORMATION
            ========================================= */}

            {isEditMode && (
              <div className="project-review-info">

                <div className="project-review-info-icon">
                  <FiBookOpen />
                </div>

                <div>
                  <strong>
                    Reviews: {project?.reviewCount || 0}/5
                  </strong>

                  <p>
                    Progress and reviews are managed from
                    the Reviews section.
                  </p>
                </div>

              </div>
            )}

            {/* =========================================
                FORM ACTIONS
            ========================================= */}

            <div className="project-form-actions">

              <button
                type="button"
                className="project-form-cancel"
                onClick={handleClose}
                disabled={submitting}
              >
                <FiX />
                Cancel
              </button>

              <button
                type="submit"
                className="project-form-submit"
                disabled={
                  submitting ||
                  availableTeams.length === 0
                }
              >
                <FiSave />

                {submitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Project"
                    : "Create Project"}
              </button>

            </div>

          </form>
        </div>
      </div>

      {/* =================================================
          CREATE / UPDATE CONFIRMATION
      ================================================= */}

      {submitConfirmation && (
        <div className="project-confirm-overlay">

          <div className="project-confirm-modal">

            <div className="project-confirm-icon">
              <FiAlertTriangle />
            </div>

            <div className="project-confirm-content">

              <h3>
                {isEditMode
                  ? "Update Project?"
                  : "Create Project?"}
              </h3>

              <p>
                Are you sure you want to{" "}
                {isEditMode
                  ? "update"
                  : "create"}{" "}
                this project?
              </p>

              <div className="project-confirm-summary">

                <div>
                  <span>Project</span>

                  <strong>
                    {submitConfirmation.projectName}
                  </strong>
                </div>

                <div>
                  <span>Team</span>

                  <strong>
                    {getTeamName(selectedTeam)}
                  </strong>
                </div>

              </div>

            </div>

            <div className="project-confirm-actions">

              <button
                type="button"
                className="project-confirm-cancel"
                onClick={cancelConfirmation}
                disabled={submitting}
              >
                <FiX />
                Cancel
              </button>

              <button
                type="button"
                className="project-confirm-submit"
                onClick={confirmProjectSubmit}
                disabled={submitting}
              >
                <FiSave />

                {submitting
                  ? "Saving..."
                  : isEditMode
                    ? "Yes, Update"
                    : "Yes, Create"}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default ProjectForm;