# SCREEN FLOW DOCUMENT
## GharTak — Driver Delivery Mobile Application
### Fresh Box Subscription Delivery Platform

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Product Design  
**Prepared By:** Senior Product Team  

---

## Table of Contents
1. [Application Screen Inventory](#1-application-screen-inventory)
2. [Authentication Flow](#2-authentication-flow)
3. [Main App Tab Flow](#3-main-app-tab-flow)
4. [Delivery Confirmation Flow](#4-delivery-confirmation-flow)
5. [Return Request Flow](#5-return-request-flow)
6. [Route Navigation Flow](#6-route-navigation-flow)
7. [Notification Interaction Flow](#7-notification-interaction-flow)
8. [Error & Edge Case Flows](#8-error--edge-case-flows)

---

## 1. Application Screen Inventory

| Screen ID | Screen Name | Route Path | Module |
|-----------|-------------|------------|--------|
| SCR-01 | Splash / Boot Screen | `/` | System |
| SCR-02 | Mobile Number Login | `/(auth)/login` | Auth |
| SCR-03 | OTP Verification | `/(auth)/otp` | Auth |
| SCR-04 | Driver Dashboard | `/(tabs)/` | Dashboard |
| SCR-05 | Delivery List | `/(tabs)/deliveries` | Deliveries |
| SCR-06 | Route Map | `/(tabs)/map` | Routes |
| SCR-07 | Returns List | `/(tabs)/returns` | Returns |
| SCR-08 | Driver Profile | `/(tabs)/profile` | Profile |
| SCR-09 | Order Detail | `/order/[id]` | Deliveries |
| SCR-10 | Delivery Confirm Modal | (Sheet over SCR-09) | Deliveries |
| SCR-11 | Photo Capture Screen | (Camera overlay) | Deliveries |
| SCR-12 | Return Form Modal | (Sheet over SCR-09) | Returns |
| SCR-13 | Notification Center | `/notifications` | Notifications |
| SCR-14 | Security Violation Screen | (Fullscreen overlay) | Security |
| SCR-15 | Offline Banner Component | (Persistent component) | Sync |

---

## 2. Authentication Flow

```mermaid
flowchart TD
    A([App Launch]) --> B{Valid Token\nin MMKV?}
    B -- Yes --> C{Token\nExpired?}
    B -- No --> D[SCR-02: Login Screen]
    C -- No --> E[SCR-04: Dashboard]
    C -- Yes --> F{Refresh\nToken Valid?}
    F -- Yes --> G[Refresh Tokens\nSilently]
    G --> E
    F -- No --> D
    D --> H[Enter Phone Number]
    H --> I[POST /auth/login/request]
    I --> J[SCR-03: OTP Screen]
    J --> K[Enter 6-digit OTP]
    K --> L[POST /auth/login/verify]
    L --> M{OTP Valid?}
    M -- Yes --> N[Store JWT in MMKV]
    N --> E
    M -- No --> O{Attempts < 3?}
    O -- Yes --> P[Show Error, Retry]
    P --> K
    O -- No --> Q[Account Locked 15min]
    Q --> D
```

### 2.1 Screen: SCR-02 — Login Screen
- **Components**: `AppLogo`, `PhoneInput` (flag + number), `RequestOtpButton`
- **Validation**: 10-digit mobile only, formatted as `+91XXXXXXXXXX`
- **States**: Idle → Loading → Error → OTP Sent

### 2.2 Screen: SCR-03 — OTP Verification
- **Components**: `OtpInput` (6 individual cells), `ResendButton` (with 30s cooldown timer), `CountdownTimer`
- **Auto-submit**: triggers `POST /auth/login/verify` when all 6 digits are filled
- **Error States**: Wrong OTP → shake animation + error text | Expired → Resend prompt

---

## 3. Main App Tab Flow

```mermaid
flowchart LR
    E[Authenticated] --> TABS[Bottom Tab Navigator]
    TABS --> T1[📦 Dashboard\nSCR-04]
    TABS --> T2[🚚 Deliveries\nSCR-05]
    TABS --> T3[🗺️ Map\nSCR-06]
    TABS --> T4[↩️ Returns\nSCR-07]
    TABS --> T5[👤 Profile\nSCR-08]

    T1 --> O[Order Detail\nSCR-09]
    T2 --> O
    T3 --> O
```

### 3.1 Screen: SCR-04 — Driver Dashboard

**Layout Sections:**
```
┌─────────────────────────────────────┐
│  Good Morning, Rajan! 🌅            │
│  Today: Wednesday, 18 June 2026      │
├──────────┬──────────┬───────────────┤
│ PENDING  │COMPLETED │  RETURNED     │
│   18     │    4     │     1         │
├──────────┴──────────┴───────────────┤
│  📍 Route: Sector 62, Noida          │
│  Estimated: 24 stops · 18.5 km      │
│  [▶ Start Route]                    │
├─────────────────────────────────────┤
│  TODAY'S EARNINGS                   │
│  ₹420 projected · ₹120 confirmed    │
├─────────────────────────────────────┤
│  QUICK ACTIONS                      │
│  [📞 Call Support] [🗺️ Open Map]   │
└─────────────────────────────────────┘
```

### 3.2 Screen: SCR-05 — Delivery List

**Features:**
- Filter tabs: `All | Pending | Completed | Returned`
- Search bar: by customer name or address
- Sort: by route sequence / distance
- Each `DeliveryCard` shows: Customer name, address snippet, product count, status badge

### 3.3 Screen: SCR-06 — Route Map

**Map Layers:**
- Base: OpenStreetMap tiles via `react-native-maps`
- Driver marker: pulsing blue dot (live position)
- Pending delivery markers: orange pins
- Completed markers: green checkmark pins
- Selected order: info card sliding up from bottom

---

## 4. Delivery Confirmation Flow

```mermaid
flowchart TD
    A[SCR-09: Order Detail] --> B[Tap DELIVER Button]
    B --> C{GPS\nEnabled?}
    C -- No --> D[Prompt: Enable Location]
    D --> C
    C -- Yes --> E{Mock GPS\nDetected?}
    E -- Yes --> F[BLOCK + Log Security Event]
    E -- No --> G{Within\n100m Geofence?}
    G -- No --> H[Show Distance Error\nCannot Confirm]
    G -- Yes --> I[SCR-11: Camera Capture]
    I --> J[Photo Captured?]
    J -- No --> K[Prompt: Photo Required]
    K --> I
    J -- Yes --> L[SCR-10: Confirm Modal]
    L --> M[Add Remarks Optional]
    M --> N[Tap SUBMIT]
    N --> O{Network\nAvailable?}
    O -- Yes --> P[POST /deliveries/confirm]
    P --> Q[Status = COMPLETED ✅]
    O -- No --> R[Queue Locally]
    R --> S[Show Queued Badge ⏳]
    S --> Q
```

### 4.1 Screen: SCR-09 — Order Detail

**Sections:**
```
┌─────────────────────────────────────┐
│ ← Order #1001         [📞 Call]     │
├─────────────────────────────────────┤
│ CUSTOMER                             │
│  Amit Sharma  |  +91 99998 88877    │
│  Apt 4B, Sky Heights, Sector 62     │
├─────────────────────────────────────┤
│ PRODUCTS                             │
│  🫙  15L Water   ×2                 │
│  🥦  Organic Tomatoes  ×1 kg        │
│  🍇  Black Grapes  ×500g            │
├─────────────────────────────────────┤
│ DELIVERY NOTES                       │
│  "Leave near shoe rack"              │
├─────────────────────────────────────┤
│ LOCATION                             │
│  [Map Preview]  →  28.6289, 77.3653 │
│  [Navigate] [View on Maps]           │
├─────────────────────────────────────┤
│ [   ✅  DELIVER   ] [ ↩️  RETURN ]  │
└─────────────────────────────────────┘
```

---

## 5. Return Request Flow

```mermaid
flowchart TD
    A[SCR-09: Order Detail] --> B[Tap RETURN Button]
    B --> C[SCR-12: Return Form Modal]
    C --> D[Select Return Reason]
    D --> E{Partial Return?}
    E -- Yes --> F[Adjust Quantities]
    E -- No --> G[Full Return]
    F & G --> H[Camera: Capture Return Photo]
    H --> I{Photo Captured?}
    I -- No --> J[Alert: Photo Mandatory]
    J --> H
    I -- Yes --> K[Tap SUBMIT RETURN]
    K --> L{Network?}
    L -- Yes --> M[POST /returns/request]
    M --> N[Status = RETURN_PENDING]
    L -- No --> O[Queue Offline]
    O --> N
```

### 5.1 Return Reason Options
```
○ Customer Not Available
○ Customer Rejected Order
○ Product Damaged During Transit
○ Wrong Address / Unable to Locate
○ Quantity Mismatch
○ Customer Requested Cancellation
○ Other (with free-text field)
```

---

## 6. Route Navigation Flow

```mermaid
flowchart TD
    A[SCR-06: Map Screen] --> B[View All Delivery Pins]
    B --> C[Tap Next Stop Pin]
    C --> D[Slide-up: Order Summary Card]
    D --> E[Tap Navigate]
    E --> F{Navigation App\nPreference}
    F -- In-App --> G[Embedded Turn-by-turn\nvia OSM]
    F -- External --> H[Open Google Maps / Waze]
    G & H --> I[Driver Arrives]
    I --> J[Geofence Triggered]
    J --> K[Navigate to SCR-09: Order Detail]
```

---

## 7. Notification Interaction Flow

```mermaid
flowchart TD
    A[FCM Push Received] --> B{App State}
    B -- Foreground --> C[In-App Toast Notification]
    B -- Background/Killed --> D[System Notification Tray]
    C --> E{User Taps?}
    D --> E
    E -- Yes --> F{Notification Type}
    F -- ROUTE_UPDATED --> G[Navigate → SCR-06: Map]
    F -- RETURN_APPROVED --> H[Navigate → SCR-07: Returns]
    F -- EMERGENCY_ALERT --> I[Navigate → SCR-04: Dashboard]
    F -- ORDER_ASSIGNED --> J[Navigate → SCR-09: Order Detail]
    E -- No --> K[Store in Notification Center]
    K --> L[SCR-13: Notification Center Badge +1]
```

---

## 8. Error & Edge Case Flows

### 8.1 Security Violation (Root / Mock GPS)
```
Security Violation Detected
    │
    ▼
SCR-14: Fullscreen Security Block Screen
    │
    ├── Log event to local audit queue
    ├── POST /security/violation (background)
    └── Display: "Device integrity compromised.
                  Contact your supervisor."
        [Only option: Close App]
```

### 8.2 Force Logout (Server-Initiated)
```
Any API call returns 403 with { forceLogout: true }
    │
    ▼
Axios Interceptor catches 403
    │
    ▼
performLogout() executed
    │
    ├── Clear Redux state
    ├── Clear MMKV secureStorage
    └── router.replace('/(auth)/login')
        Banner: "Your session was terminated remotely."
```

### 8.3 Offline State Entry
```
NetInfo: isConnected = false
    │
    ▼
Redux: setNetworkStatus(false)
    │
    ├── Show persistent offline banner
    ├── Disable API-dependent actions (showing local data only)
    └── Enable local queue mode (actions queue to MMKV)
```

---

*Document End — SCREEN_FLOW_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
