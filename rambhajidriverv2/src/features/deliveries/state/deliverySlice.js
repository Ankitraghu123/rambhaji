// src/features/deliveries/state/deliverySlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  confirmationStatus: 'IDLE',  // IDLE | VALIDATING | CAPTURING | SUBMITTING | SUCCESS | ERROR
  geofenceValid: false,
  locationCaptured: null,      // { latitude, longitude, accuracy, timestamp }
  distanceMeters: null,
  photoCaptured: null,         // Local file URI
  error: null,
};

const deliverySlice = createSlice({
  name: 'deliveries',
  initialState,
  reducers: {
    beginConfirmationFlow: (state) => {
      state.confirmationStatus = 'VALIDATING';
      state.geofenceValid = false;
      state.locationCaptured = null;
      state.distanceMeters = null;
      state.photoCaptured = null;
      state.error = null;
    },
    setGeofenceResult: (state, action) => {
      state.geofenceValid = action.payload.valid;
      state.locationCaptured = action.payload.driverCoords;
      state.distanceMeters = action.payload.distanceMeters;
      if (action.payload.valid) {
        state.confirmationStatus = 'CAPTURING';
      }
    },
    setPhotoCaptured: (state, action) => {
      state.photoCaptured = action.payload;
      state.confirmationStatus = 'IDLE'; // Ready to submit
    },
    setSubmitting: (state) => {
      state.confirmationStatus = 'SUBMITTING';
    },
    setConfirmationSuccess: (state) => {
      state.confirmationStatus = 'SUCCESS';
    },
    setConfirmationError: (state, action) => {
      state.error = action.payload;
      state.confirmationStatus = 'ERROR';
    },
    resetConfirmationFlow: () => initialState,
  },
});

export const {
  beginConfirmationFlow,
  setGeofenceResult,
  setPhotoCaptured,
  setSubmitting,
  setConfirmationSuccess,
  setConfirmationError,
  resetConfirmationFlow,
} = deliverySlice.actions;

// Selectors
export const selectConfirmationStatus = (state) => state.deliveries.confirmationStatus;
export const selectGeofenceValid = (state) => state.deliveries.geofenceValid;
export const selectLocationCaptured = (state) => state.deliveries.locationCaptured;
export const selectDistanceMeters = (state) => state.deliveries.distanceMeters;
export const selectPhotoCaptured = (state) => state.deliveries.photoCaptured;
export const selectDeliveryError = (state) => state.deliveries.error;
export const selectIsReadyToSubmit = (state) =>
  state.deliveries.geofenceValid && Boolean(state.deliveries.photoCaptured);

export default deliverySlice.reducer;
