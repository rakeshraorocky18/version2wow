import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const agentApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

agentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

agentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agentAccessToken');
      localStorage.removeItem('agentRefreshToken');
      localStorage.removeItem('agentUser');
      if (!window.location.pathname.includes('/agent/login')) {
        window.location.href = '/agent/login';
      }
    }
    return Promise.reject(error);
  },
);

export default agentApi;
