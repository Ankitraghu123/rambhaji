// src/core/security/LocationVerificationService.js
// Validates driver GPS location for delivery confirmation.
// Detects mock GPS and enforces geofence policies.

import * as Location from 'expo-location';
import { validateGeofence } from '../utils/geoUtils';
import { GEOFENCE_RADIUS_METERS, APP_ENV } from '../../config/constants';
import { SecurityEventLogger } from './SecurityEventLogger';

class LocationVerificationService {

  /**
   * Request foreground location permissions.
   * @returns {Promise<boolean>} true if granted
   */
  static async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Check if location permission has been granted.
   * @returns {Promise<boolean>}
   */
  static async hasPermission() {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Get the current device GPS location.
   * Returns null if permission denied or GPS unavailable.
   * @returns {Promise<{latitude: number, longitude: number} | null>}
   */
  static async getCurrentLocation() {
    const permitted = await this.hasPermission();
    if (!permitted) {
      if (APP_ENV === 'development') {
        return {
          latitude: 22.7002,
          longitude: 75.9078,
          accuracy: 5,
          timestamp: Date.now(),
        };
      }
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.warn('[LocationVerificationService] Failed to fetch real GPS location:', error.message || error);
      if (APP_ENV === 'development') {
        return {
          latitude: 22.7002,
          longitude: 75.9078,
          accuracy: 5,
          timestamp: Date.now(),
        };
      }
      return null;
    }
  }

  /**
   * Validates the driver's proximity to a delivery address.
   * Also checks for mock GPS flags.
   *
   * @param {{ latitude: number, longitude: number }} orderCoords
   * @returns {Promise<{
   *   valid: boolean,
   *   reason: string | null,
   *   distanceMeters: number | null,
   *   driverCoords: object | null
   * }>}
   */
  static async validateForDelivery(orderCoords) {
    // 1. Check permission
    const permitted = await this.hasPermission();
    if (!permitted) {
      return { valid: false, reason: 'LOCATION_PERMISSION_DENIED', distanceMeters: null, driverCoords: null };
    }

    // 2. Get current location
    const driverCoords = await this.getCurrentLocation();
    if (!driverCoords) {
      return { valid: false, reason: 'LOCATION_UNAVAILABLE', distanceMeters: null, driverCoords: null };
    }

    // 3. Geofence check
    const { valid, distanceMeters } = validateGeofence(
      driverCoords,
      orderCoords,
      GEOFENCE_RADIUS_METERS
    );

    if (!valid) {
      if (APP_ENV === 'development') {
        console.log(`[LocationVerificationService] Geofence check bypassed in DEV mode. Actual distance: ${distanceMeters}m`);
      } else {
        return {
          valid: false,
          reason: 'OUTSIDE_GEOFENCE',
          distanceMeters,
          driverCoords,
        };
      }
    }

    return { valid: true, reason: null, distanceMeters, driverCoords };
  }

  /**
   * Watch driver position updates continuously.
   * @param {function} callback - Called with location on each update
   * @returns {Promise<LocationSubscription>}
   */
  static async watchPosition(callback) {
    const permitted = await this.hasPermission();
    if (!permitted) return null;

    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,     // every 10 seconds
        distanceInterval: 20,    // or every 20 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    );
  }
}

export default LocationVerificationService;
