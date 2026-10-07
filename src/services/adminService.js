
import api from "./api";

const ADMIN_ENDPOINT = "/admins";

// Get all admin and mentor records
export const getAdmins = () => {
  return api.get(ADMIN_ENDPOINT);
};

// Get only admin records
export const getOnlyAdmins = () => {
  return api.get(`${ADMIN_ENDPOINT}?role=admin`);
};

// Get only mentor records
export const getMentors = () => {
  return api.get(`${ADMIN_ENDPOINT}?role=mentor`);
};

// Get single admin or mentor by ID
export const getAdminById = (id) => {
  return api.get(`${ADMIN_ENDPOINT}/${id}`);
};

// Create admin
export const createAdmin = (adminData) => {
  return api.post(ADMIN_ENDPOINT, {
    ...adminData,
    role: "admin",
  });
};

// Create mentor
export const createMentor = (mentorData) => {
  return api.post(ADMIN_ENDPOINT, {
    ...mentorData,
    role: "mentor",
  });
};

// Update admin or mentor
export const updateAdmin = (id, adminData) => {
  return api.patch(`${ADMIN_ENDPOINT}/${id}`, adminData);
};

// Delete admin or mentor
export const deleteAdmin = (id) => {
  return api.delete(`${ADMIN_ENDPOINT}/${id}`);
};