// src/features/sync/constants/queueActionTypes.js
// Enum of all possible offline queue action types

export const QUEUE_ACTION_TYPES = {
  ORDER_DELIVER:    'ORDER_DELIVER',    // Driver confirms a delivery
  ORDER_RETURN:     'ORDER_RETURN',     // Driver submits a return request
  ORDER_REPLACE:    'ORDER_REPLACE',    // Driver submits a replacement request
  ROUTE_START:      'ROUTE_START',      // Driver marks route as started
  ROUTE_COMPLETE:   'ROUTE_COMPLETE',   // Driver submits end-of-shift summary
  AUDIT_LOG_BATCH:  'AUDIT_LOG_BATCH',  // Batch audit log upload
  PHOTO_UPLOAD:     'PHOTO_UPLOAD',     // Standalone photo pre-upload step
};

// Queue item status lifecycle
export const QUEUE_STATUS = {
  PENDING:  'PENDING',  // Waiting to be processed
  SYNCING:  'SYNCING',  // Currently being submitted
  SYNCED:   'SYNCED',   // Successfully uploaded (will be pruned)
  FAILED:   'FAILED',   // Failed, eligible for retry
  DEAD:     'DEAD',     // Max retries exceeded — in Dead Letter Queue
};
