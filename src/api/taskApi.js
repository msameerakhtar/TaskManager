import api from './axiosInstance';

export const taskApi = {
  getTasks: (projectId) =>
    api.get('/tasks', { params: { projectId } }),

  createTask: (payload) =>
    api.post('/tasks', payload),

  updateTask: (taskId, payload) =>
    api.put(`/tasks/${taskId}`, payload),

  deleteTask: (taskId) =>
    api.delete(`/tasks/${taskId}`),

  addComment: (taskId, text) =>
    api.post(`/tasks/${taskId}/comments`, { text }),

  addNote: (taskId, content) =>
    api.post(`/tasks/${taskId}/notes`, { content }),

  addAttachment: (taskId, formData) =>
    api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  suggestDeadline: (payload) =>
    api.post('/tasks/suggest/deadline', payload),

  suggestPriority: (payload) =>
    api.post('/tasks/suggest/priority', payload),
};
