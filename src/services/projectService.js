
import api from "./api";

const PROJECT_ENDPOINT = "/projects";

// Get all projects
export const getProjects = (params = {}) => {
  return api.get(PROJECT_ENDPOINT, { params });
};

// Get projects by course (Admin scope)
export const getProjectsByCourse = (course) => {
  return api.get(PROJECT_ENDPOINT, {
    params: { course },
  });
};

// Get projects by course and department (Mentor scope)
export const getProjectsByDepartment = (course, department) => {
  return api.get(PROJECT_ENDPOINT, {
    params: {
      course,
      department,
    },
  });
};

// Get single project by ID
export const getProjectById = (id) => {
  return api.get(`${PROJECT_ENDPOINT}/${id}`);
};

// Create project
export const createProject = (projectData) => {
  return api.post(PROJECT_ENDPOINT, projectData);
};

// Update project
export const updateProject = (id, projectData) => {
  return api.put(`${PROJECT_ENDPOINT}/${id}`, projectData);
};

// Delete project
export const deleteProject = (id) => {
  return api.delete(`${PROJECT_ENDPOINT}/${id}`);
};