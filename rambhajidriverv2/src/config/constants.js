import { Platform } from 'react-native';

const getBaseUrl = () => {
  return 'https://rambhaji.backend.shreenari.com/api';
};

export const API_BASE_URL = getBaseUrl();
export const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';

// Geofence
export const GEOFENCE_RADIUS_METERS = Number(process.env.EXPO_PUBLIC_GEOFENCE_RADIUS_METERS) || 100;

// Authentication
export const MAX_OTP_ATTEMPTS = Number(process.env.EXPO_PUBLIC_MAX_OTP_ATTEMPTS) || 3;
export const OTP_EXPIRY_SECONDS = Number(process.env.EXPO_PUBLIC_OTP_EXPIRY_SECONDS) || 300;
export const JWT_ACCESS_EXPIRY_MINUTES = Number(process.env.EXPO_PUBLIC_JWT_ACCESS_EXPIRY_MINUTES) || 15;

// Sync Engine
export const MAX_RETRY_COUNT = Number(process.env.EXPO_PUBLIC_MAX_RETRY_COUNT) || 5;
export const SYNC_BASE_DELAY_MS = Number(process.env.EXPO_PUBLIC_SYNC_BASE_DELAY_MS) || 2000;
export const SYNC_MAX_DELAY_MS = Number(process.env.EXPO_PUBLIC_SYNC_MAX_DELAY_MS) || 60000;

// Audit Logging
export const AUDIT_BATCH_SIZE = Number(process.env.EXPO_PUBLIC_AUDIT_BATCH_SIZE) || 50;
export const AUDIT_FLUSH_INTERVAL_MS = Number(process.env.EXPO_PUBLIC_AUDIT_FLUSH_INTERVAL_MS) || 300000;

// Order Status Enum
export const ORDER_STATUS = {
  ASSIGNED:   'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED:  'COMPLETED',
  RETURNED:   'RETURNED',
  FAILED:     'FAILED',
};

// Return Reasons
export const RETURN_REASONS = [
  'Customer Not Available',
  'Customer Rejected Order',
  'Product Damaged During Transit',
  'Wrong Address / Unable to Locate',
  'Quantity Mismatch',
  'Customer Requested Cancellation',
  'Other',
];

// Product Categories
export const PRODUCT_CATEGORIES = {
  VEGETABLES:          'VEGETABLES',
  FRUITS:              'FRUITS',
  EXOTIC_VEGETABLES:   'EXOTIC_VEGETABLES',
  WATER_SUBSCRIPTION:  'WATER_SUBSCRIPTION',
  OTHER:               'OTHER',
};

// MMKV Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN:    'auth_access_token',
  REFRESH_TOKEN:   'auth_refresh_token',
  DRIVER_PROFILE:  'auth_driver_profile',
  DEVICE_BOUND:    'auth_device_bound',
  OFFLINE_QUEUE:   'offline_action_queue',
  ROUTE_CACHE:     'route_today_cache',
  AUDIT_QUEUE:     'audit_log_queue',
};

// CDN base URL for loading assets
export const CDN_BASE_URL = process.env.EXPO_PUBLIC_CDN_BASE_URL || 'https://cdn.ranbhaji.com/assets';
