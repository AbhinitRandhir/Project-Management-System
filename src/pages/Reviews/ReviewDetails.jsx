
import { useMemo } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiFileText,
  FiStar,
  FiUserCheck,
  FiUsers,
  FiX,
  FiBookOpen,
  FiHash,
} from "react-icons/fi";

import "./ReviewDetails.css";

/* =========================================================
   HELPERS
========================================================= */

const toId = (value) => String(value ?? "").trim();

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, toNumber(value)));

const getRecordId = (record) =>
  toId(record?.id ?? record?._id);

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

const getProgressClass = (progress) => {
  if (progress >= 100) return "progress-complete";
  if (progress >= 70) return "progress-good";
  if (progress >= 40) return "progress-medium";
  return "progress-low";
};

const getEvaluationStudentId = (evaluation) =>
  toId(
    evaluation?.studentId ??
    evaluation?.id ??
    evaluation?._id
  );

const getStudentRecord = (studentId, students = []) => {
  const id = toId(studentId);

  if (!id) return null;

  return students.find((student) => {
    const databaseId = getRecordId(student);
    const studentCode = toId(student?.studentId);

    return id === databaseId || id === studentCode;
  }) || null;
};

/*
  Supports both database ID and human-readable Student ID.
*/
const getEvaluationForStudent = (
  evaluations = [],
  student
) => {
  const studentIds = new Set(
    [
      getRecordId(student),
      toId(student?.studentId),
    ].filter(Boolean)
  );

  return evaluations.find((evaluation) =>
    studentIds.has(getEvaluationStudentId(evaluation))
  ) || null;
};

/*
  Keep only one record for each review number.
  The currently opened review takes priority.
*/
const getUniqueProjectReviews = (reviews = [], currentReview) => {
  const reviewMap = new Map();

  reviews.forEach((item) => {
    const number = Number(item?.reviewNumber);

    if (number < 1 || number > 5) return;

    reviewMap.set(number, item);
  });

  if (currentReview) {
    const currentNumber = Number(currentReview.reviewNumber);

    if (currentNumber >= 1 && currentNumber <= 5) {
      reviewMap.set(currentNumber, currentReview);
    }
  }

  return Array.from(reviewMap.values()).sort(
    (a, b) =>
      Number(a.reviewNumber) - Number(b.reviewNumber)
  );
};

/* =========================================================
   MARKS BAR
========================================================= */

function MarksBar({ marks, maxMarks = 20 }) {
  const safeMax = Math.max(1, toNumber(maxMarks));
  const safeMarks = clamp(marks, 0, safeMax);
  const percentage = (safeMarks / safeMax) * 100;

  return (
    <div className="review-details-marks">
      <div
        className="review-details-marks-track"
        role="progressbar"
        aria-label={`Marks ${safeMarks} out of ${safeMax}`}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeMarks}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>

      <strong>
        {safeMarks}/{safeMax}
      </strong>
    </div>
  );
}

/* =========================================================
   REVIEW DETAILS
========================================================= */

function ReviewDetails({
  review,
  project,
  team,
  reviews = [],
  students = [],
  onClose,
  onEdit,
  canEdit = false,
}) {
  /*
    Hooks are intentionally declared before conditional return.
  */

  const projectId = toId(
    project?.id ??
    project?._id ??
    review?.projectId
  );

  const projectReviews = useMemo(() => {
    if (!review) return [];

    const matchingReviews = (Array.isArray(reviews) ? reviews : [])
      .filter(
        (item) =>
          toId(item?.projectId) === projectId
      );

    return getUniqueProjectReviews(
      matchingReviews,
      review
    );
  }, [reviews, review, projectId]);

  const studentRows = useMemo(() => {
    const evaluations = Array.isArray(review?.studentEvaluations)
      ? review.studentEvaluations
      : [];

    const seenStudents = new Set();

    return evaluations
      .map((evaluation, index) => {
        const evaluationId = getEvaluationStudentId(evaluation);
        const student = getStudentRecord(
          evaluationId,
          students
        );

        const databaseId = getRecordId(student);
        const studentCode = toId(student?.studentId);

        const uniqueKey =
          databaseId ||
          studentCode ||
          evaluationId ||
          `student-${index}`;

        if (seenStudents.has(uniqueKey)) {
          return null;
        }

        seenStudents.add(uniqueKey);

        return {
          id: uniqueKey,
          studentId:
            studentCode ||
            evaluationId ||
            "—",
          name:
            evaluation?.studentName ||
            student?.name ||
            student?.studentName ||
            "Student",
          marks: toNumber(evaluation?.marks),
          maxMarks:
            toNumber(evaluation?.maxMarks) || 20,
          sourceStudent: student,
        };
      })
      .filter(Boolean);
  }, [review, students]);

  if (!review) return null;

  /* =======================================================
     PROJECT / TEAM INFORMATION
  ======================================================= */

  const projectName =
    project?.projectName ||
    project?.name ||
    review?.projectName ||
    "Not Available";

  const displayProjectId =
    projectId || "Not Available";

  const teamName =
    team?.teamName ||
    project?.teamName ||
    review?.teamName ||
    "Not Available";

  const teamId =
    getRecordId(team) ||
    toId(team?.teamId) ||
    toId(project?.teamId) ||
    toId(review?.teamId) ||
    "Not Available";

  const course =
    team?.course ||
    project?.course ||
    review?.course ||
    "Not Available";

  const department =
    team?.department ||
    project?.department ||
    review?.department ||
    "Not Available";

  const teamLeader =
    team?.teamLeaderName ||
    project?.teamLeaderName ||
    review?.teamLeaderName ||
    "Not Available";

  const mentor =
    team?.mentorName ||
    project?.mentorName ||
    review?.mentorName ||
    "Not Available";

  /* =======================================================
     CURRENT REVIEW
  ======================================================= */

  const reviewNumber = Number(review.reviewNumber) || 0;

  const rating = clamp(review.rating, 0, 5);
  const progress = clamp(review.progress, 0, 100);

  const teamEvaluation =
    review.teamEvaluation || {};

  const currentTeamMarks =
    clamp(teamEvaluation.marks, 0, 20);

  const currentTeamMax =
    toNumber(teamEvaluation.maxMarks) || 20;

  const completedReviews = projectReviews.length;

  /* =======================================================
     CUMULATIVE TEAM MARKS
  ======================================================= */

  const teamTotal = projectReviews.reduce(
    (sum, item) =>
      sum + clamp(item?.teamEvaluation?.marks, 0, 20),
    0
  );

  const safeTeamTotal = clamp(teamTotal, 0, 100);

  /* =======================================================
     CUMULATIVE STUDENT MARKS
  ======================================================= */

  const getStudentTotal = (studentRow) => {
    return projectReviews.reduce((sum, item) => {
      const evaluations = Array.isArray(
        item?.studentEvaluations
      )
        ? item.studentEvaluations
        : [];

      const evaluation = getEvaluationForStudent(
        evaluations,
        studentRow.sourceStudent
      );

      /*
        Fallback for older records where student data
        was saved using a different ID format.
      */
      const fallbackEvaluation =
        evaluation ||
        evaluations.find(
          (entry) =>
            getEvaluationStudentId(entry) ===
            studentRow.studentId
        );

      return (
        sum +
        clamp(fallbackEvaluation?.marks, 0, 20)
      );
    }, 0);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="review-details-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="review-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-details-title"
      >
        {/* HEADER */}

        <div className="review-details-header">
          <div className="review-details-title">
            <div className="review-details-icon">
              <FiCheckCircle />
            </div>

            <div>
              <span>
                Review {reviewNumber || "—"} of 5
              </span>

              <h2 id="review-details-title">
                Review Details
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="review-details-close"
            onClick={onClose}
            title="Close"
            aria-label="Close review details"
          >
            <FiX />
          </button>
        </div>

        {/* CONTENT */}

        <div className="review-details-content">

          {/* PROJECT INFORMATION */}

          <section className="review-details-section">
            <div className="review-details-section-title">
              <FiFileText />
              <h3>Project Information</h3>
            </div>

            <div className="review-details-project">
              <div className="review-details-project-icon">
                <FiFileText />
              </div>

              <div>
                <span>Project Name</span>

                <h4>{projectName}</h4>

                <small>
                  Project ID: {displayProjectId}
                </small>
              </div>
            </div>
          </section>

          {/* TEAM INFORMATION */}

          <section className="review-details-section">
            <div className="review-details-section-title">
              <FiUsers />
              <h3>Team Information</h3>
            </div>

            <div className="review-details-grid">

              <div className="review-details-item">
                <span>Team Name</span>
                <strong>{teamName}</strong>
              </div>

              <div className="review-details-item">
                <span>Team ID</span>
                <strong className="review-details-value-icon">
                  <FiHash />
                  {teamId}
                </strong>
              </div>

              <div className="review-details-item">
                <span>Course</span>
                <strong className="review-details-value-icon">
                  <FiBookOpen />
                  {course}
                </strong>
              </div>

              <div className="review-details-item">
                <span>Department</span>
                <strong>{department}</strong>
              </div>

              <div className="review-details-item">
                <span>Team Leader</span>
                <strong>{teamLeader}</strong>
              </div>

              <div className="review-details-item">
                <span>Mentor</span>
                <strong>{mentor}</strong>
              </div>

            </div>
          </section>

          {/* REVIEW INFORMATION */}

          <section className="review-details-section">
            <div className="review-details-section-title">
              <FiCheckCircle />
              <h3>Review Information</h3>
            </div>

            <div className="review-details-grid">

              <div className="review-details-item">
                <span>Review Number</span>
                <strong>
                  Review {reviewNumber || "—"}
                </strong>
              </div>

              <div className="review-details-item">
                <span>Review Date</span>

                <strong className="review-details-value-icon">
                  <FiCalendar />
                  {formatDate(review.reviewDate)}
                </strong>
              </div>

              <div className="review-details-item">
                <span>Reviewer / Mentor</span>

                <strong className="review-details-value-icon">
                  <FiUserCheck />
                  {review.reviewerName || "Not Available"}
                </strong>
              </div>

              <div className="review-details-item">
                <span>Rating</span>

                <div className="review-details-rating">
                  <div className="review-details-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        className={
                          star <= rating
                            ? "review-details-star-filled"
                            : "review-details-star-empty"
                        }
                      />
                    ))}
                  </div>

                  <strong>{rating}/5</strong>
                </div>
              </div>

              <div className="review-details-item">
                <span>Completed Reviews</span>
                <strong>{completedReviews}/5</strong>
              </div>

            </div>
          </section>

          {/* PROJECT PROGRESS */}

          <section className="review-details-section">
            <div className="review-details-section-title">
              <FiCheckCircle />
              <h3>Project Progress</h3>
            </div>

            <div className="review-details-progress">
              <div className="review-details-progress-header">
                <span>Progress</span>
                <strong>{progress}%</strong>
              </div>

              <div className="review-details-progress-track">
                <div
                  className={`review-details-progress-fill ${getProgressClass(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>

          {/* TEAM EVALUATION */}

          <section className="review-details-section">
            <div className="review-details-section-title">
              <FiUsers />
              <h3>Team Evaluation</h3>
            </div>

            <div className="review-details-score-card">

              <div className="review-details-score-heading">
                <span>Marks in This Review</span>

                <strong>
                  {currentTeamMarks}/{currentTeamMax}
                </strong>
              </div>

              <MarksBar
                marks={currentTeamMarks}
                maxMarks={currentTeamMax}
              />

              <div className="review-details-cumulative">
                <span>Cumulative Team Marks</span>

                <strong>
                  {safeTeamTotal}/100
                </strong>
              </div>

              <div className="review-details-comments">
                <span>Team Feedback</span>

                <p>
                  {teamEvaluation.feedback?.trim() ||
                    "No team feedback available."}
                </p>
              </div>

            </div>
          </section>

          {/* STUDENT EVALUATION */}

          <section className="review-details-section">
            <div className="review-details-section-title">
              <FiUsers />
              <h3>Individual Student Evaluation</h3>
            </div>

            {studentRows.length === 0 ? (
              <div className="review-details-comments">
                <p className="review-details-no-comments">
                  No individual student marks available
                  for this review.
                </p>
              </div>
            ) : (
              <div className="review-details-student-list">

                {studentRows.map((student) => {
                  const studentTotal = clamp(
                    getStudentTotal(student),
                    0,
                    100
                  );

                  return (
                    <article
                      className="review-details-student-card"
                      key={student.id}
                    >

                      <div className="review-details-student-info">
                        <span className="review-details-student-avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </span>

                        <div>
                          <strong>{student.name}</strong>

                          <small>
                            Student ID: {student.studentId}
                          </small>
                        </div>
                      </div>

                      <div className="review-details-student-score">
                        <span>This Review</span>

                        <MarksBar
                          marks={student.marks}
                          maxMarks={student.maxMarks}
                        />
                      </div>

                      <div className="review-details-student-total">
                        <span>Cumulative Total</span>

                        <strong>
                          {studentTotal}/100
                        </strong>
                      </div>

                    </article>
                  );
                })}

              </div>
            )}
          </section>

          {/* REVIEW COMMENTS */}

          <section className="review-details-section">
            <div className="review-details-section-title">
              <FiFileText />
              <h3>Overall Review Comments</h3>
            </div>

            <div className="review-details-comments">
              {review.comments?.trim() ? (
                <p>{review.comments}</p>
              ) : (
                <p className="review-details-no-comments">
                  No comments available.
                </p>
              )}
            </div>
          </section>

        </div>

        {/* FOOTER */}

        <div className="review-details-footer">
          <button
            type="button"
            className="review-details-close-btn"
            onClick={onClose}
          >
            <FiX />
            Close
          </button>

          {canEdit && (
            <button
              type="button"
              className="review-details-edit-btn"
              onClick={() => onEdit?.(review)}
            >
              <FiEdit2 />
              Edit Review
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default ReviewDetails;