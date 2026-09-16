# SECURITY & ACCESS CONTROL DOCUMENT
## GharTak — Driver Delivery Mobile Application
### Fresh Box Subscription Delivery Platform

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Critical Security  
**Prepared By:** Senior Security Architect  

---

## Table of Contents
1. [Authentication Architecture](#1-authentication-architecture)
2. [Authorization & Access Control](#2-authorization--access-control)
3. [Device Security & Integrity Protection](#3-device-security--device-integrity-protection)
4. [Data Protection & Encryption Standards](#4-data-protection--encryption-standards)
5. [Fraud Prevention & Validation Guards](#5-fraud-prevention--validation-guards)
6. [API Security & Payload Protection](#6-api-security--payload-protection)
7. [Incident Response & Security Violation Workflows](#7-incident-response--security-violation-workflows)

---

## 1. Authentication Architecture

The application implements a secure, token-based authentication protocol designed to verify the driver's identity and secure active communication channels.

```
 [ Driver Mobile Client ]                  [ OTP Provider ]                 [ Express Backend ]
          |                                       |                                  |
          | ----- 1. Request Login (Mobile) ------> |                                  |
          |                                       | ---- 2. Send SMS OTP ----------> | (SMS Sent)
          | <---- 3. Enter 6-digit OTP ----------- |                                  |
          |                                                                          |
          | ----------------- 4. Submit OTP + Device Fingerprint ------------------> |
          |                                                                          | -- Validate OTP
          |                                                                          | -- Match Device Bind
          | <---------------- 5. Return JWT (Access + Refresh) ----------------------|
```

### 1.1 Mobile OTP Login Flow
- Drivers enter their registered mobile number.
- The backend triggers a one-time password (OTP) via a secure SMS gateway. The OTP is a **6-digit code** valid for **5 minutes** with a maximum of **3 validation attempts**.
- Upon entering the correct OTP, the backend generates a JWT token pair and completes the session bind.

### 1.2 JWT Access & Refresh Token Rotation
- **Access Token**: Valid for **15 minutes**. It is signed using `HMAC-SHA256` and contains the driver's ID, role, and device ID.
- **Refresh Token**: Valid for **30 days**. It is stored in MMKV-encrypted storage.
- **Token Rotation**: Each refresh request generates a new token pair and invalidates the old ones on the server. If a refresh token is reused, the backend assumes a theft attempt, revokes all tokens associated with the session, and triggers an app logout.

### 1.3 Device Binding & Fingerprinting
- The application generates a cryptographic device fingerprint using hardware attributes (CPU architecture, OS build, motherboard ID, MAC address).
- This fingerprint is sent during login and bound to the driver's session in the backend database.
- If the fingerprint changes, the session is invalidated, and the driver must contact support for manual authorization.

---

## 2. Authorization & Access Control

### 2.1 Role-Based Access Control (RBAC)
The driver app supports three functional roles:
- `DRIVER`: Standard delivery executive. Can view routes, perform deliveries, and request returns.
- `LEAD_DRIVER`: Senior driver. Can also assign routes to other drivers and approve manual overrides.
- `ADMIN`: Full access to configurations, device reset commands, and emergency overrides.

### 2.2 Route Guards & Permission Gates
- **Route Guards**: Custom router rules (Expo Router layout) check active session states before loading screens. If authentication is missing, the router redirects the app to the login screen.
- **Permission Guards**: Require explicitly granted permissions (Camera, Location) before rendering active controls.

---

## 3. Device Security & Device Integrity Protection

The application protects against tampering and runtime modification tools.

### 3.1 Root & Jailbreak Detection
On launch, the app runs checks to identify root indicators:
- Search for the `su` binary in common system paths (`/system/bin/`, `/system/xbin/`).
- Check for root management apps (SuperSU, Magisk).
- Check write permissions in system root directories.
- If root access is detected, the app blocks execution and displays a security violation screen.

### 3.2 Emulator Detection
The app inspects build properties to detect emulation environments:
- Check for emulator hardware strings (e.g., `goldfish`, `ranchu`, `google_sdk`).
- Validate hardware signatures against known physical chip models.
- If detected, the system blocks the map, location updates, and camera components.

### 3.3 Screenshot & Screen Recording Prevention
- **Android**: Uses window flag controls (`WindowManager.LayoutParams.FLAG_SECURE`) to make the app screen appear blank in screenshots, screen recordings, and the system tasks list.
- **iOS**: Detects screen capture state updates (`UIScreen.isCaptured`) and displays a blur overlay to obscure sensitive driver data.

---

## 4. Data Protection & Encryption Standards

All sensitive data is encrypted at rest and in transit.

### 4.1 Storage & Cache Encryption
- **MMKV Secure Store**: Initialized with a 256-bit encryption key stored in the Android KeyStore or iOS Keychain.
- **Media Cache**: Photos taken for delivery confirmations are stored in an encrypted folder structure inside the app's sandboxed directory.

### 4.2 Transport Layer Security (TLS)
- All network API communication requires **HTTPS with TLS 1.3** and fallback to TLS 1.2.
- The app uses SSL Pinning to prevent man-in-the-middle (MITM) attacks.

---

## 5. Fraud Prevention & Validation Guards

### 5.1 Geofence Enforcement
- A delivery status cannot be updated to `COMPLETED` unless the driver's physical location is within **100 meters** of the customer's coordinates.
- Geofence validation is performed both on the mobile client (to update UI controls) and on the backend database (which serves as the source of truth).

### 5.2 Mock GPS Detection
- The location service uses the Android/iOS location APIs to verify location flags.
- If the OS reports that the location is generated by a mock provider (e.g., mock location enabled in Developer Options), the app blocks the confirmation process, logs the event, and alerts the backend.

---

## 6. API Security & Payload Protection

### 6.1 Request Signing
To prevent request tampering:
- The app generates an HMAC signature for all state-changing API payloads.
- The signature is calculated using the request body, timestamp, and a shared cryptographic key stored in secure local storage.
- The signature is sent in the header:
  ```http
  X-GharTak-Signature: hmac-sha256-hash
  X-GharTak-Timestamp: epoch-milliseconds
  ```
- The backend verifies that the timestamp is within **5 minutes** of current time and validates the signature before executing the request.

---

## 7. Incident Response & Security Violation Workflows

If the app detects a security violation (e.g., mock location, tamper attempt, root access):

1. **Immediate Block**: The app blocks user interactions and displays a warning banner.
2. **Local Security Log**: The event is recorded in the encrypted local audit store.
3. **Alert Telemetry**: An emergency payload is sent to `/api/v1/security/violation` with high-priority status:
   ```json
   {
     "driverId": "driver-101",
     "violationType": "MOCK_GPS_DETECTED",
     "timestamp": "ISO-8601-string",
     "location": { "lat": 28.6139, "lon": 77.2090 },
     "deviceMeta": { "os": "android", "isEmulator": false }
   }
   ```
4. **Force Logout**: If the backend identifies a serious violation, it revokes all active session tokens and triggers a remote force logout.

---

*Document End — SECURITY_ACCESS_CONTROL_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
