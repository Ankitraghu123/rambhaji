// src/features/tracking/repositories/TelemetryRepository.js
import apiClient from '../../../core/network/apiClient';

class TelemetryRepository {
  /**
   * Upload batch of audit logs to server.
   * @param {Array<object>} logs
   */
  static async uploadAuditLogs(logs) {
    const response = await apiClient.post('/telemetry/audit-logs', { logs });
    return response.data;
  }
}

export default TelemetryRepository;
