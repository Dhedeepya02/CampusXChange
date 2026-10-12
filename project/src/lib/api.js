/**
 * Axios API client for CampusXChange.
 * All requests go to /api/* which Vite proxies to the Flask backend.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cxc_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stored credentials (token expired / revoked)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cxc_token');
      localStorage.removeItem('cxc_user');
    }
    return Promise.reject(err);
  }
);

export default api;
