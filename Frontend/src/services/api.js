import axios from 'axios';
import { API_BASE } from '../utils/constants';

const api = axios.create({ baseURL: API_BASE });

// Attach user ID to every request (Mock Auth)
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('newsflow_user') || 'null');
  if (user?.id) {
    config.headers['x-user-id'] = user.id;
  }
  return config;
});

export default api;
