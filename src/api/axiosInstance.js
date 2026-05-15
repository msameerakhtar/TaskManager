import axios from 'axios';
import { store } from '../app/store';
import { logout } from '../features/auth/authSlice';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ── Request Interceptor ─ auto-attach auth token ──────────────────
api.interceptors.request.use(
  (config) => {
    const { token } = store.getState().auth;
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─ handle 401/403 (session expired or suspended) ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized = error.response?.status === 401;
    const isSuspended = error.response?.status === 403 && error.response?.data?.message?.includes('suspended');
    
    if (
      (isUnauthorized || isSuspended) &&
      !error.config?._skipAuthRedirect
    ) {
      if (isSuspended) {
          alert('Your account has been suspended by the administrator. Please contact support.');
      }
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
