// src/features/routes/state/routeSlice.js
import { createSlice, current } from '@reduxjs/toolkit';
import { appStorage, getJSON, setJSON } from '../../../core/storage/mmkvInstances';
import { todayISO } from '../../../core/utils/dateUtils';

const ROUTE_STATE_CACHE_KEY = `driver_route_state_${todayISO()}`;

// Persists the full route state (orders + requests) to MMKV for cross-session recovery
function persistRouteState(state) {
  try {
    const snap = current(state);
    setJSON(appStorage, ROUTE_STATE_CACHE_KEY, {
      routeId: snap.routeId,
      orders: snap.orders,
      totalDistanceKm: snap.totalDistanceKm,
      activeOrderIndex: snap.activeOrderIndex,
      returnRequests: snap.returnRequests,
      replacementRequests: snap.replacementRequests,
      adminLogs: snap.adminLogs,
      historyCount: snap.historyCount,
      historyCountToday: snap.historyCountToday,
      historyOrders: snap.historyOrders,
    });
  } catch (e) {
    // Non-fatal — storage may be unavailable in some environments
    console.warn('[routeSlice] Could not persist route state to MMKV:', e?.message);
  }
}

const savedState = getJSON(appStorage, ROUTE_STATE_CACHE_KEY);

const initialState = savedState ? {
  routeId: savedState.routeId || null,
  routeStatus: savedState.routeId ? 'ACTIVE' : 'IDLE',
  orders: savedState.orders || [],
  orderIndex: (savedState.orders || []).reduce((acc, o) => { acc[String(o.id)] = o; return acc; }, {}),
  activeOrderIndex: savedState.activeOrderIndex || 0,
  totalDistanceKm: savedState.totalDistanceKm || 0,
  lastSyncedAt: null,
  isLoading: false,
  error: null,
  adminLogs: savedState.adminLogs || [],
  returnRequests: savedState.returnRequests || [],
  replacementRequests: savedState.replacementRequests || [],
  pendingIncomingOrder: null,
  historyCount: savedState.historyCount || 0,
  historyCountToday: savedState.historyCountToday || 0,
  historyOrders: savedState.historyOrders || [],
} : {
  routeId: null,
  routeStatus: 'IDLE',   // IDLE | LOADING | ACTIVE | COMPLETED
  orders: [],
  orderIndex: {},
  activeOrderIndex: 0,
  totalDistanceKm: 0,
  lastSyncedAt: null,
  isLoading: false,
  error: null,
  adminLogs: [],
  returnRequests: [],
  replacementRequests: [],
  pendingIncomingOrder: null, // New order waiting for driver accept/reject
  historyCount: 0,
  historyCountToday: 0,
  historyOrders: [],
};

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    setRoute: (state, action) => {
      const { routeId, orders, totalDistanceEstimateKm } = action.payload || {};
      state.routeId = routeId || null;
      state.totalDistanceKm = totalDistanceEstimateKm || 0;
      state.routeStatus = 'ACTIVE';
      state.lastSyncedAt = Date.now();
      state.error = null;

      // Merge fresh load orders with current state orders to preserve completed/returned/replaced statuses
      const existingOrdersMap = {};
      (state.orders || []).forEach(o => {
        existingOrdersMap[o.id] = o;
      });

      const mergedOrders = (orders || []).map(newOrder => {
        const existing = existingOrdersMap[newOrder.id];
        if (existing) {
          return {
            ...newOrder,
            status: existing.status,
            photoUri: existing.photoUri,
            returnDetails: existing.returnDetails,
            replacementDetails: existing.replacementDetails,
          };
        }
        return newOrder;
      });

      const newOrderIds = new Set((orders || []).map(o => o.id));
      const processedOrders = (state.orders || []).filter(o => 
        !newOrderIds.has(o.id) && 
        (o.status === 'COMPLETED' || o.status === 'RETURNED' || o.status === 'REPLACED' || o.status === 'REPLACEMENT_SCHEDULED')
      );

      // Retain dynamically created scheduled replacement orders (id >= 1000)
      const dynamicOrders = (state.orders || []).filter(o => o.id >= 1000 && !newOrderIds.has(o.id));
      
      state.orders = [...mergedOrders, ...processedOrders, ...dynamicOrders];
      state.orderIndex = state.orders.reduce((acc, o) => { acc[String(o.id)] = o; return acc; }, {});

      // Initialize mock logs if empty
      if (state.adminLogs.length === 0) {
        state.adminLogs = [
          {
            id: 1,
            driverName: 'System',
            customerName: 'System Gate',
            orderId: 101,
            actionType: 'ROUTE_STARTED',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'Route 101 successfully assigned to driver Rohan Sharma.',
            photoUri: null,
          },
          {
            id: 2,
            driverName: 'System',
            customerName: 'System Gate',
            orderId: 101,
            actionType: 'VEHICLE_DISPATCHED',
            timestamp: new Date(Date.now() - 3300000).toISOString(),
            details: 'Delivery vehicle loaded and dispatched from Bhopal Central Hub.',
            photoUri: null,
          }
        ];
      }

      persistRouteState(state);
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status, items, reason, photoUri, driverName } = action.payload || {};
      let order = (state.orders || []).find((o) => String(o.id) === String(orderId));
      if (!order) {
        order = (state.historyOrders || []).find((o) => String(o.id) === String(orderId));
      }
      if (order) {
        const prevStatus = order.status;
        order.status = status;
        const currentDriverName = driverName || 'Rohan Sharma';

        if (status === 'COMPLETED') {
          order.photoUri = photoUri || null;
          if (prevStatus !== 'COMPLETED') {
            state.historyCount = (state.historyCount || 0) + 1;
            state.historyCountToday = (state.historyCountToday || 0) + 1;
          }
          state.adminLogs.unshift({
            id: Date.now() + Math.random(),
            driverName: currentDriverName,
            customerName: order.customerName,
            orderId: order.id,
            actionType: 'DELIVERED',
            timestamp: new Date().toISOString(),
            details: `Order #${order.id} delivered successfully.`,
            photoUri: photoUri || null,
          });
        } else if (status === 'RETURNED') {
          order.returnDetails = {
            items: items || order.items || [],
            reason: reason || 'Customer Request',
            photoUri: photoUri || null,
            timestamp: new Date().toISOString(),
          };
          const existingIdx = state.returnRequests.findIndex(r => String(r.orderId) === String(order.id));
          const newReq = {
            id: existingIdx !== -1 ? state.returnRequests[existingIdx].id : Date.now() + Math.random(),
            orderId: order.id,
            customerName: order.customerName,
            address: order.address,
            items: items || order.items || [],
            reason: reason || 'Customer Request',
            photoUri: photoUri || null,
            timestamp: new Date().toISOString(),
          };
          if (existingIdx !== -1) {
            state.returnRequests[existingIdx] = newReq;
          } else {
            state.returnRequests.unshift(newReq);
          }
          state.adminLogs.unshift({
            id: Date.now() + Math.random(),
            driverName: currentDriverName,
            customerName: order.customerName,
            orderId: order.id,
            actionType: 'RETURN_CREATED',
            timestamp: new Date().toISOString(),
            details: `Return request created for ${order.customerName}. Reason: ${reason}`,
            photoUri: photoUri || null,
          });
        } else if (status === 'REPLACED') {
          order.replacementDetails = {
            items: items || order.items || [],
            reason: reason || 'Customer Request',
            photoUri: photoUri || null,
            timestamp: new Date().toISOString(),
          };
          const existingIdx = state.replacementRequests.findIndex(r => String(r.orderId) === String(order.id));
          const newReq = {
            id: existingIdx !== -1 ? state.replacementRequests[existingIdx].id : Date.now() + Math.random(),
            orderId: order.id,
            customerName: order.customerName,
            address: order.address,
            items: items || order.items || [],
            reason: reason || 'Customer Request',
            photoUri: photoUri || null,
            timestamp: new Date().toISOString(),
          };
          if (existingIdx !== -1) {
            state.replacementRequests[existingIdx] = newReq;
          } else {
            state.replacementRequests.unshift(newReq);
          }
          state.adminLogs.unshift({
            id: Date.now() + Math.random(),
            driverName: currentDriverName,
            customerName: order.customerName,
            orderId: order.id,
            actionType: 'REPLACEMENT_CREATED',
            timestamp: new Date().toISOString(),
            details: `Replacement request created for ${order.customerName}. Reason: ${reason}`,
            photoUri: photoUri || null,
          });

          // Create dynamic replacement order scheduled for tomorrow
          const nextDayOrder = {
            id: 1000 + Math.floor(Math.random() * 9000),
            customerName: order.customerName,
            customerPhone: order.customerPhone || order.phone,
            address: order.address,
            status: 'REPLACEMENT_SCHEDULED',
            items: (items || order.items || []).map(ri => ({
              id: ri.id,
              category: ri.category,
              productName: ri.productName || ri.name,
              quantity: ri.quantity,
              price: ri.price
            })),
            codAmount: 0,
            paymentMode: 'PREPAID',
            lat: order.lat,
            lng: order.lng,
            isReplacement: true,
            originalOrderId: order.id,
            scheduledDate: new Date(Date.now() + 86400000).toLocaleDateString('en-IN'), // Tomorrow
          };
          state.orders.push(nextDayOrder);
        }
      }
      state.orderIndex = state.orders.reduce((acc, o) => { acc[String(o.id)] = o; return acc; }, {});

      persistRouteState(state);
    },

    // ── Location Tagging ─────────────────────────────────────────────────────
    setLocationTagged: (state, action) => {
      const { orderId, latitude, longitude } = action.payload || {};
      const order = (state.orders || []).find((o) => String(o.id) === String(orderId));
      if (order) {
        order.locationTagged = true;
        order.locationTaggedAt = new Date().toISOString();
        order.latitude = latitude;
        order.longitude = longitude;
        state.orderIndex = state.orders.reduce((acc, o) => { acc[String(o.id)] = o; return acc; }, {});
        persistRouteState(state);
      }
    },
    setRouteLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setRouteError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    advanceToNextOrder: (state) => {
      const pending = (state.orders || []).findIndex(
        (o, i) => i > state.activeOrderIndex && o.status === 'ASSIGNED'
      );
      if (pending !== -1) state.activeOrderIndex = pending;
      persistRouteState(state);
    },
    resetRoute: () => {
      // Clear persisted cache when route is fully reset
      try { appStorage.delete(ROUTE_STATE_CACHE_KEY); } catch (_) {}
      return initialState;
    },

    hydrateRoute: (state) => {
      const saved = getJSON(appStorage, ROUTE_STATE_CACHE_KEY);
      if (saved) {
        state.routeId = saved.routeId || null;
        state.orders = saved.orders || [];
        state.orderIndex = (saved.orders || []).reduce((acc, o) => { acc[String(o.id)] = o; return acc; }, {});
        state.activeOrderIndex = saved.activeOrderIndex || 0;
        state.totalDistanceKm = saved.totalDistanceKm || 0;
        state.adminLogs = saved.adminLogs || [];
        state.returnRequests = saved.returnRequests || [];
        state.replacementRequests = saved.replacementRequests || [];
        state.routeStatus = saved.routeId ? 'ACTIVE' : 'IDLE';
        state.historyCount = saved.historyCount || 0;
        state.historyCountToday = saved.historyCountToday || 0;
        state.historyOrders = saved.historyOrders || [];
      }
    },
    // ── Incoming Order Actions ──────────────────────────────────────────────
    setIncomingOrder: (state, action) => {
      state.pendingIncomingOrder = action.payload; // null clears it
    },
    acceptIncomingOrder: (state) => {
      const order = state.pendingIncomingOrder;
      if (order) {
        // Add to orders list with ASSIGNED status
        state.orders.push({ ...order, status: 'ASSIGNED' });
        state.orderIndex = state.orders.reduce((acc, o) => { acc[String(o.id)] = o; return acc; }, {});
        state.adminLogs.unshift({
          id: Date.now() + Math.random(),
          driverName: 'Driver',
          customerName: order.customerName,
          orderId: order.id,
          actionType: 'ORDER_ACCEPTED',
          timestamp: new Date().toISOString(),
          details: `New order #${order.id} accepted by driver.`,
          photoUri: null,
        });
        persistRouteState(state);
      }
      state.pendingIncomingOrder = null;
    },
    rejectIncomingOrder: (state) => {
      state.pendingIncomingOrder = null;
    },
    setHistoryCount: (state, action) => {
      state.historyCount = action.payload;
      persistRouteState(state);
    },
    setHistoryCountToday: (state, action) => {
      state.historyCountToday = action.payload;
      persistRouteState(state);
    },
    setHistoryOrders: (state, action) => {
      state.historyOrders = action.payload;
      persistRouteState(state);
    },
  },
});

export const {
  setRoute,
  updateOrderStatus,
  setLocationTagged,
  setRouteLoading,
  setRouteError,
  advanceToNextOrder,
  resetRoute,
  setIncomingOrder,
  acceptIncomingOrder,
  rejectIncomingOrder,
  hydrateRoute,
  setHistoryCount,
  setHistoryCountToday,
  setHistoryOrders,
} = routeSlice.actions;

// Selectors
export const selectAllOrders = (state) => {
  const activeOrders = state.route?.orders || [];
  const historyOrders = state.route?.historyOrders || [];
  const combinedRaw = [...activeOrders, ...historyOrders];

  const uniqueCombined = [];
  const seenIds = new Set();
  combinedRaw.forEach(o => {
    const key = String(o.id);
    if (!seenIds.has(key)) {
      seenIds.add(key);
      uniqueCombined.push(o);
    }
  });

  return uniqueCombined;
};
export const selectRouteId = (state) => state.route?.routeId;
export const selectRouteStatus = (state) => state.route?.routeStatus;
export const selectRouteLoading = (state) => state.route?.isLoading;
export const selectRouteError = (state) => state.route?.error;
export const selectLastSynced = (state) => state.route?.lastSyncedAt;
export const selectTotalDistanceKm = (state) => state.route?.totalDistanceKm || 0;
export const selectActiveOrderIndex = (state) => state.route?.activeOrderIndex || 0;
export const selectHistoryCount = (state) => state.route?.historyCount || 0;
export const selectHistoryCountToday = (state) => state.route?.historyCountToday || 0;
export const selectHistoryOrders = (state) => state.route?.historyOrders || [];

export const selectPendingOrders = (state) =>
  selectAllOrders(state).filter((o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT');

export const selectCompletedOrders = (state) =>
  selectAllOrders(state).filter((o) => o.status === 'COMPLETED');

export const selectReturnedOrders = (state) =>
  selectAllOrders(state).filter((o) => o.status === 'RETURNED');

export const selectActiveOrder = (state) =>
  (state.route?.orders || [])[state.route?.activeOrderIndex || 0] ?? null;

export const selectOrderById = (id) => (state) =>
  state.route?.orderIndex?.[String(id)] ?? null;

export const selectDashboardStats = (state) => {
  // selectAllOrders = strictly deduplicated active + history
  // Server now correctly maps RETURNED/REPLACED from DeliveryItems — trust server data only
  const allOrders = selectAllOrders(state);
  const activeOrders = state.route?.orders || [];

  const pending = activeOrders.filter((o) => o.status === 'ASSIGNED' || o.status === 'IN_TRANSIT').length;
  const completed = allOrders.filter((o) => o.status === 'COMPLETED').length;
  const completedToday = state.route?.historyCountToday || activeOrders.filter((o) => o.status === 'COMPLETED').length;

  const returnedOrders = allOrders.filter((o) => o.status === 'RETURNED');
  const replacedOrders = allOrders.filter((o) => o.status === 'REPLACED');

  const returnedCount = returnedOrders.length;
  const replacementCount = replacedOrders.length;

  const returnedItemsCount = returnedOrders.reduce(
    (sum, o) => sum + (o.returnDetails?.items || o.items || []).length,
    0
  );

  return {
    total: activeOrders.filter((o) => o.status !== 'REPLACEMENT_SCHEDULED').length,
    pending,
    completed,
    completedToday,
    returned: returnedCount,
    replacement: replacementCount,
    returnedItemsCount,
    replacedItemsCount: replacementCount,
    totalDistanceKm: state.route?.totalDistanceKm || 0,
  };
};



export const selectAdminLogs = (state) => state.route?.adminLogs || [];
export const selectReturnRequests = (state) => state.route?.returnRequests || [];
export const selectReplacementRequests = (state) => state.route?.replacementRequests || [];
export const selectIncomingOrder = (state) => state.route?.pendingIncomingOrder ?? null;

export default routeSlice.reducer;
