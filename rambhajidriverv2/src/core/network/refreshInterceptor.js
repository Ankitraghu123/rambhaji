// src/core/network/refreshInterceptor.js
// Response interceptor: handles 401 JWT expiry, auto-refreshes tokens,
// queues and retries failed requests, force-logouts on refresh failure

import { secureStorage } from '../storage/mmkvInstances';
import { STORAGE_KEYS } from '../../config/constants';
import { store } from '../../store';
import { clearSession } from '../../features/auth/state/authSlice';
import { router } from 'expo-router';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function attachRefreshInterceptor(axiosInstance) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Force logout flag from server
      if (
        error.response?.status === 403 &&
        error.response?.data?.forceLogout === true
      ) {
        await performForceLogout();
        return Promise.reject(error);
      }

      // Handle 401: attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue additional requests while refresh is in progress
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = secureStorage.getString(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          await performForceLogout();
          return Promise.reject(error);
        }

        try {
          const response = await axiosInstance.post('/auth/token/refresh', null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;

          secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          secureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

          processQueue(null, accessToken);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await performForceLogout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

export async function performForceLogout(reason = 'Session expired, please login again.') {
  secureStorage.clearAll();
  store.dispatch(clearSession(reason));
  try {
    router.replace({
      pathname: '/(auth)/login',
      params: { sessionExpired: 'true', reason },
    });
  } catch (e) {
    router.replace('/(auth)/login');
  }
}
