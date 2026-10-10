import axios from 'axios';
import { clearAuthSession } from '../utils/authFlow.js';

const api = axios.create({
  baseURL: (import.meta.env ?. VITE_API_BASE_URL) || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },  timeout: 10000,
});

// Request interceptor to add Authorization header using 'token'
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // In case localStorage is unavailable in certain environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully and avoid redirect loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url &&
      (error.config.url.includes('/auth/login') ||
        error.config.url.includes('/auth/register'));

    // Handle 401 from protected requests only; auth endpoint failures (e.g. invalid credentials)
    // should reject normally without clearing stored credentials or redirecting the user.
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      clearAuthSession(localStorage);

      // Dispatch custom session-expiration event for active SPA state transition without hard reload
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        try {
          const event = typeof CustomEvent === 'function'
            ? new CustomEvent('upiq:session-expired')
            : { type: 'upiq:session-expired' };
          window.dispatchEvent(event);
        } catch {
          // Fallback if CustomEvent is unavailable
        }
      }
    }

    // Extract user-friendly error message without leaking sensitive data
    const errorMessage =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    error.userFriendlyMessage = errorMessage;

    return Promise.reject(error);
  }
);

export default api;
