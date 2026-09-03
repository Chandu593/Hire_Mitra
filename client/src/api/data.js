import { api } from './http';
export const jobsApi = {
  list: (includeArchived=false) => api(`/jobs${includeArchived ? '?includeArchived=true' : ''}`),
  get: id => api(`/jobs/${id}`),
  create: body => api('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  archive: id => api(`/jobs/${id}/archive`, { method: 'PATCH' }),
  restore: id => api(`/jobs/${id}/restore`, { method: 'PATCH' }),
  applications: id => api(`/jobs/${id}/applications`),
  createApplication: (id, body) => api(`/jobs/${id}/applications`, { method: 'POST', body: JSON.stringify(body) })
};
export const applicationsApi = {
  list: params => api(`/applications?${new URLSearchParams(params).toString()}`),
  mine: () => api('/applications/mine'),
  get: id => api(`/applications/${id}`),
  update: (id, body) => api(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  advance: (id, targetStage) => api(`/applications/${id}/advance`, { method: 'PATCH', body: JSON.stringify(targetStage ? { targetStage } : {}) }),
  reject: id => api(`/applications/${id}/reject`, { method: 'PATCH' }),
  reinstate: id => api(`/applications/${id}/reinstate`, { method: 'PATCH' }),
  setInterviewers: (id, interviewerIds) => api(`/applications/${id}/interviewers`, { method: 'PATCH', body: JSON.stringify({ interviewerIds }) }),
  timeline: id => api(`/applications/${id}/timeline`),
  feedback: (id, feedbackText) => api(`/applications/${id}/feedback`, { method: 'POST', body: JSON.stringify({ feedbackText }) }),
  bulkAdvance: applicationIds => api('/applications/bulk/advance', { method: 'POST', body: JSON.stringify({ applicationIds }) }),
  bulkReject: applicationIds => api('/applications/bulk/reject', { method: 'POST', body: JSON.stringify({ applicationIds }) }),
  exportCsv: () => api('/applications/export.csv')
};
export const usersApi = { interviewers: () => api('/users/interviewers') };
export const dashboardApi = { get: () => api('/dashboard') };
export const alertsApi = { stalled: () => api('/alerts/stalled'), dismiss: id => api(`/alerts/${id}/dismiss`, { method: 'POST' }) };
