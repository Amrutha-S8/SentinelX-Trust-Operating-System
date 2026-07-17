import axios from 'axios';

const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.tokens;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: any) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  setupTOTP: () => apiClient.post('/auth/totp/setup'),
  verifyTOTPSetup: (token: string) => apiClient.post('/auth/totp/verify-setup', { token }),
  getSessions: () => apiClient.get('/auth/sessions'),
  getDevices: () => apiClient.get('/auth/devices'),
};

// Trust API
export const trustAPI = {
  evaluate: (data: any) => apiClient.post('/trust/evaluate', data),
  getCurrentScore: () => apiClient.get('/trust/score'),
  getHistory: (limit?: number, skip?: number) =>
    apiClient.get('/trust/history', { params: { limit, skip } }),
  getTrends: (days?: number) => apiClient.get('/trust/analytics/trends', { params: { days } }),
  getAlerts: () => apiClient.get('/trust/risk/alerts'),
};

// Approval API
export const approvalAPI = {
  getRequests: (status?: string) =>
    apiClient.get('/approvals/requests', { params: { status } }),
  getPending: () => apiClient.get('/approvals/requests/pending'),
  approve: (requestId: string, comments?: string) =>
    apiClient.post(`/approvals/requests/${requestId}/approve`, { comments }),
  reject: (requestId: string, comments?: string) =>
    apiClient.post(`/approvals/requests/${requestId}/reject`, { comments }),
  breakGlass: (requestId: string, reason: string) =>
    apiClient.post(`/approvals/requests/${requestId}/break-glass`, { reason }),
  getStats: () => apiClient.get('/approvals/stats'),
};

// Audit API
export const auditAPI = {
  getLogs: (params?: any) => apiClient.get('/audit/logs', { params }),
  verifyChain: () => apiClient.post('/audit/verify'),
  exportLogs: (filters: any, format: 'json' | 'csv') =>
    apiClient.post('/audit/export', { filters, format }),
  getAnalytics: () => apiClient.get('/audit/analytics/overview'),
  getSecurityEvents: () => apiClient.get('/audit/analytics/security-events'),
};

// Policy API
export const policyAPI = {
  getPolicies: (category?: string) =>
    apiClient.get('/policies', { params: { category } }),
  getPolicy: (id: string) => apiClient.get(`/policies/${id}`),
  createPolicy: (data: any) => apiClient.post('/policies', data),
  updatePolicy: (id: string, data: any) => apiClient.put(`/policies/${id}`, data),
  deletePolicy: (id: string) => apiClient.delete(`/policies/${id}`),
  enablePolicy: (id: string) => apiClient.patch(`/policies/${id}/enable`),
  disablePolicy: (id: string) => apiClient.patch(`/policies/${id}/disable`),
};

// Admin API
export const adminAPI = {
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  getSystemHealth: () => apiClient.get('/admin/health'),
  getMetrics: () => apiClient.get('/admin/metrics'),
};

// Simulator API
export const simulatorAPI = {
  simulateSIMSwap: (targetAction: string) =>
    apiClient.post('/simulator/attacks/sim-swap', { targetAction }),
  simulateImpossibleTravel: (fromLocation: any, toLocation: any, timeDiffMinutes: number) =>
    apiClient.post('/simulator/attacks/impossible-travel', {
      fromLocation,
      toLocation,
      timeDiffMinutes,
    }),
  simulateCredentialStuffing: (email: string, attempts: number) =>
    apiClient.post('/simulator/attacks/credential-stuffing', { email, attempts }),
  simulateMFAFatigue: (pushNotifications: number) =>
    apiClient.post('/simulator/attacks/mfa-fatigue', { pushNotifications }),
  getDetectionRate: () => apiClient.get('/simulator/metrics/detection-rate'),
  getScenarioTemplates: () => apiClient.get('/simulator/scenarios/templates'),
};