import axios from 'axios';

// Configure Axios with credentials support for HttpOnly session cookies
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Endpoints
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// User Endpoints
export const userService = {
  getProfile: () => api.get('/user/profile'),
  changePassword: (data) => api.put('/user/change-password', data),
  getMyFsmHistory: () => api.get('/user/fsm-history'),
};

// Admin Endpoints
export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getAllUsers: () => api.get('/admin/users'),
  lockUser: (userId) => api.post(`/admin/users/${userId}/lock`),
  unlockUser: (userId) => api.post(`/admin/users/${userId}/unlock`),
  changeUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
};

// FSM Endpoints
export const fsmService = {
  getDefinition: () => api.get('/fsm/definition'),
  simulateTransition: (data) => api.post('/fsm/simulate', data),
  getHistory: (limit = 50) => api.get(`/fsm/history?limit=${limit}`),
  testRegex: (data) => api.post('/fsm/regex-test', data),
};

// Network Endpoints
export const networkService = {
  getStats: () => api.get('/network/stats'),
  getLiveRequests: () => api.get('/network/live-stream'),
  clearLogs: () => api.delete('/network/clear'),
};

// Session Endpoints
export const sessionService = {
  getActiveSessions: () => api.get('/session/active'),
  terminateSession: (sessionId) => api.post(`/session/terminate/${sessionId}`),
  inspectSession: () => api.get('/session/inspect'),
  getSecurityLogs: (params) => api.get('/session/logs', { params }),
};

export default api;
