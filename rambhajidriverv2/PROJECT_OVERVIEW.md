r├── eas.json                      # EAS Build config
└── package.json                  # Dependencies
```

---

## 🖥️ Screens — Har Screen Ka Kaam

### 1. 🔐 Login Screen — `app/(auth)/login.js`
**Sabse badi file — 676 lines** — World-class cinematic login experience.

**Features:**
- Phone number + Password login
- India 🇮🇳 +91 country code picker
- Password show/hide toggle (👁️)
- Form validation via `react-hook-form`
- Error messages (server errors, timeout messages in Hindi!)
- Server connect hone mein time lage to friendly Hindi message: *"Server wake ho raha hai..."*

**Animations (8 types on this screen alone!):**
| Animation | Description |
|-----------|-------------|
| 🌊 **Parallax Clouds** | 2 clouds continuously moving left-right at different speeds |
| 🍃 **Floating Particles** | 8 emoji particles (🍃🍅💧🌿✨🥕🍋🌱) float bottom to top with swing |
| 🏍️ **Scooter Entry** | Scooter + rider slides in from left with bounce, exhaust puff |
| ✨ **Sparkle Burst** | 8-directional star explosion on scooter arrival |
| 💡 **Glow Ring** | Breathing glow halo under the logo (pulsing opacity) |
| 🍀 **Logo Float** | Logo continuously floats up-down (-8 to +6) with slight rotation |
| 🏷️ **Badge Pulse** | "DELIVERY PORTAL" badge scales 1.0→1.12 rhythmically |
| ✨ **Button Shimmer** | Login button me light sweep animation chalti rehti hai |
| 🌈 **BG Gradient Pulse** | Background color subtle `#FAF6F0 → #F1F9F6` breathes |
| 🎯 **Input Focus Glow** | Phone/Password field green glow aata hai focus pe |

---

### 2. 🏠 Dashboard — `app/(tabs)/index.js`
Driver ka main home screen with today's stats.

**Features:**
- Time-based greeting (Good Morning / Afternoon / Evening)
- 4 Stat cards: Pending 🚚, Delivered ✅, Returned ↩️, Replacement 🔄
- Online/Offline status indicator with `PulsingDot`
- Today's orders list with category emoji
- Pull-to-refresh
- Total distance calculation

**Animations:**
| Animation | Description |
|-----------|-------------|
| 🔔 **Bell Ring** | Notification bell shakes (±18deg) every 4 seconds |
| 💬 **Greeting Fade** | Welcome text fades up on mount |
| 🃏 **AnimatedCard** | Each stat card slides up with staggered delay |

---

### 3. 📋 Order Detail — `app/order/[id].js`
**Sabse complex screen — 887 lines!** Yahan delivery actually complete hoti hai.

**Features:**
- Order info (customer name, address, phone, items list)
- **GPS Location Verification** — Delivery tabhi ho sakti hai jab driver nearby ho
- **Camera Integration** — Delivery proof photo lena mandatory
- **Delivery Flow:** Photo → Location Tag → Submit
- **Return Flow:** Item select → Reason → Photo → Submit
- **Replacement Flow:** Item select → Notes → Submit
- COD amount display + Call customer button
- Offline queue — internet nahi hai to queue mein save ho jata hai

**Animations:**
| Animation | Description |
|-----------|-------------|
| ⏳ **PageLoader** | Premium loading screen (1.2 sec transition) |
| 🎉 **ConfettiRain** | Colourful confetti delivery success pe |
| ✅ **SuccessCheckmark** | Spring-in animated green check |
| 📤 **SlideInSheet** | Bottom sheet modals slide up smoothly |

---

### 4. 🗺️ Map Screen — `app/(tabs)/map.js`
Live route map with all delivery stops.

**Features:**
- **Leaflet.js + OpenStreetMap** tiles via WebView
- **Nearest-Neighbor Algorithm** — Closest stops pehle dikhata hai
- Color-coded markers: Blue (Assigned), Orange (In Transit), Green (Completed), Red (Returned)
- Driver's current location (GPS) with custom pin
- Order cards float above map
- **Google Maps integration** — Tap karo aur Maps mein open ho jata hai
- Route polylines orders ko connect karti hain

**Animations:**
- Floating order cards slide in from bottom
- Live location update with smooth marker transition
- `PulsingDot` — Online status indicator

---

### 5. 📦 Deliveries List — `app/(tabs)/deliveries.js`
All today's orders with filters and search.

**Features:**
- Filter tabs: All / Pending / Completed
- Search by customer name or order ID
- Status-colored badges
- Tap to open Order Detail

**Animations:**
- Each order card: `AnimatedCard` with staggered delay (index × 65ms)
- `NoOrdersAnim` — Hovering box when empty
- `AnimatedPressable` — Bouncy button press

---

### 6. 🛒 Available Orders — `app/(tabs)/available-orders.js`
New orders claim karo yahan se.

**Features:**
- Unclaimed orders list
- Claim button with loading state
- COD vs Prepaid badges
- Distance & estimated amount display
- Category emoji (💧 Water, 🍎 Fruits, 🥬 Veggies)

**Animations:**
- `AnimatedCard` with `index × 80ms` stagger
- `AnimatedPressable` on Claim button

---

### 7. 👤 Profile Screen — `app/(tabs)/profile.js`
Driver ki profile aur app stats.

**Features:**
- Driver name, phone, role display
- Today's stats summary
- Pending sync count
- Last sync timestamp (`timeAgo` format)
- Logout button with confirmation

**Animations:**
- `AnimatedCard` with stagger for each section

---

### 8. ↩️ Returns Screen — `app/(tabs)/returns.js`
Return aur replacement requests.

---

### 9. 🔧 Admin Panel — `app/(tabs)/admin.js`
Admin-only features (driver management, etc.)

---

## 🎭 Animations Library — `src/components/common/Motion.js`

Yeh file pure app ka **central animation hub** hai — **1021 lines** ke saath. Isme sab reusable animation components hain.

### Complete Animations List:

| Component | Kya Karta Hai |
|-----------|--------------|
| **`PulsingDot`** | Green dot jo breathe karta hai (opacity 0.4→1.0 loop) — Live status indicator |
| **`AnimatedCard`** | Card fade in + slide up from bottom, spring animation, stagger delay support |
| **`AnimatedPressable`** | Button press pe scale 1→0.95 (snap down), spring back on release |
| **`SlideInSheet`** | Bottom sheet slide up/down — fade + spring combo |
| **`Shimmer`** | Diagonal light sweep across any view (skeleton loading) |
| **`SkeletonCard`** | Full shimmer placeholder card — jab data load ho raha ho |
| **`SuccessCheckmark`** | Green circle spring-pops in, checkmark fades in — delivery done! |
| **`ConfettiRain`** | 45 colourful pieces rain down from top with rotation + sway |
| **`ToastNotification`** | Spring-slides in from top, auto-dismisses after 3.5s |
| **`ExpandableFAB`** | Floating Action Button — expand/collapse mini buttons with spring |
| **`NumberCounter`** | Number changes pe scale 1→1.35 spring bounce |
| **`TypingText`** | Typewriter character-by-character text reveal |
| **`CharacterWalk`** | Emoji character bounce + tilt animation (walking effect) |
| **`LocationSearch`** | 📍 pin ke around 🔍 orbits, pulse ring expands |
| **`NoInternetAnim`** | Two staggered wifi rings expand + fade (offline indicator) |
| **`NoOrdersAnim`** | 📦 box hovers up-down, 📄 paper rocks side-to-side |
| **`MaintenanceAnim`** | ⚙️ gear continuously rotates, 🔧 wrench sways ±25deg |
| **`PageNotFoundAnim`** | "404" bounces up-down, 🤖 robot hovers + "Lost?" speech bubble |
| **`OrderTimelineAnim`** | Step-by-step delivery progress tracker with color states |

---

## 🔄 Offline Sync Engine — `src/features/sync/services/SyncEngine.js`

Yeh app ka **sabse important engineering feature** hai.

### Kaise Kaam Karta Hai:

```
Driver → Action (Deliver/Return/Replace)
    ↓
Internet Available?
    ├── YES → Direct API call
    └── NO  → MMKV Queue mein save
                    ↓
              Network wapas aaya
                    ↓
              SyncEngine.triggerSync()
                    ↓
              Queue items FIFO process
                    ↓
              Success → Mark SYNCED
              Fail → Retry with Exponential Backoff
              Max retries → Mark DEAD
```

### Queue Action Types:
- `ORDER_DELIVER` — Delivery complete karna
- `ORDER_RETURN` — Return request
- `ORDER_REPLACE` — Replacement request

### Retry Strategy:
- **Exponential backoff:** `delay = min(baseDelay × 2^retryCount, maxDelay)`
- **Max retries:** Configurable `MAX_RETRY_COUNT`
- **Dead letter queue:** Failed items marked `DEAD`

### API Submission:
- `multipart/form-data` — Photo attach hokar jaati hai
- `/mark-delivered` — Delivery API
- `/return-item` — Return/Replace API (per item)

---

## 🔐 Authentication System — `src/features/auth/`

### Login Flow:
```
User → Phone + Password
    ↓
AuthRepository.loginWithPassword()
    ↓
API: POST /login
    ↓
Response: { success, token, user }
    ↓
secureStorage (MMKV) → token + driver profile save
    ↓
Redux: setDriver(driver)
    ↓
NotificationService.registerForPushNotifications()
TelemetryService.logEvent('LOGIN')
TelemetryService.startScheduler()
    ↓
router.replace('/(tabs)/')
```

### Session Hydration:
- App open hone pe `AuthService.hydrateSession()` MMKV se token + profile restore karta hai
- Agar valid session mili → Direct dashboard
- Nahi mili → Login screen

---

## 🌐 API Layer — `src/core/network/`

### Files:
| File | Kaam |
|------|------|
| `apiClient.js` | Axios instance with base URL, headers |
| `refreshInterceptor.js` | Auto token refresh on 401 responses |
| `NetworkMonitor.js` | Real-time online/offline detection (NetInfo) |

### Features:
- **Auto token refresh** — Token expire ho to silently refresh karta hai
- **Request queuing** — Offline pe requests queue ceases
- **Error normalization** — Consistent error format across app

---

## 📦 State Management — Redux Store

### Slices:
| Slice | State |
|-------|-------|
| `authSlice` | driver, loading, error, isAuthenticated |
| `routeSlice` | orders[], incomingOrder, loading, totalDistanceKm |
| `syncSlice` | isOnline, isSyncing, pendingCount, lastSyncAt |
| `notificationSlice` | notifications[], unreadCount |
| `availableOrdersSlice` | availableOrders[], loading, error |

---

## 📍 GPS & Security — `src/core/security/LocationVerificationService.js`

- Driver ko delivery ke time **customer ke paas hona zaroori hai**
- GPS coordinates compare karta hai (Haversine distance formula)
- Location mismatch hone pe delivery block ho jaati hai
- Security violation screen show hoti hai

---

## 📸 Camera Integration

- **Delivery Proof Photo** — Mandatory before marking delivered
- `expo-camera` (CameraView component)
- Photo `multipart/form-data` mein API ko bhejti hai
- Offline hone pe locally save hoti hai, sync pe upload hoti hai
- `expo-image-manipulator` se image compress bhi hoti hai

---

## 🔔 Push Notifications — `src/features/notifications/`

- `expo-notifications` se push token register hota hai
- **Incoming Order Modal** — Zomato/Swiggy style popup
  - Bottom se slide up karta hai
  - **30-second countdown** with ring indicator
  - Urgency — last 10 seconds pe red ho jaata hai
  - Auto-reject if no action in 30 seconds
  - Phone vibrate hoti hai

---

## 📊 Telemetry — `src/features/tracking/`

- `TelemetryService` driver actions log karta hai
- Events: LOGIN, DELIVER, RETURN, REPLACE, LOGOUT
- Background scheduler se periodic location updates

---

## 🎨 Design System

### Color Palette:
| Color | Hex | Use |
|-------|-----|-----|
| **Primary Green** | `#2E9D6A` | Buttons, accents, active states |
| **Dark Green** | `#0E4A35` | Toast backgrounds, deep accents |
| **Warm Cream** | `#FAF6F0` | Background |
| **Light Cream** | `#F1F9F6` | Card backgrounds |
| **Amber** | `#D97706` | Pending status |
| **Red** | `#DC2626` | Error, returned status |
| **Blue** | `#2563EB` | In-transit, info |
| **Text Dark** | `#2C2B29` | Primary text |
| **Text Muted** | `#7E7A74` | Secondary text |

### Typography:
- System fonts (platform native)
- Custom weights: 400, 600, 700, bold
- Letter spacing on badges: 1.8–2px

### Card Design:
- `borderRadius: 28` — Rounded cards
- `glassmorphism` inspired — white bg with green shadow
- `elevation: 8` on Android
- `overflow: 'hidden'` for clean animations

---

## 📱 App Permissions Required

| Permission | Reason |
|-----------|--------|
| `ACCESS_FINE_LOCATION` | Delivery address GPS verification |
| `ACCESS_COARSE_LOCATION` | Approximate location for routing |
| `CAMERA` | Delivery proof photo capture |
| `VIBRATE` | Incoming order alert haptic |
| `RECORD_AUDIO` | Camera audio (required by Android) |

---

## 🔑 Key Libraries & Their Use

| Library | Version | Kaise Use Hota Hai |
|---------|---------|-------------------|
| `expo-router` | ~6.0.24 | File-based navigation |
| `react-native-mmkv` | ^2.11.0 | Secure fast storage (tokens, queue) |
| `react-native-maps` | 1.20.1 | Map rendering (backup) |
| `react-native-webview` | 13.15.0 | Leaflet map HTML rendering |
| `react-native-reanimated` | ~4.1.1 | Advanced animations |
| `react-native-gesture-handler` | ~2.28.0 | Gesture handling |
| `expo-camera` | ~17.0.10 | Photo capture |
| `expo-location` | ~19.0.8 | GPS |
| `expo-notifications` | ~0.32.17 | Push notifications |
| `@reduxjs/toolkit` | ^2.3.0 | State management |
| `axios` | ^1.7.7 | HTTP client |
| `react-hook-form` | ^7.53.2 | Form validation |
| `date-fns` | ^3.6.0 | Date formatting |

---

## 🚀 Build & Deploy

```bash
# Development
npm start           # Expo dev server

# Android
npm run android     # expo run:android

# Production Build (EAS)
eas build --platform android --profile production
```

**EAS Project ID:** `f835da62-6647-4ceb-901b-4067c6b1fc0c`  
**Owner:** `ishhexpo`  
**Bundle ID (Android):** `com.rambhaji.driver`  
**Bundle ID (iOS):** `com.rambhaji.driver`

---

## 📈 Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Login (Phone + Password) | ✅ | |
| Dashboard Stats | ✅ | |
| Delivery List | ✅ | Filters + Search |
| Order Detail | ✅ | Full flow |
| GPS Verification | ✅ | Haversine distance |
| Camera Proof | ✅ | Mandatory |
| Return Flow | ✅ | Item-level |
| Replacement Flow | ✅ | Item-level |
| Offline Queue | ✅ | MMKV + FIFO |
| Auto Sync | ✅ | Exponential backoff |
| Map View | ✅ | Leaflet + OSM |
| Route Optimization | ✅ | Nearest Neighbor |
| Push Notifications | ✅ | Incoming orders |
| Incoming Order Modal | ✅ | 30sec countdown |
| Available Orders | ✅ | Claim system |
| Admin Panel | ✅ | |
| OTP Auth | 🔶 | Partial |

---

## 🧩 Architecture Summary

```
┌─────────────────────────────────────────┐
│           EXPO ROUTER (UI Layer)         │
│  app/(auth)/  │  app/(tabs)/  │ app/order│
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        REDUX STORE (State Layer)         │
│  authSlice │ routeSlice │ syncSlice      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      FEATURE SERVICES (Business Logic)   │
│  AuthService │ RouteService │ SyncEngine │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        CORE LAYER (Infrastructure)       │
│  apiClient │ MMKV Storage │ GPS Security │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         EXTERNAL SERVICES                │
│  FreshBox API │ OpenStreetMap │ FCM Push │
└─────────────────────────────────────────┘
```

---

*Generated: 2026-07-01 | Ram Bhaji Driver App v1.0.0*
