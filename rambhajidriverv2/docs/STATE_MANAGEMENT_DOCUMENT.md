# STATE MANAGEMENT DOCUMENT
## GharTak — Driver Delivery Mobile Application
### Fresh Box Subscription Delivery Platform

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Engineering  
**Prepared By:** Senior Engineering Team  

---

## Table of Contents
1. [State Management Philosophy](#1-state-management-philosophy)
2. [Redux Store Architecture](#2-redux-store-architecture)
3. [Slice Definitions](#3-slice-definitions)
4. [Async Thunks & Data Fetching](#4-async-thunks--data-fetching)
5. [Selectors & Derived State](#5-selectors--derived-state)
6. [Redux Middleware Configuration](#6-redux-middleware-configuration)
7. [State Persistence Strategy](#7-state-persistence-strategy)
8. [State Reset & Session Cleanup](#8-state-reset--session-cleanup)

---

## 1. State Management Philosophy

The GharTak Driver App uses **Redux Toolkit (RTK)** as the single source of truth for all global application state. The architecture follows strict boundaries:

| State Type | Where Stored | Example |
|------------|-------------|---------|
| **Server Cache** | Redux Store | Today's orders, route data |
| **UI/Local State** | React `useState` | Modal open/close, form inputs |
| **Persistent Auth** | MMKV Secure Store | JWT tokens, driver profile |
| **Offline Queue** | MMKV Secure Store | Pending sync transactions |

**Rule:** Redux manages **runtime state** (in-memory). MMKV manages **persistence** (survives app restarts).

---

## 2. Redux Store Architecture

```
src/store/
├── index.js             ← Store configuration entry point
├── rootReducer.js       ← Combines all feature slices
└── middleware/
    └── syncMiddleware.js ← Triggers sync engine on delivery actions

src/features/
├── auth/state/
│   └── authSlice.js
├── routes/state/
│   └── routeSlice.js
├── deliveries/state/
│   └── deliverySlice.js
├── returns/state/
│   └── returnSlice.js
├── sync/state/
│   └── syncSlice.js
└── notifications/state/
    └── notificationSlice.js
```

### 2.1 Root Store Configuration

```javascript
// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import syncMiddleware from './middleware/syncMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow MMKV instances in state
    }).concat(syncMiddleware),
});
```

```javascript
// src/store/rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/state/authSlice';
import routeReducer from '../features/routes/state/routeSlice';
import deliveryReducer from '../features/deliveries/state/deliverySlice';
import returnReducer from '../features/returns/state/returnSlice';
import syncReducer from '../features/sync/state/syncSlice';
import notificationReducer from '../features/notifications/state/notificationSlice';

const rootReducer = combineReducers({
  auth:          authReducer,
  route:         routeReducer,
  deliveries:    deliveryReducer,
  returns:       returnReducer,
  sync:          syncReducer,
  notifications: notificationReducer,
});

export default rootReducer;
```

---

## 3. Slice Definitions

### 3.1 Auth Slice

```javascript
// src/features/auth/state/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  driver: null,          // { id, name, phone, role }
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
    },
    clearSession: (state) => {
      state.driver = null;
      state.isAuthenticated = false;
    },
    setAuthLoading: (state, action) => { state.isLoading = action.payload; },
    setAuthError: (state, action) => { state.error = action.payload; },
  },
});

export const { setDriver, clearSession, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
```

### 3.2 Route Slice

```javascript
// src/features/routes/state/routeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  routeId: null,
  routeStatus: 'IDLE',   // IDLE | LOADING | ACTIVE | COMPLETED
  orders: [],
  activeOrderIndex: 0,
  totalDistanceKm: 0,
  lastSyncedAt: null,
  isLoading: false,
  error: null,
};

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    setRoute: (state, action) => {
      state.routeId = action.payload.routeId;
      state.orders = action.payload.orders;
      state.totalDistanceKm = action.payload.totalDistanceEstimateKm;
      state.routeStatus = 'ACTIVE';
      state.lastSyncedAt = Date.now();
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find((o) => o.id === orderId);
      if (order) order.status = status;
    },
    setRouteLoading: (state, action) => { state.isLoading = action.payload; },
    setRouteError: (state, action) => { state.error = action.payload; },
    advanceToNextOrder: (state) => { state.activeOrderIndex += 1; },
  },
});

export const {
  setRoute,
  updateOrderStatus,
  setRouteLoading,
  setRouteError,
  advanceToNextOrder,
} = routeSlice.actions;
export default routeSlice.reducer;
```

### 3.3 Delivery Slice

```javascript
// src/features/deliveries/state/deliverySlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeDelivery: null,      // Order being actively confirmed
  confirmationStatus: 'IDLE', // IDLE | VALIDATING | SUBMITTING | SUCCESS | ERROR
  geofenceValid: false,
  locationCaptured: null,    // { latitude, longitude, timestamp }
  photoCaptured: null,       // Local URI
  error: null,
};

const deliverySlice = createSlice({
  name: 'deliveries',
  initialState,
  reducers: {
    startDeliveryConfirmation: (state, action) => {
      state.activeDelivery = action.payload;
      state.confirmationStatus = 'IDLE';
      state.geofenceValid = false;
      state.locationCaptured = null;
      state.photoCaptured = null;
    },
    setGeofenceValid: (state, action) => { state.geofenceValid = action.payload; },
    setLocationCaptured: (state, action) => { state.locationCaptured = action.payload; },
    setPhotoCaptured: (state, action) => { state.photoCaptured = action.payload; },
    setConfirmationStatus: (state, action) => { state.confirmationStatus = action.payload; },
    setDeliveryError: (state, action) => { state.error = action.payload; },
    resetDeliveryFlow: () => initialState,
  },
});

export const {
  startDeliveryConfirmation,
  setGeofenceValid,
  setLocationCaptured,
  setPhotoCaptured,
  setConfirmationStatus,
  setDeliveryError,
  resetDeliveryFlow,
} = deliverySlice.actions;
export default deliverySlice.reducer;
```

### 3.4 Sync Slice

```javascript
// src/features/sync/state/syncSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  syncError: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setNetworkStatus: (state, action) => { state.isOnline = action.payload; },
    setSyncing: (state, action) => { state.isSyncing = action.payload; },
    setPendingCount: (state, action) => { state.pendingCount = action.payload; },
    setSyncComplete: (state) => {
      state.isSyncing = false;
      state.lastSyncAt = Date.now();
      state.pendingCount = 0;
      state.syncError = null;
    },
    setSyncError: (state, action) => { state.syncError = action.payload; },
  },
});

export const {
  setNetworkStatus,
  setSyncing,
  setPendingCount,
  setSyncComplete,
  setSyncError,
} = syncSlice.actions;
export default syncSlice.reducer;
```

---

## 4. Async Thunks & Data Fetching

```javascript
// src/features/routes/state/routeThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import RouteRepository from '../repositories/RouteRepository';
import { setRoute, setRouteLoading, setRouteError } from './routeSlice';

export const fetchTodaysRoute = createAsyncThunk(
  'route/fetchToday',
  async (driverId, { dispatch, rejectWithValue }) => {
    dispatch(setRouteLoading(true));
    try {
      const route = await RouteRepository.getRoute(driverId);
      dispatch(setRoute(route));
      return route;
    } catch (error) {
      dispatch(setRouteError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setRouteLoading(false));
    }
  }
);
```

---

## 5. Selectors & Derived State

```javascript
// src/features/routes/state/routeSelectors.js

// Get all orders from active route
export const selectAllOrders = (state) => state.route.orders;

// Get only pending orders
export const selectPendingOrders = (state) =>
  state.route.orders.filter((o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT');

// Get completed count
export const selectCompletedCount = (state) =>
  state.route.orders.filter((o) => o.status === 'COMPLETED').length;

// Get returned count
export const selectReturnedCount = (state) =>
  state.route.orders.filter((o) => o.status === 'RETURNED').length;

// Get active order (next stop)
export const selectActiveOrder = (state) =>
  state.route.orders[state.route.activeOrderIndex] || null;

// Is geofence valid for current delivery?
export const selectIsGeofenceValid = (state) => state.deliveries.geofenceValid;
```

---

## 6. Redux Middleware Configuration

```javascript
// src/store/middleware/syncMiddleware.js
import QueueManager from '../../features/sync/services/QueueManager';
import SyncEngine from '../../features/sync/services/SyncEngine';

const syncMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  const { sync } = store.getState();

  // Trigger sync when network comes back online
  if (action.type === 'sync/setNetworkStatus' && action.payload === true) {
    SyncEngine.triggerSync();
  }

  return result;
};

export default syncMiddleware;
```

---

## 7. State Persistence Strategy

Redux state is **not persisted** to disk — it is rebuilt on each app launch from MMKV cache:

```
App Launch
    │
    ▼
Read auth tokens from MMKV secureStorage
    │
    ▼
Validate tokens (check expiry)
    │
    ├── VALID → Restore auth state → Fetch today's route
    └── EXPIRED → Trigger token refresh → Fetch today's route
```

---

## 8. State Reset & Session Cleanup

On logout (manual or forced), the entire Redux state is reset to initial values and MMKV secure storage is cleared:

```javascript
// src/features/auth/services/AuthService.js
import { store } from '../../../store';
import { clearSession } from '../state/authSlice';
import { secureStorage } from '../../../core/storage/mmkvInstances';
import { router } from 'expo-router';

export const performLogout = async () => {
  // 1. Clear Redux state
  store.dispatch(clearSession());

  // 2. Wipe all secure keys from MMKV
  secureStorage.clearAll();

  // 3. Redirect to login screen
  router.replace('/(auth)/login');
};
```

---

*Document End — STATE_MANAGEMENT_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
