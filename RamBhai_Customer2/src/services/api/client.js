import axios from 'axios';
import { useAppStore } from '../../store/UseAppStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://rambhaji.backend.shreenari.com/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s timeout for render cold starts
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Get token from zustand store directly (synchronous)
    const token = useAppStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and route to login via store
      useAppStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

