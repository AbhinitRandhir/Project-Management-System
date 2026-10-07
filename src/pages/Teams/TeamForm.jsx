
import { useEffect, useMemo, useState } from "react";

import {
  FiAlertTriangle,
  FiChevronDown,
  FiPlus,
  FiSave,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useToast } from "../../components/Toast/Toast";
import { useAuth } from "../../context/AuthContext";
import { getMentors } from "../../services/adminService";

import "./TeamForm.css";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const getInitialFormData = () => ({
  teamName: "",
  course: "",
  department: "",
  teamSize: "",
  teamLeaderId: "",
  mentorName: "",
  mentorId: "",
  members: [],
});

const getMemberIds = (members) => {
  if (!Array.isArray(members)) return [];

  return [
    ...new Set(
      members
        .map((member) =>
          typeof member === "object"
            ? member?.id
            : member
        )
        .filter(
          (id) => id !== undefined && id !== null
        )
        .map(String)
    ),
  ];
};

const getStudentById = (students, studentId) =>
  students.find(
    (student) =>
      String(student.id) === String(studentId)
  );

const getInitialTeamData = (
  team,
  students,
  userCourse,
  userDepartment,
  currentUser
) => {
  if (!team) {
    return {
      ...getInitialFormData(),
      course: userCourse || "",
      department: userDepartment || "",
      mentorId: currentUser?.role === "mentor"
        ? String(currentUser.id || "")
        : "",
      mentorName: currentUser?.role === "mentor"
        ? currentUser.name || ""
        : "",
    };
  }

  const members = getMemberIds(team.members);

  const firstStudent = members.length
    ? getStudentById(students, members[0])
    : null;

  return {
    teamName: team.teamName || team.name || "",

    course: String(
      team.course ||
        firstStudent?.course ||
        userCourse ||
        ""
    ),

    department: String(
      team.department ||
        team.branch ||
        firstStudent?.department ||
        userDepartment ||
        ""
    ),

    teamSize: String(
      team.teamSize ||
        team.size ||
        members.length ||
        ""
    ),

    teamLeaderId: String(
      team.teamLeaderId ||
        team.teamLeader ||
        team.leader ||
        ""
    ),

    mentorName:
      team.mentorName || team.mentor || "",

    mentorId: String(team.mentorId || ""),

    members,
  };
};

// =========================================================
// TEAM FORM
// =========================================================

function TeamForm({
  team,
  students = [],
  teams = [],
  onSubmit,
  onClose,
  submitting = false,

  isAdmin: adminProp,
  isMentor: mentorProp,

  currentUser: currentUserProp,
  userCourse: userCourseProp,
  userDepartment: userDepartmentProp,
}) {
  // -------------------------------------------------------
  // TOAST
  // -------------------------------------------------------

  const {
    success: showSuccess,
    error: showError,
  } = useToast();

  // -------------------------------------------------------
  // AUTH
  // -------------------------------------------------------

  const auth = useAuth();

  const currentUser =
    currentUserProp ||
    auth.currentUser ||
    auth.user ||
    null;

  const role = normalize(currentUser?.role);

  const isAdmin =
    adminProp ?? (role === "admin" || auth.isAdmin);

  const isMentor =
    mentorProp ?? (role === "mentor" || auth.isMentor);

  const userCourse = String(
    userCourseProp ||
      auth.userCourse ||
      currentUser?.course ||
      ""
  ).trim();

  const userDepartment = String(
    userDepartmentProp ||
      auth.userDepartment ||
      currentUser?.department ||
      ""
  ).trim();

  const currentUserId = String(
    currentUser?.id ||
      currentUser?.adminId ||
      ""
  );

  const currentUserName = String(
    currentUser?.name || ""
  ).trim();

  // -------------------------------------------------------
  // INITIAL FORM DATA
  // -------------------------------------------------------

  const [formData, setFormData] = useState(() =>
    getInitialTeamData(
      team,
      students,
      userCourse,
      userDepartment,
      currentUser
    )
  );

  // -------------------------------------------------------
  // UI STATES
  // -------------------------------------------------------

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [studentDropdownOpen, setStudentDropdownOpen] =
    useState(false);

  const [errors, setErrors] = useState({});

  const [submitConfirmation, setSubmitConfirmation] =
    useState(null);

  const [mentors, setMentors] = useState([]);

  const [mentorLoadError, setMentorLoadError] =
    useState("");

  // -------------------------------------------------------
  // LOAD MENTORS
  // -------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const loadMentors = async () => {
      try {
        const response = await getMentors();

        if (!isMounted) return;

        const data = Array.isArray(response?.data)
          ? response.data
          : [];

        setMentors(data);
        setMentorLoadError("");
      } catch (error) {
        console.error("Unable to load mentors:", error);

        if (!isMounted) return;

        setMentors([]);
        setMentorLoadError(
          "Unable to load mentors. Please try again."
        );
      }
    };

    loadMentors();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------
  // AVAILABLE MENTORS
  // -------------------------------------------------------

  const availableMentors = useMemo(() => {
    const selectedCourse = normalize(userCourse);
    const selectedDepartment = normalize(formData.department);

    if (!selectedCourse || !selectedDepartment) return [];

    if (isMentor) {
      const belongsToSelection =
        normalize(userCourse) === selectedCourse &&
        normalize(userDepartment) === selectedDepartment;

      return currentUserId && belongsToSelection
        ? [
            {
              id: currentUserId,
              name: currentUserName,
              course: userCourse,
              department: userDepartment,
              role: "mentor",
              status: "active",
            },
          ]
        : [];
    }

    if (!isAdmin) return [];

    return mentors
      .filter((mentor) => {
        const mentorRole = normalize(mentor.role);
        const status = normalize(mentor.status);
        const active = !status || status === "active";

        const sameCourse =
          normalize(mentor.course) === selectedCourse;
        const sameDepartment =
          normalize(mentor.department) === selectedDepartment;

        return (
          mentorRole === "mentor" &&
          active &&
          sameCourse &&
          sameDepartment
        );
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
  }, [
    mentors,
    isAdmin,
    isMentor,
    currentUserId,
    currentUserName,
    userCourse,
    userDepartment,
    formData.department,
  ]);

  // -------------------------------------------------------
  // DEPARTMENT OPTIONS
  // Only departments are shown in the dropdown.
  // Course is taken from the logged-in account.
  // -------------------------------------------------------

  const departments = useMemo(() => {
    if (isMentor) {
      return userDepartment
        ? [userDepartment]
        : [];
    }

    const values = students
      .filter(
        (student) =>
          normalize(student.course) ===
          normalize(userCourse)
      )
      .map((student) =>
        String(student.department || "").trim()
      )
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [
    students,
    isMentor,
    userCourse,
    userDepartment,
  ]);

  // -------------------------------------------------------
  // ASSIGNED STUDENTS
  // Exclude current team during edit.
  // -------------------------------------------------------

  const assignedStudentIds = useMemo(() => {
    const ids = [];

    teams.forEach((item) => {
      if (
        team &&
        String(item.id) === String(team.id)
      ) {
        return;
      }

      getMemberIds(item.members).forEach((id) => {
        ids.push(id);
      });
    });

    return [...new Set(ids)];
  }, [teams, team]);

  // -------------------------------------------------------
  // AVAILABLE STUDENTS
  // -------------------------------------------------------

  const availableStudents = useMemo(() => {
    if (!userCourse || !formData.department) {
      return [];
    }

    return students.filter((student) => {
      const studentId = String(student.id);

      const isActive =
        normalize(student.status) === "active";

      const isAssigned =
        assignedStudentIds.includes(studentId);

      const isSelected =
        formData.members.includes(studentId);

      const sameCourse =
        normalize(student.course) ===
        normalize(userCourse);

      const sameDepartment =
        normalize(student.department) ===
        normalize(formData.department);

      return (
        isActive &&
        !isAssigned &&
        !isSelected &&
        sameCourse &&
        sameDepartment
      );
    });
  }, [
    students,
    assignedStudentIds,
    formData.members,
    formData.department,
    userCourse,
  ]);

  // -------------------------------------------------------
  // SELECTED STUDENT
  // -------------------------------------------------------

  const selectedStudent = useMemo(
    () =>
      selectedStudentId
        ? getStudentById(
            students,
            selectedStudentId
          )
        : null,
    [students, selectedStudentId]
  );

  // -------------------------------------------------------
  // SELECTED MEMBERS
  // -------------------------------------------------------

  const selectedMembers = useMemo(
    () =>
      formData.members
        .map((id) => getStudentById(students, id))
        .filter(Boolean),
    [formData.members, students]
  );

  // -------------------------------------------------------
  // INPUT CHANGE
  // -------------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "course") {
      return;
    }

    if (
      name === "department" &&
      isMentor
    ) {
      return;
    }

    if (
      name === "department" &&
      formData.members.length > 0
    ) {
      showError(
        "Remove existing team members before changing the department."
      );
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "department"
        ? {
            mentorId: isMentor ? previous.mentorId : "",
            mentorName: isMentor ? previous.mentorName : "",
          }
        : {}),
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      ...(name === "teamSize"
        ? { members: "" }
        : {}),
    }));

    if (name === "department") {
      setSelectedStudentId("");
      setStudentDropdownOpen(false);
    }
  };

  // -------------------------------------------------------
  // MENTOR SELECTION
  // -------------------------------------------------------

  const handleMentorChange = (event) => {
    if (!isAdmin) return;

    const mentorId = event.target.value;

    const mentor = availableMentors.find(
      (item) => String(item.id) === String(mentorId)
    );

    setFormData((previous) => ({
      ...previous,
      mentorId,
      mentorName: mentor?.name || "",
    }));

    setErrors((previous) => ({
      ...previous,
      mentorName: "",
    }));
  };

  // -------------------------------------------------------
  // SELECT STUDENT
  // -------------------------------------------------------

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(String(studentId));
    setStudentDropdownOpen(false);

    setErrors((previous) => ({
      ...previous,
      members: "",
    }));
  };

  // -------------------------------------------------------
  // ADD STUDENT
  // -------------------------------------------------------

  const handleAddMember = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!formData.department) {
      setErrors((previous) => ({
        ...previous,
        department: "Please select a department.",
      }));

      showError("Please select a department first.");
      return;
    }

    const teamSize = Number(formData.teamSize);

    if (
      !Number.isInteger(teamSize) ||
      teamSize < 2 ||
      teamSize > 5
    ) {
      setErrors((previous) => ({
        ...previous,
        teamSize: "Team size must be between 2 and 5.",
      }));

      showError("Team size must be between 2 and 5.");
      return;
    }

    if (!selectedStudentId) {
      showError("Please select a student.");
      return;
    }

    const student = getStudentById(
      students,
      selectedStudentId
    );

    if (!student) {
      showError("Selected student not found.");
      return;
    }

    const studentId = String(student.id);

    if (formData.members.includes(studentId)) {
      showError("This student is already added.");
      return;
    }

    if (assignedStudentIds.includes(studentId)) {
      showError(
        "This student is already assigned to another team."
      );
      return;
    }

    if (
      normalize(student.course) !==
      normalize(userCourse)
    ) {
      showError(
        "Student must belong to your course."
      );
      return;
    }

    if (
      normalize(student.department) !==
      normalize(formData.department)
    ) {
      showError(
        "Student must belong to the selected department."
      );
      return;
    }

    if (formData.members.length >= teamSize) {
      showError(
        `Team size cannot exceed ${teamSize} members.`
      );
      return;
    }

    setFormData((previous) => ({
      ...previous,
      members: [...previous.members, studentId],
    }));

    setSelectedStudentId("");
    setStudentDropdownOpen(false);

    setErrors((previous) => ({
      ...previous,
      members: "",
    }));

    showSuccess(`${student.name} added to the team.`);
  };

  // -------------------------------------------------------
  // REMOVE STUDENT
  // -------------------------------------------------------

  const handleRemoveMember = (studentId) => {
    setFormData((previous) => {
      const updatedMembers =
        previous.members.filter(
          (id) => String(id) !== String(studentId)
        );

      return {
        ...previous,
        members: updatedMembers,
        teamLeaderId:
          String(previous.teamLeaderId) ===
          String(studentId)
            ? ""
            : previous.teamLeaderId,
      };
    });

    setErrors((previous) => ({
      ...previous,
      members: "",
      teamLeaderId: "",
    }));

    showSuccess("Student removed from the team.");
  };

  // -------------------------------------------------------
  // VALIDATE FORM
  // -------------------------------------------------------

  const validateForm = () => {
    const newErrors = {};

    const teamName = formData.teamName.trim();
    const teamSize = Number(formData.teamSize);

    if (!teamName) {
      newErrors.teamName = "Team name is required.";
    } else if (teamName.length < 3) {
      newErrors.teamName =
        "Team name must be at least 3 characters.";
    }

    if (!userCourse) {
      newErrors.course =
        "Your account does not have a course assigned.";
    }

    if (!formData.department) {
      newErrors.department =
        "Please select a department.";
    }

    if (
      !Number.isInteger(teamSize) ||
      teamSize < 2 ||
      teamSize > 5
    ) {
      newErrors.teamSize =
        "Team size must be between 2 and 5.";
    }

    if (
      Number.isInteger(teamSize) &&
      teamSize >= 2 &&
      teamSize <= 5 &&
      formData.members.length !== teamSize
    ) {
      newErrors.members =
        `Add exactly ${teamSize} students to match the team size.`;
    }

    if (formData.members.length < 2) {
      newErrors.members =
        "A team must contain at least 2 students.";
    }

    if (!formData.mentorId || !formData.mentorName) {
      newErrors.mentorName =
        "Please select a mentor.";
    }

    if (!formData.teamLeaderId) {
      newErrors.teamLeaderId =
        "Please select a team leader.";
    } else if (
      !formData.members.includes(
        String(formData.teamLeaderId)
      )
    ) {
      newErrors.teamLeaderId =
        "Team leader must be a team member.";
    }

    const invalidMember = selectedMembers.some(
      (student) =>
        normalize(student.course) !==
          normalize(userCourse) ||
        normalize(student.department) !==
          normalize(formData.department)
    );

    if (invalidMember) {
      newErrors.members =
        "All team members must belong to the selected course and department.";
    }

    if (
      isMentor &&
      normalize(formData.department) !==
        normalize(userDepartment)
    ) {
      newErrors.department =
        "Mentors can create teams only in their assigned department.";
    }

    if (isAdmin) {
      const selectedMentor = availableMentors.find(
        (item) =>
          String(item.id) ===
          String(formData.mentorId)
      );

      if (!selectedMentor) {
        newErrors.mentorName =
          "Select an active mentor from the selected course and department.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showError("Please fix the validation errors.");
      return false;
    }

    return true;
  };

  // -------------------------------------------------------
  // SUBMIT
  // -------------------------------------------------------

  const handleSubmit = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (submitting) return;

    if (!validateForm()) return;

    const payload = {
      ...formData,

      teamName: formData.teamName.trim(),

      course: userCourse,

      department: formData.department
        .trim()
        .toUpperCase(),

      teamSize: Number(formData.teamSize),

      mentorId: String(formData.mentorId),

      mentorName: formData.mentorName.trim(),

      teamLeaderId: String(formData.teamLeaderId),

      members: [
        ...new Set(formData.members.map(String)),
      ],
    };

    setSubmitConfirmation(payload);
  };

  // -------------------------------------------------------
  // CONFIRM SUBMIT
  // -------------------------------------------------------

  const confirmTeamSubmit = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!submitConfirmation || submitting) return;

    onSubmit(submitConfirmation);
  };

  // -------------------------------------------------------
  // CANCEL CONFIRMATION
  // -------------------------------------------------------

  const cancelTeamSubmit = (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (submitting) return;

    setSubmitConfirmation(null);
  };

  // -------------------------------------------------------
  // CLOSE FORM
  // -------------------------------------------------------

  const handleClose = () => {
    if (submitting || submitConfirmation) return;
    onClose?.();
  };

  // =========================================================
  // JSX
  // =========================================================

  return (
    <>
      <div
        className="team-form-overlay"
        onClick={handleClose}
      >
        <div
          className="team-form-modal"
          onClick={(event) => event.stopPropagation()}
        >
          {/* HEADER */}

          <div className="team-form-header">
            <div>
              <h2>
                {team ? "Edit Team" : "Create New Team"}
              </h2>

              <p>
                {team
                  ? "Update team information and members"
                  : "Create a project team and add students"}
              </p>
            </div>

            <button
              type="button"
              className="team-form-close"
              onClick={handleClose}
              disabled={submitting}
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>

          {/* FORM */}

          <form
            className="team-form"
            onSubmit={handleSubmit}
          >
            <div className="team-form-grid">
              {/* TEAM NAME */}

              <div className="team-form-group">
                <label htmlFor="teamName">
                  Team Name
                </label>

                <div
                  className={`team-input-wrapper ${
                    errors.teamName ? "team-input-error" : ""
                  }`}
                >
                  <FiUsers />

                  <input
                    id="teamName"
                    name="teamName"
                    type="text"
                    placeholder="Enter team name"
                    value={formData.teamName}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                {errors.teamName && (
                  <span className="team-form-error">
                    {errors.teamName}
                  </span>
                )}
              </div>

              {/* COURSE - READ ONLY */}

              <div className="team-form-group">
                <label htmlFor="course">
                  Course
                </label>

                <div className="team-input-wrapper">
                  <FiUsers />

                  <input
                    id="course"
                    name="course"
                    type="text"
                    value={userCourse}
                    readOnly
                    disabled
                  />
                </div>

                <small className="team-form-help">
                  Course is assigned from your account.
                </small>
              </div>

              {/* DEPARTMENT */}

              <div className="team-form-group">
                <label htmlFor="department">
                  Department
                </label>

                <div
                  className={`team-input-wrapper ${
                    errors.department
                      ? "team-input-error"
                      : ""
                  }`}
                >
                  <FiUsers />

                  {isMentor ? (
                    <input
                      id="department"
                      name="department"
                      type="text"
                      value={userDepartment.toUpperCase()}
                      readOnly
                      disabled
                    />
                  ) : (
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      disabled={
                        submitting ||
                        formData.members.length > 0
                      }
                    >
                      <option value="">
                        Select department
                      </option>

                      {departments.map((department) => (
                        <option
                          key={department}
                          value={department}
                        >
                          {department.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {errors.department && (
                  <span className="team-form-error">
                    {errors.department}
                  </span>
                )}

                {formData.members.length > 0 && isAdmin && (
                  <small className="team-form-help">
                    Remove members to change department.
                  </small>
                )}
              </div>

              {/* TEAM SIZE */}

              <div className="team-form-group">
                <label htmlFor="teamSize">
                  Team Size
                </label>

                <div
                  className={`team-input-wrapper ${
                    errors.teamSize ? "team-input-error" : ""
                  }`}
                >
                  <FiUsers />

                  <input
                    id="teamSize"
                    name="teamSize"
                    type="number"
                    min="2"
                    max="5"
                    step="1"
                    placeholder="Enter team size (2–5)"
                    value={formData.teamSize}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                {errors.teamSize && (
                  <span className="team-form-error">
                    {errors.teamSize}
                  </span>
                )}

                <small className="team-form-help">
                  Minimum 2 and maximum 5 students.
                </small>
              </div>

              {/* MENTOR */}

              <div className="team-form-group">
                <label htmlFor="mentorId">
                  Mentor Name
                </label>

                <div
                  className={`team-input-wrapper ${
                    errors.mentorName
                      ? "team-input-error"
                      : ""
                  }`}
                >
                  <FiUserCheck />

                  {isMentor ? (
                    <input
                      id="mentorName"
                      type="text"
                      value={currentUserName}
                      readOnly
                      disabled
                    />
                  ) : (
                    <select
                      id="mentorId"
                      name="mentorId"
                      value={formData.mentorId}
                      onChange={handleMentorChange}
                      disabled={submitting || !isAdmin}
                    >
                      <option value="">
                        {!formData.department
                          ? "Select department first"
                          : availableMentors.length === 0
                          ? "No mentors available"
                          : "Select mentor"}
                      </option>

                      {availableMentors.map((mentor) => (
                        <option
                          key={mentor.id}
                          value={mentor.id}
                        >
                          {mentor.name} - {mentor.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {errors.mentorName && (
                  <span className="team-form-error">
                    {errors.mentorName}
                  </span>
                )}

                {mentorLoadError && isAdmin && (
                  <span className="team-form-error">
                    {mentorLoadError}
                  </span>
                )}

                {isAdmin &&
                  !mentorLoadError &&
                  formData.department &&
                  availableMentors.length === 0 && (
                    <small className="team-form-help">
                      No active mentors found for this course and department.
                    </small>
                  )}
              </div>
            </div>

            {/* TEAM MEMBERS */}

            <div className="team-members-section">
              <div className="team-section-title">
                <div>
                  <h3>Team Members</h3>

                  <p>
                    Select students from the chosen department.
                  </p>
                </div>

                <span>
                  {formData.members.length} /{" "}
                  {formData.teamSize || 0} Members
                </span>
              </div>

              {/* ADD STUDENT */}

              <div className="team-member-add">
                <div className="team-student-dropdown">
                  <button
                    type="button"
                    className={`team-student-dropdown-trigger ${
                      studentDropdownOpen ? "active" : ""
                    }`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();

                      setStudentDropdownOpen(
                        (previous) => !previous
                      );
                    }}
                    disabled={
                      submitting ||
                      !formData.department ||
                      !formData.teamSize ||
                      Number(formData.teamSize) < 2 ||
                      Number(formData.teamSize) > 5 ||
                      formData.members.length >=
                        Number(formData.teamSize)
                    }
                  >
                    <span
                      className={
                        selectedStudent
                          ? "student-selected-value"
                          : "student-placeholder"
                      }
                    >
                      {!formData.department
                        ? "Select department first"
                        : !formData.teamSize
                        ? "Enter team size first"
                        : Number(formData.teamSize) < 2 ||
                          Number(formData.teamSize) > 5
                        ? "Team size must be 2–5"
                        : formData.members.length >=
                          Number(formData.teamSize)
                        ? "Team size reached"
                        : selectedStudent
                        ? `${selectedStudent.name} - ${
                            selectedStudent.studentId ||
                            selectedStudent.id
                          }`
                        : "Select available student"}
                    </span>

                    <FiChevronDown
                      className={
                        studentDropdownOpen ? "rotate" : ""
                      }
                    />
                  </button>

                  {studentDropdownOpen && (
                    <div className="team-student-dropdown-menu">
                      {availableStudents.length > 0 ? (
                        availableStudents.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            className={`team-student-dropdown-option ${
                              String(selectedStudentId) ===
                              String(student.id)
                                ? "selected"
                                : ""
                            }`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();

                              handleSelectStudent(student.id);
                            }}
                          >
                            <span className="team-dropdown-avatar">
                              {student.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </span>

                            <span className="team-dropdown-student-info">
                              <strong>{student.name}</strong>

                              <small>
                                Student ID:{" "}
                                {student.studentId || student.id}
                              </small>
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="team-student-empty">
                          No available students found for this
                          department.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="team-add-member-btn"
                  onClick={handleAddMember}
                  disabled={
                    submitting ||
                    !selectedStudentId ||
                    !formData.department ||
                    Number(formData.teamSize) < 2 ||
                    Number(formData.teamSize) > 5 ||
                    formData.members.length >=
                      Number(formData.teamSize)
                  }
                >
                  <FiPlus />
                  <span>Add</span>
                </button>
              </div>

              {errors.members && (
                <span className="team-form-error">
                  {errors.members}
                </span>
              )}

              {/* SELECTED MEMBERS */}

              {selectedMembers.length > 0 ? (
                <div className="selected-members-list">
                  {selectedMembers.map((student) => (
                    <div
                      className="selected-member"
                      key={student.id}
                    >
                      <div className="selected-member-info">
                        <div className="selected-member-avatar">
                          {student.name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{student.name}</strong>

                          <span>
                            Student ID:{" "}
                            {student.studentId || student.id}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(student.id)
                        }
                        disabled={submitting}
                        title="Remove Student"
                        aria-label={`Remove ${student.name}`}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-members-message">
                  <FiUsers />

                  <span>
                    No students added to this team
                  </span>
                </div>
              )}
            </div>

            {/* TEAM LEADER */}

            <div className="team-form-group team-leader-group">
              <label htmlFor="teamLeaderId">
                Team Leader
              </label>

              <div
                className={`team-input-wrapper ${
                  errors.teamLeaderId
                    ? "team-input-error"
                    : ""
                }`}
              >
                <FiUserCheck />

                <select
                  id="teamLeaderId"
                  name="teamLeaderId"
                  value={formData.teamLeaderId}
                  onChange={handleChange}
                  disabled={
                    submitting ||
                    selectedMembers.length === 0
                  }
                >
                  <option value="">
                    {selectedMembers.length === 0
                      ? "Add team members first"
                      : "Select team leader"}
                  </option>

                  {selectedMembers.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.name} -{" "}
                      {student.studentId || student.id}
                    </option>
                  ))}
                </select>
              </div>

              {errors.teamLeaderId && (
                <span className="team-form-error">
                  {errors.teamLeaderId}
                </span>
              )}
            </div>

            {/* FOOTER */}

            <div className="team-form-footer">
              <button
                type="button"
                className="team-cancel-btn"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="team-submit-btn"
                disabled={submitting}
              >
                <FiSave />

                <span>
                  {submitting
                    ? "Saving..."
                    : team
                    ? "Update Team"
                    : "Create Team"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}

      {submitConfirmation && (
        <div
          className="team-confirm-overlay"
          onClick={cancelTeamSubmit}
        >
          <div
            className="team-confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="team-confirm-icon">
              <FiAlertTriangle />
            </div>

            <div className="team-confirm-content">
              <h3>
                {team ? "Update Team" : "Create Team"}
              </h3>

              <p>
                {team
                  ? `Are you sure you want to update "${formData.teamName.trim()}"?`
                  : `Are you sure you want to create "${formData.teamName.trim()}"?`}
              </p>
            </div>

            <div className="team-confirm-actions">
              <button
                type="button"
                className="team-confirm-cancel"
                onClick={cancelTeamSubmit}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="team-confirm-submit"
                onClick={confirmTeamSubmit}
                disabled={submitting}
              >
                {submitting
                  ? "Saving..."
                  : team
                  ? "Update Team"
                  : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TeamForm;