// src/core/network/apiClient.js
// Axios instance with base configuration, request signing, and auth headers

import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { secureStorage, appStorage, getJSON, setJSON } from '../storage/mmkvInstances';
import { STORAGE_KEYS } from '../../config/constants';
import { store } from '../../store';
import { setServerError } from '../../features/sync/state/syncSlice';

// Cache Configuration for GET requests
const getCacheConfig = (url) => {
  if (!url) return null;
  const cleanUrl = url.split('?')[0];
  if (cleanUrl.endsWith('/today-deliveries')) {
    return { key: 'api_cache_today_deliveries', ttl: 30000 };
  }
  if (cleanUrl.endsWith('/available-orders')) {
    return { key: 'api_cache_available_orders', ttl: 15000 };
  }
  if (cleanUrl.endsWith('/notifications')) {
    return { key: 'api_cache_notifications', ttl: 30000 };
  }
  return null;
};

// ⚠️  Render free tier cold start ke liye 60s timeout rakha hai
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds — Render cold start handle karne ke liye
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Helper to send logs to the local proxy server running in the terminal
const logToTerminal = (message) => {
  // Standard console log in browser
  console.log(message);
  
  // Forward to local proxy terminal (Disabled to prevent network tab spam in browser)
  // axios.post('http://localhost:3001/log-terminal', { message }).catch(() => {});
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Inject Bearer token and device fingerprint into every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token = secureStorage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add timestamp for request signing validation
    config.headers['X-RamBhaji-Timestamp'] = Date.now().toString();

    // Retry counter initialize karo
    config._retryCount = config._retryCount || 0;

    // Cache hit logic
    const cacheConfig = getCacheConfig(config.url);
    if (config.method?.toLowerCase() === 'get' && cacheConfig && config.headers['Cache-Control'] !== 'no-cache') {
      const cached = getJSON(appStorage, cacheConfig.key);
      if (cached && (Date.now() - cached.timestamp < cacheConfig.ttl)) {
        logToTerminal(`[Cache HIT] Serving ${config.url} from MMKV cache`);
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: { 'x-from-cache': 'true', 'content-type': 'application/json' },
          config,
        });
        return config;
      }
    }

    // Detailed Request Logging
    const reqLog = `
    ╔═════════════════ API REQUEST ═════════════════╗
    ║ Method:  ${config.method?.toUpperCase()}
    ║ URL:     ${config.baseURL || ''}${config.url || ''}
    ║ Headers: ${JSON.stringify(config.headers, null, 2)}
    ║ Payload: ${config.data ? JSON.stringify(config.data, null, 2) : '[None]'}
    ╚═══════════════════════════════════════════════╝`;
    logToTerminal(reqLog);

    return config;
  },
  (error) => {
    console.error('[apiClient] Request Error:', error);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor — Log Success & Auto Retry on Timeout / Network Error ─────────────
apiClient.interceptors.response.use(
  (response) => {
    // Cache write logic
    const cacheConfig = getCacheConfig(response.config.url);
    if (response.config.method?.toLowerCase() === 'get' && cacheConfig && response.headers['x-from-cache'] !== 'true') {
      setJSON(appStorage, cacheConfig.key, {
        data: response.data,
        timestamp: Date.now(),
      });
      logToTerminal(`[Cache Write] Cached response for ${response.config.url}`);
    }
    // Detailed Response Logging
    const resLog = `
╔═════════════════ API RESPONSE ════════════════╗
║ URL:     ${response.config.baseURL || ''}${response.config.url || ''}
║ Status:  ${response.status} ${response.statusText || 'OK'}
║ Headers: ${JSON.stringify(response.headers, null, 2)}
║ Data:    ${JSON.stringify(response.data, null, 2)}
╚═══════════════════════════════════════════════╝`;
    logToTerminal(resLog);
    return response;
  },
  async (error) => {
    const config = error.config;
    const MAX_RETRIES = 2;

    // Detailed Error Response Logging
    const errLog = `
╔═════════════════ API ERROR ═══════════════════╗
║ URL:     ${config ? (config.baseURL || '') + (config.url || '') : 'Unknown'}
║ Message: ${error.message}
${error.response ? `║ Status:  ${error.response.status}\n║ Headers: ${JSON.stringify(error.response.headers, null, 2)}\n║ Data:    ${JSON.stringify(error.response.data, null, 2)}` : ''}
╚═══════════════════════════════════════════════╝`;
    logToTerminal(errLog);

    // Timeout ya network error pe retry karo (Render cold start)
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    const isNetworkError = !error.response && error.message === 'Network Error';

    if ((isTimeout || isNetworkError) && config && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      console.warn(
        `[apiClient] Retry ${config._retryCount}/${MAX_RETRIES} — server wake ho raha hai...`
      );
      // 2 seconds wait karo before retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return apiClient(config);
    }

    // Log 5xx errors for debugging, but do not block the UI with global Server Error modal
    if (error.response && error.response.status >= 500) {
      console.warn(
        `[apiClient] Server Error ${error.response.status} on ${config?.url || 'API'}:`,
        error.response.data?.message || error.message
      );
      // Only dispatch setServerError if explicitly requested via X-Require-Server-Error-Modal header
      if (config?.headers?.['X-Require-Server-Error-Modal']) {
        store.dispatch(
          setServerError({
            code: error.response.status,
            message: error.response.data?.message || 'Server is temporarily unavailable.',
          })
        );
      }
    }

    return Promise.reject(error);
  }
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handled in refreshInterceptor.js (attached separately to avoid circular deps)

export default apiClient;
