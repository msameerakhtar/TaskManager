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

// ── Response Interceptor ─ handle 401 (session expired) ───────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?._skipAuthRedirect
    ) {
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
