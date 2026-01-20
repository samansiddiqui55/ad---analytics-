import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE_URL = `${BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const campaignsAPI = {
  getAll: (platform) => apiClient.get('/campaigns', { params: { platform } }),
  getSummary: () => apiClient.get('/campaigns/summary'),
};

export const performanceAPI = {
  getMetrics: (params) => apiClient.get('/performance', { params }),
  sync: () => apiClient.post('/sync'),
};

export default apiClient;
