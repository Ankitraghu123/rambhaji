// src/core/network/NetworkMonitor.js
// Monitors network connectivity state and dispatches to Redux store.
// Triggers offline sync engine automatically on reconnect.

import { store } from '../../store';
import { setNetworkStatus } from '../../features/sync/state/syncSlice';

// Dynamic require prevents Expo Go crash — NetInfo uses TurboModuleRegistry at import time
let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  console.warn('[NetworkMonitor] NetInfo not available in this environment:', e.message);
}

class NetworkMonitor {
  static _unsubscribe = null;

  /**
   * Helper to parse NetInfo state accurately.
   * During app cold start, NetInfo returns `isInternetReachable: null` while ping test is pending.
   * Treating `null` as offline causes a false Offline screen on launch.
   * We only mark offline if `isConnected === false` or `isInternetReachable === false`.
   */
  static _parseIsOnline(state) {
    if (!state) return true;
    if (state.isConnected === false) return false;
    if (state.isInternetReachable === false) return false;
    return true;
  }

  /**
   * Attach the NetInfo listener. Call once from app root (_layout.js).
   */
  static initialize() {
    if (!NetInfo) {
      console.warn('[NetworkMonitor] Skipping — NetInfo unavailable (Expo Go).');
      return;
    }
    if (this._unsubscribe) return; // Already initialized

    this._unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = this._parseIsOnline(state);
      store.dispatch(setNetworkStatus(isOnline));
    });

    // Immediately fetch current state
    NetInfo.fetch().then((state) => {
      const isOnline = this._parseIsOnline(state);
      store.dispatch(setNetworkStatus(isOnline));
    });
  }

  /**
   * Remove the NetInfo listener. Call on app unmount.
   */
  static destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }

  /**
   * Returns a one-time check of current connectivity.
   * @returns {Promise<boolean>}
   */
  static async isOnline() {
    if (!NetInfo) return true; // Assume online in Expo Go
    const state = await NetInfo.fetch();
    return this._parseIsOnline(state);
  }
}

export default NetworkMonitor;
