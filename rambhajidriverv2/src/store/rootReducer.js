// src/store/rootReducer.js
// Combines all feature slices into the unified Redux root reducer

import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/state/authSlice';
import routeReducer from '../features/routes/state/routeSlice';
import deliveryReducer from '../features/deliveries/state/deliverySlice';
import returnReducer from '../features/returns/state/returnSlice';
import syncReducer from '../features/sync/state/syncSlice';
import notificationReducer from '../features/notifications/state/notificationSlice';
import availableOrdersReducer from '../features/routes/state/availableOrdersSlice';
import securityReducer from '../features/security/state/securitySlice';

const rootReducer = combineReducers({
  auth:          authReducer,
  route:         routeReducer,
  deliveries:    deliveryReducer,
  returns:       returnReducer,
  sync:          syncReducer,
  notifications:    notificationReducer,
  availableOrders:  availableOrdersReducer,
  security:         securityReducer,
});

export default rootReducer;
