// src/features/returns/state/returnSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  flowStatus: 'IDLE', // IDLE | SUBMITTING | SUCCESS | ERROR
  selectedReason: null,
  adjustedQuantity: 1,
  photoCaptured: null,
  error: null,
};

const returnSlice = createSlice({
  name: 'returns',
  initialState,
  reducers: {
    setReturnReason: (state, action) => {
      state.selectedReason = action.payload;
    },
    setReturnQuantity: (state, action) => {
      state.adjustedQuantity = action.payload;
    },
    setReturnPhoto: (state, action) => {
      state.photoCaptured = action.payload;
    },
    setReturnSubmitting: (state) => {
      state.flowStatus = 'SUBMITTING';
    },
    setReturnSuccess: (state) => {
      state.flowStatus = 'SUCCESS';
    },
    setReturnError: (state, action) => {
      state.error = action.payload;
      state.flowStatus = 'ERROR';
    },
    resetReturnFlow: () => initialState,
  },
});

export const {
  setReturnReason,
  setReturnQuantity,
  setReturnPhoto,
  setReturnSubmitting,
  setReturnSuccess,
  setReturnError,
  resetReturnFlow,
} = returnSlice.actions;

export const selectReturnFlowStatus = (state) => state.returns.flowStatus;
export const selectReturnReason = (state) => state.returns.selectedReason;
export const selectReturnQuantity = (state) => state.returns.adjustedQuantity;
export const selectReturnPhoto = (state) => state.returns.photoCaptured;
export const selectReturnError = (state) => state.returns.error;
export const selectIsReturnReadyToSubmit = (state) =>
  Boolean(state.returns.selectedReason) && Boolean(state.returns.photoCaptured);

export default returnSlice.reducer;
