// src/core/security/SecurityEventLogger.js
// Logs security violations locally and transmits them to the backend.

import { secureStorage } from '../storage/mmkvInstances';
import apiClient from '../network/apiClient';

const SECURITY_LOG_KEY = 'security_violation_queue';

export class SecurityEventLogger {
  /**
   * Log a security event to local queue and attempt server transmission.
   * @param {{ eventType: string, details?: object }} event
   */
  static async log(event) {
    const entry = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Persist locally first
    const queue = this._getQueue();
    queue.push(entry);
    secureStorage.set(SECURITY_LOG_KEY, JSON.stringify(queue));

    // Attempt immediate server transmission
    try {
      await apiClient.post('/security/violation', entry);
    } catch {
      // Will be retried on next app session (queue persists)
    }
  }

  static _getQueue() {
    const raw = secureStorage.getString(SECURITY_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
