import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL:         API_BASE,
  withCredentials: true,
  timeout:         20000, // 20 s — Neon serverless can take a few seconds to wake
});

// Auth routes — never trigger global logout on failure
const AUTH_PATHS = ['/auth/profile', '/auth/google', '/auth/dev-login', '/auth/dev-logout'];

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url        = error.config?.url || '';
    const isAuthRoute = AUTH_PATHS.some(p => url.includes(p));

    if (error.response?.status === 401 && !isAuthRoute) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    // Annotate network errors with a friendlier message so UI can display it
    if (!error.response) {
      error.isNetwork = true;
      error.friendlyMessage = 'Could not reach the server. Check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;
