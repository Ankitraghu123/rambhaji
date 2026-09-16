# OFFLINE SYNC DOCUMENT
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
1. [Introduction & Philosophy](#1-introduction--philosophy)
2. [Offline Detection Strategy](#2-offline-detection-strategy)
3. [Local Data Cache Architecture](#3-local-data-cache-architecture)
4. [Action Queue System](#4-action-queue-system)
5. [Synchronization Engine Design](#5-synchronization-engine-design)
6. [Retry & Backoff Policies](#6-retry--backoff-policies)
7. [Binary Asset (Photo) Upload Recovery](#7-binary-asset-photo-upload-recovery)
8. [Conflict Resolution Strategy](#8-conflict-resolution-strategy)
9. [Queue Lifecycle & Pruning](#9-queue-lifecycle--pruning)
10. [Offline State UI/UX Patterns](#10-offline-state-uiux-patterns)

---

## 1. Introduction & Philosophy

The GharTak Driver App is designed as an **Offline-First** application. This means:

> **The application must be fully operational without any network connection.** Network connectivity is an enhancement — not a dependency — for completing daily delivery operations.

### 1.1 Why Offline-First?
Delivery executives operate across:
- High-rise apartment basement car parks (complete network blackout)
- Rural delivery zones (2G/EDGE network)
- Underground parking, lifts, and building interiors

Any architecture that blocks a driver's workflow during connectivity loss is unacceptable.

### 1.2 Offline-First Contract Guarantees
| Guarantee | Detail |
|-----------|--------|
| **Zero Data Loss** | Every action taken offline is persisted locally before acknowledgement |
| **Eventual Consistency** | All offline actions will be synced to the server once connectivity returns |
| **Order Preservation** | Actions are submitted to the server in the exact FIFO sequence they were performed |
| **Idempotency** | Duplicate sync submissions are safely rejected by the server without corrupting state |
| **Transparent Recovery** | The driver is shown real-time sync status without blocking their workflow |

---

## 2. Offline Detection Strategy

### 2.1 Network State Monitoring
The application uses **`@react-native-community/netinfo`** to monitor network state transitions in real time.

```javascript
// src/core/network/NetworkMonitor.js
import NetInfo from '@react-native-community/netinfo';
import { store } from '../../store';
import { setNetworkStatus } from '../../features/sync/syncSlice';

class NetworkMonitor {
  static _unsubscribe = null;

  static initialize() {
    this._unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      store.dispatch(setNetworkStatus(isConnected));

      if (isConnected) {
        SyncEngine.triggerSync(); // Auto-sync on reconnect
      }
    });
  }

  static destroy() {
    if (this._unsubscribe) this._unsubscribe();
  }
}
```

### 2.2 Connectivity Quality Levels
The app distinguishes three connectivity states:

| State | `isConnected` | `isInternetReachable` | Behavior |
|-------|--------------|----------------------|----------|
| **ONLINE** | `true` | `true` | Full sync active |
| **LIMITED** | `true` | `false` | Local-only mode, queue builds |
| **OFFLINE** | `false` | `false` | Full offline mode, no requests |

---

## 3. Local Data Cache Architecture

### 3.1 MMKV Storage Instances

The application maintains **two isolated MMKV instances** for security and performance:

```javascript
// src/core/storage/mmkvInstances.js
import { MMKV } from 'react-native-mmkv';

// Public app config - unencrypted
export const appStorage = new MMKV({ id: 'ghartak-app-storage' });

// Sensitive data - AES-256 encrypted
export const secureStorage = new MMKV({
  id: 'ghartak-secure-storage',
  encryptionKey: getEncryptionKeyFromKeystore(), // Android KeyStore / iOS Keychain
});
```

### 3.2 Cached Data Registry

| Cache Key Pattern | Storage Instance | Description | Expiry |
|-------------------|-----------------|-------------|--------|
| `route_YYYY-MM-DD` | `secureStorage` | Full daily route + order payload | End of day |
| `queue_items` | `secureStorage` | Serialized action queue array | Until synced |
| `auth_tokens` | `secureStorage` | JWT access + refresh tokens | Per rotation |
| `driver_profile` | `secureStorage` | Driver identity object | Session |
| `audit_queue` | `appStorage` | Pending audit log batch | Weekly |
| `app_settings` | `appStorage` | Theme, preferences | Persistent |

---

## 4. Action Queue System

### 4.1 Queue Item Schema

Every offline action is serialized into a **Queue Transaction Record** before submission:

```javascript
// Queue Transaction Schema
{
  id: 'uuid-v4',                    // Unique transaction ID (= idempotency key)
  action: 'ORDER_DELIVER',          // Action type enum
  payload: {                        // Action-specific data payload
    orderId: 1001,
    latitude: 28.6289,
    longitude: 77.3653,
    remarks: 'Delivered to watchman',
    deliveredAt: '2026-06-18T23:45:00Z'
  },
  localPhotoUri: 'file:///data/...pod_1001.jpg',  // Local photo path (if any)
  uploadedPhotoUrl: null,           // Set after photo uploads to server
  status: 'PENDING',               // PENDING | SYNCING | SYNCED | FAILED | DEAD
  retryCount: 0,                    // Number of sync attempts made
  createdAt: 1718736300000,         // Unix epoch milliseconds
  lastAttemptAt: null               // Timestamp of last sync attempt
}
```

### 4.2 Action Type Enum

```javascript
// src/features/sync/constants/queueActionTypes.js
export const QUEUE_ACTION_TYPES = {
  ORDER_DELIVER:    'ORDER_DELIVER',
  ORDER_RETURN:     'ORDER_RETURN',
  ROUTE_START:      'ROUTE_START',
  ROUTE_COMPLETE:   'ROUTE_COMPLETE',
  AUDIT_LOG_BATCH:  'AUDIT_LOG_BATCH',
  PHOTO_UPLOAD:     'PHOTO_UPLOAD',
};
```

### 4.3 Queue Manager Service

```javascript
// src/features/sync/services/QueueManager.js
import { secureStorage } from '../../core/storage/mmkvInstances';
import uuid from 'react-native-uuid';

const QUEUE_KEY = 'offline_action_queue';

class QueueManager {

  static getQueue() {
    const raw = secureStorage.getString(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  static enqueue(action, payload, localPhotoUri = null) {
    const queue = this.getQueue();
    const item = {
      id: uuid.v4(),
      action,
      payload,
      localPhotoUri,
      uploadedPhotoUrl: null,
      status: 'PENDING',
      retryCount: 0,
      createdAt: Date.now(),
      lastAttemptAt: null,
    };
    queue.push(item);
    secureStorage.set(QUEUE_KEY, JSON.stringify(queue));
    return item.id;
  }

  static updateItem(id, updates) {
    const queue = this.getQueue();
    const index = queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      secureStorage.set(QUEUE_KEY, JSON.stringify(queue));
    }
  }

  static removeItem(id) {
    const queue = this.getQueue().filter((item) => item.id !== id);
    secureStorage.set(QUEUE_KEY, JSON.stringify(queue));
  }

  static getPendingItems() {
    return this.getQueue().filter(
      (item) => item.status === 'PENDING' || item.status === 'FAILED'
    );
  }

  static getDeadLetterItems() {
    return this.getQueue().filter((item) => item.status === 'DEAD');
  }
}

export default QueueManager;
```

---

## 5. Synchronization Engine Design

### 5.1 Sync Orchestrator

The Sync Engine processes the offline queue when the network is restored:

```javascript
// src/features/sync/services/SyncEngine.js
import QueueManager from './QueueManager';
import DeliveryRepository from '../../deliveries/repositories/DeliveryRepository';
import ReturnRepository from '../../returns/repositories/ReturnRepository';
import MediaUploadService from '../../core/services/MediaUploadService';

class SyncEngine {
  static _isRunning = false;

  static async triggerSync() {
    if (this._isRunning) return; // Prevent concurrent runs
    this._isRunning = true;

    try {
      const pendingItems = QueueManager.getPendingItems();

      for (const item of pendingItems) {
        await this._processItem(item);
      }
    } finally {
      this._isRunning = false;
    }
  }

  static async _processItem(item) {
    QueueManager.updateItem(item.id, { status: 'SYNCING', lastAttemptAt: Date.now() });

    try {
      // Step 1: Upload photo asset first if needed
      if (item.localPhotoUri && !item.uploadedPhotoUrl) {
        const photoUrl = await MediaUploadService.upload(item.localPhotoUri);
        QueueManager.updateItem(item.id, { uploadedPhotoUrl: photoUrl });
        item.uploadedPhotoUrl = photoUrl;
      }

      // Step 2: Execute the primary action
      await this._dispatchAction(item);

      // Step 3: Mark as synced and remove from active queue
      QueueManager.updateItem(item.id, { status: 'SYNCED' });
      QueueManager.removeItem(item.id);

    } catch (error) {
      const retryCount = item.retryCount + 1;
      const isDead = retryCount >= 5;

      QueueManager.updateItem(item.id, {
        status: isDead ? 'DEAD' : 'FAILED',
        retryCount,
      });
    }
  }

  static async _dispatchAction(item) {
    switch (item.action) {
      case 'ORDER_DELIVER':
        return DeliveryRepository.confirmDelivery({
          ...item.payload,
          podPhotoUrl: item.uploadedPhotoUrl,
          idempotencyKey: item.id,
        });
      case 'ORDER_RETURN':
        return ReturnRepository.submitReturn({
          ...item.payload,
          returnPhotoUrl: item.uploadedPhotoUrl,
          idempotencyKey: item.id,
        });
      default:
        throw new Error(`Unknown action type: ${item.action}`);
    }
  }
}

export default SyncEngine;
```

---

## 6. Retry & Backoff Policies

### 6.1 Exponential Backoff Formula

```
delay = min(BASE_DELAY_MS × 2^retryCount, MAX_DELAY_MS)

Example:
  Retry 1: min(2000 × 2^1, 60000) = 4,000ms  (4 seconds)
  Retry 2: min(2000 × 2^2, 60000) = 8,000ms  (8 seconds)
  Retry 3: min(2000 × 2^3, 60000) = 16,000ms (16 seconds)
  Retry 4: min(2000 × 2^4, 60000) = 32,000ms (32 seconds)
  Retry 5: DEAD — Moved to Dead Letter Queue
```

### 6.2 Retry Classification Rules

| HTTP Status | Retry? | Reason |
|-------------|--------|--------|
| `500`, `502`, `503`, `504` | ✅ Yes | Transient server error |
| `408` Request Timeout | ✅ Yes | Network timeout |
| `429` Rate Limit | ✅ Yes with delay | Throttled |
| `400` Bad Request | ❌ No → DLQ | Payload validation failure |
| `409` Conflict | ❌ No → Discard | Duplicate (already synced) |
| `403` Forbidden | ❌ No → Logout | Session invalidated |

---

## 7. Binary Asset (Photo) Upload Recovery

### 7.1 Photo Upload Strategy

Photos are stored locally in the app's private cache directory and are uploaded **before** the parent delivery confirmation request.

```javascript
// src/core/services/MediaUploadService.js
import apiClient from '../../core/network/apiClient';

class MediaUploadService {

  static async upload(localUri) {
    const filename = localUri.split('/').pop();
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: 'image/jpeg',
    });

    const response = await apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.url; // Returns the CDN-hosted URL
  }
}

export default MediaUploadService;
```

### 7.2 Photo Lifecycle Rules

```
Photo Captured by Driver
        │
        ▼
Saved to App Cache Dir (Encrypted)
        │
        ▼
Queue Item: localPhotoUri set → uploadedPhotoUrl = null
        │
  [Network Online]
        │
        ▼
MediaUploadService.upload(localUri) → Server CDN URL returned
        │
        ▼
Queue Item: uploadedPhotoUrl = CDN URL
        │
        ▼
Delivery Confirm Request Sent with CDN URL
        │
        ▼
Server Confirms → Item marked SYNCED
        │
        ▼
Local photo deleted from cache after 24h
```

---

## 8. Conflict Resolution Strategy

| Scenario | Resolution |
|----------|-----------|
| Driver confirmed delivery offline; order already cancelled by ops | Server returns `409`. App discards queue item, shows cancellation notice to driver |
| Two offline actions submitted for same order | Server uses `idempotency_key` to reject the duplicate; both get `200 OK` response |
| Route updated by ops while driver was offline | On sync, updated route data is fetched and local cache is overwritten |
| Return request for item already returned by another sync | Server rejects with `409`. App marks queue item discarded |

---

## 9. Queue Lifecycle & Pruning

```
PENDING → SYNCING → SYNCED → [Removed from Queue]
                  ↘ FAILED (retryCount < 5) → Back to PENDING
                  ↘ DEAD (retryCount >= 5) → Stays in Dead Letter Queue
```

**Pruning Policy:**
- `SYNCED` items: Removed immediately after successful sync
- `DEAD` items: Retained for 7 days in DLQ for admin review, then auto-purged
- `FAILED` items: Retried automatically on each `triggerSync()` call

---

## 10. Offline State UI/UX Patterns

### 10.1 Network Status Banner
```
┌────────────────────────────────────────────┐
│ 🔴  You are offline. Changes will sync     │
│      when connectivity is restored.         │
└────────────────────────────────────────────┘
```

### 10.2 Queued Action Indicator
Orders that have been confirmed offline show a visual badge:
```
┌────────────────────────────────┐
│  Order #1001   ⏳ Syncing...  │
│  Amit Sharma                   │
└────────────────────────────────┘
```

### 10.3 Sync Progress Toast
When auto-sync completes on reconnect:
```
✅  3 deliveries synced successfully!
```

---

*Document End — OFFLINE_SYNC_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
