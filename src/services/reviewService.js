
import api from "./api";

const REVIEW_ENDPOINT = "/reviews";
const PROJECT_ENDPOINT = "/projects";

// Get all reviews or filtered reviews
export const getReviews = (params = {}) => {
  return api.get(REVIEW_ENDPOINT, { params });
};

// Get reviews by course (Admin scope)
export const getReviewsByCourse = (course) => {
  return api.get(REVIEW_ENDPOINT, {
    params: { course },
  });
};

// Get reviews by course and department (Mentor scope)
export const getReviewsByDepartment = (course, department) => {
  return api.get(REVIEW_ENDPOINT, {
    params: {
      course,
      department,
    },
  });
};

// Get single review by ID
export const getReviewById = (id) => {
  return api.get(`${REVIEW_ENDPOINT}/${id}`);
};

// Synchronize project review count with actual reviews
const syncProjectReviewCount = async (projectId) => {
  if (!projectId) return;

  const [projectResponse, reviewsResponse] = await Promise.all([
    api.get(`${PROJECT_ENDPOINT}/${projectId}`),
    api.get(REVIEW_ENDPOINT, {
      params: { projectId },
    }),
  ]);

  const project = projectResponse.data;
  const reviewCount = reviewsResponse.data.length;

  if (Number(project.reviewCount || 0) !== reviewCount) {
    await api.patch(`${PROJECT_ENDPOINT}/${projectId}`, {
      reviewCount,
    });
  }
};

// Create review
export const createReview = async (reviewData) => {
  const response = await api.post(REVIEW_ENDPOINT, reviewData);

  try {
    await syncProjectReviewCount(response.data.projectId);
  } catch (error) {
    console.error("Review saved, but project review count sync failed:", error);
  }

  return response;
};

// Update review
export const updateReview = async (id, reviewData) => {
  const existingResponse = await getReviewById(id);
  const oldProjectId = existingResponse.data.projectId;

  const response = await api.put(
    `${REVIEW_ENDPOINT}/${id}`,
    reviewData
  );

  const newProjectId = response.data.projectId;

  try {
    await syncProjectReviewCount(oldProjectId);

    if (String(oldProjectId) !== String(newProjectId)) {
      await syncProjectReviewCount(newProjectId);
    }
  } catch (error) {
    console.error("Review updated, but project review count sync failed:", error);
  }

  return response;
};

// Delete review
export const deleteReview = async (id) => {
  const existingResponse = await getReviewById(id);
  const projectId = existingResponse.data.projectId;

  const response = await api.delete(`${REVIEW_ENDPOINT}/${id}`);

  try {
    await syncProjectReviewCount(projectId);
  } catch (error) {
    console.error("Review deleted, but project review count sync failed:", error);
  }

  return response;
};