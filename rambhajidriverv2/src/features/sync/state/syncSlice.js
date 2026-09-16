// src/features/sync/state/syncSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  syncError: null,
  serverError: null, // Holds { code: 503, message: 'Server unavailable' }
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setNetworkStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action) => {
      state.isSyncing = action.payload;
    },
    setPendingCount: (state, action) => {
      state.pendingCount = action.payload;
    },
    setSyncComplete: (state) => {
      state.isSyncing = false;
      state.lastSyncAt = Date.now();
      state.pendingCount = 0;
      state.syncError = null;
      state.serverError = null;
    },
    setSyncError: (state, action) => {
      state.isSyncing = false;
      state.syncError = action.payload;
    },
    setServerError: (state, action) => {
      state.serverError = action.payload;
    },
    clearServerError: (state) => {
      state.serverError = null;
    },
  },
});

export const {
  setNetworkStatus,
  setSyncing,
  setPendingCount,
  setSyncComplete,
  setSyncError,
  setServerError,
  clearServerError,
} = syncSlice.actions;

// Selectors
export const selectIsOnline = (state) => state.sync.isOnline;
export const selectIsSyncing = (state) => state.sync.isSyncing;
export const selectPendingCount = (state) => state.sync.pendingCount;
export const selectLastSyncAt = (state) => state.sync.lastSyncAt;
export const selectSyncError = (state) => state.sync.syncError;
export const selectServerError = (state) => state.sync.serverError;

export default syncSlice.reducer;
