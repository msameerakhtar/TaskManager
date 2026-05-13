import api from './axiosInstance';

export const notificationApi = {
  getNotifications: (params) =>
    api.get('/notifications', { params }),

  markAsRead: (notificationId) =>
    api.patch(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
};
