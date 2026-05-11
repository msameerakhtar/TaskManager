import api from './axiosInstance';

export const authApi = {
  login: (data) =>
    api.post('/auth/login', data, { _skipAuthRedirect: true }),

  signup: (data) =>
    api.post('/auth/signup', data, { _skipAuthRedirect: true }),

  uploadAvatar: (formData) =>
    api.post('/auth/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateProfile: (data) =>
    api.put('/auth/profile', data),

  changePassword: (data) =>
    api.put('/auth/change-password', data),
};
