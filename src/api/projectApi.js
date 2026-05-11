import api from './axiosInstance';

export const projectApi = {
  getProjects: () =>
    api.get('/projects'),

  createProject: (name) =>
    api.post('/projects', { name }),

  inviteMember: (projectId, email, role) =>
    api.post(`/projects/${projectId}/members`, { email, role }),

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
};
