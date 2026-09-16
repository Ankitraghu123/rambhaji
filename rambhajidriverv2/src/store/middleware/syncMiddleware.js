// src/store/middleware/syncMiddleware.js
// Redux middleware: triggers SyncEngine & automatic data refresh when network comes back online

import SyncEngine from '../../features/sync/services/SyncEngine';
import RouteService from '../../features/routes/services/RouteService';
import AvailableOrdersService from '../../features/routes/services/AvailableOrdersService';

const syncMiddleware = (_store) => (next) => (action) => {
  const result = next(action);

  // When network transitions to ONLINE, kick off SyncEngine and auto-sync latest data
  if (action.type === 'sync/setNetworkStatus' && action.payload === true) {
    console.log('[SyncMiddleware] Network reconnected — triggering offline queue sync and latest data refresh');
    SyncEngine.triggerSync();
    RouteService.loadTodaysRoute(true);
    AvailableOrdersService.loadAvailableOrders(true);
    RouteService.fetchHistoryCount();
  }

  return result;
};

export default syncMiddleware;
