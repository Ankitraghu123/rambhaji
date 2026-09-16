# TESTING CHECKLIST
## GharTak — Driver Delivery Mobile Application
### Comprehensive QA Verification Document

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Ready for QA Execution  
**Classification:** Internal — QA Engineering  
**Prepared By:** QA Lead / Senior Engineering Team  

---

## How to Use This Checklist
- Mark each item `✅ PASS`, `❌ FAIL`, or `⚠️ BLOCKED`
- Document the device model, OS version, and build number for each test session
- All P0 items must pass before any release candidate is approved

---

## Module 1: Authentication & Session Management

### 1.1 OTP Login Flow
- [ ] `AUTH-01` App loads login screen when no valid session exists
- [ ] `AUTH-02` Phone number field only accepts 10-digit numeric input
- [ ] `AUTH-03` "Send OTP" button is disabled with fewer than 10 digits
- [ ] `AUTH-04` OTP request succeeds for a registered driver number
- [ ] `AUTH-05` Unregistered mobile number shows appropriate error message
- [ ] `AUTH-06` OTP input auto-submits when all 6 digits are entered
- [ ] `AUTH-07` Incorrect OTP shows error and allows retry
- [ ] `AUTH-08` 3 consecutive wrong OTPs shows account lock message
- [ ] `AUTH-09` Expired OTP (after 5 min) shows expiry message
- [ ] `AUTH-10` "Resend OTP" button works after 30-second cooldown
- [ ] `AUTH-11` Successful OTP stores JWT tokens in MMKV encrypted store
- [ ] `AUTH-12` Successful login navigates to Dashboard screen
- [ ] `AUTH-13` Device fingerprint is sent and bound during login

### 1.2 Token Management
- [ ] `AUTH-14` Expired access token is automatically refreshed silently
- [ ] `AUTH-15` App retries the original request after token refresh
- [ ] `AUTH-16` Invalid refresh token triggers logout and redirects to login
- [ ] `AUTH-17` Logout clears all tokens from MMKV
- [ ] `AUTH-18` Force logout (403 server response) clears session and redirects

---

## Module 2: Driver Dashboard

- [ ] `DASH-01` Dashboard shows today's Pending, Completed, Returned counts
- [ ] `DASH-02` Route summary shows total stops and distance
- [ ] `DASH-03` Earnings projection displays correctly
- [ ] `DASH-04` "Start Route" button navigates to delivery list
- [ ] `DASH-05` Notification bell shows correct unread count badge
- [ ] `DASH-06` Offline banner appears when device loses connectivity
- [ ] `DASH-07` Dashboard data loads from MMKV cache when offline
- [ ] `DASH-08` Dashboard refreshes on pull-to-refresh when online

---

## Module 3: Delivery List & Order Details

- [ ] `DEL-01` Delivery list shows all assigned orders for today
- [ ] `DEL-02` Filter tabs work correctly (All / Pending / Completed / Returned)
- [ ] `DEL-03` Search returns matching results by customer name
- [ ] `DEL-04` Search returns matching results by address
- [ ] `DEL-05` Order detail shows customer name, phone, and address
- [ ] `DEL-06` Order detail shows all product items with quantities and categories
- [ ] `DEL-07` Order detail shows delivery instructions if present
- [ ] `DEL-08` Tapping phone number initiates a phone call
- [ ] `DEL-09` Map preview shows the correct customer location pin
- [ ] `DEL-10` "Navigate" button opens navigation correctly

---

## Module 4: Delivery Confirmation

- [ ] `CONF-01` DELIVER button is visible and tappable on order detail screen
- [ ] `CONF-02` App requests location permission if not already granted
- [ ] `CONF-03` DELIVER button is blocked if GPS is disabled (clear error shown)
- [ ] `CONF-04` DELIVER button is blocked if mock GPS is detected
- [ ] `CONF-05` DELIVER button is blocked if driver is outside 100m geofence
- [ ] `CONF-06` Distance error shows actual distance from delivery address
- [ ] `CONF-07` Camera opens when DELIVER is tapped (all validations passed)
- [ ] `CONF-08` SUBMIT is disabled before photo is captured
- [ ] `CONF-09` Remarks field accepts free text (optional)
- [ ] `CONF-10` Successful delivery changes order status to COMPLETED
- [ ] `CONF-11` Completed order shows green checkmark badge in list
- [ ] `CONF-12` Delivery confirmation with no network queues to offline store
- [ ] `CONF-13` Queued delivery syncs automatically when network returns
- [ ] `CONF-14` Idempotency key prevents duplicate delivery submissions
- [ ] `CONF-15` GPS coordinates are captured and included in the payload

---

## Module 5: Returns Management

- [ ] `RET-01` RETURN button is visible on order detail screen
- [ ] `RET-02` Return reason list shows all predefined options
- [ ] `RET-03` Quantity adjustment works for partial returns
- [ ] `RET-04` SUBMIT RETURN is blocked before photo is captured
- [ ] `RET-05` Camera opens successfully for return proof photo
- [ ] `RET-06` Return submission creates record with RETURN_PENDING status
- [ ] `RET-07` Return submission offline queues and syncs later
- [ ] `RET-08` Driver receives push notification when return is approved
- [ ] `RET-09` Driver receives push notification when return is rejected
- [ ] `RET-10` Return history tab shows past returns with status badges

---

## Module 6: Route & Map

- [ ] `MAP-01` Map renders with OpenStreetMap tiles loaded
- [ ] `MAP-02` Driver's live location marker updates in real time
- [ ] `MAP-03` All pending delivery pins are shown on the map
- [ ] `MAP-04` Completed orders show green pin markers
- [ ] `MAP-05` Tapping a pin shows order summary card
- [ ] `MAP-06` ETA and distance to selected pin are displayed
- [ ] `MAP-07` "Navigate" from map card launches navigation correctly
- [ ] `MAP-08` Background location updates function when app is minimized

---

## Module 7: Offline Mode & Sync Engine

- [ ] `SYNC-01` App detects offline state and shows banner within 2 seconds
- [ ] `SYNC-02` Cached route data is shown when offline (no blank screen)
- [ ] `SYNC-03` Delivery confirmation queues to MMKV when offline
- [ ] `SYNC-04` Return request queues to MMKV when offline
- [ ] `SYNC-05` Sync engine activates automatically when network is restored
- [ ] `SYNC-06` All queued items are processed in FIFO order
- [ ] `SYNC-07` Photos are uploaded before delivery confirmation payload
- [ ] `SYNC-08` Failed sync retries with exponential backoff (verified via logs)
- [ ] `SYNC-09` Items with 5+ failures move to Dead Letter Queue (not retried)
- [ ] `SYNC-10` `409 Conflict` responses discard the queue item gracefully
- [ ] `SYNC-11` Sync progress is visible to the driver
- [ ] `SYNC-12` Sync completion shows success toast with item count

---

## Module 8: Notifications

- [ ] `NOTIF-01` App requests notification permission on first launch
- [ ] `NOTIF-02` FCM device token is registered with server after permission grant
- [ ] `NOTIF-03` Foreground push notifications show in-app toast
- [ ] `NOTIF-04` Background push notifications appear in system tray
- [ ] `NOTIF-05` Tapping a notification deep-links to correct screen
- [ ] `NOTIF-06` Notification center shows all received notifications
- [ ] `NOTIF-07` Notification badge count decrements after reading

---

## Module 9: Performance & UX

- [ ] `PERF-01` App cold start completes in under 3 seconds
- [ ] `PERF-02` Dashboard loads in under 1.5 seconds
- [ ] `PERF-03` Delivery list of 50 items scrolls at 60 FPS (no jank)
- [ ] `PERF-04` Map loads with 60 pins in under 1 second
- [ ] `PERF-05` Camera opens and captures in under 2 seconds
- [ ] `PERF-06` Photo upload (3G network) completes within 30 seconds

---

## Module 10: Regression & Compatibility

- [ ] `REG-01` All features tested on Android 8.0 (minimum supported)
- [ ] `REG-02` All features tested on Android 12 / 13 (latest)
- [ ] `REG-03` All features tested on iOS 14+ (secondary platform)
- [ ] `REG-04` App functions on 720p resolution devices
- [ ] `REG-05` No crashes reported on low-memory devices (2GB RAM)
- [ ] `REG-06` All screen transitions are smooth and free of visual glitches

---

*Document End — TESTING_CHECKLIST.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
