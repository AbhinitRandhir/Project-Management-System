import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  FiAlertTriangle,
  FiCheckCircle,
  FiCheck,
  FiChevronDown,
  FiEdit2,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import Loader from "../../components/Loader/Loader";
import { useToast } from "../../components/Toast/Toast";
import { useAuth } from "../../context/AuthContext";

import ReviewForm from "./ReviewForm";
import ReviewDetails from "./ReviewDetails";

import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../../services/reviewService";

import { getProjects } from "../../services/projectService";
import { getTeams } from "../../services/teamService";
import { getStudents } from "../../services/studentService";

import "./Reviews.css";

/* =====================================================
   HELPERS
===================================================== */

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const sameValue = (first, second) =>
  normalize(first) === normalize(second);

const getId = (value) =>
  String(value ?? "").trim();

const getRating = (review) => {
  const rating = Number(review?.rating || 0);

  return Math.min(5, Math.max(0, rating));
};

const getProgress = (review) => {
  const progress = Number(review?.progress || 0);

  return Math.min(100, Math.max(0, progress));
};

const getProgressClass = (progress) => {
  if (progress >= 100) return "progress-complete";
  if (progress >= 70) return "progress-good";
  if (progress >= 40) return "progress-medium";

  return "progress-low";
};

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
   SIMPLE CUSTOM DROPDOWN (NO SEARCH)
===================================================== */
function CustomDropdown({ value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, []);

  return (
    <div className={`custom-dropdown ${open ? "is-open" : ""}`} ref={rootRef}>
      <button type="button" className="custom-dropdown-trigger" aria-label={ariaLabel}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((prev) => !prev)}>
        <span>{selected?.label || "Select option"}</span>
        <FiChevronDown className="dropdown-chevron" />
      </button>
      {open && (
        <div className="custom-dropdown-menu" role="listbox">
          {options.map((option) => {
            const active = String(option.value) === String(value);
            return (
              <button key={option.value} type="button" role="option" aria-selected={active}
                className={`custom-dropdown-option ${active ? "selected" : ""}`}
                onClick={() => { onChange(option.value); setOpen(false); }}>
                <span>{option.label}</span>{active && <FiCheck />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   REVIEWS COMPONENT
===================================================== */

function Reviews() {
  const {
    currentUser,
    isAdmin,
    isMentor,
    userCourse,
    userDepartment,
  } = useAuth();

  const {
    success: showSuccess,
    error: showError,
  } = useToast();

  /* =====================================================
     CURRENT USER
  ===================================================== */

  const currentUserId = getId(
    currentUser?.id ?? currentUser?._id
  );

  const currentUserName = normalize(
    currentUser?.name
  );

  const courseScope =
    userCourse || currentUser?.course || "";

  const departmentScope =
    userDepartment ||
    currentUser?.department ||
    "";

  /* =====================================================
     STATE
  ===================================================== */

  const [reviews, setReviews] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [reviewFilter, setReviewFilter] = useState("");
  const [exportReviewFilter, setExportReviewFilter] = useState("5");
  const [exportTypeFilter, setExportTypeFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const REVIEWS_PER_PAGE = 6;

  const [showForm, setShowForm] = useState(false);
  const [selectedReview, setSelectedReview] =
    useState(null);

  const [detailsReview, setDetailsReview] =
    useState(null);

  const [deleteConfirmation, setDeleteConfirmation] =
    useState(null);
  const [exportConfirmation, setExportConfirmation] = useState(null);
  const [exporting, setExporting] = useState(false);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          reviewsResponse,
          projectsResponse,
          teamsResponse,
          studentsResponse,
        ] = await Promise.all([
          getReviews(),
          getProjects(),
          getTeams(),
          getStudents(),
        ]);

        if (!isMounted) return;

        setReviews(
          Array.isArray(reviewsResponse?.data)
            ? reviewsResponse.data
            : []
        );

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
      } catch (requestError) {
        if (!isMounted) return;

        console.error(
          "Unable to load reviews:",
          requestError
        );

        const message =
          requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load reviews.";

        setError(message);
        showError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [showError]);

  /* =====================================================
     DATA LOOKUPS
  ===================================================== */

  const getProject = (projectId) => {
    if (!projectId) return null;

    return (
      projects.find(
        (project) =>
          getId(project?.id) === getId(projectId)
      ) || null
    );
  };

  const getTeam = (project) => {
    if (!project) return null;

    return (
      teams.find(
        (team) =>
          getId(team?.id) ===
          getId(project?.teamId)
      ) || null
    );
  };

  const getReviewProject = (review) => {
    return getProject(review?.projectId);
  };

  const getReviewTeam = (review) => {
    const project = getReviewProject(review);

    if (project) {
      return getTeam(project);
    }

    return (
      teams.find(
        (team) =>
          getId(team?.id) ===
          getId(review?.teamId)
      ) || null
    );
  };

  const getProjectName = (review) => {
    const project = getReviewProject(review);

    return (
      project?.projectName ||
      review?.projectName ||
      "Not Available"
    );
  };

  const getTeamName = (review) => {
    const project = getReviewProject(review);
    const team = getReviewTeam(review);

    return (
      team?.teamName ||
      project?.teamName ||
      review?.teamName ||
      "Not Available"
    );
  };

  const getTeamLeader = (review) => {
    const project = getReviewProject(review);
    const team = getReviewTeam(review);

    return (
      team?.teamLeaderName ||
      project?.teamLeaderName ||
      review?.teamLeaderName ||
      "Not Available"
    );
  };

  const getMentor = (review) => {
    const project = getReviewProject(review);
    const team = getReviewTeam(review);

    return (
      team?.mentorName ||
      project?.mentorName ||
      review?.mentorName ||
      "Not Available"
    );
  };

  const getDepartment = (review) => {
    const project = getReviewProject(review);
    const team = getReviewTeam(review);

    return (
      team?.department ||
      project?.department ||
      review?.department ||
      "Not Available"
    );
  };

  const getCourse = (review) => {
    const project = getReviewProject(review);
    const team = getReviewTeam(review);

    return (
      team?.course ||
      project?.course ||
      review?.course ||
      ""
    );
  };

  /* =====================================================
     ROLE ACCESS
  ===================================================== */

  const hasCourseAccess = (review) => {
    if (!isAdmin && !isMentor) {
      return false;
    }

    const course = getCourse(review);

    if (!courseScope) {
      return false;
    }

    return sameValue(course, courseScope);
  };

  const hasDepartmentAccess = (review) => {
    if (!hasCourseAccess(review)) {
      return false;
    }

    if (isAdmin) {
      return true;
    }

    if (!isMentor || !departmentScope) {
      return false;
    }

    return sameValue(
      getDepartment(review),
      departmentScope
    );
  };

  /* =====================================================
     MENTOR OWNERSHIP
  ===================================================== */

  const isOwnTeam = (team) => {
    if (!team || !isMentor) {
      return false;
    }

    const teamMentorId = getId(team?.mentorId);

    // Prefer mentor ID when it is available.
    if (teamMentorId && currentUserId) {
      return teamMentorId === currentUserId;
    }

    // Legacy fallback for old records without mentorId.
    const teamMentorName = normalize(
      team?.mentorName
    );

    return Boolean(
      currentUserName &&
      teamMentorName &&
      teamMentorName === currentUserName
    );
  };

  const canManageReview = (review) => {
    if (isAdmin) {
      return hasCourseAccess(review);
    }

    if (!isMentor) {
      return false;
    }

    if (!hasDepartmentAccess(review)) {
      return false;
    }

    const team = getReviewTeam(review);

    return isOwnTeam(team);
  };

  const canManageProject = (project) => {
    if (!project) return false;

    const projectCourse =
      project.course || "";

    const projectDepartment =
      project.department || "";

    if (
      !courseScope ||
      !sameValue(projectCourse, courseScope)
    ) {
      return false;
    }

    if (isAdmin) {
      return true;
    }

    if (
      !isMentor ||
      !departmentScope ||
      !sameValue(
        projectDepartment,
        departmentScope
      )
    ) {
      return false;
    }

    const team = getTeam(project);

    return isOwnTeam(team);
  };

  /* =====================================================
     VISIBLE DATA
  ===================================================== */

  const visibleReviews = reviews.filter(
    hasDepartmentAccess
  );

  const visibleProjects = projects.filter(
    (project) => {
      const projectCourse =
        project?.course || "";

      const projectDepartment =
        project?.department || "";

      if (
        !courseScope ||
        !sameValue(projectCourse, courseScope)
      ) {
        return false;
      }

      if (isAdmin) {
        return true;
      }

      return (
        isMentor &&
        Boolean(departmentScope) &&
        sameValue(
          projectDepartment,
          departmentScope
        )
      );
    }
  );

  // Admin can manage all projects in their course.
  // Mentor can create reviews only for their own teams.
  const manageableProjects = visibleProjects.filter(
    canManageProject
  );

  /* =====================================================
     REVIEW PROJECT FILTER OPTIONS
  ===================================================== */

  const reviewProjects = [
    ...new Map(
      visibleReviews
        .map((review) => getReviewProject(review))
        .filter(Boolean)
        .map((project) => [
          getId(project.id),
          project,
        ])
    ).values(),
  ].sort((first, second) =>
    String(first?.projectName || "").localeCompare(
      String(second?.projectName || "")
    )
  );

  /* =====================================================
     FILTER REVIEWS
  ===================================================== */

  const search = searchTerm.trim().toLowerCase();

  const filteredReviews = visibleReviews
    .filter((review) => {
      const project = getReviewProject(review);

      const projectName =
        getProjectName(review).toLowerCase();

      const teamName =
        getTeamName(review).toLowerCase();

      const teamLeader =
        getTeamLeader(review).toLowerCase();

      const mentor =
        getMentor(review).toLowerCase();

      const department =
        getDepartment(review).toLowerCase();

      const reviewer = normalize(
        review?.reviewerName
      );

      const reviewNumber = String(
        review?.reviewNumber || ""
      );

      const projectId = normalize(
        review?.projectId
      );

      const matchesSearch =
        !search ||
        projectName.includes(search) ||
        teamName.includes(search) ||
        teamLeader.includes(search) ||
        mentor.includes(search) ||
        department.includes(search) ||
        reviewer.includes(search) ||
        reviewNumber.includes(search) ||
        projectId.includes(search);

      const matchesProject =
        !projectFilter ||
        getId(project?.id) ===
          getId(projectFilter);

      const matchesReview =
        !reviewFilter ||
        String(review?.reviewNumber) ===
          String(reviewFilter);

      return (
        matchesSearch &&
        matchesProject &&
        matchesReview
      );
    })
    .sort(
      (first, second) =>
        Number(first?.reviewNumber || 0) -
        Number(second?.reviewNumber || 0)
    );

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReviews.length / REVIEWS_PER_PAGE
    )
  );

  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  );

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

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

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalReviews = visibleReviews.length;

  const projectsWithReviews = new Set(
    visibleReviews
      .map((review) => getId(review?.projectId))
      .filter(Boolean)
  ).size;

  const completedProjects = new Set(
    visibleReviews
      .filter((review) => {
        const projectReviewCount =
          visibleReviews.filter(
            (item) =>
              getId(item?.projectId) ===
              getId(review?.projectId)
          ).length;

        return projectReviewCount >= 5;
      })
      .map((review) => getId(review?.projectId))
  ).size;

  const availableReviewSlots =
    manageableProjects.reduce(
      (total, project) => {
        const reviewCount = reviews.filter(
          (review) =>
            getId(review?.projectId) ===
            getId(project?.id)
        ).length;

        return (
          total +
          Math.max(0, 5 - reviewCount)
        );
      },
      0
    );

  /* =====================================================
     FORM HANDLERS
  ===================================================== */

  const handleAddReview = () => {
    if (manageableProjects.length === 0) {
      showError(
        "No manageable projects are available for reviews."
      );
      return;
    }

    setSelectedReview(null);
    setShowForm(true);
  };

  const handleEditReview = (review) => {
    if (!canManageReview(review)) {
      showError(
        "You do not have permission to edit this review."
      );
      return;
    }

    setSelectedReview(review);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setShowForm(false);
    setSelectedReview(null);
  };

  /* =====================================================
     DETAILS
  ===================================================== */

  const handleViewReview = (review) => {
    setDetailsReview(review);
  };

  const handleCloseDetails = () => {
    setDetailsReview(null);
  };

  /* =====================================================
     SAVE REVIEW
  ===================================================== */

  const handleSaveReview = async (reviewData) => {
    try {
      setSubmitting(true);
      setError("");

      if (!reviewData?.projectId) {
        const message = "Please select a project.";

        setError(message);
        showError(message);

        return false;
      }

      const selectedProject = getProject(
        reviewData.projectId
      );

      if (!selectedProject) {
        const message =
          "Selected project was not found.";

        setError(message);
        showError(message);

        return false;
      }

      if (!canManageProject(selectedProject)) {
        const message =
          "You do not have permission to manage reviews for this project.";

        setError(message);
        showError(message);

        return false;
      }

      if (
        selectedReview &&
        !canManageReview(selectedReview)
      ) {
        const message =
          "You do not have permission to edit this review.";

        setError(message);
        showError(message);

        return false;
      }

      const reviewNumber = Number(
        reviewData?.reviewNumber
      );

      if (
        !Number.isInteger(reviewNumber) ||
        reviewNumber < 1 ||
        reviewNumber > 5
      ) {
        const message =
          "Review number must be between 1 and 5.";

        setError(message);
        showError(message);

        return false;
      }

      const duplicateReview = reviews.find(
        (review) =>
          getId(review?.projectId) ===
            getId(reviewData.projectId) &&
          Number(review?.reviewNumber) ===
            reviewNumber &&
          getId(review?.id) !==
            getId(selectedReview?.id)
      );

      if (duplicateReview) {
        const message =
          `Review ${reviewNumber} already exists for this project.`;

        setError(message);
        showError(message);

        return false;
      }

      if (!selectedReview) {
        const reviewCount = reviews.filter(
          (review) =>
            getId(review?.projectId) ===
            getId(reviewData.projectId)
        ).length;

        if (reviewCount >= 5) {
          const message =
            "This project already has 5 reviews.";

          setError(message);
          showError(message);

          return false;
        }
      }

      const selectedTeam =
        getTeam(selectedProject);

      const rating = Number(
        reviewData?.rating || 0
      );

      const progress = Number(
        reviewData?.progress || 0
      );

      const payload = {
        projectId: selectedProject.id,

        projectName:
          selectedProject.projectName || "",

        teamId:
          selectedTeam?.id ||
          selectedProject.teamId ||
          "",

        teamName:
          selectedTeam?.teamName ||
          selectedProject.teamName ||
          "",

        course:
          selectedTeam?.course ||
          selectedProject.course ||
          "",

        department:
          selectedTeam?.department ||
          selectedProject.department ||
          "",

        teamLeaderId:
          selectedTeam?.teamLeaderId ||
          selectedProject.teamLeaderId ||
          "",

        teamLeaderName:
          selectedTeam?.teamLeaderName ||
          selectedProject.teamLeaderName ||
          "",

        mentorName:
          selectedTeam?.mentorName ||
          selectedProject.mentorName ||
          "",

        reviewNumber,

        reviewDate:
          reviewData?.reviewDate || "",

        reviewerName: String(
          reviewData?.reviewerName || ""
        ).trim(),

        rating: Math.min(
          5,
          Math.max(0, rating)
        ),

        progress: Math.min(
          100,
          Math.max(0, progress)
        ),

        comments: String(
          reviewData?.comments || ""
        ).trim(),

        teamEvaluation: {
          marks: Number(reviewData?.teamEvaluation?.marks ?? 0),
          maxMarks: 20,
          feedback: String(reviewData?.teamEvaluation?.feedback || "").trim(),
        },

        studentEvaluations: Array.isArray(reviewData?.studentEvaluations)
          ? reviewData.studentEvaluations.map((item) => ({
              studentId: String(item.studentId ?? ""),
              studentName: String(item.studentName || ""),
              marks: Number(item.marks ?? 0),
              maxMarks: 20,
            }))
          : [],
      };

      /* UPDATE */

      if (selectedReview) {
        const response = await updateReview(
          selectedReview.id,
          {
            ...payload,
            updatedAt: new Date().toISOString(),
          }
        );

        const updatedReview = response?.data;

        if (!updatedReview) {
          throw new Error(
            "Review was not updated."
          );
        }

        setReviews((currentReviews) =>
          currentReviews.map((review) =>
            getId(review.id) ===
            getId(selectedReview.id)
              ? updatedReview
              : review
          )
        );

        showSuccess(
          "Review updated successfully."
        );
      } else {
        /* CREATE */

        const response = await createReview({
          ...payload,
          createdAt: new Date().toISOString(),
        });

        const newReview = response?.data;

        if (!newReview) {
          throw new Error(
            "Review was not created."
          );
        }

        setReviews((currentReviews) => [
          ...currentReviews,
          newReview,
        ]);

        showSuccess(
          "Review created successfully."
        );
      }

      setShowForm(false);
      setSelectedReview(null);

      return true;
    } catch (requestError) {
      console.error(
        "Unable to save review:",
        requestError
      );

      const message =
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Unable to save review.";

      setError(message);
      showError(message);

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDeleteReview = (review) => {
    if (!canManageReview(review)) {
      showError(
        "You do not have permission to delete this review."
      );
      return;
    }

    setDeleteConfirmation(review);
  };

  const confirmDeleteReview = async () => {
    if (!deleteConfirmation?.id) return;

    if (!canManageReview(deleteConfirmation)) {
      showError(
        "You do not have permission to delete this review."
      );

      setDeleteConfirmation(null);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await deleteReview(
        deleteConfirmation.id
      );

      setReviews((currentReviews) =>
        currentReviews.filter(
          (review) =>
            getId(review.id) !==
            getId(deleteConfirmation.id)
        )
      );

      showSuccess(
        "Review deleted successfully."
      );

      setDeleteConfirmation(null);
    } catch (requestError) {
      console.error(
        "Unable to delete review:",
        requestError
      );

      const message =
        requestError?.response?.data?.message ||
        requestError?.message ||
        "Unable to delete review.";

      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     CONSOLIDATED RESULTS + EXPORTS
     Reviews 1-4 export the selected review marks (/20).
     Review 5 exports the final cumulative result (/100)
     with percentage and grade.
  ===================================================== */

  const getGrade = (marks) => {
    const score = Number(marks) || 0;
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    if (score >= 40) return "E";
    return "F";
  };

  const consolidatedRows = useMemo(() => {
    const rows = [];

    visibleProjects.forEach((project) => {
      const team = getTeam(project);
      if (!team) return;

      const projectId = getId(project.id ?? project._id);
      const projectReviews = visibleReviews
        .filter((item) => getId(item.projectId) === projectId)
        .sort((a, b) => Number(a.reviewNumber) - Number(b.reviewNumber));

      if (!projectReviews.length) return;

      const memberIds = Array.isArray(team.members)
        ? team.members.map((member) =>
            getId(typeof member === "object" ? member.id ?? member._id : member)
          )
        : [];

      const teamMarks = Array.from({ length: 5 }, (_, index) => {
        const record = projectReviews.find(
          (item) => Number(item.reviewNumber) === index + 1
        );
        const value = record?.teamEvaluation?.marks;
        return value === undefined || value === null || value === ""
          ? ""
          : Number(value);
      });

      const teamTotal = teamMarks.reduce(
        (sum, value) => sum + (value === "" ? 0 : value),
        0
      );

      const common = {
        Course: team.course || project.course || "",
        Department: team.department || project.department || "",
        Project: project.projectName || project.name || "",
        Team: team.teamName || project.teamName || "",
      };

      rows.push({
        Type: "TEAM",
        ...common,
        "Team ID": getId(team.teamId ?? team.id ?? team._id) || "—",
        Name: "Team Total",
        "Student ID": "—",
        "Review 1": teamMarks[0],
        "Review 2": teamMarks[1],
        "Review 3": teamMarks[2],
        "Review 4": teamMarks[3],
        "Review 5": teamMarks[4],
        "Total /100": teamTotal,
        Percentage: `${teamTotal}%`,
        Grade: getGrade(teamTotal),
        "Completed Reviews": new Set(
          projectReviews
            .map((item) => Number(item.reviewNumber))
            .filter((number) => number >= 1 && number <= 5)
        ).size,
      });

      memberIds.forEach((memberId) => {
        const student = students.find(
          (item) => getId(item.id ?? item._id) === memberId
        );
        if (!student) return;

        const databaseId = getId(student.id ?? student._id);
        const studentCode = getId(student.studentId ?? databaseId);

        const studentMarks = Array.from({ length: 5 }, (_, index) => {
          const record = projectReviews.find(
            (item) => Number(item.reviewNumber) === index + 1
          );
          const evaluation = Array.isArray(record?.studentEvaluations)
            ? record.studentEvaluations.find((entry) => {
                const entryId = getId(entry.studentId);
                return entryId === studentCode || entryId === databaseId;
              })
            : null;

          const value = evaluation?.marks;
          return value === undefined || value === null || value === ""
            ? ""
            : Number(value);
        });

        const total = studentMarks.reduce(
          (sum, value) => sum + (value === "" ? 0 : value),
          0
        );

        rows.push({
          Type: "STUDENT",
          Course: student.course || common.Course,
          Department: student.department || common.Department,
          Project: common.Project,
          Team: common.Team,
          "Team ID": getId(team.teamId ?? team.id ?? team._id) || "—",
          Name: student.name || student.studentName || "Student",
          "Student ID": student.studentId || databaseId,
          "Review 1": studentMarks[0],
          "Review 2": studentMarks[1],
          "Review 3": studentMarks[2],
          "Review 4": studentMarks[3],
          "Review 5": studentMarks[4],
          "Total /100": total,
          Percentage: `${total}%`,
          Grade: getGrade(total),
          "Completed Reviews": projectReviews.length,
        });
      });
    });

    return rows;
  }, [visibleProjects, visibleReviews, teams, students]);

  const getExportRows = () => {
    const selectedReview = Number(exportReviewFilter);
    const scopedRows = consolidatedRows.filter((row) => {
      if (exportTypeFilter === "ALL") return true;
      if (exportTypeFilter === "PUBLIC_STUDENT") return row.Type === "STUDENT";
      return row.Type === exportTypeFilter;
    });

    // Public student result is a clean final-only sheet for classroom sharing.
    // It intentionally excludes review-wise marks and internal team details.
    if (exportTypeFilter === "PUBLIC_STUDENT") {
      if (selectedReview !== 5) return [];
      return scopedRows
        .filter((row) => row["Completed Reviews"] >= 5)
        .map((row) => ({
          Course: row.Course,
          Department: row.Department,
          Name: row.Name,
          "Student ID": row["Student ID"],
          Percentage: row.Percentage,
          Grade: row.Grade,
        }));
    }

    if (selectedReview === 5) {
      return scopedRows
        .filter((row) => row["Completed Reviews"] >= 5)
        .map((row) => {
          const resultRow = {
            Type: row.Type,
            Course: row.Course,
            Department: row.Department,
            Project: row.Project,
            Team: row.Team,
            "Team ID": row["Team ID"],
            Name: row.Name,
          };

          // Student ID is relevant only to student records. In a Team-only
          // export, omit the column completely rather than showing a dash.
          if (exportTypeFilter !== "TEAM") {
            resultRow["Student ID"] =
              row.Type === "STUDENT" ? row["Student ID"] : "";
          }

          resultRow["Review 1 (/20)"] = row["Review 1"];
          resultRow["Review 2 (/20)"] = row["Review 2"];
          resultRow["Review 3 (/20)"] = row["Review 3"];
          resultRow["Review 4 (/20)"] = row["Review 4"];
          resultRow["Review 5 (/20)"] = row["Review 5"];
          resultRow["Total (/100)"] = row["Total /100"];
          resultRow.Percentage = row.Percentage;
          resultRow.Grade = row.Grade;
          return resultRow;
        });
    }

    const markKey = `Review ${selectedReview}`;
    return scopedRows
      .filter((row) => row[markKey] !== "")
      .map((row) => {
        const resultRow = {
          Type: row.Type,
          Course: row.Course,
          Department: row.Department,
          Project: row.Project,
          Team: row.Team,
          "Team ID": row["Team ID"],
          Name: row.Name,
        };

        if (exportTypeFilter !== "TEAM") {
          resultRow["Student ID"] =
            row.Type === "STUDENT" ? row["Student ID"] : "";
        }

        resultRow[`Review ${selectedReview} Marks (/20)`] = row[markKey];
        return resultRow;
      });
  };

  const getExportFileLabel = () => {
    const resultType =
      exportTypeFilter === "ALL"
        ? "All"
        : exportTypeFilter === "TEAM"
        ? "Team"
        : exportTypeFilter === "PUBLIC_STUDENT"
        ? "Student_Public"
        : "Students";

    return `${resultType}_${exportReviewFilter === "5"
      ? "Final_Result"
      : `Review_${exportReviewFilter}_Result`}`;
  };

  const performExcelExport = () => {
    const exportRows = getExportRows();
    if (!exportRows.length) {
      showError(
        exportTypeFilter === "PUBLIC_STUDENT" && exportReviewFilter !== "5"
          ? "Student Public Result is available only for the final Review 5."
          : exportReviewFilter === "5"
          ? "Final result is available after all 5 reviews are completed."
          : `No marks available for Review ${exportReviewFilter}.`
      );
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const columns = Object.keys(exportRows[0]);
    worksheet["!cols"] = columns.map((key) => ({
      wch: Math.max(
        12,
        Math.min(
          30,
          Math.max(
            key.length + 2,
            ...exportRows.map((row) => String(row[key] ?? "").length + 2)
          )
        )
      ),
    }));
    worksheet["!autofilter"] = {
      ref: XLSX.utils.encode_range(
        0,
        0,
        exportRows.length,
        columns.length - 1
      ),
    };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      exportReviewFilter === "5" ? "Final Result" : `Review ${exportReviewFilter}`
    );
    XLSX.writeFile(
      workbook,
      `ProjectTrack_${getExportFileLabel()}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const performPDFExport = () => {
    const exportRows = getExportRows();
    if (!exportRows.length) {
      showError(
        exportTypeFilter === "PUBLIC_STUDENT" && exportReviewFilter !== "5"
          ? "Student Public Result is available only for the final Review 5."
          : exportReviewFilter === "5"
          ? "Final result is available after all 5 reviews are completed."
          : `No marks available for Review ${exportReviewFilter}.`
      );
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    const resultTitle =
      exportTypeFilter === "ALL"
        ? "Combined"
        : exportTypeFilter === "TEAM"
        ? "Team"
        : exportTypeFilter === "PUBLIC_STUDENT"
        ? "Student Public"
        : "Student";

    const title =
      exportReviewFilter === "5"
        ? `ProjectTrack - ${resultTitle} Final Evaluation Result`
        : `ProjectTrack - ${resultTitle} Review ${exportReviewFilter} Result`;

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 22);

    const columns = Object.keys(exportRows[0]);
    autoTable(doc, {
      startY: 27,
      head: [columns],
      body: exportRows.map((row) => columns.map((column) => row[column] ?? "—")),
      styles: {
        fontSize: exportReviewFilter === "5" ? 7 : 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: { fillColor: [32, 90, 158] },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      margin: { left: 10, right: 10, bottom: 15 },
      didDrawPage: () => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          pageWidth - 25,
          pageHeight - 7
        );
      },
    });

    doc.save(
      `ProjectTrack_${getExportFileLabel()}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  const requestExport = (format) => {
    if (!isAdmin) {
      showError("Only Admin can download result reports.");
      return;
    }
    const rows = getExportRows();
    if (!rows.length) {
      showError(
        exportTypeFilter === "PUBLIC_STUDENT" && exportReviewFilter !== "5"
          ? "Student Public Result is available only for the final Review 5."
          : exportReviewFilter === "5"
          ? "Final result is available after all 5 reviews are completed."
          : `No marks available for Review ${exportReviewFilter}.`
      );
      return;
    }
    const typeLabel = {
      ALL: "Combined: Team + Students",
      TEAM: "Team Result Only",
      STUDENT: "Student Results Only (Detailed)",
      PUBLIC_STUDENT: "Student Public Result",
    }[exportTypeFilter];
    setExportConfirmation({ format, typeLabel, count: rows.length });
  };

  const confirmExport = () => {
    if (!isAdmin || !exportConfirmation || exporting) return;
    const format = exportConfirmation.format;
    setExporting(true);
    try {
      if (format === "PDF") performPDFExport();
      else performExcelExport();
      setExportConfirmation(null);
    } catch (exportError) {
      console.error("Unable to export result:", exportError);
      showError(exportError?.message || "Unable to export result.");
    } finally {
      setExporting(false);
    }
  };

  /* =====================================================
     FILTER CLEAR
  ===================================================== */

  const handleClearFilters = () => {
    setSearchTerm("");
    setProjectFilter("");
    setReviewFilter("");
    setCurrentPage(1);
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="reviews-page-state">
        <Loader />
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="reviews-page">
      {/* HEADER */}

      <div className="reviews-page-header">
        <div className="reviews-heading">
          <div className="reviews-heading-icon">
            <FiCheckCircle />
          </div>

          <div>
            <h1>Reviews</h1>

            <p>
              Manage project reviews and progress
            </p>
          </div>
        </div>

        <button
          type="button"
          className="add-review-btn"
          onClick={handleAddReview}
          disabled={
            manageableProjects.length === 0 ||
            availableReviewSlots === 0
          }
        >
          <FiPlus />
          Add Review
        </button>
      </div>

      {/* ADMIN-ONLY RESULT REPORTS */}
      {isAdmin && (
        <section className="result-reports-section" aria-labelledby="result-reports-title">
          <div className="result-reports-heading">
            <h2 id="result-reports-title">Result Reports</h2>
            <p>Filter team and student results, then confirm before downloading the selected report.</p>
          </div>
          <div className="result-reports-controls">
            <CustomDropdown
              value={exportTypeFilter}
              onChange={setExportTypeFilter}
              ariaLabel="Select result type"
              options={[
                { value: "ALL", label: "Combined: Team + Students" },
                { value: "TEAM", label: "Team Result Only" },
                { value: "STUDENT", label: "Student Results Only (Detailed)" },
                { value: "PUBLIC_STUDENT", label: "Student Public Result" },
              ]}
            />
            <CustomDropdown
              value={exportReviewFilter}
              onChange={setExportReviewFilter}
              ariaLabel="Select review for download"
              options={[1, 2, 3, 4, 5].map((number) => ({
                value: String(number),
                label: number === 5 ? "Download Final Result (Review 5)" : `Download Review ${number}`,
              }))}
            />
            <button type="button" className="add-review-btn" onClick={() => requestExport("PDF")}>
              <FiDownload /> Export PDF
            </button>
            <button type="button" className="add-review-btn" onClick={() => requestExport("Excel")}>
              <FiDownload /> Export Excel
            </button>
          </div>
        </section>
      )}

      {/* STATISTICS */}

      <div className="reviews-stats">
        <div className="review-stat-card">
          <div className="review-stat-icon review-stat-icon-blue">
            <FiFileText />
          </div>

          <div>
            <span>Total Reviews</span>
            <strong>{totalReviews}</strong>
          </div>
        </div>

        <div className="review-stat-card">
          <div className="review-stat-icon review-stat-icon-purple">
            <FiUsers />
          </div>

          <div>
            <span>Projects Reviewed</span>
            <strong>{projectsWithReviews}</strong>
          </div>
        </div>

        <div className="review-stat-card">
          <div className="review-stat-icon review-stat-icon-green">
            <FiCheckCircle />
          </div>

          <div>
            <span>5 Reviews Completed</span>
            <strong>{completedProjects}</strong>
          </div>
        </div>

        <div className="review-stat-card">
          <div className="review-stat-icon review-stat-icon-orange">
            <FiStar />
          </div>

          <div>
            <span>Available Slots</span>
            <strong>{availableReviewSlots}</strong>
          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="reviews-error" role="alert">
          <FiAlertTriangle />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            title="Close"
            aria-label="Close error"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* TOOLBAR */}

      <div className="reviews-toolbar">
        <div className="reviews-search">
          <FiSearch />

          <input
            type="text"
            placeholder="Search reviews, projects, teams..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-review-search"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              title="Clear search"
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="review-filter-wrapper">
          <FiFilter />

          <select
            className="review-filter-select"
            value={projectFilter}
            onChange={(event) => {
              setProjectFilter(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by project"
          >
            <option value="">All Projects</option>

            {reviewProjects.map((project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.projectName}
              </option>
            ))}
          </select>
        </div>

        <div className="review-filter-wrapper">
          <select
            className="review-filter-select"
            value={reviewFilter}
            onChange={(event) => {
              setReviewFilter(event.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by review number"
          >
            <option value="">All Reviews</option>
            <option value="1">Review 1</option>
            <option value="2">Review 2</option>
            <option value="3">Review 3</option>
            <option value="4">Review 4</option>
            <option value="5">Review 5</option>
          </select>
        </div>

        {(searchTerm ||
          projectFilter ||
          reviewFilter) && (
          <button
            type="button"
            className="clear-review-filters"
            onClick={handleClearFilters}
          >
            <FiX />
            Clear
          </button>
        )}
      </div>

      {/* REVIEW LIST */}

      {filteredReviews.length === 0 ? (
        <div className="reviews-empty">
          <div className="reviews-empty-icon">
            <FiCheckCircle />
          </div>

          <h3>
            {visibleReviews.length === 0
              ? "No Reviews Yet"
              : "No Reviews Found"}
          </h3>

          <p>
            {visibleReviews.length === 0
              ? "No reviews are available in your accessible scope."
              : "Try changing your search or filters."}
          </p>

          {visibleReviews.length === 0 &&
            manageableProjects.length > 0 &&
            availableReviewSlots > 0 && (
              <button
                type="button"
                className="add-review-btn"
                onClick={handleAddReview}
              >
                <FiPlus />
                Add Review
              </button>
            )}
        </div>
      ) : (
        <>
          <div className="reviews-grid">
            {paginatedReviews.map((review) => {
              const progress = getProgress(review);
              const rating = getRating(review);

              const projectName =
                getProjectName(review);

              const teamName =
                getTeamName(review);

              const teamLeader =
                getTeamLeader(review);

              const mentor =
                getMentor(review);

              const department =
                getDepartment(review);

              const canManage =
                canManageReview(review);

              return (
                <div
                  className="review-card"
                  key={review.id}
                >
                  {/* CARD TOP */}

                  <div className="review-card-top">
                    <div className="review-number-badge">
                      Review {review.reviewNumber || "-"}
                    </div>

                    <div className="review-card-actions">
                      <button
                        type="button"
                        className="review-view-btn"
                        onClick={() =>
                          handleViewReview(review)
                        }
                        title="View Review"
                        aria-label="View review"
                      >
                        <FiEye />
                      </button>

                      {canManage && (
                        <>
                          <button
                            type="button"
                            className="review-edit-btn"
                            onClick={() =>
                              handleEditReview(review)
                            }
                            title="Edit Review"
                            aria-label="Edit review"
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            className="review-delete-btn"
                            onClick={() =>
                              handleDeleteReview(review)
                            }
                            title="Delete Review"
                            aria-label="Delete review"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PROJECT */}

                  <div className="review-card-project">
                    <div className="review-card-project-icon">
                      <FiFileText />
                    </div>

                    <div>
                      <span>Project</span>

                      <h3>{projectName}</h3>

                      <small>
                        ID:{" "}
                        {review.projectId ||
                          "Not Available"}
                      </small>
                    </div>
                  </div>

                  {/* TEAM INFORMATION */}

                  <div className="review-team-info">
                    <div className="review-info-row">
                      <FiUsers />

                      <div>
                        <span>Team</span>
                        <strong>{teamName}</strong>
                      </div>
                    </div>

                    <div className="review-info-row">
                      <FiUserCheck />

                      <div>
                        <span>Team Leader</span>
                        <strong>{teamLeader}</strong>
                      </div>
                    </div>

                    <div className="review-info-row">
                      <FiUserCheck />

                      <div>
                        <span>Mentor</span>
                        <strong>{mentor}</strong>
                      </div>
                    </div>

                    <div className="review-info-row">
                      <FiFileText />

                      <div>
                        <span>Department</span>
                        <strong>{department}</strong>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS */}

                  <div className="review-progress-section">
                    <div className="review-progress-header">
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="review-progress-track">
                      <div
                        className={`review-progress-fill ${getProgressClass(
                          progress
                        )}`}
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* RATING */}

                  <div className="review-card-rating">
                    <span>Rating</span>

                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <FiStar
                            key={star}
                            className={
                              star <= rating
                                ? "review-star-filled"
                                : "review-star-empty"
                            }
                          />
                        )
                      )}

                      <strong>{rating}/5</strong>
                    </div>
                  </div>

                  {/* FOOTER */}

                  <div className="review-card-footer">
                    <span>
                      {formatDate(review.reviewDate)}
                    </span>

                    <span>
                      {review.reviewerName ||
                        "Reviewer not available"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}

          {totalPages > 1 && (
            <div className="reviews-pagination">
              <button
                type="button"
                className="reviews-pagination-btn"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="reviews-pagination-pages">
                {pageNumbers.map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`reviews-pagination-page ${
                      currentPage === page
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handlePageChange(page)
                    }
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="reviews-pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* REVIEW FORM */}

      {showForm && (
        <ReviewForm
          review={selectedReview}
          projects={manageableProjects}
          reviews={visibleReviews}
          teams={teams}
          students={students}
          onSubmit={handleSaveReview}
          onClose={handleCloseForm}
          submitting={submitting}
        />
      )}

      {/* REVIEW DETAILS */}

      {detailsReview && (
        <ReviewDetails
          review={detailsReview}
          project={getReviewProject(detailsReview)}
          team={getReviewTeam(detailsReview)}
          reviews={visibleReviews}
          students={students}
          canEdit={canManageReview(detailsReview)}
          onClose={handleCloseDetails}
          onEdit={() => {
            const reviewToEdit = detailsReview;

            setDetailsReview(null);
            handleEditReview(reviewToEdit);
          }}
        />
      )}

      {/* DELETE CONFIRMATION */}

      {deleteConfirmation && (
        <div className="review-delete-overlay">
          <div className="review-delete-modal">
            <div className="review-delete-icon">
              <FiAlertTriangle />
            </div>

            <div className="review-delete-content">
              <h2>Delete Review?</h2>

              <p>
                Are you sure you want to delete{" "}
                <strong>
                  Review{" "}
                  {deleteConfirmation.reviewNumber || "-"}
                </strong>{" "}
                from{" "}
                <strong>
                  {getProjectName(
                    deleteConfirmation
                  )}
                </strong>
                ?
              </p>

              <span>
                This action cannot be undone.
              </span>
            </div>

            <div className="review-delete-actions">
              <button
                type="button"
                className="review-delete-cancel"
                onClick={() =>
                  setDeleteConfirmation(null)
                }
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="review-delete-confirm"
                onClick={confirmDeleteReview}
                disabled={submitting}
              >
                <FiTrash2 />
                {submitting
                  ? "Deleting..."
                  : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EXPORT CONFIRMATION */}
      {isAdmin && exportConfirmation && (
        <div className="review-delete-overlay" role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !exporting) setExportConfirmation(null);
          }}>
          <div className="review-delete-modal export-confirm-modal" role="dialog" aria-modal="true"
            aria-labelledby="export-confirm-title">
            <div className="review-delete-icon export-confirm-icon"><FiDownload /></div>
            <div className="review-delete-content">
              <h2 id="export-confirm-title">Confirm Download?</h2>
              <p>Are you sure you want to download this result report?</p>
              <div className="export-confirm-details">
                <div><span>Report Type</span><strong>{exportConfirmation.typeLabel}</strong></div>
                <div><span>Review</span><strong>{exportReviewFilter === "5" ? "Final Result (Review 5)" : `Review ${exportReviewFilter}`}</strong></div>
                <div><span>File Format</span><strong>{exportConfirmation.format}</strong></div>
                <div><span>Total Records</span><strong>{exportConfirmation.count}</strong></div>
              </div>
              <span>The report will be generated and downloaded to your device.</span>
            </div>
            <div className="review-delete-actions">
              <button type="button" className="review-delete-cancel"
                onClick={() => setExportConfirmation(null)} disabled={exporting}>Cancel</button>
              <button type="button" className="review-delete-confirm export-confirm-btn"
                onClick={confirmExport} disabled={exporting}>
                <FiDownload /> {exporting ? "Preparing..." : "Confirm Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;