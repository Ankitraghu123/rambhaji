// src/features/auth/state/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  driver: null,        // { id, name, phone, role }
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setDriver: (state, action) => {
      state.driver = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearSession: (state, action) => {
      return {
        ...initialState,
        error: action?.payload || null,
      };
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setDriver, clearSession, setAuthLoading, setAuthError } = authSlice.actions;

// Selectors
export const selectDriver = (state) => state.auth.driver;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectDriverRole = (state) => state.auth.driver?.role;

export default authSlice.reducer;
