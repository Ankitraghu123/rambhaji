// src/core/security/SecurityService.js
// Fraud & Security Engine for Ram Bhaji Delivery App
// Handles Device Fingerprinting, Rate Limiting, Suspicious Login Detection, Location Spoofing Checks & Risk Scoring

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { secureStorage, appStorage } from '../storage/mmkvInstances';
import { store } from '../../store';
import {
  setDeviceMeta,
  setRiskScore,
  incrementFailedLogin,
  resetFailedLogin,
  setRateLimited,
  addSecurityAlert,
  setActiveSessionId,
} from '../../features/security/state/securitySlice';

const DEVICE_FINGERPRINT_KEY = 'security_device_fingerprint';
const LAST_GPS_KEY = 'security_last_gps_log';
const ACTION_TIMESTAMPS_KEY = 'security_action_timestamps';

export class SecurityService {
  /**
   * Sliding window action timestamp cache in memory
   */
  static _actionWindows = {};

  /**
   * Generate a unique device fingerprint hash string
   */
  static async getDeviceFingerprint() {
    try {
      let installId = secureStorage.getString('app_installation_id');
      if (!installId) {
        installId = 'inst_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        secureStorage.set('app_installation_id', installId);
      }

      const parts = [
        Device.manufacturer || 'Generic',
        Device.modelName || 'Device',
        Device.osVersion || 'OS',
        Platform.OS,
        installId,
      ];

      const fingerprint = parts.join('_').replace(/\s+/g, '-').toLowerCase();
      const meta = {
        fingerprint,
        manufacturer: Device.manufacturer || 'Unknown',
        modelName: Device.modelName || 'Device',
        osVersion: Device.osVersion || '',
        platform: Platform.OS,
        installId,
        registeredAt: new Date().toISOString(),
      };

      store.dispatch(setDeviceMeta(meta));
      return meta;
    } catch (e) {
      console.warn('[SecurityService] Fingerprint error:', e);
      return { fingerprint: 'unknown_device', platform: Platform.OS };
    }
  }

  /**
   * Verify device identity on login
   */
  static async verifyDeviceSession() {
    try {
      const currentMeta = await this.getDeviceFingerprint();
      const knownFingerprint = secureStorage.getString(DEVICE_FINGERPRINT_KEY);

      if (!knownFingerprint) {
        // First login on this device — register as trusted
        secureStorage.set(DEVICE_FINGERPRINT_KEY, currentMeta.fingerprint);
        store.dispatch(
          addSecurityAlert({
            type: 'DEVICE_REGISTERED',
            title: 'Trusted Device Enrolled',
            message: `Logged in from ${currentMeta.modelName} (${currentMeta.platform})`,
            level: 'INFO',
          })
        );
        return { isNewDevice: false, meta: currentMeta };
      }

      if (knownFingerprint !== currentMeta.fingerprint) {
        // Unrecognized device login attempt detected!
        console.warn('[SecurityService] ⚠️ New / Unrecognized Device Login Detected!');
        store.dispatch(
          addSecurityAlert({
            type: 'SUSPICIOUS_LOGIN',
            title: 'Unrecognized Device Login',
            message: `New login attempt from ${currentMeta.modelName}. Please verify if this was you.`,
            level: 'WARNING',
          })
        );
        
        this._bumpRiskScore(25);
        return { isNewDevice: true, meta: currentMeta };
      }

      return { isNewDevice: false, meta: currentMeta };
    } catch (e) {
      return { isNewDevice: false, meta: null };
    }
  }

  /**
   * Rate Limiter (Sliding Window Algorithm)
   * @param {string} actionKey - e.g. 'login_attempt', 'claim_order', 'attendance_punch'
   * @param {number} maxAllowed - max actions allowed in window
   * @param {number} windowMs - window size in milliseconds
   */
  static checkRateLimit(actionKey, maxAllowed = 5, windowMs = 60000) {
    const now = Date.now();
    if (!this._actionWindows[actionKey]) {
      this._actionWindows[actionKey] = [];
    }

    // Filter timestamps within the active sliding window
    this._actionWindows[actionKey] = this._actionWindows[actionKey].filter(
      (ts) => now - ts < windowMs
    );

    if (this._actionWindows[actionKey].length >= maxAllowed) {
      const remainingMs = windowMs - (now - this._actionWindows[actionKey][0]);
      const remainingSec = Math.ceil(remainingMs / 1000);
      const msg = `Rate limit exceeded for ${actionKey.replace('_', ' ')}. Please wait ${remainingSec}s.`;

      console.warn(`[SecurityService] 🛡️ Rate limit hit on ${actionKey}!`);
      store.dispatch(
        setRateLimited({
          isLimited: true,
          message: msg,
        })
      );
      store.dispatch(
        addSecurityAlert({
          type: 'RATE_LIMIT_EXCEEDED',
          title: 'Action Rate Limit Triggered',
          message: msg,
          level: 'WARNING',
        })
      );
      this._bumpRiskScore(15);

      setTimeout(() => {
        store.dispatch(setRateLimited({ isLimited: false, message: null }));
      }, remainingMs);

      return { allowed: false, remainingSec, message: msg };
    }

    // Record action timestamp
    this._actionWindows[actionKey].push(now);
    return { allowed: true };
  }

  /**
   * Check if account is in security lockout from multiple failed logins
   */
  static checkLoginLockout() {
    const state = store.getState();
    const lockoutUntil = state.security?.lockoutUntil;

    if (lockoutUntil) {
      const remainingMs = new Date(lockoutUntil).getTime() - Date.now();
      if (remainingMs > 0) {
        const remainingSec = Math.ceil(remainingMs / 1000);
        return {
          isLocked: true,
          remainingSec,
          message: `Security Lockout Active. Too many failed attempts. Try again in ${Math.ceil(remainingSec / 60)} minutes.`,
        };
      } else {
        // Lockout expired — auto reset
        store.dispatch(resetFailedLogin());
      }
    }
    return { isLocked: false };
  }

  /**
   * Record a failed login attempt
   */
  static recordFailedLogin() {
    store.dispatch(incrementFailedLogin());
    const state = store.getState();
    const attempts = state.security?.failedLoginAttempts || 0;

    store.dispatch(
      addSecurityAlert({
        type: 'FAILED_LOGIN',
        title: 'Failed Login Attempt',
        message: `Invalid credentials entered (Attempt ${attempts}/5).`,
        level: attempts >= 4 ? 'HIGH' : 'WARNING',
      })
    );
  }

  /**
   * Record a successful login
   */
  static recordSuccessfulLogin() {
    store.dispatch(resetFailedLogin());
    const sessionToken = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    store.dispatch(setActiveSessionId(sessionToken));
    this.verifyDeviceSession();
  }

  /**
   * Detect location velocity anomaly / GPS spoofing
   * @param {object} coords - { latitude, longitude }
   */
  static evaluateLocationSecurity(coords) {
    if (!coords || coords.latitude === undefined || coords.longitude === undefined) return;

    try {
      const rawLastGps = appStorage.getString(LAST_GPS_KEY);
      const now = Date.now();

      if (rawLastGps) {
        const lastGps = JSON.parse(rawLastGps);
        const timeDiffSec = (now - lastGps.timestamp) / 1000;

        if (timeDiffSec > 5 && timeDiffSec < 3600) {
          const distKm = this._calculateHaversineDistance(
            lastGps.latitude,
            lastGps.longitude,
            coords.latitude,
            coords.longitude
          );

          const speedKmH = (distKm / (timeDiffSec / 3600));

          // If speed > 180 km/h -> unrealistic for delivery driver (Location spoofing risk)
          if (speedKmH > 180 && distKm > 3) {
            console.warn(`[SecurityService] ⚠️ Location Anomaly Detected! Speed: ${speedKmH.toFixed(0)} km/h over ${distKm.toFixed(1)} km`);
            store.dispatch(
              addSecurityAlert({
                type: 'LOCATION_SPOOF_RISK',
                title: 'GPS Velocity Anomaly Detected',
                message: `Unrealistic position change detected (${distKm.toFixed(1)} km in ${timeDiffSec.toFixed(0)}s).`,
                level: 'HIGH',
              })
            );
            this._bumpRiskScore(40);
          }
        }
      }

      // Save current GPS position
      appStorage.set(
        LAST_GPS_KEY,
        JSON.stringify({
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: now,
        })
      );
    } catch (e) {
      console.warn('[SecurityService] Location security evaluation error:', e);
    }
  }

  /**
   * Increase security risk score
   */
  static _bumpRiskScore(amount) {
    const currentScore = store.getState().security?.riskScore || 0;
    store.dispatch(setRiskScore(currentScore + amount));
  }

  /**
   * Haversine formula to compute distance in km
   */
  static _calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export default SecurityService;
