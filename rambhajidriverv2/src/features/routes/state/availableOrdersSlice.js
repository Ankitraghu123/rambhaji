// src/features/routes/state/availableOrdersSlice.js
// Redux slice for driver-claimable available orders

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],          // Available orders fetched from API
  isLoading: false,
  error: null,
  lastFetchedAt: null,
};

const availableOrdersSlice = createSlice({
  name: 'availableOrders',
  initialState,
  reducers: {
    setAvailableOrders: (state, action) => {
      state.orders = action.payload || [];
      state.lastFetchedAt = Date.now();
      state.error = null;
    },
    setAvailableOrdersLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAvailableOrdersError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    // Remove a claimed order from the list
    removeAvailableOrder: (state, action) => {
      const orderId = action.payload;
      state.orders = state.orders.filter((o) => String(o.id) !== String(orderId));
    },
  },
});

export const {
  setAvailableOrders,
  setAvailableOrdersLoading,
  setAvailableOrdersError,
  removeAvailableOrder,
} = availableOrdersSlice.actions;

// Selectors
export const selectAvailableOrders = (state) => state.availableOrders?.orders || [];
export const selectAvailableOrdersLoading = (state) => state.availableOrders?.isLoading;
export const selectAvailableOrdersError = (state) => state.availableOrders?.error;

export default availableOrdersSlice.reducer;
