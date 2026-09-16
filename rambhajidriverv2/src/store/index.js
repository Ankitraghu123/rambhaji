// src/store/index.js
// Redux Toolkit store configuration for the GharTak Driver App

import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import syncMiddleware from './middleware/syncMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // MMKV instances stored in state are not serializable — ignore them
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(syncMiddleware),
  devTools: process.env.EXPO_PUBLIC_APP_ENV !== 'production',
});

export default store;
