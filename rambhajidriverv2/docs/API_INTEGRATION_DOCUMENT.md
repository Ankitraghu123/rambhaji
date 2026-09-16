# API INTEGRATION DOCUMENT
## GharTak — Driver Delivery Mobile Application
### Fresh Box Subscription Delivery Platform

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Developer Integration  
**Prepared By:** Lead Integration Engineer  

---

## Table of Contents
1. [General API Specifications](#1-general-api-specifications)
2. [Authentication Module Endpoints](#2-authentication-module-endpoints)
3. [Route Management Endpoints](#3-route-management-endpoints)
4. [Delivery Actions Endpoints](#4-delivery-actions-endpoints)
5. [Returns Management Endpoints](#5-returns-management-endpoints)
6. [Notification Registry Endpoints](#6-notification-registry-endpoints)
7. [Telemetry & Audit Endpoints](#7-telemetry--audit-endpoints)

---

## 1. General API Specifications

- **Base URL**: `https://api.ghartak.com/api/v1`
- **Content Type**: `application/json` (except image upload endpoints, which use `multipart/form-data`)
- **Common Status Codes**:
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Payload validation failure.
  - `401 Unauthorized`: Authentication token invalid or expired.
  - `403 Forbidden`: Permissions missing or device mismatch.
  - `409 Conflict`: Duplicate request or status state violation.
  - `500 Internal Server Error`: Critical database or backend exception.

---

## 2. Authentication Module Endpoints

### 2.1 Request OTP
Initiates login sequence by sending a 6-digit OTP code to the driver's mobile device.
- **Method**: `POST`
- **Path**: `/auth/login/request`
- **Request Payload**:
  ```json
  {
    "phone": "+919876543210"
  }
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP transmitted successfully.",
    "expiresInSeconds": 300
  }
  ```

### 2.2 Verify OTP & Retrieve Session
Validates the OTP code, binds the device profile, and returns session tokens.
- **Method**: `POST`
- **Path**: `/auth/login/verify`
- **Request Payload**:
  ```json
  {
    "phone": "+919876543210",
    "otp": "123456",
    "deviceFingerprint": "9a38f3b2cd56ef7e01a",
    "deviceModel": "OnePlus 9R",
    "osVersion": "Android 12"
  }
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "success": true,
    "driver": {
      "id": 101,
      "name": "Rajan Kumar",
      "phone": "+919876543210",
      "role": "DRIVER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
  ```

### 2.3 Rotate JWT Tokens
Renews an expired access token using a valid refresh token.
- **Method**: `POST`
- **Path**: `/auth/token/refresh`
- **Request Headers**:
  ```http
  Authorization: Bearer <REFRESH_TOKEN>
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "success": true,
    "tokens": {
      "accessToken": "eyJhbGciOiNew...",
      "refreshToken": "eyJhbGciOiNew..."
    }
  }
  ```

---

## 3. Route Management Endpoints

### 3.1 Get Daily Route List
Retrieves assigned delivery orders for the specified date.
- **Method**: `GET`
- **Path**: `/routes/today`
- **Headers**:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "routeId": 501,
    "status": "PENDING",
    "totalDistanceEstimateKm": 18.5,
    "orders": [
      {
        "id": 1001,
        "customerName": "Amit Sharma",
        "phone": "+919999888877",
        "address": "Apartment 4B, Sky Heights, Sector 62, Noida",
        "latitude": 28.6289,
        "longitude": 77.3653,
        "status": "ASSIGNED",
        "deliveryInstructions": "Leave near shoes rack",
        "items": [
          {
            "productName": "15L Drinking Water",
            "category": "WATER_SUBSCRIPTION",
            "quantity": 2
          },
          {
            "productName": "Organic Tomatoes",
            "category": "VEGETABLES",
            "quantity": 1
          }
        ]
      }
    ]
  }
  ```

---

## 4. Delivery Actions Endpoints

### 4.1 Confirm Delivery
Completes an order with geo-validation and photo proof.
- **Method**: `POST`
- **Path**: `/deliveries/confirm`
- **Content Type**: `multipart/form-data`
- **Request Form Parts**:
  - `photo`: Binary Image (JPEG)
  - `metadata`: JSON payload
    ```json
    {
      "orderId": 1001,
      "latitude": 28.62895,
      "longitude": 77.36532,
      "remarks": "Delivered to customer directly",
      "idempotencyKey": "90e6db69-b5fe-4f81-8b3f-1d8f53cf839a"
    }
    ```
- **Response Payload (200 OK)**:
  ```json
  {
    "success": true,
    "orderId": 1001,
    "status": "COMPLETED",
    "updatedAt": "2026-06-18T23:45:00Z"
  }
  ```

---

## 5. Returns Management Endpoints

### 5.1 Request Return
Logs returned items with a reason and proof of return.
- **Method**: `POST`
- **Path**: `/returns/request`
- **Content Type**: `multipart/form-data`
- **Request Form Parts**:
  - `photo`: Binary Image (JPEG)
  - `metadata`: JSON payload
    ```json
    {
      "orderId": 1001,
      "reason": "PRODUCT_DAMAGED",
      "adjustedQuantity": 1,
      "idempotencyKey": "a90e3cd6-81cf-4d9f-a2e1-c8efd9101f3e"
    }
    ```
- **Response Payload (200 OK)**:
  ```json
  {
    "success": true,
    "returnId": 801,
    "status": "PENDING"
  }
  ```

---

## 6. Notification Registry Endpoints

### 6.1 Register Device Push Token
Registers the Firebase Cloud Messaging device token to route system alerts and notifications.
- **Method**: `POST`
- **Path**: `/notifications/register-token`
- **Request Payload**:
  ```json
  {
    "pushToken": "fcm_token_string_..."
  }
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Token registered successfully."
  }
  ```

---

## 7. Telemetry & Audit Endpoints

### 7.1 Batch Upload Audit Logs
Uploads batched activity tracking logs to the server.
- **Method**: `POST`
- **Path**: `/telemetry/audit-logs`
- **Request Payload**:
  ```json
  {
    "logs": [
      {
        "eventId": "a93e24b0-91cd-4001",
        "timestamp": "2026-06-18T23:10:00Z",
        "eventType": "DELIVERY_START",
        "driverId": 101,
        "latitude": 28.6289,
        "longitude": 77.3653,
        "deviceMeta": "OnePlus 9R Android 12"
      }
    ]
  }
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "success": true,
    "processedCount": 1
  }
  ```

---

*Document End — API_INTEGRATION_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
