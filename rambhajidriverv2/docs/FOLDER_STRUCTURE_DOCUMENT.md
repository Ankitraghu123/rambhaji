# FOLDER STRUCTURE DOCUMENT
## GharTak — Driver Delivery Mobile Application
### Production-Ready Codebase Architecture Blueprint

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Engineering  
**Prepared By:** Senior Engineering Team  

---

## Overview

This document defines the **complete, production-ready folder structure** for the GharTak Driver Delivery App built with **React Native Expo CLI**, **Expo Router**, and **JavaScript**.

The architecture follows **Clean Architecture**, **Feature-Based Module Design**, and **Domain-Driven Design** principles. Every directory has a specific role and clear ownership.

---

## Complete Folder Tree

```
ghartak-driver-app/
│
├── app/                              # [EXPO ROUTER] Navigation Entry Points
│   ├── _layout.js                   # Root layout - providers, error boundary, font loader
│   ├── index.js                     # Splash gate - checks auth state and redirects
│   │
│   ├── (auth)/                      # Authentication Route Group (unauthenticated)
│   │   ├── _layout.js               # Auth layout - redirect if already authenticated
│   │   ├── login.js                 # SCR-02: Mobile number entry screen
│   │   └── otp.js                   # SCR-03: OTP verification screen
│   │
│   ├── (tabs)/                      # Main App Route Group (authenticated tab navigator)
│   │   ├── _layout.js               # Tab bar configuration, icons, badges
│   │   ├── index.js                 # SCR-04: Driver Dashboard (home tab)
│   │   ├── deliveries.js            # SCR-05: Delivery list screen
│   │   ├── map.js                   # SCR-06: Route map screen
│   │   ├── returns.js               # SCR-07: Returns list screen
│   │   └── profile.js               # SCR-08: Driver profile & logout
│   │
│   ├── order/
│   │   └── [id].js                  # SCR-09: Order detail (dynamic route)
│   │
│   └── notifications.js             # SCR-13: Notification center
│
│
├── src/                             # All application source code
│   │
│   ├── components/                  # Shared Reusable UI Components
│   │   ├── common/
│   │   │   ├── AppButton.js         # Primary/secondary/outline button variants
│   │   │   ├── AppInput.js          # Styled text input with label + error state
│   │   │   ├── AppLoader.js         # Full-screen loading spinner
│   │   │   ├── AppModal.js          # Base bottom-sheet modal wrapper
│   │   │   ├── StatusBadge.js       # Order status color badge
│   │   │   ├── OfflineBanner.js     # Red offline warning bar (persistent)
│   │   │   ├── SyncProgressBar.js   # Sync progress indicator
│   │   │   ├── ErrorBox.js          # Inline error message block
│   │   │   ├── EmptyState.js        # Empty list placeholder with icon + message
│   │   │   ├── ConfirmDialog.js     # Generic confirmation alert dialog
│   │   │   └── KeyboardAvoidingWrapper.js  # Keyboard scroll wrapper
│   │   │
│   │   └── layout/
│   │       ├── ScreenWrapper.js     # SafeAreaView + consistent screen padding
│   │       └── SectionHeader.js     # Section label with optional action button
│   │
│   │
│   ├── config/                      # App-Wide Configuration
│   │   ├── constants.js             # API_BASE_URL, GEOFENCE_RADIUS_M, timeouts
│   │   ├── theme.js                 # React Native Paper theme (colors, typography)
│   │   ├── strings.js               # All user-facing text strings (i18n-ready)
│   │   └── appConfig.js             # Feature flags, environment toggles
│   │
│   │
│   ├── core/                        # Framework-Agnostic Core Utilities
│   │   │
│   │   ├── network/
│   │   │   ├── apiClient.js         # Axios instance with base URL + default headers
│   │   │   ├── authInterceptor.js   # Request interceptor: inject Bearer token
│   │   │   ├── refreshInterceptor.js # Response interceptor: handle 401, refresh tokens
│   │   │   └── NetworkMonitor.js    # NetInfo wrapper: online/offline detection
│   │   │
│   │   ├── storage/
│   │   │   ├── mmkvInstances.js     # Exports appStorage and secureStorage instances
│   │   │   └── StorageKeys.js       # Enum of all MMKV key constants
│   │   │
│   │   ├── security/
│   │   │   ├── DeviceValidationService.js  # Root, jailbreak, emulator detection
│   │   │   ├── LocationVerificationService.js # Mock GPS, geofence checks
│   │   │   ├── ScreenSecurityManager.js    # Screenshot/recording prevention
│   │   │   ├── RequestSigner.js     # HMAC request payload signing
│   │   │   └── SecurityEventLogger.js     # Log + transmit security violations
│   │   │
│   │   ├── errors/
│   │   │   ├── AppError.js          # Base custom error class
│   │   │   ├── NetworkError.js      # Network-specific error subclass
│   │   │   ├── AuthError.js         # Authentication error subclass
│   │   │   └── ErrorBoundary.js     # React error boundary component
│   │   │
│   │   ├── utils/
│   │   │   ├── dateUtils.js         # Date formatting, relative time helpers
│   │   │   ├── geoUtils.js          # Haversine distance, coordinate validation
│   │   │   ├── imageUtils.js        # Photo compression via Expo ImageManipulator
│   │   │   ├── formatUtils.js       # Currency, number, phone formatting
│   │   │   └── idUtils.js           # UUID v4 generator for idempotency keys
│   │   │
│   │   └── validators/
│   │       ├── phoneValidator.js    # Validates 10-digit Indian mobile numbers
│   │       ├── otpValidator.js      # Validates 6-digit OTP format
│   │       └── deliveryValidator.js # Validates geofence, GPS, photo before confirm
│   │
│   │
│   ├── features/                    # Domain Feature Modules (Isolated by Feature)
│   │   │
│   │   ├── auth/                    # Authentication Domain
│   │   │   ├── components/
│   │   │   │   ├── PhoneInput.js    # Country-code-aware mobile number input
│   │   │   │   ├── OtpInput.js      # 6-cell OTP input with auto-focus
│   │   │   │   └── ResendTimer.js   # Countdown timer with resend CTA
│   │   │   ├── hooks/
│   │   │   │   ├── useLogin.js      # Manages login form state and OTP request
│   │   │   │   └── useOtpVerify.js  # Manages OTP input state and verification
│   │   │   ├── services/
│   │   │   │   └── AuthService.js   # login(), verifyOtp(), logout(), refreshTokens()
│   │   │   ├── repositories/
│   │   │   │   └── AuthRepository.js # API calls: POST /auth/login/request & /verify
│   │   │   └── state/
│   │   │       ├── authSlice.js     # Redux slice: driver profile, isAuthenticated
│   │   │       └── authThunks.js    # Async thunks for login and token operations
│   │   │
│   │   ├── routes/                  # Route & Navigation Domain
│   │   │   ├── components/
│   │   │   │   ├── RouteMap.js      # Full-screen map with all delivery pins
│   │   │   │   ├── DeliveryPin.js   # Custom marker component (pending/done/active)
│   │   │   │   ├── RouteSummaryCard.js # Slide-up card for selected delivery
│   │   │   │   └── EtaDisplay.js    # ETA and distance to next stop
│   │   │   ├── hooks/
│   │   │   │   ├── useLiveLocation.js   # Expo Location: watch position
│   │   │   │   └── useRouteNavigator.js # Handles navigation sequencing
│   │   │   ├── services/
│   │   │   │   └── RouteService.js  # Optimized route ordering, ETA calculations
│   │   │   ├── repositories/
│   │   │   │   └── RouteRepository.js   # API + MMKV: GET /routes/today, cache write
│   │   │   └── state/
│   │   │       ├── routeSlice.js
│   │   │       └── routeSelectors.js
│   │   │
│   │   ├── deliveries/              # Delivery Execution Domain
│   │   │   ├── components/
│   │   │   │   ├── DeliveryCard.js  # List item: customer name, address, status badge
│   │   │   │   ├── OrderDetailHeader.js # Customer info + call button
│   │   │   │   ├── OrderItemList.js # Product list: category icon + qty
│   │   │   │   ├── DeliveryActionBar.js # DELIVER + RETURN buttons row
│   │   │   │   ├── PodCaptureModal.js   # Bottom sheet: camera, remarks, submit
│   │   │   │   └── GeofenceAlert.js # Error dialog when outside geofence
│   │   │   ├── hooks/
│   │   │   │   ├── useGeofenceCheck.js  # Validates driver is within 100m
│   │   │   │   ├── usePodCapture.js     # Camera open, photo compress, URI store
│   │   │   │   └── useDeliveryConfirm.js # Orchestrates full delivery confirm flow
│   │   │   ├── services/
│   │   │   │   └── DeliveryService.js   # confirmDelivery() — validates, queues, submits
│   │   │   ├── repositories/
│   │   │   │   └── DeliveryRepository.js # POST /deliveries/confirm (multipart)
│   │   │   └── state/
│   │   │       ├── deliverySlice.js
│   │   │       └── deliveryThunks.js
│   │   │
│   │   ├── returns/                 # Returns Management Domain
│   │   │   ├── components/
│   │   │   │   ├── ReturnFormModal.js    # Bottom sheet: reason, qty, photo, submit
│   │   │   │   ├── ReturnReasonSelector.js # Predefined reasons radio list
│   │   │   │   ├── QuantityAdjuster.js  # + / - quantity control
│   │   │   │   └── ReturnStatusCard.js  # Displays status (Pending/Approved/Rejected)
│   │   │   ├── hooks/
│   │   │   │   └── useReturnFlow.js     # Manages return form state
│   │   │   ├── services/
│   │   │   │   └── ReturnService.js     # submitReturn() — validates, queues
│   │   │   ├── repositories/
│   │   │   │   └── ReturnRepository.js  # POST /returns/request (multipart)
│   │   │   └── state/
│   │   │       ├── returnSlice.js
│   │   │       └── returnSelectors.js
│   │   │
│   │   ├── dashboard/               # Dashboard Domain
│   │   │   ├── components/
│   │   │   │   ├── StatsCard.js         # Reusable stat counter card
│   │   │   │   ├── EarningsSummary.js   # Projected + confirmed earnings widget
│   │   │   │   ├── RouteStatusWidget.js # Active route: stops + distance
│   │   │   │   └── QuickActions.js      # Call Support, Open Map CTAs
│   │   │   ├── hooks/
│   │   │   │   └── useDashboardStats.js # Derived stats from routeSlice
│   │   │   └── services/
│   │   │       └── DashboardService.js  # Aggregates daily performance data
│   │   │
│   │   ├── sync/                    # Offline Sync Domain
│   │   │   ├── services/
│   │   │   │   ├── QueueManager.js      # Enqueue, update, remove queue items
│   │   │   │   └── SyncEngine.js        # Sync orchestrator: FIFO processor
│   │   │   ├── constants/
│   │   │   │   └── queueActionTypes.js  # Enum: ORDER_DELIVER, ORDER_RETURN, etc.
│   │   │   └── state/
│   │   │       ├── syncSlice.js
│   │   │       └── syncSelectors.js
│   │   │
│   │   ├── notifications/           # Push Notification Domain
│   │   │   ├── components/
│   │   │   │   ├── NotificationItem.js  # Single notification list row
│   │   │   │   └── NotificationBadge.js # Unread count badge overlay
│   │   │   ├── services/
│   │   │   │   ├── NotificationService.js  # Register token, handle deep links
│   │   │   │   └── PushHandler.js          # FCM payload parser and router
│   │   │   └── state/
│   │   │       ├── notificationSlice.js
│   │   │       └── notificationSelectors.js
│   │   │
│   │   └── tracking/                # Audit Logging & Activity Tracking Domain
│   │       ├── services/
│   │       │   ├── AuditLoggerService.js  # Log events to MMKV queue
│   │       │   └── AuditBatchUploader.js  # Batch transmit: POST /telemetry/audit-logs
│   │       └── constants/
│   │           └── auditEventTypes.js     # Enum: LOGIN, LOGOUT, DELIVERY_CONFIRMED, etc.
│   │
│   │
│   └── store/                       # Redux Toolkit Global Store
│       ├── index.js                 # configureStore() with all middleware
│       ├── rootReducer.js           # combineReducers()
│       └── middleware/
│           └── syncMiddleware.js    # Triggers SyncEngine on network state change
│
│
├── assets/                          # Static Assets
│   ├── images/
│   │   ├── logo.png                 # GharTak app logo
│   │   ├── splash.png               # Splash screen image
│   │   ├── empty-deliveries.png     # Empty state illustration
│   │   └── offline-illustration.png # Offline state illustration
│   └── fonts/
│       ├── Inter-Regular.ttf
│       ├── Inter-Medium.ttf
│       ├── Inter-SemiBold.ttf
│       └── Inter-Bold.ttf
│
│
├── docs/                            # Project Documentation
│   ├── PRODUCT_REQUIREMENT_DOCUMENT.md
│   ├── SYSTEM_DESIGN_DOCUMENT.md
│   ├── SOFTWARE_ARCHITECTURE_DOCUMENT.md
│   ├── TECHNICAL_ARCHITECTURE_DOCUMENT.md
│   ├── SECURITY_ACCESS_CONTROL_DOCUMENT.md
│   ├── DATABASE_MAPPING_DOCUMENT.md
│   ├── API_INTEGRATION_DOCUMENT.md
│   ├── FEATURE_TICKETS_DOCUMENT.md
│   ├── OFFLINE_SYNC_DOCUMENT.md
│   ├── STATE_MANAGEMENT_DOCUMENT.md
│   ├── SCREEN_FLOW_DOCUMENT.md
│   ├── DRIVER_USER_MANUAL.md
│   ├── TESTING_CHECKLIST.md
│   ├── SECURITY_TESTING_CHECKLIST.md
│   └── FOLDER_STRUCTURE_DOCUMENT.md
│
│
├── .env                             # Environment variables (gitignored)
├── .env.example                     # Template for required env vars
├── .gitignore                       # Git ignore rules
├── .eslintrc.js                     # ESLint configuration
├── .prettierrc                      # Prettier code formatting rules
├── app.json                         # Expo application configuration
├── babel.config.js                  # Babel presets (expo + module aliases)
├── package.json                     # NPM dependencies and scripts
└── README.md                        # Project setup and developer guide
```

---

## Directory Responsibility Summary

| Directory | Owner Domain | Key Responsibility |
|-----------|-------------|-------------------|
| `app/` | Navigation | Route definitions via Expo Router |
| `src/components/common/` | UI | Shared, framework-agnostic components |
| `src/config/` | Configuration | Constants, theme, strings, feature flags |
| `src/core/network/` | Infrastructure | Axios client, interceptors, network monitoring |
| `src/core/storage/` | Infrastructure | MMKV instance management |
| `src/core/security/` | Security | Root detection, GPS validation, screen protection |
| `src/core/utils/` | Utilities | Pure helper functions (geo, date, image, format) |
| `src/features/auth/` | Auth Domain | OTP flow, JWT management, session control |
| `src/features/routes/` | Route Domain | Map rendering, GPS tracking, navigation |
| `src/features/deliveries/` | Delivery Domain | POD workflow, geofence checks, confirmation |
| `src/features/returns/` | Returns Domain | Return flow, quantity adjustment, proof capture |
| `src/features/sync/` | Sync Domain | Offline queue, sync engine, retry logic |
| `src/features/notifications/` | Notification Domain | FCM token, push handling, deep linking |
| `src/features/tracking/` | Audit Domain | Event logging, batch upload |
| `src/store/` | State | Redux store config, root reducer, middleware |
| `docs/` | Documentation | All 15 enterprise architecture documents |

---

## Module Dependency Rules (Enforced)

```
┌─────────────────────────────────────────────────────────┐
│                    DEPENDENCY RULES                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  app/  →  src/features/*  →  src/core/*                 │
│                                                          │
│  features/* →  store/  →  components/common/             │
│                                                          │
│  ❌  features/deliveries/ CANNOT import features/auth/  │
│  ❌  core/ CANNOT import features/*                     │
│  ❌  components/common/ CANNOT import features/*        │
│  ✅  features/* CAN use store/ dispatches               │
│  ✅  features/* CAN use core/ utilities                 │
│  ✅  features/* CAN use components/common/              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Key Configuration Files

### `.env.example`
```env
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://api.ghartak.com/api/v1
EXPO_PUBLIC_APP_ENV=development

# Firebase
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ghartak-prod

# Geofence
EXPO_PUBLIC_GEOFENCE_RADIUS_METERS=100

# Security
EXPO_PUBLIC_MAX_OTP_ATTEMPTS=3
EXPO_PUBLIC_OTP_EXPIRY_SECONDS=300
EXPO_PUBLIC_JWT_ACCESS_EXPIRY_MINUTES=15
```

### `babel.config.js` (Module Aliases)
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './src/components',
            '@core': './src/core',
            '@features': './src/features',
            '@store': './src/store',
            '@config': './src/config',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};
```

---

## File Count Summary

| Category | Approximate File Count |
|----------|----------------------|
| Expo Router screens | 10 |
| Feature components | 30 |
| Common components | 12 |
| Services | 18 |
| Repositories | 7 |
| Hooks | 12 |
| Redux slices + selectors | 14 |
| Core utilities | 16 |
| Configuration files | 8 |
| Documentation | 15 |
| **Total** | **~142 files** |

---

*Document End — FOLDER_STRUCTURE_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
