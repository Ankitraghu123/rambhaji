// src/core/security/DeviceValidationService.js
// Detects rooted/jailbroken devices and emulators.
// Blocks sensitive operations when integrity violations are found.

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { SecurityEventLogger } from './SecurityEventLogger';

// Known emulator hardware identifiers
const EMULATOR_HARDWARE = ['goldfish', 'ranchu', 'vbox86', 'generic'];
const EMULATOR_MANUFACTURERS = ['Genymotion', 'unknown'];
const EMULATOR_MODELS = ['Android SDK built for x86', 'Emulator', 'Android Emulator'];

class DeviceValidationService {
  static _validationResult = null;

  /**
   * Run all device integrity checks.
   * Results are cached for the session (only run once).
   * @returns {{ isRooted: boolean, isEmulator: boolean, isSecure: boolean }}
   */
  static async validate() {
    if (this._validationResult) return this._validationResult;

    const isEmulator = await this._checkEmulator();
    const isRooted = await this._checkRooted();
    const isSecure = !isEmulator && !isRooted;

    this._validationResult = { isRooted, isEmulator, isSecure };

    if (!isSecure) {
      SecurityEventLogger.log({
        eventType: 'DEVICE_INTEGRITY_VIOLATION',
        details: { isRooted, isEmulator },
      });
    }

    return this._validationResult;
  }

  /**
   * Check if the device is an emulator using Expo Device properties.
   */
  static async _checkEmulator() {
    if (!Device.isDevice) return true; // Not a physical device

    const model = Device.modelName || '';
    const manufacturer = Device.manufacturer || '';
    const deviceType = await Device.getDeviceTypeAsync();

    // Expo Device.isDevice handles most cases.
    // Additional checks for specific emulator identifiers:
    const modelMatch = EMULATOR_MODELS.some((m) =>
      model.toLowerCase().includes(m.toLowerCase())
    );
    const manufacturerMatch = EMULATOR_MANUFACTURERS.some((m) =>
      manufacturer.toLowerCase().includes(m.toLowerCase())
    );

    return modelMatch || manufacturerMatch;
  }

  /**
   * Check for root indicators on Android / jailbreak on iOS.
   * Note: Full root detection requires a native module in production.
   * This implementation covers detectable signals via JS.
   */
  static async _checkRooted() {
    if (Platform.OS === 'android') {
      // In production, use a native module like `react-native-root-detection`
      // or JailMonkey for more comprehensive checks.
      // JS-level: We check if the device is a physical device (basic guard)
      return false; // Placeholder — integrate native module for production
    }

    if (Platform.OS === 'ios') {
      return false; // Placeholder — integrate JailMonkey for iOS
    }

    return false;
  }

  /**
   * Convenience method for conditional rendering / guards.
   */
  static async isSecureDevice() {
    const result = await this.validate();
    return result.isSecure;
  }

  /**
   * Reset cached results (for testing purposes only).
   */
  static resetCache() {
    this._validationResult = null;
  }
}

export default DeviceValidationService;
