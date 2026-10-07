
import api from "./api";

const TEAM_ENDPOINT = "/teams";

// Get all teams or filtered teams
export const getTeams = (params = {}) => {
  return api.get(TEAM_ENDPOINT, { params });
};

// Get teams by course (Admin scope)
export const getTeamsByCourse = (course) => {
  return api.get(TEAM_ENDPOINT, {
    params: { course },
  });
};

// Get teams by course and department (Mentor scope)
export const getTeamsByDepartment = (course, department) => {
  return api.get(TEAM_ENDPOINT, {
    params: {
      course,
      department,
    },
  });
};

// Get single team by ID
export const getTeamById = (id) => {
  return api.get(`${TEAM_ENDPOINT}/${id}`);
};

// Create team
export const createTeam = (teamData) => {
  return api.post(TEAM_ENDPOINT, teamData);
};

// Update team
export const updateTeam = (id, teamData) => {
  return api.put(`${TEAM_ENDPOINT}/${id}`, teamData);
};

// Delete team
export const deleteTeam = (id) => {
  return api.delete(`${TEAM_ENDPOINT}/${id}`);
};