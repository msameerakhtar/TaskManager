import api from './axiosInstance';

export const projectApi = {
  getProjects: () =>
    api.get('/projects'),

  createProject: (name) =>
    api.post('/projects', { name }),

  inviteMember: (projectId, email, role) =>
    api.post(`/projects/${projectId}/members`, { email, role }),

  updateMemberRole: (projectId, userId, role) =>
    api.patch(`/projects/${projectId}/members/${userId}`, { role }),

  removeMember: (projectId, userId) =>
    api.delete(`/projects/${projectId}/members/${userId}`),

  renameProject: (projectId, name) =>
    api.patch(`/projects/${projectId}`, { name }),

  deleteProject: (projectId) =>
    api.delete(`/projects/${projectId}`),

  updateEnterprise: (projectId, enterprise) =>
    api.patch(`/projects/${projectId}/enterprise`, { enterprise }),

  getApiKeys: (projectId) =>
    api.get(`/projects/${projectId}/api-keys`),

  createApiKey: (projectId, label) =>
    api.post(`/projects/${projectId}/api-keys`, { label }),

  revokeApiKey: (projectId, keyId) =>
    api.delete(`/projects/${projectId}/api-keys/${keyId}`),

  testSlack: (projectId) =>
    api.post(`/projects/${projectId}/integrations/test-slack`),

  testEmail: (projectId) =>
    api.post(`/projects/${projectId}/integrations/test-email`),

  getMyPermissions: (projectId) =>
    api.get(`/projects/${projectId}/my-permissions`),
};
