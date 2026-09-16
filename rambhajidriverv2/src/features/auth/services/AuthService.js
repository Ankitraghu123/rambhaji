// src/features/auth/services/AuthService.js
// Business logic layer for authentication: orchestrates login, logout, and session hydration.

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import AuthRepository from '../repositories/AuthRepository';
import { secureStorage } from '../../../core/storage/mmkvInstances';
import { STORAGE_KEYS } from '../../../config/constants';
import { store } from '../../../store';
import { setDriver, clearSession, setAuthLoading, setAuthError } from '../state/authSlice';
import { resetRoute } from '../../routes/state/routeSlice';
import { clearNotifications } from '../../notifications/state/notificationSlice';
import NotificationService from '../../notifications/services/NotificationService';
import TelemetryService from '../../tracking/services/TelemetryService';

class AuthService {

  /**
   * Login with phone + password.
   * API returns: { success, token, user }
   */
  static async loginWithPassword(phone, password) {
    store.dispatch(setAuthLoading(true));
    store.dispatch(setAuthError(null));
    try {
      const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
      const data = await AuthRepository.loginWithPassword(cleanedPhone, password);

      console.log('[AuthService] Login response:', JSON.stringify(data, null, 2));

      // FreshBox API returns: { success, token, user }
      const accessToken = data.token;
      const driver = data.user;

      if (!accessToken || !driver) {
        throw new Error(data.message || 'Invalid server response — no token or user returned');
      }

      // Persist tokens and profile securely
      secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      secureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, accessToken); // Same token used as refresh
      secureStorage.set(STORAGE_KEYS.DRIVER_PROFILE, JSON.stringify(driver));

      // Clear any cached route state before loading the new session
      store.dispatch(resetRoute());

      // Update Redux state
      store.dispatch(setDriver(driver));

      // Trigger push token registration in background
      NotificationService.registerForPushNotifications().catch(() => {});
      TelemetryService.logEvent('LOGIN');
      TelemetryService.startScheduler();

      return { success: true };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      const msg = error.response?.data?.message || error.message || 'Login failed';
      store.dispatch(setAuthError(msg));
      return { success: false, error: msg };
    } finally {
      store.dispatch(setAuthLoading(false));
    }
  }

  /**
   * Hydrate session from MMKV on app launch.
   * Returns true if a valid session was restored.
   */
  static hydrateSession() {
    const token = secureStorage.getString(STORAGE_KEYS.ACCESS_TOKEN);
    const profileRaw = secureStorage.getString(STORAGE_KEYS.DRIVER_PROFILE);

    if (!token || !profileRaw) return false;

    try {
      const driver = JSON.parse(profileRaw);
      store.dispatch(setDriver(driver));
      
      // Register token and start scheduler
      NotificationService.registerForPushNotifications().catch(() => {});
      TelemetryService.startScheduler();
      
      return true;
    } catch (gp) {
      return false;
    }
  }

  /**
   * Perform a clean logout and redirect to login screen.
   */
  static logout() {
    TelemetryService.logEvent('LOGOUT');
    TelemetryService.flush();
    TelemetryService.stopScheduler();

    // Try server-side logout (fire and forget)
    AuthRepository.logout().catch(() => {});

    secureStorage.clearAll();
    store.dispatch(clearSession());
    store.dispatch(resetRoute());
    store.dispatch(clearNotifications());
    router.replace('/(auth)/login');
  }

  /**
   * Generate a device fingerprint using Expo Device properties.
   */
  static async _getDeviceFingerprint() {
    const parts = [
      Device.modelName,
      Device.manufacturer,
      Device.osVersion,
      Platform.OS,
    ];
    return parts.filter(Boolean).join('_').replace(/\s+/g, '-').toLowerCase();
  }
}

export default AuthService;
