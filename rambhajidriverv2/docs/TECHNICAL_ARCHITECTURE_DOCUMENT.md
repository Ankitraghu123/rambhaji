# TECHNICAL ARCHITECTURE DOCUMENT
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
1. [Introduction](#1-introduction)
2. [Folder Structure Schema](#2-folder-structure-schema)
3. [Coding Standards & ESLint Guidelines](#3-coding-standards--eslint-guidelines)
4. [Naming Conventions](#4-naming-conventions)
5. [Module Separation & Dependency Rules](#5-module-separation--dependency-rules)
6. [Dependency Management Plan](#6-dependency-management-plan)
7. [Scalability & Extension Planning](#7-scalability--extension-planning)
8. [Maintainability Guidelines](#8-maintainability-guidelines)

---

## 1. Introduction

This Technical Architecture Document defines the coding conventions, directory structures, dependencies, scalability plans, and maintainability practices for the **GharTak Driver Delivery App**. 

Following these guidelines ensures that the codebase remains clean, easy to read, and modular as the team scales from a few developers to dozens.

---

## 2. Folder Structure Schema

The application uses an **Expo Router** convention combined with a domain-based feature structure.

```
/
├── app/                      # Expo Router Navigation Layer
│   ├── (auth)/               # Authentication routing boundary
│   │   ├── login.js
│   │   └── otp.js
│   ├── (tabs)/               # Main app tab layout
│   │   ├── index.js          # Dashboard Screen
│   │   ├── deliveries.js     # Active Route list
│   │   ├── returns.js        # Returns screen
│   │   └── profile.js        # Profile & status screen
│   │   └── map.js            # Route Map Screen
│   ├── order/
│   │   └── [id].js           # Order detail screen
│   ├── _layout.js            # Root routing configuration
│   └── index.js              # Application entry gate
│
├── src/                      # Application Source Code
│   ├── components/           # Shared UI Components
│   │   └── common/           # Custom Reusable Buttons, Input, Spinners
│   │
│   ├── config/               # System configurations, styles, variables
│   │   ├── constants.js
│   │   └── theme.js
│   │
│   ├── core/                 # Shared core utilities and abstractions
│   │   ├── errors/
│   │   ├── utils/
│   │   └── validators/
│   │
│   ├── features/             # Feature Modules (Domain Isolated)
│   │   ├── auth/
│   │   ├── deliveries/
│   │   ├── routes/
│   │   ├── returns/
│   │   ├── sync/
│   │   └── tracking/
│   │
│   └── store/                # Redux Toolkit global store config
│       ├── rootReducer.js
│       └── index.js
│
├── package.json
└── app.json
```

---

## 3. Coding Standards & ESLint Guidelines

### 3.1 JavaScript Coding Guidelines
- **Modern JavaScript**: Standardized on ES6+ features (destructuring, arrow functions, async/await, template literals).
- **Asynchronous Code**: Use standard `try/catch` syntax for async operations instead of nested promise chains (`.then()`).
- **Hook Rules**: Custom hooks must begin with the `use` prefix (e.g., `useLocationTracker`). State hooks must be executed only at the top level of React functions.
- **Pure Functions**: Business logic helper modules must be implemented as pure, side-effect-free functions to simplify testing.

### 3.2 ESLint Configurations
```json
{
  "extends": [
    "expo",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-unused-vars": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "curly": "error",
    "eqeqeq": ["error", "always"]
  }
}
```

---

## 4. Naming Conventions

### 4.1 File & Directory Structures
- **React Components**: CamelCase starting with an uppercase letter (e.g., `DeliveryCard.js`, `RouteSummary.js`).
- **Standard JS Files/Hooks**: camelCase starting with a lowercase letter (e.g., `useLocation.js`, `apiClient.js`).
- **Directories**: lowercase kebab-case (e.g., `order-details`, `common`).

### 4.2 Symbols & Logic Code
- **Functions/Variables**: camelCase (e.g., `confirmDelivery`, `orderId`).
- **Constants/Enums**: UPPERCASE with underscores (e.g., `MAX_RETRY_COUNT`, `STATUS_PENDING`).
- **Styles**: Defined using StyleSheet objects, named camelCase with a `styles` suffix (e.g., `const styles = StyleSheet.create(...)`).

---

## 5. Module Separation & Dependency Rules

To keep the application modular and prevent complex dependency chains:

```
[ app/ Navigation & Routing ]
            |
            v
[ src/features/ Domain Modules ] <---- No direct inter-dependencies!
            |
            +------------+------------+
            |                         |
            v                         v
[ src/components/common ]    [ src/store/ Redux Store ]
            |                         |
            +------------+------------+
                         |
                         v
           [ src/core/ Shared Utils ]
```

### 5.1 Rules for Features
1. **No direct cross-imports**: Files inside `features/deliveries` must never import files from `features/auth` or `features/routes`.
2. **Communication through Redux**: Inter-feature state interactions are managed through the central Redux store.
3. **Common extraction**: If a component is shared between features, it must be promoted to `src/components/common`.

---

## 6. Dependency Management Plan

The project uses **Yarn** or **NPM Lockfiles** to pin all packages to exact, tested versions.

### 6.1 Critical App Dependencies
- **State Store**: `@reduxjs/toolkit` & `react-redux`
- **Networking**: `axios`
- **Storage Database**: `react-native-mmkv`
- **Layout & Base UI**: `react-native-paper`
- **Form Engine**: `react-hook-form`
- **Maps**: `react-native-maps`
- **Location Drivers**: `expo-location`
- **Notifications**: `expo-notifications`

---

## 7. Scalability & Extension Planning

To support expansion from 10 to 50,000 drivers:

### 7.1 Data Storage Upgrades
The current MMKV key-value model works well for active delivery lists. If future updates require offline history searches across millions of past deliveries:
- The `IDeliveryRepository` contract can be re-routed to a **SQLite** database implementation.
- The presentation layer and components will not need modification, as the repository contract abstracts away the database driver.

### 7.2 Multi-Language Architecture (i18n)
All UI text strings must be stored in `src/config/strings.js` instead of being hardcoded in components. This makes it easy to integrate translation frameworks like `i18n-js` when the app needs to support regional languages.

---

## 8. Maintainability Guidelines

- **Self-Documenting Code**: Choose descriptive variable and function names. Comments should explain the *why*, not the *how*.
- **Dry Execution (DRY)**: Abstract duplicate UI panels, calculations, and data validations into reusable components or helper modules.
- **Strict Size Limits**: Component files should be kept under **250 lines of code**. If a view grows beyond this, break it down into smaller sub-components.
- **Unit Testing Targets**: Focus testing efforts on domain logic helpers, Redux slice state reducers, and validation rules.

---

*Document End — TECHNICAL_ARCHITECTURE_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
