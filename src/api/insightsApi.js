import api from './axiosInstance';

export const insightsApi = {
  getWorkload: (projectId) =>
    api.get(`/insights/workload/${projectId}`),

  getProductivity: (projectId) =>
    api.get(`/insights/productivity/${projectId}`),

  getCalendarLinks: (projectId) =>
    api.get(`/calendar/project/${projectId}/links`),
};
