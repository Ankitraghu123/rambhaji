// src/features/sync/services/SyncEngine.js
// Offline action sync orchestrator — processes the MMKV queue when online

import { Platform } from 'react-native';
import QueueManager from './QueueManager';
import { QUEUE_ACTION_TYPES, QUEUE_STATUS } from '../constants/queueActionTypes';
import { setSyncing, setSyncComplete, setSyncError } from '../state/syncSlice';
import { updateOrderStatus } from '../../routes/state/routeSlice';
import RouteService from '../../routes/services/RouteService';
import apiClient from '../../../core/network/apiClient';
import { MAX_RETRY_COUNT, SYNC_BASE_DELAY_MS, SYNC_MAX_DELAY_MS } from '../../../config/constants';

let _storeInstance = null;
const getStore = () => {
  if (!_storeInstance) {
    _storeInstance = require('../../../store').store;
  }
  return _storeInstance;
};


class SyncEngine {
  static _isRunning = false;

  static async triggerSync() {
    if (this._isRunning) return;
    this._isRunning = true;
    const store = getStore();
    store.dispatch(setSyncing(true));

    try {
      const pendingItems = QueueManager.getPendingItems();
      if (pendingItems.length === 0) {
        store.dispatch(setSyncComplete());
        return;
      }

      // Process queue items sequentially (FIFO)
      for (const item of pendingItems) {
        await this._processItem(item);
      }

      QueueManager.clearSyncedItems();
      store.dispatch(setSyncComplete());
    } catch (error) {
      store.dispatch(setSyncError(error.message));
    } finally {
      this._isRunning = false;
    }
  }

  static async _processItem(item) {
    const store = getStore();
    QueueManager.updateItem(item.id, {
      status: QUEUE_STATUS.SYNCING,
      lastAttemptAt: Date.now(),
    });

    try {
      // Execute the business action (which includes direct photo submission in Form Data)
      await this._dispatchAction({ ...item });

      // Mark success
      QueueManager.updateItem(item.id, { status: QUEUE_STATUS.SYNCED });

      // Update Redux order status
      if (item.action === QUEUE_ACTION_TYPES.ORDER_DELIVER) {
        store.dispatch(updateOrderStatus({ orderId: item.payload.orderId, status: 'COMPLETED' }));
        RouteService.fetchHistoryCount();
      } else if (item.action === QUEUE_ACTION_TYPES.ORDER_RETURN) {
        store.dispatch(updateOrderStatus({ orderId: item.payload.orderId, status: 'RETURNED' }));
        RouteService.fetchHistoryCount();
      } else if (item.action === QUEUE_ACTION_TYPES.ORDER_REPLACE) {
        store.dispatch(updateOrderStatus({
          orderId: item.payload.orderId,
          status: 'REPLACED',
          items: item.payload.items,
          reason: item.payload.reason,
          photoUri: item.payload.photoUri,
          driverName: item.payload.driverName,
        }));
        RouteService.fetchHistoryCount();
      }

    } catch (error) {
      console.error('[SyncEngine] Error processing item:', error.message || error);
      if (error.response) {
        console.error('[SyncEngine] Server Response Status:', error.response.status);
        console.error('[SyncEngine] Server Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('[SyncEngine] Server Response Headers:', JSON.stringify(error.response.headers, null, 2));
      }
      console.error('[SyncEngine] Item payload:', JSON.stringify(item, null, 2));

      const isAlreadyProcessed = error.response &&
        error.response.status === 400 &&
        (String(error.response.data?.message).toLowerCase().includes('already processed') ||
         String(error.response.data?.message).toLowerCase().includes('not found'));

      if (isAlreadyProcessed) {
        console.log('[SyncEngine] Item was already processed or not found on the server. Marking as SYNCED to clear queue.');
        QueueManager.updateItem(item.id, { status: QUEUE_STATUS.SYNCED });

        // Update Redux order status
        if (item.action === QUEUE_ACTION_TYPES.ORDER_DELIVER) {
          store.dispatch(updateOrderStatus({ orderId: item.payload.orderId, status: 'COMPLETED' }));
          RouteService.fetchHistoryCount();
        } else if (item.action === QUEUE_ACTION_TYPES.ORDER_RETURN) {
          store.dispatch(updateOrderStatus({ orderId: item.payload.orderId, status: 'RETURNED' }));
          RouteService.fetchHistoryCount();
        } else if (item.action === QUEUE_ACTION_TYPES.ORDER_REPLACE) {
          store.dispatch(updateOrderStatus({
            orderId: item.payload.orderId,
            status: 'REPLACED',
            items: item.payload.items,
            reason: item.payload.reason,
            photoUri: item.payload.photoUri,
            driverName: item.payload.driverName,
          }));
          RouteService.fetchHistoryCount();
        }
        return; // Successful resolution, skip retry
      }

      const isClientError = error.response &&
        error.response.status >= 400 &&
        error.response.status < 500 &&
        error.response.status !== 429;

      const retryCount = item.retryCount + 1;
      const isDead = isClientError || retryCount >= MAX_RETRY_COUNT;

      QueueManager.updateItem(item.id, {
        status: isDead ? QUEUE_STATUS.DEAD : QUEUE_STATUS.FAILED,
        retryCount,
      });

      if (!isDead) {
        // Exponential backoff wait before next item
        const delay = Math.min(SYNC_BASE_DELAY_MS * 2 ** retryCount, SYNC_MAX_DELAY_MS);
        await this._sleep(delay);
      }
    }
  }

  static async _dispatchAction(item) {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    switch (item.action) {
      case QUEUE_ACTION_TYPES.ORDER_DELIVER: {
        const formData = await this._buildDeliveryForm(item);
        await apiClient.post('/mark-delivered', formData, config);
        break;
      }
      case QUEUE_ACTION_TYPES.ORDER_RETURN: {
        const items = item.payload.items || [];
        if (items.length === 0) {
          const formData = await this._buildReturnForm(item, 1, 100);
          await apiClient.post('/boy-return-item', formData, config);
        } else {
          for (const prod of items) {
            const formData = await this._buildReturnForm(item, prod.deliveryItemId || prod.id || 1, prod.quantity || prod.qty_gm || 1);
            await apiClient.post('/boy-return-item', formData, config);
          }
        }
        break;
      }
      case QUEUE_ACTION_TYPES.ORDER_REPLACE: {
        const formData = await this._buildOrderReturnForm(item);
        await apiClient.post('/boy-return-order', formData, config);
        break;
      }
      default:
        throw new Error(`Unknown action: ${item.action}`);
    }
  }

  static async _appendFileToFormData(formData, key, uri) {
    if (!uri) return;

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        
        let extension = 'jpg';
        if (blob.type) {
          const parts = blob.type.split('/');
          if (parts.length === 2) {
            extension = parts[1];
          }
        }
        if (extension === 'jpeg') extension = 'jpg';
        
        const filename = `photo.${extension}`;
        formData.append(key, blob, filename);
      } catch (error) {
        console.error('[SyncEngine] Web file append error:', error);
        formData.append(key, {
          uri: uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });
      }
    } else {
      let filename = uri.split('/').pop() || 'photo.jpg';
      if (!filename.includes('.')) {
        filename = 'photo.jpg';
      }
      formData.append(key, {
        uri: uri,
        name: filename,
        type: 'image/jpeg',
      });
    }
  }

  static async _buildDeliveryForm(item) {
    const formData = new FormData();
    await this._appendFileToFormData(formData, 'photo', item.localPhotoUri);
    formData.append('schedule_id', String(item.payload.scheduleId || item.payload.orderId));
    formData.append('remark', String(item.payload.remark || item.payload.remarks || 'Delivered to customer directly'));
    return formData;
  }
 
  static async _buildReturnForm(item, deliveryItemId, returnQty) {
    const formData = new FormData();
    await this._appendFileToFormData(formData, 'photo', item.localPhotoUri);
 
    formData.append('delivery_item_id', String(deliveryItemId));
    formData.append('return_qty', String(returnQty));
    formData.append('return_reason', String(item.payload.reason || 'Other'));
    return formData;
  }
 
  static async _buildOrderReturnForm(item) {
    const formData = new FormData();
    await this._appendFileToFormData(formData, 'photo', item.localPhotoUri);
 
    formData.append('schedule_id', String(item.payload.scheduleId || item.payload.orderId));
    formData.append('return_reason', String(item.payload.reason || 'Other'));
    return formData;
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default SyncEngine;
