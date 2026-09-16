// src/features/sync/services/QueueManager.js
// Manages the persistent offline action queue stored in MMKV

import { secureStorage } from '../../../core/storage/mmkvInstances';
import { generateId } from '../../../core/utils/idUtils';
import { QUEUE_STATUS } from '../constants/queueActionTypes';
import { setPendingCount } from '../state/syncSlice';

const QUEUE_KEY = 'offline_action_queue';

let _storeInstance = null;
const getStore = () => {
  if (!_storeInstance) {
    _storeInstance = require('../../../store').store;
  }
  return _storeInstance;
};

class QueueManager {

  static getQueue() {
    const raw = secureStorage.getString(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  static _saveQueue(queue) {
    secureStorage.set(QUEUE_KEY, JSON.stringify(queue));
    // Update Redux with pending count
    const pending = queue.filter(
      (i) => i.status === QUEUE_STATUS.PENDING || i.status === QUEUE_STATUS.FAILED
    ).length;
    getStore().dispatch(setPendingCount(pending));
  }

  /**
   * Add a new action to the queue.
   * @param {string} action - Action type from QUEUE_ACTION_TYPES
   * @param {object} payload - Data payload for the action
   * @param {string|null} localPhotoUri - Local file URI of captured photo
   * @returns {string} The generated queue item ID (also serves as idempotency key)
   */
  static enqueue(action, payload, localPhotoUri = null) {
    const queue = this.getQueue();
    const item = {
      id: generateId(),
      action,
      payload,
      localPhotoUri,
      uploadedPhotoUrl: null,
      status: QUEUE_STATUS.PENDING,
      retryCount: 0,
      createdAt: Date.now(),
      lastAttemptAt: null,
    };
    queue.push(item);
    this._saveQueue(queue);
    return item.id;
  }

  static updateItem(id, updates) {
    const queue = this.getQueue();
    const index = queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      this._saveQueue(queue);
    }
  }

  static removeItem(id) {
    const queue = this.getQueue().filter((item) => item.id !== id);
    this._saveQueue(queue);
  }

  static getPendingItems() {
    return this.getQueue().filter(
      (item) =>
        item.status === QUEUE_STATUS.PENDING || item.status === QUEUE_STATUS.FAILED
    );
  }

  static getDeadLetterItems() {
    return this.getQueue().filter((item) => item.status === QUEUE_STATUS.DEAD);
  }

  static clearSyncedItems() {
    const queue = this.getQueue().filter(
      (item) => item.status !== QUEUE_STATUS.SYNCED
    );
    this._saveQueue(queue);
  }
}

export default QueueManager;
