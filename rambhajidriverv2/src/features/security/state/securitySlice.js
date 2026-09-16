// src/features/security/state/securitySlice.js
// Redux Toolkit slice for Fraud Detection, Security Risks, Rate Limiting & Device Session Tracking

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  riskScore: 0,              // 0 to 100
  riskLevel: 'LOW',          // 'LOW' | 'MEDIUM' | 'HIGH'
  failedLoginAttempts: 0,
  lockoutUntil: null,        // Timestamp ISO string or null
  activeDeviceMeta: null,    // Device fingerprint object
  securityAlerts: [],        // Recent security alerts [{ id, type, title, message, timestamp, level }]
  isRateLimited: false,
  rateLimitMessage: null,
  activeSessionId: null,
};

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    setDeviceMeta: (state, action) => {
      state.activeDeviceMeta = action.payload;
    },
    setRiskScore: (state, action) => {
      const score = Math.max(0, Math.min(100, action.payload));
      state.riskScore = score;
      if (score >= 75) {
        state.riskLevel = 'HIGH';
      } else if (score >= 35) {
        state.riskLevel = 'MEDIUM';
      } else {
        state.riskLevel = 'LOW';
      }
    },
    incrementFailedLogin: (state) => {
      state.failedLoginAttempts += 1;
      if (state.failedLoginAttempts >= 5) {
        // 5 minutes security lockout
        state.lockoutUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        state.riskScore = Math.min(100, state.riskScore + 35);
        state.riskLevel = state.riskScore >= 75 ? 'HIGH' : 'MEDIUM';
      }
    },
    resetFailedLogin: (state) => {
      state.failedLoginAttempts = 0;
      state.lockoutUntil = null;
    },
    setRateLimited: (state, action) => {
      state.isRateLimited = action.payload.isLimited;
      state.rateLimitMessage = action.payload.message || null;
    },
    addSecurityAlert: (state, action) => {
      const alert = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.securityAlerts = [alert, ...state.securityAlerts.slice(0, 19)]; // Keep last 20
    },
    clearSecurityAlerts: (state) => {
      state.securityAlerts = [];
    },
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },
  },
});

export const {
  setDeviceMeta,
  setRiskScore,
  incrementFailedLogin,
  resetFailedLogin,
  setRateLimited,
  addSecurityAlert,
  clearSecurityAlerts,
  setActiveSessionId,
} = securitySlice.actions;

export const selectSecurityState = (state) => state.security || initialState;
export const selectRiskLevel = (state) => state.security?.riskLevel || 'LOW';
export const selectRiskScore = (state) => state.security?.riskScore || 0;
export const selectLockoutUntil = (state) => state.security?.lockoutUntil || null;
export const selectSecurityAlerts = (state) => state.security?.securityAlerts || [];
export const selectActiveDeviceMeta = (state) => state.security?.activeDeviceMeta || null;

export default securitySlice.reducer;
