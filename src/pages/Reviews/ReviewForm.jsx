import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronDown,
  FiFileText,
  FiSave,
  FiStar,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { useToast } from "../../components/Toast/Toast";
import "./ReviewForm.css";

const INITIAL_FORM_DATA = {
  projectId: "",
  reviewNumber: "",
  reviewDate: "",
  reviewerName: "",
  rating: 0,
  comments: "",
};

const getRecordId = (record) =>
  String(record?.id ?? record?._id ?? "");

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const getReviewProgress = (reviewNumber) => {
  const number = Number(reviewNumber);
  return Number.isInteger(number) && number >= 1 && number <= 5
    ? number * 20
    : 0;
};

const validateMarks = (rawValue) => {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return "Marks are required.";
  }
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 0 || value > 20) {
    return "Enter a whole number from 0 to 20.";
  }
  return "";
};

function ReviewForm({
  review,
  projects = [],
  reviews = [],
  teams = [],
  students = [],
  onSubmit,
  onClose,
  submitting = false,
}) {
  const { error: showError } = useToast();
  const isEditMode = Boolean(review?.id ?? review?._id);
  const today = getLocalDateString();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [teamMarks, setTeamMarks] = useState("");
  const [teamFeedback, setTeamFeedback] = useState("");
  const [studentMarks, setStudentMarks] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [submitConfirmation, setSubmitConfirmation] = useState(null);

  useEffect(() => {
    if (review) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        projectId: String(review.projectId ?? ""),
        reviewNumber: String(review.reviewNumber ?? ""),
        reviewDate: String(review.reviewDate ?? "").slice(0, 10),
        reviewerName: review.reviewerName ?? "",
        rating: Number(review.rating ?? 0),
        comments: review.comments ?? "",
      });
      setTeamMarks(String(review.teamEvaluation?.marks ?? ""));
      setTeamFeedback(review.teamEvaluation?.feedback ?? "");

    } else {
      setFormData({
        ...INITIAL_FORM_DATA,
        reviewDate: getLocalDateString(),
      });
      setTeamMarks("");
      setTeamFeedback("");
      setStudentMarks({});
    }

    setErrors({});
    setTouched({});
    setSubmitConfirmation(null);
    setProjectDropdownOpen(false);
  }, [review]);

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => getRecordId(project) === String(formData.projectId)
      ) || null,
    [projects, formData.projectId]
  );

  const selectedTeam = useMemo(() => {
    if (!selectedProject) return null;
    const teamId = String(
      selectedProject.teamId ?? selectedProject.team_id ?? ""
    );
    return (
      teams.find(
        (team) =>
          getRecordId(team) === teamId ||
          String(team?.teamId ?? "") === teamId
      ) || null
    );
  }, [teams, selectedProject]);

  // Resolve team member references to student records and remove duplicate
  // references so one student cannot appear twice in the evaluation form.
  const teamMembers = useMemo(() => {
    if (!Array.isArray(selectedTeam?.members)) return [];

    const seenRecordIds = new Set();
    const seenStudentIds = new Set();

    return selectedTeam.members
      .map((memberRef) => {
        const refId =
          typeof memberRef === "object" && memberRef !== null
            ? memberRef.id ?? memberRef._id ?? memberRef.studentId
            : memberRef;
        const normalizedRefId = String(refId ?? "").trim();

        const student = students.find(
          (item) =>
            getRecordId(item) === normalizedRefId ||
            String(item?.studentId ?? "").trim() === normalizedRefId
        );
        if (!student) return null;

        const recordId = getRecordId(student).trim();
        const studentId = String(student.studentId ?? recordId).trim();
        const normalizedRecordId = recordId.toLowerCase();
        const normalizedStudentId = studentId.toLowerCase();

        // Deduplicate by either database record ID or displayed student ID.
        if (
          (normalizedRecordId && seenRecordIds.has(normalizedRecordId)) ||
          (normalizedStudentId && seenStudentIds.has(normalizedStudentId))
        ) {
          return null;
        }

        if (normalizedRecordId) seenRecordIds.add(normalizedRecordId);
        if (normalizedStudentId) seenStudentIds.add(normalizedStudentId);

        const uniqueKey = recordId || studentId;
        if (!uniqueKey) return null;

        return {
          key: uniqueKey,
          recordId,
          studentId,
          studentName:
            student.studentName ??
            student.name ??
            student.fullName ??
            "Unnamed Student",
        };
      })
      .filter(Boolean);
  }, [selectedTeam, students]);

  // Hydrate edit-mode marks only after the selected project's team members
  // have been resolved. This avoids blank marks on the first render.
  useEffect(() => {
    if (!review) return;

    const evaluations = Array.isArray(review.studentEvaluations)
      ? review.studentEvaluations
      : [];
    const existingMarks = {};

    teamMembers.forEach((member) => {
      const savedEvaluation = evaluations.find((entry) => {
        const savedId = String(entry?.studentId ?? "").trim().toLowerCase();
        const savedRecordId = String(
          entry?.studentRecordId ?? entry?.recordId ?? ""
        ).trim().toLowerCase();
        const currentStudentId = String(member.studentId).trim().toLowerCase();
        const currentRecordId = String(member.recordId).trim().toLowerCase();

        return (
          (savedId &&
            (savedId === currentStudentId || savedId === currentRecordId)) ||
          (savedRecordId &&
            (savedRecordId === currentStudentId ||
              savedRecordId === currentRecordId))
        );
      });

      if (savedEvaluation) {
        existingMarks[member.key] = String(savedEvaluation.marks ?? "");
      }
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudentMarks(existingMarks);
  }, [review, teamMembers]);

  const projectReviews = useMemo(
    () =>
      reviews.filter(
        (item) =>
          String(item?.projectId) === String(formData.projectId) &&
          String(item?.id ?? item?._id) !==
            String(review?.id ?? review?._id ?? "")
      ),
    [reviews, formData.projectId, review]
  );

  const availableProjects = useMemo(
    () =>
      projects
        .filter((project) => {
          if (
            isEditMode &&
            getRecordId(project) === String(review?.projectId)
          ) {
            return true;
          }
          const count = reviews.filter(
            (item) =>
              String(item?.projectId) === getRecordId(project) &&
              Number(item?.reviewNumber) >= 1 &&
              Number(item?.reviewNumber) <= 5
          ).length;
          return count < 5;
        })
        .sort((a, b) =>
          String(a?.projectName ?? "").localeCompare(
            String(b?.projectName ?? "")
          )
        ),
    [projects, reviews, isEditMode, review]
  );

  const teamName =
    selectedTeam?.teamName ?? selectedProject?.teamName ?? "Not Available";
  const teamLeader =
    selectedTeam?.teamLeaderName ??
    selectedProject?.teamLeaderName ??
    "Not Available";
  const mentor =
    selectedTeam?.mentorName ??
    selectedProject?.mentorName ??
    "Not Available";
  const department =
    selectedTeam?.department ??
    selectedProject?.department ??
    "Not Available";
  const course =
    selectedTeam?.course ?? selectedProject?.course ?? "Not Available";

  const reviewOptions = useMemo(() => {
    const completed = new Set(
      projectReviews
        .map((item) => Number(item?.reviewNumber))
        .filter((number) => Number.isInteger(number) && number >= 1 && number <= 5)
    );

    return [1, 2, 3, 4, 5].map((number) => {
      const exists = completed.has(number);
      const missingPrevious = Array.from(
        { length: number - 1 },
        (_, index) => index + 1
      ).find((previous) => !completed.has(previous));
      return {
        number,
        exists,
        locked: Boolean(missingPrevious),
        missingPrevious,
      };
    });
  }, [projectReviews]);

  const noProjects = projects.length === 0;

  const validateField = (name, value) => {
    switch (name) {
      case "projectId": {
        if (!value) return "Please select a project.";
        const exists = projects.some(
          (project) => getRecordId(project) === String(value)
        );
        return exists ? "" : "Selected project is not available.";
      }

      case "reviewNumber": {
        if (value === "" || value === null || value === undefined) {
          return "Please select a review number.";
        }
        const number = Number(value);
        if (!Number.isInteger(number) || number < 1 || number > 5) {
          return "Review number must be between 1 and 5.";
        }
        if (!selectedProject) return "Please select a valid project first.";

        const duplicate = projectReviews.some(
          (item) => Number(item?.reviewNumber) === number
        );
        if (duplicate) {
          return `Review ${number} already exists for this project.`;
        }

        const missingPrevious = Array.from(
          { length: number - 1 },
          (_, index) => index + 1
        ).find(
          (previous) =>
            !projectReviews.some(
              (item) => Number(item?.reviewNumber) === previous
            )
        );
        return missingPrevious
          ? `Complete Review ${missingPrevious} before Review ${number}.`
          : "";
      }

      case "reviewDate":
        if (!value) return "Review date is required.";
        if (!isValidDate(value)) return "Please select a valid calendar date.";
        if (value > today) return "Review date cannot be in the future.";
        return "";

      case "reviewerName": {
        const name = String(value ?? "").trim();
        if (!name) return "Reviewer name is required.";
        if (name.length < 3) return "Name must contain at least 3 characters.";
        if (name.length > 80) return "Name cannot exceed 80 characters.";
        if (!/^[\p{L}][\p{L} .'-]*$/u.test(name)) {
          return "Enter a valid name using letters and normal name separators.";
        }
        return "";
      }

      case "rating": {
        const rating = Number(value);
        return Number.isInteger(rating) && rating >= 1 && rating <= 5
          ? ""
          : "Please select a rating from 1 to 5.";
      }

      case "comments": {
        const comments = String(value ?? "").trim();
        if (!comments) return "Overall review comments are required.";
        if (comments.length < 5) return "Comments must be at least 5 characters.";
        if (comments.length > 1000) return "Comments cannot exceed 1000 characters.";
        if (!/[\p{L}]/u.test(comments)) return "Enter meaningful text.";
        return "";
      }

      default:
        return "";
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleProjectChange = (projectId) => {
    setFormData((current) => ({
      ...current,
      projectId: String(projectId),
      reviewNumber: "",
    }));
    setStudentMarks({});
    setTeamMarks("");
    setTeamFeedback("");
    setErrors({});
    setTouched((current) => ({ ...current, projectId: true }));
    setProjectDropdownOpen(false);
  };

  const handleRating = (rating) => {
    setFormData((current) => ({ ...current, rating }));
    setErrors((current) => ({ ...current, rating: "" }));
    setTouched((current) => ({ ...current, rating: true }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    setErrors((current) => ({
      ...current,
      [name]: validateField(name, value),
    }));
  };

  const validateForm = () => {
    const fields = [
      "projectId",
      "reviewNumber",
      "reviewDate",
      "reviewerName",
      "rating",
      "comments",
    ];
    const nextErrors = {};

    fields.forEach((field) => {
      const message = validateField(field, formData[field]);
      if (message) nextErrors[field] = message;
    });

    if (!selectedTeam) {
      nextErrors.team = "The selected project must be assigned to a valid team.";
    } else if (teamMembers.length === 0) {
      nextErrors.students =
        "No valid team members found. Check the team's member records.";
    }

    const teamMarkError = validateMarks(teamMarks);
    if (teamMarkError) nextErrors.teamMarks = teamMarkError;

    const teamFeedbackValue = teamFeedback.trim();
    if (!teamFeedbackValue) {
      nextErrors.teamFeedback = "Team feedback is required.";
    } else if (teamFeedbackValue.length < 5) {
      nextErrors.teamFeedback = "Team feedback must be at least 5 characters.";
    } else if (teamFeedbackValue.length > 1000) {
      nextErrors.teamFeedback = "Team feedback cannot exceed 1000 characters.";
    }

    teamMembers.forEach((member) => {
      const message = validateMarks(studentMarks[member.key]);
      if (message) nextErrors[`student-${member.key}`] = message;
    });

    setErrors(nextErrors);
    setTouched(
      Object.fromEntries(
        [
          ...fields,
          "teamMarks",
          "teamFeedback",
          "team",
          "students",
          ...teamMembers.map((member) => `student-${member.key}`),
        ].map((field) => [field, true])
      )
    );

    if (Object.keys(nextErrors).length) {
      showError(Object.values(nextErrors)[0]);
      return false;
    }
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting || submitConfirmation) return;
    if (!validateForm()) return;

    const payload = {
      projectId: getRecordId(selectedProject),
      projectName: selectedProject.projectName ?? "",
      teamId: getRecordId(selectedTeam),
      teamName: teamName,
      reviewNumber: Number(formData.reviewNumber),
      reviewDate: formData.reviewDate,
      reviewerName: formData.reviewerName.trim(),
      rating: Number(formData.rating),
      progress: getReviewProgress(formData.reviewNumber),
      comments: formData.comments.trim(),
      teamEvaluation: {
        marks: Number(teamMarks),
        maxMarks: 20,
        feedback: teamFeedback.trim(),
      },
      studentEvaluations: teamMembers.map((member) => ({
        studentId: member.studentId,
        studentRecordId: member.recordId,
        studentName: member.studentName,
        marks: Number(studentMarks[member.key]),
        maxMarks: 20,
      })),
    };

    setSubmitConfirmation(payload);
  };

  const confirmSubmit = async () => {
    if (!submitConfirmation || submitting) return;
    try {
      const success = await onSubmit(submitConfirmation);
      if (success) setSubmitConfirmation(null);
    } catch (error) {
      console.error("Review submission error:", error);
      showError(error?.message || "Unable to save review. Please try again.");
    }
  };

  const handleClose = () => {
    if (submitting) return;
    if (submitConfirmation) {
      setSubmitConfirmation(null);
      return;
    }
    onClose?.();
  };

  const renderError = (message) =>
    message ? (
      <small className="review-form-error" role="alert">
        <FiAlertTriangle />
        {message}
      </small>
    ) : null;

  return (
    <>
      <div
        className="review-form-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
      >
        <div
          className="review-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-form-heading"
        >
          <div className="review-form-header">
            <div className="review-form-title">
              <div className="review-form-icon">
                <FiCheckCircle />
              </div>
              <div>
                <h2 id="review-form-heading">
                  {isEditMode ? "Edit Review" : "Add Review"}
                </h2>
                <p>
                  {isEditMode
                    ? "Update evaluation details"
                    : "Record team and student evaluation"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="review-form-close"
              onClick={handleClose}
              disabled={submitting}
              title="Close"
              aria-label="Close review form"
            >
              <FiX />
            </button>
          </div>

          <form className="review-form" onSubmit={handleSubmit} noValidate>
            {/* Project selection */}
            <section className="review-form-section">
              <div className="review-form-section-title">
                <FiFileText />
                <h3>Project Information</h3>
              </div>

              <div className="review-form-group">
                <label htmlFor="projectId">
                  Project <span>*</span>
                </label>
                <div className="review-project-select-wrapper">
                  <button
                    id="projectId"
                    type="button"
                    className={`review-project-select ${
                      errors.projectId && touched.projectId ? "has-error" : ""
                    }`}
                    onClick={() =>
                      setProjectDropdownOpen((current) => !current)
                    }
                    disabled={submitting || noProjects}
                    aria-expanded={projectDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span>
                      {selectedProject?.projectName || "Select Project"}
                    </span>
                    <FiChevronDown />
                  </button>

                  {projectDropdownOpen && (
                    <div className="review-project-dropdown" role="listbox">
                      {availableProjects.length === 0 ? (
                        <div className="review-project-empty">
                          No project available
                        </div>
                      ) : (
                        availableProjects.map((project) => (
                          <button
                            type="button"
                            role="option"
                            aria-selected={
                              getRecordId(project) ===
                              String(formData.projectId)
                            }
                            key={getRecordId(project)}
                            className={
                              getRecordId(project) ===
                              String(formData.projectId)
                                ? "selected"
                                : ""
                            }
                            onClick={() =>
                              handleProjectChange(getRecordId(project))
                            }
                          >
                            <span>{project.projectName}</span>
                            <small>ID: {getRecordId(project)}</small>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {renderError(
                  errors.projectId && touched.projectId ? errors.projectId : ""
                )}
                {noProjects && (
                  <small className="review-form-hint">
                    Create a project before adding a review.
                  </small>
                )}
              </div>

              {selectedProject && (
                <div className="review-project-preview">
                  <div>
                    <span>Project ID</span>
                    <strong>{getRecordId(selectedProject)}</strong>
                  </div>
                </div>
              )}
              {renderError(errors.team && touched.team ? errors.team : "")}
            </section>

            {/* Team summary */}
            {selectedProject && (
              <section className="review-form-section">
                <div className="review-form-section-title">
                  <FiUsers />
                  <h3>Team Information</h3>
                </div>
                <div className="review-team-preview">
                  <div className="review-team-preview-item">
                    <FiUsers />
                    <div>
                      <span>Team Name</span>
                      <strong>{teamName}</strong>
                    </div>
                  </div>
                  <div className="review-team-preview-item">
                    <FiUserCheck />
                    <div>
                      <span>Team Leader</span>
                      <strong>{teamLeader}</strong>
                    </div>
                  </div>
                  <div className="review-team-preview-item">
                    <FiUserCheck />
                    <div>
                      <span>Mentor</span>
                      <strong>{mentor}</strong>
                    </div>
                  </div>
                  <div className="review-team-preview-item">
                    <FiFileText />
                    <div>
                      <span>Course</span>
                      <strong>{course}</strong>
                    </div>
                  </div>
                  <div className="review-team-preview-item">
                    <FiFileText />
                    <div>
                      <span>Department</span>
                      <strong>{department}</strong>
                    </div>
                  </div>
                  <div className="review-team-preview-item">
                    <FiUsers />
                    <div>
                      <span>Team Members</span>
                      <strong>{teamMembers.length}</strong>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Review metadata */}
            <section className="review-form-section">
              <div className="review-form-section-title">
                <FiCheckCircle />
                <h3>Review Information</h3>
              </div>

              <div className="review-form-grid">
                <div className="review-form-group">
                  <label htmlFor="reviewNumber">
                    Review Number <span>*</span>
                  </label>
                  <select
                    id="reviewNumber"
                    name="reviewNumber"
                    value={formData.reviewNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={submitting || !selectedProject}
                    className={
                      errors.reviewNumber && touched.reviewNumber
                        ? "has-error"
                        : ""
                    }
                    aria-invalid={Boolean(errors.reviewNumber)}
                  >
                    <option value="">Select Review</option>
                    {reviewOptions.map(
                      ({ number, exists, locked, missingPrevious }) => {
                        const currentEditReview =
                          isEditMode &&
                          Number(review?.reviewNumber) === number;
                        const disabled =
                          !currentEditReview && (exists || locked);
                        return (
                          <option
                            key={number}
                            value={number}
                            disabled={disabled}
                          >
                            Review {number}
                            {currentEditReview
                              ? " (Current)"
                              : exists
                              ? " (Completed)"
                              : locked
                              ? ` (Complete Review ${missingPrevious} first)`
                              : ""}
                          </option>
                        );
                      }
                    )}
                  </select>
                  {renderError(
                    errors.reviewNumber && touched.reviewNumber
                      ? errors.reviewNumber
                      : ""
                  )}
                </div>

                <div className="review-form-group">
                  <label htmlFor="reviewDate">
                    Review Date <span>*</span>
                  </label>
                  <input
                    id="reviewDate"
                    name="reviewDate"
                    type="date"
                    value={formData.reviewDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    max={today}
                    disabled={submitting}
                    className={
                      errors.reviewDate && touched.reviewDate
                        ? "has-error"
                        : ""
                    }
                    aria-invalid={Boolean(errors.reviewDate)}
                  />
                  {renderError(
                    errors.reviewDate && touched.reviewDate
                      ? errors.reviewDate
                      : ""
                  )}
                </div>

                <div className="review-form-group review-form-full">
                  <label htmlFor="reviewerName">
                    Reviewer / Mentor <span>*</span>
                  </label>
                  <input
                    id="reviewerName"
                    name="reviewerName"
                    type="text"
                    placeholder="Enter reviewer name"
                    value={formData.reviewerName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={80}
                    autoComplete="name"
                    disabled={submitting}
                    className={
                      errors.reviewerName && touched.reviewerName
                        ? "has-error"
                        : ""
                    }
                    aria-invalid={Boolean(errors.reviewerName)}
                  />
                  {renderError(
                    errors.reviewerName && touched.reviewerName
                      ? errors.reviewerName
                      : ""
                  )}
                </div>

                <div className="review-form-group">
                  <label>
                    Rating <span>*</span>
                  </label>
                  <div className="review-rating-input" role="group" aria-label="Review rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={star <= Number(formData.rating) ? "active" : ""}
                        onClick={() => handleRating(star)}
                        disabled={submitting}
                        title={`${star} Star`}
                        aria-label={`${star} star rating`}
                        aria-pressed={Number(formData.rating) === star}
                      >
                        <FiStar />
                      </button>
                    ))}
                    <strong>{Number(formData.rating || 0)}/5</strong>
                  </div>
                  {renderError(
                    errors.rating && touched.rating ? errors.rating : ""
                  )}
                </div>

                <div className="review-form-group">
                  <label>Project Progress</label>
                  <div className="review-progress-readonly">
                    {getReviewProgress(formData.reviewNumber)}%
                    <span>
                      Automatically set based on the selected review.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Team marks and one team-specific feedback area */}
            <section className="review-form-section">
              <div className="review-form-section-title">
                <FiUsers />
                <h3>Team Evaluation</h3>
              </div>

              <div className="review-form-grid">
                <div className="review-form-group">
                  <label htmlFor="teamMarks">
                    Team Marks <span>*</span>
                  </label>
                  <div className="review-marks-input">
                    <input
                      id="teamMarks"
                      type="number"
                      min="0"
                      max="20"
                      step="1"
                      inputMode="numeric"
                      value={teamMarks}
                      onChange={(event) => {
                        setTeamMarks(event.target.value);
                        setErrors((current) => ({
                          ...current,
                          teamMarks: "",
                        }));
                      }}
                      onBlur={() => {
                        setTouched((current) => ({
                          ...current,
                          teamMarks: true,
                        }));
                        setErrors((current) => ({
                          ...current,
                          teamMarks: validateMarks(teamMarks),
                        }));
                      }}
                      disabled={submitting || !selectedProject}
                      className={
                        errors.teamMarks && touched.teamMarks ? "has-error" : ""
                      }
                      aria-invalid={Boolean(errors.teamMarks)}
                    />
                    <span>/ 20</span>
                  </div>
                  {renderError(
                    errors.teamMarks && touched.teamMarks
                      ? errors.teamMarks
                      : ""
                  )}
                </div>

                <div className="review-form-group review-form-full">
                  <label htmlFor="teamFeedback">
                    Team Feedback <span>*</span>
                  </label>
                  <textarea
                    id="teamFeedback"
                    rows="3"
                    maxLength={1000}
                    placeholder="Feedback on teamwork, coordination, contribution and overall team performance..."
                    value={teamFeedback}
                    onChange={(event) => {
                      setTeamFeedback(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        teamFeedback: "",
                      }));
                    }}
                    onBlur={() => {
                      setTouched((current) => ({
                        ...current,
                        teamFeedback: true,
                      }));
                      const value = teamFeedback.trim();
                      const message = !value
                        ? "Team feedback is required."
                        : value.length < 5
                        ? "Team feedback must be at least 5 characters."
                        : value.length > 1000
                        ? "Team feedback cannot exceed 1000 characters."
                        : "";
                      setErrors((current) => ({
                        ...current,
                        teamFeedback: message,
                      }));
                    }}
                    disabled={submitting || !selectedProject}
                    className={
                      errors.teamFeedback && touched.teamFeedback
                        ? "has-error"
                        : ""
                    }
                    aria-invalid={Boolean(errors.teamFeedback)}
                  />
                  <div className="review-form-character-count">
                    {teamFeedback.length}/1000 characters
                  </div>
                  {renderError(
                    errors.teamFeedback && touched.teamFeedback
                      ? errors.teamFeedback
                      : ""
                  )}
                </div>
              </div>
            </section>

            {/* Individual student marks */}
            <section className="review-form-section">
              <div className="review-form-section-title">
                <FiUsers />
                <h3>Student Evaluation</h3>
              </div>

              {teamMembers.length === 0 ? (
                <div className="review-form-empty">
                  Select a project with a team that has valid student members.
                </div>
              ) : (
                <div className="review-student-evaluation-list">
                  {teamMembers.map((member, index) => {
                    const fieldKey = `student-${member.key}`;
                    return (
                      <div
                        className="review-student-evaluation-row"
                        key={member.key}
                      >
                        <div className="review-student-identity">
                          <span className="review-student-index">
                            {index + 1}
                          </span>
                          <div>
                            <strong>{member.studentName}</strong>
                            <small>Student ID: {member.studentId}</small>
                          </div>
                        </div>

                        <div className="review-student-marks">
                          <label htmlFor={`marks-${member.key}`}>
                            Marks <span>*</span>
                          </label>
                          <div className="review-marks-input">
                            <input
                              id={`marks-${member.key}`}
                              type="number"
                              min="0"
                              max="20"
                              step="1"
                              inputMode="numeric"
                              value={studentMarks[member.key] ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                setStudentMarks((current) => ({
                                  ...current,
                                  [member.key]: value,
                                }));
                                setErrors((current) => ({
                                  ...current,
                                  [fieldKey]: "",
                                }));
                              }}
                              onBlur={() => {
                                setTouched((current) => ({
                                  ...current,
                                  [fieldKey]: true,
                                }));
                                setErrors((current) => ({
                                  ...current,
                                  [fieldKey]: validateMarks(
                                    studentMarks[member.key]
                                  ),
                                }));
                              }}
                              disabled={submitting}
                              className={
                                errors[fieldKey] && touched[fieldKey]
                                  ? "has-error"
                                  : ""
                              }
                              aria-invalid={Boolean(errors[fieldKey])}
                            />
                            <span>/ 20</span>
                          </div>
                          {renderError(
                            errors[fieldKey] && touched[fieldKey]
                              ? errors[fieldKey]
                              : ""
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {renderError(errors.students && touched.students ? errors.students : "")}
            </section>

            {/* One overall review comments area */}
            <section className="review-form-section">
              <div className="review-form-section-title">
                <FiFileText />
                <h3>Overall Review Comments</h3>
              </div>
              <div className="review-form-group">
                <label htmlFor="comments">
                  Review Comments <span>*</span>
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  rows="4"
                  maxLength={1000}
                  placeholder="Summarize progress, achievements, concerns and next steps..."
                  value={formData.comments}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={submitting}
                  className={
                    errors.comments && touched.comments ? "has-error" : ""
                  }
                  aria-invalid={Boolean(errors.comments)}
                />
                <div className="review-form-character-count">
                  {formData.comments.length}/1000 characters
                </div>
                {renderError(
                  errors.comments && touched.comments ? errors.comments : ""
                )}
              </div>
            </section>

            <div className="review-form-actions">
              <button
                type="button"
                className="review-form-cancel"
                onClick={handleClose}
                disabled={submitting}
              >
                <FiX />
                Cancel
              </button>
              <button
                type="submit"
                className="review-form-submit"
                disabled={submitting || noProjects}
              >
                <FiSave />
                {isEditMode ? "Update Review" : "Create Review"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {submitConfirmation && (
        <div className="review-confirm-overlay">
          <div
            className="review-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-confirm-title"
          >
            <div className="review-confirm-icon">
              <FiAlertTriangle />
            </div>
            <div className="review-confirm-content">
              <h2 id="review-confirm-title">
                {isEditMode ? "Update Review?" : "Create Review?"}
              </h2>
              <p>
                Are you sure you want to {isEditMode ? "update" : "create"}{" "}
                <strong>Review {submitConfirmation.reviewNumber}</strong> for{" "}
                <strong>{submitConfirmation.projectName}</strong>?
              </p>
              <p>
                Team marks: <strong>{submitConfirmation.teamEvaluation.marks}/20</strong>
                {" · "}
                Students evaluated:{" "}
                <strong>{submitConfirmation.studentEvaluations.length}</strong>
              </p>
            </div>
            <div className="review-confirm-actions">
              <button
                type="button"
                className="review-confirm-cancel"
                onClick={() => setSubmitConfirmation(null)}
                disabled={submitting}
              >
                <FiX />
                Cancel
              </button>
              <button
                type="button"
                className="review-confirm-submit"
                onClick={confirmSubmit}
                disabled={submitting}
              >
                <FiCheckCircle />
                {submitting
                  ? "Saving..."
                  : isEditMode
                  ? "Confirm Update"
                  : "Confirm Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReviewForm;
