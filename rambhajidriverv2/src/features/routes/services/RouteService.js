// src/features/routes/services/RouteService.js
// Fetches and hydrates real route data into Redux state

import RouteRepository from '../repositories/RouteRepository';
import { store } from '../../../store';
import { setRoute, setRouteLoading, setRouteError, setIncomingOrder, setHistoryCount, setHistoryCountToday, setHistoryOrders } from '../state/routeSlice';
import { todayISO } from '../../../core/utils/dateUtils';
import { getProductImageFallback } from '../../../core/utils/formatUtils';

class RouteService {
  /**
   * Fetch today's route from API (or cache) and load into Redux.
   */
  static async loadTodaysRoute(force = false) {
    store.dispatch(setRouteLoading(true));

    try {
      const routeData = await RouteRepository.getRoute(force);
      
      const schedulesList = routeData?.deliveries || routeData?.schedules || routeData?.orders || (Array.isArray(routeData) ? routeData : []);
      const retailList = routeData?.retailOrders || [];
      const orders = [];

      if (Array.isArray(schedulesList)) {
        schedulesList.forEach(item => {
          // Handle nested structure: { user: {...}, schedules: [...] }
          if (item.user && Array.isArray(item.schedules)) {
            const parentUser = item.user;
            item.schedules.forEach(sched => {
              const parsed = RouteService._parseSchedule(sched, parentUser);
              if (parsed) orders.push(parsed);
            });
          } else {
            // Direct schedule object: { id: 195, status: 'ready_for_delivery', Subscription: {...}, DeliveryItems: [...] }
            const parsed = RouteService._parseSchedule(item);
            if (parsed) orders.push(parsed);
          }
        });
      }

      if (Array.isArray(retailList)) {
        retailList.forEach(item => {
          const parsed = RouteService._parseSchedule(item);
          if (parsed) orders.push(parsed);
        });
      }

      const formattedRoute = {
        routeId: routeData?.routeId || 101,
        totalDistanceEstimateKm: routeData?.totalDistanceEstimateKm || 0,
        orders,
      };

      store.dispatch(setRoute(formattedRoute));
    } catch (error) {
      console.error('[RouteService] Error loading route:', error);
      store.dispatch(setRouteError(error.message || 'Failed to load route.'));
    } finally {
      store.dispatch(setRouteLoading(false));
    }
  }

  static _parseSchedule(sched, parentUser = null) {
    if (!sched) return null;

    const ws = sched.WaterSubscription || sched.waterSubscription || sched.water_subscription || sched.Water_subscription || {};
    const sub = sched.Subscription || sched.subscription || {};
    const ord = sched.Order || sched.order || {};

    const user = parentUser || sub.User || sub.user || ws.User || ws.user || ord.User || ord.user || sched.User || sched.user || {};
    const addr = sub.Address || sub.address || ws.Address || ws.address || ord.Address || ord.address || sched.Address || sched.address || {};

    const cName = user.name || sched.customer_name || sched.customerName || sched.name || 'Customer';
    const cPhone = user.phone || sched.customer_phone || sched.customerPhone || sched.phone || '';

    const addressParts = [];
    if (addr.address_line) addressParts.push(addr.address_line);
    if (addr.landmark) addressParts.push(addr.landmark);
    if (addr.city) addressParts.push(addr.city);
    if (addr.pincode) addressParts.push(addr.pincode);
    let addressStr = addressParts.join(', ');
    if (!addressStr) {
      addressStr = sched.address || sched.address_line || user.address || 'Address not available';
    }

    let mappedStatus = 'ASSIGNED';
    const s = (sched.status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'COMPLETED') mappedStatus = 'COMPLETED';
    else if (s === 'RETURNED') mappedStatus = 'RETURNED';
    else if (s === 'REPLACED') mappedStatus = 'REPLACED';
    else if (s === 'REPLACEMENT_SCHEDULED') mappedStatus = 'REPLACEMENT_SCHEDULED';
    else if (s === 'FAILED' || s === 'CANCELLED') mappedStatus = 'FAILED';
    else mappedStatus = 'ASSIGNED'; // 'ready_for_delivery', 'assigned', 'pending', etc.

    const rawItems = sched.DeliveryItems || sched.deliveryItems || sched.delivery_items || sched.items || [];
    const mappedItems = rawItems.map((itm, idx) => {
      const prod = itm.Product || (typeof itm.product === 'object' ? itm.product : {});
      let pName = prod.name || itm.product_name || itm.productName || itm.name || (typeof itm.product === 'string' ? itm.product : '') || `Item ${idx + 1}`;
      
      let pCategory = prod.category || itm.category || 'OTHER';
      if (!pCategory || pCategory === 'OTHER') {
        const lowerName = (pName + ' ' + (typeof itm.product === 'string' ? itm.product : '')).toLowerCase();
        if (lowerName.includes('water') || lowerName.includes('alkaline') || lowerName.includes('bottle')) {
          pCategory = 'WATER_SUBSCRIPTION';
        } else if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('mango') || lowerName.includes('orange') || lowerName.includes('fruit') || lowerName.includes('papaya') || lowerName.includes('guava') || lowerName.includes('pomegranate') || lowerName.includes('grape')) {
          pCategory = 'FRUITS';
        } else {
          pCategory = 'VEGETABLES';
        }
      }

      const pQuantity = itm.quantity || itm.qty_gm || 1;
      const unit = itm.unit || prod.unit || (itm.qty_gm ? 'gm' : '');
      const hasUnit = /(\d+(?:\.\d+)?\s*(?:kg|gm|g|L|ml|units?|pcs?|pieces?))/i.test(pName);
      if (!hasUnit && (itm.qty_gm || itm.quantity)) {
        pName = `${pName} ${itm.qty_gm || itm.quantity}${unit}`;
      }

      const rawImg = itm.image || itm.imageUrl || itm.image_url || itm.product_image || itm.photo || prod.image_url || prod.image || prod.imageUrl || prod.photo || null;
      const pImage = rawImg ? (rawImg.startsWith('http') ? rawImg : `https://rambhaji.backend.shreenari.com${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : getProductImageFallback(pName, pCategory);

      const pHindiName = (prod.hindi_name || prod.hindiName || itm.hindi_name || itm.hindiName || '').trim();

      const rStatus = (itm.return_status || itm.returnStatus || 'none').toLowerCase();
      const isApproved = rStatus === 'approved';
      const isRequested = rStatus === 'requested';
      const isPending = rStatus === 'pending' || rStatus === 'requested';
      const isRejected = rStatus === 'rejected';
      const returnedBy = itm.returned_by || (rStatus !== 'none' ? 'user' : null);

      const returnPhotoUrl = itm.return_photo_url || itm.returnPhotoUrl
        ? (itm.return_photo_url || itm.returnPhotoUrl).startsWith('http')
          ? (itm.return_photo_url || itm.returnPhotoUrl)
          : `https://rambhaji.backend.shreenari.com${(itm.return_photo_url || itm.returnPhotoUrl).startsWith('/') ? '' : '/'}${itm.return_photo_url || itm.returnPhotoUrl}`
        : null;

      return {
        id: itm.product_id || itm.productId || itm.id || `item-${idx}-${(typeof itm.product === 'string' ? itm.product : itm.name || 'item').replace(/\s+/g, '_')}`,
        productId: itm.product_id || itm.productId || itm.id || idx,
        deliveryItemId: itm.id || itm.delivery_item_id || itm.product_id || idx,
        productName: pName,
        name: pName,
        hindiName: pHindiName,
        hindi_name: pHindiName,
        category: pCategory,
        quantity: pQuantity,
        qty: pQuantity,
        unit: unit,
        qtyUnit: unit,
        price: itm.price || prod.price || 0,
        image: pImage,
        imageUrl: pImage,
        Product: prod,
        product: prod,
        return_status: rStatus,
        returnStatus: rStatus,
        returnReason: itm.return_reason || itm.returnReason || null,
        returnPhotoUrl,
        returnQty: parseFloat(itm.return_qty || 0),
        returnedBy: returnedBy,
        returned_by: returnedBy,
        isReturned: isApproved,
        isReturnRequested: isRequested,
        isReturnPending: isPending,
        isReturnRejected: isRejected,
      };
    });

    return {
      id: sched.schedule_id || sched.id,
      scheduleId: sched.schedule_id || sched.id,
      customerName: cName,
      customerPhone: cPhone,
      address: addressStr,
      lat: parseFloat(addr.latitude || user.latitude || sched.lat || 23.25),
      lng: parseFloat(addr.longitude || user.longitude || sched.lng || 77.41),
      status: mappedStatus,
      items: mappedItems,
      codAmount: sched.codAmount || 0,
      paymentMode: sched.paymentMode || 'PREPAID',
      addressId: addr.id || user.address_id || user.id,
      package: sched.package || null,
      packageName: sched.package || (sched.type === 'package' ? 'FreshBox Package' : null),
      type: sched.type || 'package',
    };
  }

  /**
   * Load from offline cache synchronously (no network).
   */
  static loadFromCache() {
    const cached = RouteRepository.getCachedRoute();
    if (cached) {
      store.dispatch(setRoute(cached));
    }
    return cached;
  }

  /**
   * Simulate a new incoming order (for testing/development purposes).
   */
  static simulateNewOrder() {
    const mockOrder = {
      id: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: 'Aarav Sharma',
      customerPhone: '+919876543210',
      address: 'Plot 42, Sector 15, Near City Park, Bhopal, 462001',
      lat: 23.259933,
      lng: 77.412613,
      paymentMode: Math.random() > 0.5 ? 'COD' : 'PREPAID',
      codAmount: 450,
      items: [
        { id: 'p1', productName: 'Fresh Broccoli', category: 'VEGETABLES', quantity: 2, price: 120 },
        { id: 'p2', productName: 'Red Apples (Shimla)', category: 'FRUITS', quantity: 1, price: 180 },
        { id: 'p3', productName: 'Alkaline Water (1L)', category: 'WATER', quantity: 4, price: 50 },
      ],
    };

    console.log('[RouteService] Simulating incoming order:', mockOrder);
    store.dispatch(setIncomingOrder(mockOrder));
  }

  /**
   * Fetch driver history from FreshBox API and count delivered items for today.
   */
  static async fetchHistoryCount() {
    try {
      const data = await RouteRepository.getBoyHistory();
      if (data && data.success) {
        const todayStr = todayISO();
        
        const schedulesList = Array.isArray(data.schedules) ? data.schedules : [];
        const retailList = Array.isArray(data.retailOrders) ? data.retailOrders : [];

        // Map schedules
        const mappedHistory = schedulesList.map((sched, idx) => {
          const ws = sched.WaterSubscription || sched.waterSubscription || sched.water_subscription || sched.Water_subscription || {};
          const sub = sched.Subscription || sched.subscription || {};
          const ord = sched.Order || sched.order || {};

          const user = sub.User || sub.user || ws.User || ws.user || ord.User || ord.user || sched.User || sched.user || {};
          const addr = sub.Address || sub.address || ws.Address || ws.address || ord.Address || ord.address || sched.Address || sched.address || {};

          const customerName = user.name || sched.customer_name || 'Customer';
          const customerPhone = user.phone || sched.customer_phone || '';

          const addressParts = [];
          if (addr.address_line) addressParts.push(addr.address_line);
          if (addr.landmark) addressParts.push(addr.landmark);
          if (addr.city) addressParts.push(addr.city);
          if (addr.pincode) addressParts.push(addr.pincode);
          const addressStr = addressParts.join(', ') || sched.address || 'Address not available';

          const lat = parseFloat(addr.latitude || user.latitude || sched.lat || 23.25);
          const lng = parseFloat(addr.longitude || user.longitude || sched.lng || 77.41);

          const mappedItems = (sched.DeliveryItems || sched.deliveryItems || sched.delivery_items || sched.items || []).map((itm, i) => {
            const prod = itm.Product || itm.product || {};
            let pName = prod.name || itm.product_name || itm.name || `Item ${i + 1}`;
            
            let pCategory = prod.category || itm.category || 'OTHER';
            if (!pCategory || pCategory === 'OTHER') {
              const lowerName = (pName + ' ' + (typeof itm.product === 'string' ? itm.product : '')).toLowerCase();
              if (lowerName.includes('water') || lowerName.includes('alkaline') || lowerName.includes('bottle')) {
                pCategory = 'WATER_SUBSCRIPTION';
              } else if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('mango') || lowerName.includes('orange') || lowerName.includes('fruit') || lowerName.includes('papaya') || lowerName.includes('guava') || lowerName.includes('pomegranate') || lowerName.includes('grape')) {
                pCategory = 'FRUITS';
              } else {
                pCategory = 'VEGETABLES';
              }
            }

            const pQuantity = itm.quantity || itm.qty_gm || 1;
            const unit = itm.unit || prod.unit || (itm.qty_gm ? 'gm' : '');
            const hasUnit = /(\d+(?:\.\d+)?\s*(?:kg|gm|g|L|ml|units?|pcs?|pieces?))/i.test(pName);
            if (!hasUnit && (itm.qty_gm || itm.quantity)) {
              pName = `${pName} ${itm.qty_gm || itm.quantity}${unit}`;
            }

            const rawImg = itm.image || itm.imageUrl || itm.image_url || itm.product_image || itm.photo || prod.image || prod.image_url || prod.imageUrl || null;
            const pImage = rawImg ? (rawImg.startsWith('http') ? rawImg : `https://rambhaji.backend.shreenari.com${rawImg.startsWith('/') ? '' : '/'}${rawImg}`) : getProductImageFallback(pName, pCategory);

            const pHindiName = (prod.hindi_name || prod.hindiName || itm.hindi_name || itm.hindiName || '').trim();

            const rStatus = (itm.return_status || itm.returnStatus || 'none').toLowerCase();
            const isApproved = rStatus === 'approved';
            const isRequested = rStatus === 'requested';
            const isPending = rStatus === 'pending' || rStatus === 'requested';
            const isRejected = rStatus === 'rejected';
            const returnedBy = itm.returned_by || (rStatus !== 'none' ? 'user' : null);

            const returnPhotoUrl = itm.return_photo_url || itm.returnPhotoUrl
              ? (itm.return_photo_url || itm.returnPhotoUrl).startsWith('http')
                ? (itm.return_photo_url || itm.returnPhotoUrl)
                : `https://rambhaji.backend.shreenari.com${(itm.return_photo_url || itm.returnPhotoUrl).startsWith('/') ? '' : '/'}${itm.return_photo_url || itm.returnPhotoUrl}`
              : null;

            return {
              id: itm.product_id || itm.id || i,
              productId: itm.product_id || itm.id || i,
              deliveryItemId: itm.id || itm.delivery_item_id || itm.product_id || i,
              productName: pName,
              hindiName: pHindiName,
              hindi_name: pHindiName,
              category: pCategory,
              quantity: pQuantity,
              price: parseFloat(prod.price || itm.price || 0),
              image: pImage,
              imageUrl: pImage,
              return_status: rStatus,
              returnStatus: rStatus,
              returnReason: itm.return_reason || null,
              returnPhotoUrl,
              returnQty: parseFloat(itm.return_qty || 0),
              returnedBy: returnedBy,
              returned_by: returnedBy,
              isReturned: isApproved,
              isReturnRequested: isRequested,
              isReturnPending: isPending,
              isReturnRejected: isRejected,
            };
          });

          // Server sends status="delivered" — actual return status is inside DeliveryItems
          const rawDeliveryItems = sched.DeliveryItems || sched.deliveryItems || sched.delivery_items || sched.items || [];
          const returnActiveItems = rawDeliveryItems.filter(
            itm => {
              const rs = (itm.return_status || itm.returnStatus || '').toLowerCase();
              return rs === 'approved' || rs === 'requested' || rs === 'pending';
            }
          );
          const totalItems = rawDeliveryItems.length;
          const returnedItemsCount = returnActiveItems.length;

          let mappedStatus = 'COMPLETED';
          if (returnedItemsCount > 0 && returnedItemsCount >= totalItems) {
            mappedStatus = 'REPLACED'; // All items returned/requested → whole order returned
          } else if (returnedItemsCount > 0) {
            mappedStatus = 'RETURNED'; // Some items returned/requested → partial item return
          } else {
            const statusUpper = (sched.status || '').toUpperCase();
            if (statusUpper === 'FAILED') mappedStatus = 'FAILED';
          }

          const returnedMappedItems = returnActiveItems.map((itm, i) => {
            const prod = itm.Product || itm.product || {};
            let pName = prod.name || itm.product_name || itm.name || `Item ${i + 1}`;
            const pCategory = prod.category || itm.category || 'OTHER';
            const pQuantity = parseFloat(itm.return_qty || itm.qty_gm || 1);
            const unit = prod.unit || itm.unit || (itm.qty_gm ? 'gm' : '');
            const hasUnit = /(\d+(?:\.\d+)?\s*(?:kg|gm|g|L|ml|units?|pcs?|pieces?))/i.test(pName);
            if (!hasUnit && pQuantity) {
              pName = `${pName} ${pQuantity}${unit}`;
            }
            const rs = (itm.return_status || itm.returnStatus || 'none').toLowerCase();
            return {
              id: itm.product_id || itm.id || i,
              productId: itm.product_id || itm.id || i,
              deliveryItemId: itm.id || itm.product_id || i,
              productName: pName,
              category: pCategory,
              quantity: pQuantity,
              price: 0,
              return_status: rs,
              returnStatus: rs,
              returned_by: itm.returned_by || 'user',
              returnedBy: itm.returned_by || 'user',
              return_reason: itm.return_reason || null,
              returnReason: itm.return_reason || null,
              return_photo_url: itm.return_photo_url || null,
              isApproved: rs === 'approved',
              isRequested: rs === 'requested',
              isPending: rs === 'pending' || rs === 'requested',
            };
          });

          const primaryReturnItem = returnActiveItems[0] || {};
          const primaryReturnPhoto = primaryReturnItem.return_photo_url
            ? (primaryReturnItem.return_photo_url.startsWith('http')
                ? primaryReturnItem.return_photo_url
                : `https://rambhaji.backend.shreenari.com${primaryReturnItem.return_photo_url.startsWith('/') ? '' : '/'}${primaryReturnItem.return_photo_url}`)
            : null;

          return {
            id: sched.id,
            scheduleId: sched.id,
            customerName,
            customerPhone,
            address: addressStr,
            lat,
            lng,
            status: mappedStatus,
            items: mappedItems,
            returnDetails: (mappedStatus === 'RETURNED' || mappedStatus === 'REPLACED') ? {
              items: returnedMappedItems,
              reason: primaryReturnItem.return_reason || 'Customer Request',
              photoUri: primaryReturnPhoto,
              timestamp: sched.actual_delivery_date || sched.scheduled_date || new Date().toISOString(),
              returnedBy: primaryReturnItem.returned_by || 'user',
              isRequested: returnActiveItems.some(it => (it.return_status || '').toLowerCase() === 'requested'),
            } : null,
            codAmount: sched.codAmount || 0,
            paymentMode: sched.paymentMode || 'PREPAID',
            addressId: addr.id || user.address_id || sched.address_id || sched.id,
            orderId: sched.subscription_id || sched.id,
            scheduledDate: sched.scheduled_date || sched.actual_delivery_date || '',
          };
        });

        // Map retail orders
        const mappedRetail = retailList.map((ord, idx) => {
          const user = ord.User || ord.user || {};
          const addr = ord.Address || ord.address || {};
          const customerName = user.name || ord.customer_name || 'Customer';
          const customerPhone = user.phone || ord.customer_phone || '';

          const addressParts = [];
          if (addr.address_line) addressParts.push(addr.address_line);
          if (addr.landmark) addressParts.push(addr.landmark);
          if (addr.city) addressParts.push(addr.city);
          if (addr.pincode) addressParts.push(addr.pincode);
          const addressStr = addressParts.join(', ') || ord.address || 'Address not available';

          const lat = parseFloat(addr.latitude || user.latitude || ord.lat || 23.25);
          const lng = parseFloat(addr.longitude || user.longitude || ord.lng || 77.41);

          const mappedItems = (ord.RetailOrderItems || ord.retailOrderItems || ord.retail_order_items || ord.items || []).map((itm, i) => {
            const prod = itm.Product || itm.product || {};
            let pName = prod.name || itm.product_name || itm.name || `Item ${i + 1}`;
            const pCategory = prod.category || itm.category || 'OTHER';
            const pQuantity = itm.quantity || itm.qty_gm || 1;

            const unit = itm.unit || (itm.qty_gm ? 'gm' : '');
            const hasUnit = /(\d+(?:\.\d+)?\s*(?:kg|gm|g|L|ml|units?|pcs?|pieces?))/i.test(pName);
            if (!hasUnit && (itm.qty_gm || itm.quantity)) {
              pName = `${pName} ${itm.qty_gm || itm.quantity}${unit}`;
            }

            return {
              id: itm.product_id || itm.id || i,
              productId: itm.product_id || itm.id || i,
              deliveryItemId: itm.id || itm.delivery_item_id || itm.product_id || i,
              productName: pName,
              category: pCategory,
              quantity: pQuantity,
              price: parseFloat(prod.price || itm.price || 0),
            };
          });

          let mappedStatus = 'COMPLETED';
          const statusUpper = (ord.status || '').toUpperCase();
          if (statusUpper === 'RETURNED') {
            mappedStatus = 'RETURNED';
          } else if (statusUpper === 'REPLACED') {
            mappedStatus = 'REPLACED';
          } else if (statusUpper === 'FAILED') {
            mappedStatus = 'FAILED';
          }

          return {
            id: ord.id,
            scheduleId: ord.id,
            orderId: ord.id,
            customerName,
            customerPhone,
            address: addressStr,
            lat,
            lng,
            status: mappedStatus,
            items: mappedItems,
            codAmount: ord.codAmount || ord.total_amount || 0,
            paymentMode: ord.paymentMode || 'PREPAID',
            addressId: addr.id || user.address_id || ord.address_id || ord.id,
            isRetail: true,
            scheduledDate: ord.actual_delivery_date || (ord.delivered_at ? ord.delivered_at.split('T')[0] : null) || ord.scheduled_date || '',
          };
        });

        const allMapped = [...mappedHistory, ...mappedRetail];

        // Filter and count completed (all-time)
        const completedCount = schedulesList.filter(
          (s) => {
            const statusLower = (s.status || '').toLowerCase();
            return statusLower === 'delivered' || statusLower === 'completed';
          }
        ).length + retailList.filter(
          (o) => {
            const statusLower = (o.status || '').toLowerCase();
            return statusLower === 'delivered' || statusLower === 'completed';
          }
        ).length;

        // Filter and count completed today
        const completedTodayCount = schedulesList.filter(
          (s) => {
            const statusLower = (s.status || '').toLowerCase();
            const schedDate = ((s.actual_delivery_date || s.scheduled_date || '') + '').split('T')[0];
            return (statusLower === 'delivered' || statusLower === 'completed') && (schedDate === todayStr || schedDate.startsWith(todayStr));
          }
        ).length + retailList.filter(
          (o) => {
            const statusLower = (o.status || '').toLowerCase();
            const orderDate = ((o.actual_delivery_date || o.delivered_at || o.scheduled_date || o.created_at || todayStr) + '').split('T')[0];
            return (statusLower === 'delivered' || statusLower === 'completed') && (orderDate === todayStr || orderDate.startsWith(todayStr));
          }
        ).length;

        console.log('[RouteService] Mapped history orders count:', allMapped.length);
        console.log('[RouteService] Completed history count (all-time):', completedCount);
        console.log('[RouteService] Completed today history count:', completedTodayCount);
        
        store.dispatch(setHistoryCount(completedCount));
        store.dispatch(setHistoryCountToday(completedTodayCount));
        store.dispatch(setHistoryOrders(allMapped));
        return completedCount;
      }
    } catch (error) {
      console.warn('[RouteService] Failed to fetch boy history count:', error.message);
    }
    return 0;
  }
}

export default RouteService;
