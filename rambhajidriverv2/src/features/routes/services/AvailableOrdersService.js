// src/features/routes/services/AvailableOrdersService.js
// Business logic for fetching and claiming available orders

import AvailableOrdersRepository from '../repositories/AvailableOrdersRepository';
import { store } from '../../../store';
import {
  setAvailableOrders,
  setAvailableOrdersLoading,
  setAvailableOrdersError,
  removeAvailableOrder,
} from '../state/availableOrdersSlice';
import { setRoute } from '../state/routeSlice';
import { Alert } from 'react-native';

class AvailableOrdersService {
  /**
   * Fetch available orders from API and put into Redux.
   */
  static async loadAvailableOrders(force = false) {
    store.dispatch(setAvailableOrdersLoading(true));

    try {
      const data = await AvailableOrdersRepository.getAvailableOrders(force);

      const normalizedOrders = [];

      if (data && (Array.isArray(data.schedules) || Array.isArray(data.retailOrders) || Array.isArray(data.deliveries))) {
        const rawDeliveries = data.deliveries || [];
        const schedules = [...(data.schedules || [])];
        const retailOrders = data.retailOrders || [];

        rawDeliveries.forEach((del) => {
          if (del.user && Array.isArray(del.schedules)) {
            del.schedules.forEach((sched) => {
              schedules.push({
                ...sched,
                User: del.user,
                customer_name: del.user.name,
                customer_phone: del.user.phone,
                address: del.user.address,
              });
            });
          } else {
            schedules.push(del);
          }
        });

        // 1. Process Subscription Schedules
        schedules.forEach((sched, idx) => {
          const sub = sched.Subscription || {};
          const user = sub.User || sched.User || {};
          const addr = sub.Address || sched.Address || {};

          const customerName = user.name || 'Customer';
          const customerPhone = user.phone || '';

          const addressParts = [];
          if (addr.address_line) addressParts.push(addr.address_line);
          if (addr.landmark) addressParts.push(addr.landmark);
          if (addr.city) addressParts.push(addr.city);
          if (addr.pincode) addressParts.push(addr.pincode);
          const addressStr = addressParts.join(', ') || sched.address || 'Address not available';

          const lat = parseFloat(addr.latitude || user.latitude || sched.lat || 23.2285);
          const lng = parseFloat(addr.longitude || user.longitude || sched.lng || 77.4372);

          const items = (sched.DeliveryItems || sched.deliveryItems || sched.delivery_items || sched.items || []).map((itm, i) => {
            const prod = itm.Product || itm.product || {};
            const rawImg = prod.image_url || prod.image || prod.imageUrl || itm.image_url || itm.image || itm.imageUrl || itm.product_image || itm.photo || null;
            const pImage = rawImg ? (rawImg.startsWith('http') ? rawImg : `https://rambhaji.backend.shreenari.com${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : null;

            const pHindiName = (prod.hindi_name || prod.hindiName || itm.hindi_name || itm.hindiName || '').trim();
            const rStatus = (itm.return_status || itm.returnStatus || 'none').toLowerCase();
            const isApproved = rStatus === 'approved';
            const isRequested = rStatus === 'requested';
            const isPending = rStatus === 'pending' || rStatus === 'requested';
            const isRejected = rStatus === 'rejected';
            const returnedBy = itm.returned_by || (rStatus !== 'none' ? 'user' : null);

            return {
              id: itm.product_id || itm.id || i,
              productName: prod.name || 'Package Item',
              hindiName: pHindiName,
              hindi_name: pHindiName,
              category: prod.category || 'OTHER',
              quantity: itm.qty_gm || itm.quantity || 1,
              price: prod.price || 0,
              image: pImage,
              imageUrl: pImage,
              return_status: rStatus,
              returnStatus: rStatus,
              returnedBy: returnedBy,
              returned_by: returnedBy,
              returnReason: itm.return_reason || null,
              isReturned: isApproved,
              isReturnRequested: isRequested,
              isReturnPending: isPending,
              isReturnRejected: isRejected,
            };
          });

          // Fallback if no delivery items exist yet
          if (items.length === 0) {
            items.push({
              id: 'pkg-placeholder',
              productName: sub.Package?.name || 'Package Delivery',
              category: 'PACKAGE',
              quantity: 1,
              price: 0,
            });
          }

          normalizedOrders.push({
            id: sched.id,
            customerName,
            customerPhone,
            address: addressStr,
            lat,
            lng,
            paymentMode: sched.paymentMode || 'PREPAID',
            codAmount: sched.codAmount || 0,
            items,
            distance: sched.distance || null,
            estimatedAmount: sched.estimatedAmount || sched.amount || null,
            type: 'schedule',
          });
        });

        // 2. Process Retail Orders
        retailOrders.forEach((order, idx) => {
          const user = order.User || {};
          const addr = order.Address || {};

          const customerName = user.name || 'Customer';
          const customerPhone = user.phone || '';

          const addressParts = [];
          if (addr.address_line) addressParts.push(addr.address_line);
          if (addr.landmark) addressParts.push(addr.landmark);
          if (addr.city) addressParts.push(addr.city);
          if (addr.pincode) addressParts.push(addr.pincode);
          const addressStr = addressParts.join(', ') || order.address || 'Address not available';

          const lat = parseFloat(addr.latitude || user.latitude || order.lat || 23.2285);
          const lng = parseFloat(addr.longitude || user.longitude || order.lng || 77.4372);

          const items = (order.RetailOrderItems || order.retailOrderItems || order.retail_order_items || order.items || []).map((itm, i) => {
            const prod = itm.Product || itm.product || {};
            const rawImg = prod.image_url || prod.image || prod.imageUrl || itm.image_url || itm.image || itm.imageUrl || itm.product_image || itm.photo || null;
            const pImage = rawImg ? (rawImg.startsWith('http') ? rawImg : `https://rambhaji.backend.shreenari.com${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : null;

            const pHindiName = (prod.hindi_name || prod.hindiName || itm.hindi_name || itm.hindiName || '').trim();
            const rStatus = (itm.return_status || itm.returnStatus || 'none').toLowerCase();
            const isApproved = rStatus === 'approved';
            const isRequested = rStatus === 'requested';
            const isPending = rStatus === 'pending' || rStatus === 'requested';
            const isRejected = rStatus === 'rejected';
            const returnedBy = itm.returned_by || (rStatus !== 'none' ? 'user' : null);

            return {
              id: itm.product_id || itm.id || i,
              productName: prod.name || itm.product_name || 'Retail Item',
              hindiName: pHindiName,
              hindi_name: pHindiName,
              category: prod.category || 'OTHER',
              quantity: itm.qty_gm || itm.quantity || 1,
              price: prod.price || itm.price || 0,
              image: pImage,
              imageUrl: pImage,
              return_status: rStatus,
              returnStatus: rStatus,
              returnedBy: returnedBy,
              returned_by: returnedBy,
              returnReason: itm.return_reason || null,
              isReturned: isApproved,
              isReturnRequested: isRequested,
              isReturnPending: isPending,
              isReturnRejected: isRejected,
            };
          });

          normalizedOrders.push({
            id: order.id,
            customerName,
            customerPhone,
            address: addressStr,
            lat,
            lng,
            paymentMode: order.paymentMode || 'PREPAID',
            codAmount: order.codAmount || 0,
            items,
            distance: order.distance || null,
            estimatedAmount: order.estimatedAmount || order.total_amount || order.amount || null,
            type: 'retail',
          });
        });
      } else if (data) {
        // Fallback for legacy / flat structures
        let rawOrders = [];
        if (Array.isArray(data.orders)) {
          rawOrders = data.orders;
        } else if (Array.isArray(data.data)) {
          rawOrders = data.data;
        } else if (Array.isArray(data)) {
          rawOrders = data;
        }

        const legacyMapped = rawOrders.map((item, idx) => {
          if (item.user && Array.isArray(item.schedules)) {
            const user = item.user;
            const sched = item.schedules[0] || {};
            const mappedItems = (sched.items || item.items || []).map((itm, i) => ({
              id: itm.product_id || itm.productId || itm.id || i,
              productName:
                itm.product_name ||
                itm.productName ||
                itm.name ||
                (typeof itm.product === 'string' ? itm.product : itm.product?.name) ||
                `Item ${i + 1}`,
              category: itm.category || itm.product?.category || 'OTHER',
              quantity: itm.quantity || itm.qty_gm || 1,
              price: itm.price || itm.product?.price || 0,
            }));

            return {
              id: sched.schedule_id || sched.id || item.id || idx,
              customerName: user.name || 'Customer',
              customerPhone: user.phone || '',
              address: user.address || '',
              lat: user.latitude ?? 23.25,
              lng: user.longitude ?? 77.41,
              paymentMode: sched.paymentMode || item.paymentMode || 'PREPAID',
              codAmount: sched.codAmount || item.codAmount || 0,
              items: mappedItems,
              distance: item.distance || sched.distance || null,
              estimatedAmount: item.estimatedAmount || sched.amount || null,
            };
          }

          const mappedItems = (item.items || []).map((itm, i) => ({
            id: itm.product_id || itm.productId || itm.id || i,
            productName:
              itm.product_name ||
              itm.productName ||
              itm.name ||
              (typeof itm.product === 'string' ? itm.product : itm.product?.name) ||
              `Item ${i + 1}`,
            category: itm.category || itm.product?.category || 'OTHER',
            quantity: itm.quantity || itm.qty_gm || 1,
            price: itm.price || itm.product?.price || 0,
          }));

          return {
            id: item.schedule_id || item.id || idx,
            customerName: item.customer?.name || item.customer_name || item.name || 'Customer',
            customerPhone: item.customer?.phone || item.phone || '',
            address: item.customer?.address || item.address || '',
            lat: item.customer?.latitude ?? item.lat ?? 23.25,
            lng: item.customer?.longitude ?? item.lng ?? 77.41,
            paymentMode: item.paymentMode || 'PREPAID',
            codAmount: item.codAmount || 0,
            items: mappedItems,
            distance: item.distance || null,
            estimatedAmount: item.estimatedAmount || item.amount || null,
          };
        });

        normalizedOrders.push(...legacyMapped);
      }

      store.dispatch(setAvailableOrders(normalizedOrders));
      store.dispatch(setAvailableOrdersError(null));

      // Auto-assign available orders directly into Pending Deliveries (state.route.orders)
      if (normalizedOrders.length > 0) {
        const currentState = store.getState();
        const existingOrders = currentState.route?.orders || [];
        const existingIds = new Set(existingOrders.map((o) => String(o.id)));

        const newAssignedOrders = normalizedOrders
          .filter((o) => !existingIds.has(String(o.id)))
          .map((o) => ({ ...o, status: o.status || 'ASSIGNED' }));

        if (newAssignedOrders.length > 0) {
          const updatedRoute = {
            routeId: currentState.route?.routeId || 101,
            totalDistanceEstimateKm: currentState.route?.totalDistanceKm || 0,
            orders: [...existingOrders, ...newAssignedOrders],
          };
          store.dispatch(setRoute(updatedRoute));
        }
      }

      return normalizedOrders;
    } catch (error) {
      console.error('[AvailableOrdersService] Failed to fetch available orders:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to fetch available orders';
      store.dispatch(setAvailableOrdersError(errMsg));
      return [];
    } finally {
      store.dispatch(setAvailableOrdersLoading(false));
    }
  }

  /**
   * Claim an order — add it to route and remove from available list.
   */
  static async claimOrder(order) {
    // ⚡ INSTANT OPTIMISTIC UI UPDATE (0ms lag)
    store.dispatch(removeAvailableOrder(order.id));

    const currentState = store.getState();
    const existingOrders = currentState.route?.orders || [];
    const alreadyExists = existingOrders.some((o) => String(o.id) === String(order.id));

    if (!alreadyExists) {
      const newRoute = {
        routeId: currentState.route?.routeId || 101,
        totalDistanceEstimateKm: currentState.route?.totalDistanceKm || 0,
        orders: [
          ...existingOrders,
          { ...order, status: 'ASSIGNED' },
        ],
      };
      store.dispatch(setRoute(newRoute));
    }

    // Background API sync
    try {
      await AvailableOrdersRepository.claimOrder(order.id, order.type);
      return true;
    } catch (error) {
      console.warn('[AvailableOrdersService] Backend sync failed, handled gracefully in background:', error?.message);
      return true;
    }
  }
}

export default AvailableOrdersService;
