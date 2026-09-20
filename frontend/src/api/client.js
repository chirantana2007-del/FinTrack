import axios from 'axios';

// In dev, Vite proxies /api -> the backend (see vite.config.js), so a
// relative base URL works without hardcoding a host or fighting CORS.
const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('fintrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
