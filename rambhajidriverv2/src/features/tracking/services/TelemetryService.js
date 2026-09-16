// src/features/tracking/services/TelemetryService.js
// Handles local audit logging of driver events and periodic batch upload to server

import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { secureStorage } from '../../../core/storage/mmkvInstances';
import { STORAGE_KEYS, AUDIT_BATCH_SIZE } from '../../../config/constants';
import { generateId } from '../../../core/utils/idUtils';
import { store } from '../../../store';
import TelemetryRepository from '../repositories/TelemetryRepository';

class TelemetryService {
  static _flushTimer = null;

  /**
   * Log an audit event.
   * @param {string} eventType - e.g. 'LOGIN', 'LOGOUT', 'DELIVERY_START', 'DELIVERY_COMPLETE'
   * @param {object} [details] - Optional GPS coords or other meta
   */
  static async logEvent(eventType, details = {}) {
    try {
      const state = store.getState();
      const driver = state.auth?.driver;
      
      const deviceMeta = `${Device.manufacturer || ''} ${Device.modelName || 'Device'} (${Platform.OS} ${Device.osVersion || ''})`.trim();

      const logEntry = {
        eventId: generateId(),
        timestamp: new Date().toISOString(),
        eventType,
        driverId: driver?.id ? Number(driver.id) || driver.id : null,
        latitude: details.latitude !== undefined ? Number(details.latitude) : null,
        longitude: details.longitude !== undefined ? Number(details.longitude) : null,
        deviceMeta,
      };

      const queue = this._getQueue();
      queue.push(logEntry);
      this._saveQueue(queue);

      console.log(`[TelemetryService] Logged event: ${eventType}`);

      if (queue.length >= AUDIT_BATCH_SIZE) {
        await this.flush();
      }
    } catch (e) {
      console.warn('[TelemetryService] Error logging event:', e);
    }
  }

  /**
   * Flush all local logs to the server.
   */
  static async flush() {
    const queue = this._getQueue();
    if (queue.length === 0) return;

    try {
      console.log(`[TelemetryService] Flushing ${queue.length} logs to server...`);
      await TelemetryRepository.uploadAuditLogs(queue);
      this._saveQueue([]);
      console.log('[TelemetryService] Flush complete.');
    } catch (e) {
      console.warn('[TelemetryService] Failed to flush telemetry logs:', e);
    }
  }

  /**
   * Start periodic log flushing (every 5 minutes).
   */
  static startScheduler() {
    if (this._flushTimer) return;
    this._flushTimer = setInterval(() => {
      this.flush();
    }, 300000); // 5 minutes
  }

  /**
   * Stop periodic log flushing.
   */
  static stopScheduler() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
  }

  static _getQueue() {
    const raw = secureStorage.getString(STORAGE_KEYS.AUDIT_QUEUE);
    return raw ? JSON.parse(raw) : [];
  }

  static _saveQueue(queue) {
    secureStorage.set(STORAGE_KEYS.AUDIT_QUEUE, JSON.stringify(queue));
  }
}

export default TelemetryService;
