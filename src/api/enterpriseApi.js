import api from './axiosInstance';

export const enterpriseApi = {
  getAuditLog: (projectId, limit = 100) =>
    api.get('/enterprise/audit', { params: { projectId, limit } }),

  getPendingApprovals: (projectId) =>
    api.get('/enterprise/approvals/pending', { params: { projectId } }),

  approveRequest: (approvalId) =>
    api.post(`/enterprise/approvals/${approvalId}/approve`),

  rejectRequest: (approvalId, comment) =>
    api.post(`/enterprise/approvals/${approvalId}/reject`, { comment }),

  downloadExport: (path, projectId) =>
    api.get(`/enterprise/exports/${path}`, {
      params: { projectId },
      responseType: 'blob',
    }),
};
