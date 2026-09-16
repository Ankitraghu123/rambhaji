# FEATURE TICKETS DOCUMENT
## GharTak — Driver Delivery Mobile Application
### Fresh Box Subscription Delivery Platform

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Product Backlog  
**Prepared By:** Product Owner / Lead Scrum Master  

---

## Table of Contents
1. [Overview](#1-overview)
2. [Module 1: Authentication & Session Management](#2-module-1-authentication--session-management)
3. [Module 2: Driver Dashboard](#3-module-2-driver-dashboard)
4. [Module 3: Delivery Management](#4-module-3-delivery-management)
5. [Module 4: Route & Navigation](#5-module-4-route--navigation)
6. [Module 5: Returns Management](#6-module-5-returns-management)
7. [Module 6: Notifications System](#7-module-6-notifications-system)
8. [Module 7: Offline-First Sync Engine](#8-module-7-offline-first-sync-engine)
9. [Module 8: System Security & Integrity Guard](#9-module-8-system-security--integrity-guard)
10. [Module 9: Audit Trail & Tracking](#10-module-9-audit-trail--tracking)

---

## 1. Overview

This document defines the development backlog for the **GharTak Driver Delivery App**. Each ticket contains clear business context, technical requirements, acceptance criteria, edge cases, and verification rules.

---

## 2. Module 1: Authentication & Session Management

### Ticket: GT-AUTH-01 — Mobile OTP Authentication Request
- **Description**: Add OTP request UI and integration so drivers can request a login code via SMS.
- **Business Requirement**: Enable secure passwordless login for drivers using their registered mobile numbers.
- **UI Screen**: `/app/(auth)/login.js`
- **Acceptance Criteria**:
  1. Input accepts only valid 10-digit Indian phone numbers.
  2. The login button remains disabled until a valid number is entered.
  3. Displays an error message if the mobile number is not registered.
  4. Disables the request button during active API requests to prevent double-clicks.
- **APIs**: `POST /auth/login/request`
- **Edge Cases**:
  - *No Network*: Show offline error banner instead of requesting OTP.
  - *Rate Limit*: Block requests if OTP is requested more than 3 times in 5 minutes.
- **Testing Requirements**: Verify button activation/deactivation and input validation rules.

### Ticket: GT-AUTH-02 — OTP Validation and Token Storage
- **Description**: Implement the OTP code verification screen and store session tokens.
- **Business Requirement**: Authenticate the driver and grant access to the system.
- **UI Screen**: `/app/(auth)/otp.js`
- **Acceptance Criteria**:
  1. Auto-focuses on the first digit input field.
  2. Automatically submits the request when the 6th digit is entered.
  3. Displays a countdown timer showing OTP validity.
  4. Stores Access and Refresh tokens in secure, encrypted MMKV storage.
- **APIs**: `POST /auth/login/verify`
- **Dependencies**: GT-AUTH-01
- **Testing Requirements**: Validate success and failure responses, expired code workflows, and secure token storage.

---

## 3. Module 2: Driver Dashboard

### Ticket: GT-DASH-01 — Driver Dashboard Metrics Layout
- **Description**: Build the dashboard interface showing route stats, earnings, and delivery summaries.
- **Business Requirement**: Give drivers an overview of their daily tasks and progress.
- **UI Screen**: `/app/(tabs)/index.js`
- **Acceptance Criteria**:
  1. Shows metrics cards for: Pending, Completed, Returned, and Projection Earnings.
  2. Displays active route status and quick actions.
  3. Displays an offline banner if internet connectivity is lost.
- **APIs**: `GET /routes/today`
- **Testing Requirements**: Verify component layout across different screen sizes and validate data mapping under offline conditions.

---

## 4. Module 3: Delivery Management

### Ticket: GT-DEL-01 — Delivery Confirmation Workflow
- **Description**: Implement delivery confirmation with geo-validation and photo capture.
- **Business Requirement**: Verify delivery completion and prevent delivery fraud.
- **UI Screen**: `/app/order/[id].js`
- **Acceptance Criteria**:
  1. The app verifies that the driver is within 100 meters of the delivery address.
  2. Driver must capture a photo of the delivery package.
  3. Captures the physical coordinates and completion timestamp.
  4. Submits confirmation payload using an idempotency key.
- **APIs**: `POST /deliveries/confirm` (Multipart)
- **Edge Cases**:
  - *Outside Geofence*: Block confirmation and display a distance mismatch message.
  - *Camera Access Denied*: Prompt the driver to enable camera permissions.
- **Testing Requirements**: Test confirmation flows inside and outside the geofence boundary.

---

## 5. Module 4: Route & Navigation

### Ticket: GT-ROUTE-01 — OpenStreetMap Integration
- **Description**: Integrate the map view showing the delivery route and customer location pins.
- **Business Requirement**: Help drivers navigate their daily route efficiently.
- **UI Screen**: `/app/(tabs)/map.js`
- **Acceptance Criteria**:
  1. Renders OpenStreetMap with active customer location pins.
  2. Shows the driver's real-time GPS position.
  3. Calculates and displays the estimated distance and ETA to the next stop.
- **Dependencies**: GT-DASH-01
- **Testing Requirements**: Test map rendering with multiple address pins and verify GPS tracker accuracy.

---

## 6. Module 5: Returns Management

### Ticket: GT-RET-01 — Return Request Flow
- **Description**: Implement return request processing with reason selection and photo proof.
- **Business Requirement**: Allow drivers to process return requests directly on the order details screen.
- **UI Screen**: `/app/order/[id].js` (Return flow Modal)
- **Acceptance Criteria**:
  1. Driver selects a return reason from a predefined list.
  2. Allows adjusting the return quantity for subscription items (e.g., partial returns).
  3. Requires capturing a photo of the returned items.
  4. Submits the return request to the queue.
- **APIs**: `POST /returns/request` (Multipart)
- **Testing Requirements**: Validate return submissions with adjusted item quantities and test offline queuing.

---

## 7. Module 6: Notifications System

### Ticket: GT-NOTIF-01 — Firebase Push Notifications
- **Description**: Configure Firebase Cloud Messaging to receive push notifications.
- **Business Requirement**: Keep drivers updated with real-time route adjustments and operational notices.
- **Acceptance Criteria**:
  1. Requests notification permissions on first app launch.
  2. Registers the FCM device token with the server.
  3. Displays push notifications for route updates, shift cancellations, and return approvals.
- **APIs**: `POST /notifications/register-token`
- **Testing Requirements**: Verify background and foreground push reception and validate deep linking.

---

## 8. Module 7: Offline-First Sync Engine

### Ticket: GT-SYNC-01 — Offline Queue & Retry Processor
- **Description**: Build a synchronization engine that queues failed requests and retries them when connectivity returns.
- **Business Requirement**: Allow drivers to complete deliveries in areas with poor network coverage.
- **Acceptance Criteria**:
  1. Saves failed requests to an offline queue in MMKV storage.
  2. Detects network recovery using NetInfo and triggers synchronization.
  3. Processes queued actions sequentially (FIFO order).
  4. Handles request failures with exponential backoff retries.
- **Testing Requirements**: Simulate network drops, verify offline queuing, and test auto-sync on reconnect.

---

## 9. Module 8: System Security & Integrity Guard

### Ticket: GT-SEC-01 — Security Protections (Mock GPS & Root Detection)
- **Description**: Implement system integrity checks to detect rooted devices and spoofed GPS coordinates.
- **Business Requirement**: Protect the platform against location fraud and unauthorized modifications.
- **Acceptance Criteria**:
  1. Checks for root access indicators on app start.
  2. Validates location updates to verify GPS mock provider flags are disabled.
  3. Immediately blocks critical app functions if root or mock GPS is detected.
- **APIs**: `POST /security/violation`
- **Testing Requirements**: Verify security blocks on rooted devices, emulators, and with mock location active.

---

## 10. Module 9: Audit Trail & Tracking

### Ticket: GT-AUDIT-01 — Activity Tracking & Logs Uploader
- **Description**: Build an activity tracking service to log driver actions.
- **Business Requirement**: Maintain audit trails of driver actions for security and compliance.
- **Acceptance Criteria**:
  1. Logs actions (login, logout, delivery start, delivery completion) with timestamps and GPS coordinates.
  2. Stores logs in a local queue in MMKV.
  3. Uploads log batches to the server every 5 minutes or when the queue reaches 50 items.
- **APIs**: `POST /telemetry/audit-logs`
- **Testing Requirements**: Verify event logging trigger events and batch upload execution.

---

*Document End — FEATURE_TICKETS_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
