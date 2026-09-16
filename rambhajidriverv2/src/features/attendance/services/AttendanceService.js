// src/features/attendance/services/AttendanceService.js
// Live Attendance API integration for Ram Bhaji Delivery Partner App
// API Endpoint: POST https://rambhaji.backend.shreenari.com/api/attendance/mark

import apiClient from '../../../core/network/apiClient';
import { appStorage, getJSON, setJSON } from '../../../core/storage/mmkvInstances';

const ATTENDANCE_CACHE_KEY = 'driver_attendance_today';

export class AttendanceService {
  /**
   * Get today's local date formatted as YYYY-MM-DD (Device Local Timezone)
   */
  static getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Check if attendance has already been marked for today
   */
  static isAttendanceMarkedToday() {
    try {
      const cached = getJSON(appStorage, ATTENDANCE_CACHE_KEY);
      if (!cached) return false;
      const today = this.getTodayDateString();
      
      if (cached.isMarked === true && cached.markedDate && (cached.markedDate === today || cached.markedDate.startsWith(today))) {
        return true;
      }
      return false;
    } catch (e) {
      console.error('[AttendanceService] Error checking cache:', e);
      return false;
    }
  }

  /**
   * Get cached attendance details for today
   */
  static getTodayAttendanceDetails() {
    try {
      const cached = getJSON(appStorage, ATTENDANCE_CACHE_KEY);
      if (!cached) return null;
      const today = this.getTodayDateString();
      if (cached.markedDate === today || cached.markedDate?.startsWith(today)) {
        return cached;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Live API Call to POST /attendance/mark
   */
  static async markAttendance() {
    const today = this.getTodayDateString();

    try {
      console.log('[AttendanceService] Hitting live API POST /attendance/mark...');
      const response = await apiClient.post('/attendance/mark', {});

      if (response.data && (response.data.success || response.status === 201 || response.status === 200)) {
        const attendanceData = response.data.data || {};
        
        const cachePayload = {
          isMarked: true,
          markedDate: today,
          id: attendanceData.id || Date.now(),
          loginTime: attendanceData.login_time || new Date().toISOString(),
          message: response.data.message || 'Attendance marked successfully!',
        };

        // Cache in MMKV storage
        setJSON(appStorage, ATTENDANCE_CACHE_KEY, cachePayload);
        console.log('[AttendanceService] Attendance marked & cached successfully:', cachePayload);

        return {
          success: true,
          message: response.data.message || 'Attendance marked successfully!',
          data: cachePayload,
        };
      }

      throw new Error(response.data?.message || 'Failed to mark attendance.');
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message || error.message || '';
      console.log(`[AttendanceService] API Response Status: ${status}, Message: "${serverMessage}"`);

      // If HTTP 401 OR message indicates invalid/expired token
      const isTokenExpired = 
        status === 401 ||
        serverMessage.toLowerCase().includes('token') ||
        serverMessage.toLowerCase().includes('expired') ||
        serverMessage.toLowerCase().includes('unauthorized');

      if (isTokenExpired) {
        console.log('[AttendanceService] 401 Token Expired on mark. Caching today and triggering force logout...');
        const cachePayload = {
          isMarked: true,
          markedDate: today,
          loginTime: new Date().toISOString(),
          message: 'Attendance marked for today!',
        };
        setJSON(appStorage, ATTENDANCE_CACHE_KEY, cachePayload);

        try {
          const { performForceLogout } = require('../../../core/network/refreshInterceptor');
          performForceLogout('Session expired during attendance verification. Please login again.');
        } catch (e) {}

        return {
          success: true,
          message: 'Session expired. Redirecting to login...',
          data: cachePayload,
        };
      }

      // If HTTP 400/409/422 OR message indicates attendance is already marked for today on backend
      const isAlreadyMarked = 
        status === 400 || 
        status === 409 || 
        status === 422 ||
        serverMessage.toLowerCase().includes('already') ||
        serverMessage.toLowerCase().includes('marked') ||
        serverMessage.toLowerCase().includes('exists');

      if (isAlreadyMarked) {
        const cachePayload = {
          isMarked: true,
          markedDate: today,
          loginTime: new Date().toISOString(),
          message: serverMessage || 'Attendance already marked for today!',
        };
        // Cache so app unlocks and bypasses modal for rest of today!
        setJSON(appStorage, ATTENDANCE_CACHE_KEY, cachePayload);
        console.log('[AttendanceService] Attendance already marked on server. Cached today:', cachePayload);

        return {
          success: true,
          message: serverMessage || 'Attendance already marked for today!',
          data: cachePayload,
        };
      }

      return {
        success: false,
        message: serverMessage || 'Server error while marking attendance',
      };
    }
  }
}

export default AttendanceService;
