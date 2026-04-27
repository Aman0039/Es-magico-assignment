import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cwos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cwos_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Projects
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
  computeExecution: (id) => api.post(`/projects/${id}/compute-execution`),
  simulate: (id, data) => api.post(`/projects/${id}/simulate`, data),
  getWebhookLogs: (id) => api.get(`/projects/${id}/webhook-logs`)
};

// Tasks
export const tasksAPI = {
  getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/tasks/project/${projectId}`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  duplicate: (id) => api.post(`/tasks/${id}/duplicate`),
  retry: (id) => api.post(`/tasks/${id}/retry`),
  getHistory: (id) => api.get(`/tasks/${id}/history`),
  restoreVersion: (id, version) => api.post(`/tasks/${id}/restore/${version}`)
};

// Invites
export const invitesAPI = {
  generate: (projectId) => api.post(`/invites/project/${projectId}/generate`),
  validate: (token) => api.get(`/invites/validate/${token}`),
  accept: (token) => api.post(`/invites/accept/${token}`)
};

// Audit
export const auditAPI = {
  getMe: () => api.get('/audit/me'),
  getProject: (projectId, params) => api.get(`/audit/project/${projectId}`, { params })
};

// Webhooks
export const webhooksAPI = {
  getLogs: (projectId) => api.get(`/webhooks/project/${projectId}`)
};
