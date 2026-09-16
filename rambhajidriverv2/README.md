# GharTak Driver Delivery App

> Enterprise-grade delivery management application for GharTak Fresh Box Subscription Platform.  
> Built with **React Native Expo CLI**, **Expo Router**, **Redux Toolkit**, and **Offline-First Architecture**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo CLI) |
| Navigation | Expo Router |
| State Management | Redux Toolkit |
| API Client | Axios |
| Local Storage | MMKV (react-native-mmkv) |
| Forms | React Hook Form |
| UI Components | React Native Paper |
| Maps | React Native Maps (OpenStreetMap) |
| Location | Expo Location |
| Camera | Expo Camera |
| Notifications | Expo Notifications + Firebase FCM |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Fill in your API base URL, Firebase config, etc.

# 3. Start the development server
npx expo start

# 4. Run on Android
npx expo run:android

# 5. Run on iOS
npx expo run:ios
```

---

## Project Structure

See [`docs/FOLDER_STRUCTURE_DOCUMENT.md`](./docs/FOLDER_STRUCTURE_DOCUMENT.md) for the complete architecture guide.

```
ghartak-driver-app/
├── app/          # Expo Router navigation
├── src/
│   ├── components/   # Shared UI components
│   ├── config/       # App constants, theme, strings
│   ├── core/         # Network, storage, security, utils
│   ├── features/     # Domain modules (auth, routes, deliveries…)
│   └── store/        # Redux Toolkit store
├── assets/       # Images and fonts
└── docs/         # 15 enterprise architecture documents
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](./docs/PRODUCT_REQUIREMENT_DOCUMENT.md) | Business goals, user journeys, requirements |
| [System Design](./docs/SYSTEM_DESIGN_DOCUMENT.md) | Architecture, data flow, security topology |
| [Software Architecture](./docs/SOFTWARE_ARCHITECTURE_DOCUMENT.md) | Layers, patterns, repositories |
| [Technical Architecture](./docs/TECHNICAL_ARCHITECTURE_DOCUMENT.md) | Coding standards, folder rules |
| [Security & Access Control](./docs/SECURITY_ACCESS_CONTROL_DOCUMENT.md) | Auth, fraud prevention, device security |
| [Database Mapping](./docs/DATABASE_MAPPING_DOCUMENT.md) | MySQL schemas, indexes |
| [API Integration](./docs/API_INTEGRATION_DOCUMENT.md) | All REST endpoints with payloads |
| [Feature Tickets](./docs/FEATURE_TICKETS_DOCUMENT.md) | Development backlog with acceptance criteria |
| [Offline Sync](./docs/OFFLINE_SYNC_DOCUMENT.md) | Queue, sync engine, retry policies |
| [State Management](./docs/STATE_MANAGEMENT_DOCUMENT.md) | Redux slices, thunks, selectors |
| [Screen Flow](./docs/SCREEN_FLOW_DOCUMENT.md) | Navigation diagrams for all user flows |
| [Driver User Manual](./docs/DRIVER_USER_MANUAL.md) | End-user operations guide |
| [Testing Checklist](./docs/TESTING_CHECKLIST.md) | QA verification checklist |
| [Security Testing](./docs/SECURITY_TESTING_CHECKLIST.md) | OWASP Mobile Top 10 security tests |
| [Folder Structure](./docs/FOLDER_STRUCTURE_DOCUMENT.md) | Complete codebase blueprint |

---

## Architecture Principles

- **Clean Architecture** — Domain logic is isolated from framework code
- **Offline-First** — App works fully without network connectivity
- **SOLID Principles** — Every module has a single, clear responsibility
- **Repository Pattern** — Data sources are abstracted behind interfaces
- **Feature-Based Modules** — Code is co-located by domain, not type
- **Security by Default** — Root detection, geofence enforcement, AES-256 storage

---

## License

Proprietary — © 2026 GharTak Technologies. All rights reserved.
