
import api from "./api";

const STUDENT_ENDPOINT = "/students";

// Get all students or filtered students
export const getStudents = (params = {}) => {
  return api.get(STUDENT_ENDPOINT, { params });
};

// Get students by course (Admin scope)
export const getStudentsByCourse = (course) => {
  return api.get(STUDENT_ENDPOINT, {
    params: { course },
  });
};

// Get students by course and department (Mentor scope)
export const getStudentsByDepartment = (course, department) => {
  return api.get(STUDENT_ENDPOINT, {
    params: {
      course,
      department,
    },
  });
};

// Get single student by ID
export const getStudentById = (id) => {
  return api.get(`${STUDENT_ENDPOINT}/${id}`);
};

// Create student
export const createStudent = (studentData) => {
  return api.post(STUDENT_ENDPOINT, studentData);
};

// Update student
export const updateStudent = (id, studentData) => {
  return api.put(`${STUDENT_ENDPOINT}/${id}`, studentData);
};

// Delete student
export const deleteStudent = (id) => {
  return api.delete(`${STUDENT_ENDPOINT}/${id}`);
};