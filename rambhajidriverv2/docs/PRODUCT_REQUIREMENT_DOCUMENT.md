# PRODUCT REQUIREMENT DOCUMENT (PRD)
## GharTak — Driver Delivery Mobile Application
### Fresh Box Subscription Delivery Platform

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Engineering  
**Document Owner:** Product Team, GharTak  
**Prepared By:** Senior Engineering Team  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Goals & Objectives](#2-business-goals--objectives)
3. [Stakeholders & Personas](#3-stakeholders--personas)
4. [Product Vision & Mission](#4-product-vision--mission)
5. [User Journeys & Workflows](#5-user-journeys--workflows)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Use Cases](#8-use-cases)
9. [Feature Breakdown](#9-feature-breakdown)
10. [Success Metrics & KPIs](#10-success-metrics--kpis)
11. [Constraints & Assumptions](#11-constraints--assumptions)
12. [Risk Register](#12-risk-register)
13. [Glossary](#13-glossary)

---

## 1. Executive Summary

GharTak is a fresh box subscription delivery platform that delivers vegetables, fruits, exotic produce, and water subscriptions directly to customer doorsteps on a daily basis. The **Driver Delivery Mobile Application** is the operational backbone of this platform — used daily by delivery executives (drivers) to:

- Accept and manage assigned delivery routes
- Navigate to customer locations using GPS
- Confirm deliveries with photo proof and GPS verification
- Handle customer returns and complaints
- Communicate with operations and customers
- Work seamlessly in low-connectivity environments
- Maintain complete audit trails of all actions

This document defines the complete product requirements, user journeys, acceptance criteria, and expected outcomes for the Driver App, serving as the single source of truth for the engineering, design, QA, and product teams.

---

## 2. Business Goals & Objectives

### 2.1 Primary Business Goals

| # | Goal | Business Outcome |
|---|------|-----------------|
| BG-01 | Reduce delivery failures to < 2% | Increase customer retention and satisfaction |
| BG-02 | Achieve < 5 min average delivery confirmation time | Improve operational throughput |
| BG-03 | Enable real-time delivery visibility for operations | Reduce customer support tickets by 40% |
| BG-04 | Scale from 10 to 50,000 drivers without re-architecture | Support rapid business expansion |
| BG-05 | Achieve 99.5% app uptime including offline mode | Ensure daily operational continuity |
| BG-06 | Reduce fraudulent deliveries to near-zero | Protect revenue and customer trust |
| BG-07 | Automate returns workflow | Reduce manual reconciliation effort by 80% |
| BG-08 | Provide driver performance analytics | Enable data-driven incentive programs |

### 2.2 Operational Objectives

- **Daily Operations:** Drivers can start their route, complete all deliveries, handle returns, and close their shift entirely within the app without external intervention.
- **Fraud Prevention:** GPS verification, geofencing, and photo proof prevent fake delivery confirmations.
- **Offline Resilience:** Drivers working in basement complexes, elevators, or remote areas must never lose progress — all actions queue locally and sync when connectivity returns.
- **Customer Satisfaction:** Real-time notifications and delivery proof sent to customers increase trust and reduce complaints.

---

## 3. Stakeholders & Personas

### 3.1 Primary Persona — Delivery Executive (Driver)

```
Name:         Rajan Kumar
Age:          24–35
Role:         Ground-level delivery executive
Device:       Android (primarily), some iOS
Connectivity: Variable — urban 4G, suburban 3G/2G, occasional offline
Language:     Hindi/Regional + basic English
Technical:    Moderate smartphone proficiency
Daily Usage:  6–9 AM start, 20–60 deliveries/day, 8–12 hour shift
Pain Points:  Complex UI, app crashes, network drops, unclear workflows
Goal:         Complete all deliveries quickly with minimal friction
```

### 3.2 Secondary Personas

| Persona | Role | App Interaction |
|---------|------|-----------------|
| Operations Manager | Monitors routes, resolves escalations | Backend dashboard (not this app) |
| Warehouse Supervisor | Approves returns, manages inventory | Backend dashboard |
| Customer Support | Handles delivery complaints | Backend dashboard |
| System Administrator | Manages driver accounts, permissions | Admin portal |
| Finance Team | Reconciles delivery earnings | Reports dashboard |

### 3.3 Stakeholder Matrix

| Stakeholder | Interest | Influence | Engagement Strategy |
|-------------|----------|-----------|---------------------|
| CEO/Founders | Business growth, revenue | High | Monthly demo |
| Operations Head | Operational efficiency | High | Weekly review |
| Drivers | Ease of use, fairness | Medium | Beta testing, feedback |
| IT/Security Team | Security, compliance | High | Architecture reviews |
| Backend Team | API contracts, load | High | Daily syncs |

---

## 4. Product Vision & Mission

### Vision
> "Empower every GharTak delivery executive with an intelligent, offline-capable mobile tool that makes delivering fresh groceries as simple as accepting, navigating, and confirming — while giving operations complete real-time visibility and audit trails."

### Mission
- Build the most reliable, secure, and driver-friendly delivery app in the Indian fresh produce logistics space.
- Create an architecture that supports GharTak's growth from a startup to a national-scale platform.
- Ensure zero revenue leakage through robust fraud prevention and proof-of-delivery systems.

---

## 5. User Journeys & Workflows

### 5.1 Core User Journey: Daily Delivery Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRIVER DAILY JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

START OF DAY
    │
    ▼
[1] Driver opens app → OTP Login
    │
    ▼
[2] App syncs today's delivery route from server
    │ (or loads from offline cache if no connectivity)
    ▼
[3] Dashboard displays:
    • Total deliveries assigned
    • Route summary with estimated time
    • Earnings projection
    • Any urgent notifications
    │
    ▼
[4] Driver taps "Start Route"
    │
    ▼
[5] Route screen shows optimized delivery order
    │
    ▼
[6] FOR EACH DELIVERY:
    │
    ├── [6a] View Order Details
    │         • Customer name, phone, address
    │         • Products: water jugs, vegetables, fruits, exotic items
    │         • Quantity and special instructions
    │
    ├── [6b] Navigate to Customer
    │         • OpenStreetMap navigation
    │         • Live GPS tracking
    │         • ETA display
    │         • Call customer option
    │
    ├── [6c] Arrival at Location
    │         • Geofence validation (must be within 100m radius)
    │         • App prompts for delivery confirmation
    │
    ├── [6d] Delivery Confirmation Flow
    │         • Capture delivery photo (mandatory)
    │         • GPS location verified
    │         • Timestamp recorded
    │         • Add delivery remarks (optional)
    │         • Submit confirmation
    │
    ├── [6e] Partial/Return Flow (if customer rejects or absent)
    │         • Select return reason
    │         • Adjust quantities
    │         • Capture return photo
    │         • Submit return request
    │
    └── [6f] Mark Complete → Move to Next Delivery
    │
    ▼
[7] All deliveries done → End of Route Summary
    • Completed count
    • Return count
    • Total distance
    • Earnings for the day
    │
    ▼
[8] Driver submits End-of-Shift Report
    │
    ▼
[9] Secure Logout
```

### 5.2 User Journey: OTP Authentication

```
STEP 1: Enter Mobile Number
    ↓
STEP 2: Backend validates driver exists and is active
    ↓
STEP 3: OTP sent via SMS (6-digit, 5-minute validity)
    ↓
STEP 4: Driver enters OTP
    ↓
STEP 5: Backend validates OTP + issues JWT Access Token + Refresh Token
    ↓
STEP 6: Device fingerprint registered/validated
    ↓
STEP 7: Session established → Dashboard
```

### 5.3 User Journey: Return Management

```
Driver arrives at customer location
    ↓
Customer refuses delivery / Product damaged
    ↓
Driver selects "Initiate Return" on order screen
    ↓
Select return reason:
  - Customer Not Available
  - Customer Rejected
  - Product Damaged
  - Wrong Address
  - Quantity Mismatch
    ↓
Adjust quantities (partial returns supported)
    ↓
Capture return photo (mandatory)
    ↓
Submit return request → Queued locally if offline
    ↓
Synced to server → Operations team notified
    ↓
Return status tracked: Pending → Approved / Rejected
```

### 5.4 User Journey: Offline-First Operation

```
Device loses connectivity mid-route
    ↓
App detects offline state → UI banner displayed
    ↓
Driver continues deliveries using cached order data
    ↓
Delivery confirmations / returns queued in local MMKV store
    ↓
Photo uploads stored locally in encrypted cache
    ↓
Connectivity restored → Sync engine activates automatically
    ↓
All queued actions pushed to server in order
    ↓
Conflicts resolved using server-side timestamp authority
    ↓
UI updated with server-confirmed statuses
```

---

## 6. Functional Requirements

### 6.1 Authentication & Security (F-AUTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-AUTH-01 | Mobile OTP login via SMS | P0 |
| F-AUTH-02 | JWT Access Token (15-min expiry) + Refresh Token rotation | P0 |
| F-AUTH-03 | Secure token storage using MMKV with AES-256 encryption | P0 |
| F-AUTH-04 | Device binding — one active session per device | P0 |
| F-AUTH-05 | Force logout capability from admin panel | P0 |
| F-AUTH-06 | Biometric re-authentication for sensitive actions | P1 |
| F-AUTH-07 | Root/jailbreak detection — block app launch | P0 |
| F-AUTH-08 | Emulator detection — restrict GPS and camera | P0 |
| F-AUTH-09 | Mock GPS detection — block delivery confirmation | P0 |
| F-AUTH-10 | Session invalidation on token revocation | P0 |
| F-AUTH-11 | Multi-device session control | P1 |

### 6.2 Dashboard (F-DASH)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-DASH-01 | Display today's delivery statistics summary | P0 |
| F-DASH-02 | Show pending, completed, and returned delivery counts | P0 |
| F-DASH-03 | Display earnings projection and confirmed earnings | P0 |
| F-DASH-04 | Show total distance traveled | P0 |
| F-DASH-05 | Display active route summary | P0 |
| F-DASH-06 | Performance metrics (on-time rate, completion rate) | P1 |
| F-DASH-07 | Quick action buttons (Start Route, View Map, Call Support) | P0 |
| F-DASH-08 | Notification bell with unread count | P0 |
| F-DASH-09 | Offline status indicator | P0 |
| F-DASH-10 | Weekly/Monthly performance summary | P2 |

### 6.3 Delivery Management (F-DEL)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-DEL-01 | View all assigned orders for the day | P0 |
| F-DEL-02 | Filter orders by status (pending, completed, returned, all) | P0 |
| F-DEL-03 | Search orders by customer name, address, or order ID | P0 |
| F-DEL-04 | Sort orders by priority, distance, or time window | P0 |
| F-DEL-05 | View order details: customer info, products, quantities | P0 |
| F-DEL-06 | Support product types: water jugs, vegetables, fruits, exotic produce | P0 |
| F-DEL-07 | View delivery instructions and customer notes | P0 |
| F-DEL-08 | Mark delivery as started | P0 |
| F-DEL-09 | Complete delivery with photo proof + GPS verification | P0 |
| F-DEL-10 | Block delivery completion if outside geofence | P0 |
| F-DEL-11 | Block delivery completion if GPS disabled | P0 |
| F-DEL-12 | Capture and upload delivery photo (mandatory) | P0 |
| F-DEL-13 | Add delivery remarks/notes | P0 |
| F-DEL-14 | Call customer directly from order screen | P0 |
| F-DEL-15 | Support partial delivery | P1 |

### 6.4 Route Management (F-ROUTE)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-ROUTE-01 | Display optimized delivery route on OpenStreetMap | P0 |
| F-ROUTE-02 | Show all customer markers on map | P0 |
| F-ROUTE-03 | Live GPS tracking of driver position | P0 |
| F-ROUTE-04 | ETA calculation to each stop | P0 |
| F-ROUTE-05 | Distance calculation between stops | P0 |
| F-ROUTE-06 | Multi-stop sequential navigation | P0 |
| F-ROUTE-07 | Background location updates (when app in background) | P0 |
| F-ROUTE-08 | Route deviation alerts | P1 |
| F-ROUTE-09 | Re-route capability if driver deviates | P1 |
| F-ROUTE-10 | Integration with Google Maps / external nav app | P1 |

### 6.5 Returns Management (F-RET)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-RET-01 | Initiate return request with reason selection | P0 |
| F-RET-02 | Support predefined return reasons list | P0 |
| F-RET-03 | Support quantity adjustment for partial returns | P0 |
| F-RET-04 | Mandatory photo capture for return proof | P0 |
| F-RET-05 | Submit return request (online or queued offline) | P0 |
| F-RET-06 | Track return status: Pending → Approved/Rejected | P0 |
| F-RET-07 | View return history | P1 |
| F-RET-08 | Receive push notification on return status update | P0 |

### 6.6 Notifications (F-NOTIF)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-NOTIF-01 | Firebase Push Notifications for delivery assignments | P0 |
| F-NOTIF-02 | Route update notifications | P0 |
| F-NOTIF-03 | Order update notifications | P0 |
| F-NOTIF-04 | Return approval/rejection notifications | P0 |
| F-NOTIF-05 | Emergency operational alerts | P0 |
| F-NOTIF-06 | In-app notification center with history | P1 |
| F-NOTIF-07 | Notification deep-linking to relevant screen | P0 |

### 6.7 Offline Sync (F-OFFLINE)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-OFFLINE-01 | Cache today's delivery data on app start | P0 |
| F-OFFLINE-02 | Queue delivery confirmations when offline | P0 |
| F-OFFLINE-03 | Queue return requests when offline | P0 |
| F-OFFLINE-04 | Store photo captures locally when offline | P0 |
| F-OFFLINE-05 | Auto-sync when connectivity restored | P0 |
| F-OFFLINE-06 | Retry mechanism with exponential backoff | P0 |
| F-OFFLINE-07 | Conflict resolution strategy | P0 |
| F-OFFLINE-08 | Offline status visual indicator | P0 |
| F-OFFLINE-09 | Sync progress indicator | P1 |

### 6.8 Audit & Tracking (F-AUDIT)

| ID | Requirement | Priority |
|----|-------------|----------|
| F-AUDIT-01 | Log all login/logout events with device + GPS | P0 |
| F-AUDIT-02 | Log delivery start, completion, return events | P0 |
| F-AUDIT-03 | Log all security events (root detected, mock GPS, etc.) | P0 |
| F-AUDIT-04 | Log route deviations | P1 |
| F-AUDIT-05 | Log API request failures | P1 |
| F-AUDIT-06 | Transmit audit logs to server (batch upload) | P0 |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | App cold start time | < 3 seconds |
| NFR-PERF-02 | Dashboard load time | < 1.5 seconds |
| NFR-PERF-03 | Delivery list render (50 items) | < 500ms |
| NFR-PERF-04 | Photo capture and upload initiation | < 2 seconds |
| NFR-PERF-05 | GPS location acquisition | < 5 seconds |
| NFR-PERF-06 | Offline queue sync on reconnect | < 10 seconds for 50 items |
| NFR-PERF-07 | Map rendering with 60 markers | < 1 second |
| NFR-PERF-08 | API response time (P95) | < 800ms |

### 7.2 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SCALE-01 | Concurrent drivers supported | 50,000 |
| NFR-SCALE-02 | Deliveries per month | 10,000,000 |
| NFR-SCALE-03 | API requests per second | 100,000 |
| NFR-SCALE-04 | Photo storage scalability | 10TB+ with CDN |

### 7.3 Reliability

| NFR-REL-01 | App uptime | 99.5% including offline mode |
| NFR-REL-02 | Zero data loss for queued offline actions | 100% guaranteed |
| NFR-REL-03 | Photo upload success rate | > 99.9% |
| NFR-REL-04 | JWT token refresh success rate | > 99.99% |

### 7.4 Security

| NFR-SEC-01 | OWASP Mobile Top 10 compliance | Full compliance |
| NFR-SEC-02 | Token storage encryption | AES-256 |
| NFR-SEC-03 | All API communications | HTTPS/TLS 1.3 only |
| NFR-SEC-04 | Sensitive data at rest | Encrypted |
| NFR-SEC-05 | Root/jailbreak detection | Block sensitive actions |
| NFR-SEC-06 | Mock GPS detection | Block delivery confirmation |

### 7.5 Usability

| NFR-UX-01 | Driver training time to competence | < 30 minutes |
| NFR-UX-02 | Delivery confirmation steps | ≤ 4 taps |
| NFR-UX-03 | Support for Hindi UI (future) | Architecture ready |
| NFR-UX-04 | Accessibility compliance | WCAG 2.1 AA |

---

## 8. Use Cases

### UC-01: Driver Login with OTP

| Field | Detail |
|-------|--------|
| **Actor** | Delivery Executive |
| **Precondition** | Driver account exists and is active in system |
| **Main Flow** | 1. Driver opens app → 2. Enters mobile number → 3. Receives OTP → 4. Enters OTP → 5. JWT issued → 6. Dashboard loads |
| **Alt Flow 1** | OTP expired → Driver requests new OTP |
| **Alt Flow 2** | Wrong OTP × 3 → Account temporarily locked for 15 minutes |
| **Alt Flow 3** | Device not bound → Admin must approve new device |
| **Postcondition** | Driver is authenticated and can access all features |
| **Security** | Device fingerprint recorded, login audit logged |

### UC-02: Complete a Delivery

| Field | Detail |
|-------|--------|
| **Actor** | Delivery Executive |
| **Precondition** | Driver is authenticated, delivery is in ASSIGNED status, driver is within 100m of delivery address |
| **Main Flow** | 1. Open order details → 2. Navigate to location → 3. Arrive at geofence → 4. Capture photo → 5. Confirm delivery → 6. Status updated to COMPLETED |
| **Alt Flow 1** | Driver outside geofence → System blocks confirmation |
| **Alt Flow 2** | GPS disabled → System blocks confirmation with prompt |
| **Alt Flow 3** | Mock GPS detected → System blocks + logs security event |
| **Alt Flow 4** | No network → Confirmation queued locally → Synced later |
| **Postcondition** | Order status = COMPLETED, customer notified, audit log created |

### UC-03: Initiate a Return

| Field | Detail |
|-------|--------|
| **Actor** | Delivery Executive |
| **Precondition** | Driver has attempted delivery, customer is not available or rejected |
| **Main Flow** | 1. Open order → Tap Return → 2. Select reason → 3. Adjust quantities if partial → 4. Capture photo → 5. Submit → 6. Status = RETURN_PENDING |
| **Alt Flow** | Offline → Return request queued → Synced when online |
| **Postcondition** | Return request logged, operations team notified |

### UC-04: Route Navigation

| Field | Detail |
|-------|--------|
| **Actor** | Delivery Executive |
| **Precondition** | Route assigned, GPS enabled |
| **Main Flow** | 1. Open route map → 2. View all delivery pins → 3. Tap next stop → 4. Navigation starts → 5. Live tracking active → 6. Arrival detected |
| **Alt Flow** | Location permission denied → Prompt for permission |

### UC-05: Offline Sync Recovery

| Field | Detail |
|-------|--------|
| **Actor** | System (automatic) |
| **Precondition** | Driver was offline, connectivity restored |
| **Main Flow** | 1. Connectivity detected → 2. Sync engine activates → 3. Queued items uploaded in sequence → 4. Photos uploaded → 5. Server confirms → 6. Local queue cleared |
| **Conflict Resolution** | Server timestamp authority; duplicate submissions rejected idempotently |

---

## 9. Feature Breakdown

### Module 1: Authentication & Session Management
- OTP Login Flow
- JWT Token Management
- Refresh Token Rotation
- Device Binding & Validation
- Force Logout Handling
- Biometric Re-auth Gate

### Module 2: Driver Dashboard
- Stats Cards (deliveries, earnings, distance)
- Route Summary Widget
- Performance Metrics
- Quick Actions Bar
- Notification Badge
- Offline Status Banner

### Module 3: Delivery Management
- Delivery List with Filters
- Order Detail Screen
- Delivery Confirmation Workflow
- Partial Delivery Support
- Customer Call Integration
- Delivery History

### Module 4: Route & Navigation
- OpenStreetMap Integration
- Live GPS Tracking
- Multi-Stop Route Display
- ETA Calculation Engine
- Background Location Service
- Geofence Validation Engine

### Module 5: Returns Management
- Return Initiation Flow
- Return Reason Selection
- Quantity Adjustment UI
- Return Photo Capture
- Return Status Tracking
- Return History List

### Module 6: Push Notifications
- Firebase Cloud Messaging Integration
- Notification Permission Flow
- Notification Categories
- Deep Link Navigation
- In-App Notification Center

### Module 7: Offline-First Engine
- MMKV Local Cache Layer
- Action Queue Manager
- Sync Engine
- Retry & Backoff Logic
- Conflict Resolver
- Upload Recovery System

### Module 8: Security Layer
- Root/Jailbreak Detection
- Emulator Detection
- Mock GPS Detection
- AES-256 Storage Encryption
- Request Signing
- Security Event Logger
- Screenshot/Recording Prevention

### Module 9: Audit & Activity Tracking
- Event Logger Service
- Batch Uploader
- GPS Tagging on Events
- Device Info Capture

---

## 10. Success Metrics & KPIs

### 10.1 Operational KPIs

| KPI | Baseline | Target (3 months) | Target (12 months) |
|-----|----------|-------------------|---------------------|
| Delivery Success Rate | N/A | > 96% | > 98% |
| App Crash Rate | N/A | < 0.5% | < 0.1% |
| Avg. Delivery Confirmation Time | N/A | < 5 min | < 3 min |
| Offline-to-Sync Success Rate | N/A | > 99% | > 99.9% |
| False Return Rate | N/A | < 1% | < 0.5% |

### 10.2 Technical KPIs

| KPI | Target |
|-----|--------|
| App Store Rating | > 4.3 stars |
| Daily Active Usage Rate | > 95% of assigned drivers |
| Push Notification Delivery Rate | > 98% |
| JWT Refresh Success Rate | > 99.99% |
| Photo Upload Success Rate | > 99.9% |

### 10.3 Security KPIs

| KPI | Target |
|-----|--------|
| Fraudulent Delivery Reports | < 0.01% |
| Security Incident Response Time | < 15 minutes |
| Mock GPS Attempts Blocked | 100% |
| Root Device Blocked | 100% |

---

## 11. Constraints & Assumptions

### 11.1 Constraints

- **Platform Priority:** Android first (90% driver base), iOS secondary
- **Network:** Must work on 2G/3G connections for core features
- **Device:** Must support Android 8.0+ (API 26+) devices from 2018 onwards
- **Storage:** App installation size < 80MB
- **Language:** JavaScript (no TypeScript migration required at this stage)
- **Backend:** Must integrate with existing Node.js/Express.js/JWT/MySQL backend
- **Maps:** OpenStreetMap (not Google Maps to avoid billing); Google Maps integration as optional upgrade

### 11.2 Assumptions

- Drivers have company-provided or personal Android smartphones
- Backend APIs are available with proper CORS and JWT configuration
- SMS gateway is integrated in the backend for OTP delivery
- Firebase project is configured and FCM server key is available
- Photo storage backend (S3 or equivalent) is configured
- Admin panel exists for operations team (not in scope of this app)
- GPS signal is generally available in deployment areas

---

## 12. Risk Register

| Risk ID | Risk Description | Probability | Impact | Mitigation |
|---------|-----------------|-------------|--------|------------|
| R-01 | GPS spoofing by drivers | Medium | High | Mock GPS detection + geofence enforcement |
| R-02 | App used on rooted devices | Low | High | Root detection blocks sensitive features |
| R-03 | Backend API downtime | Low | High | Offline-first architecture with local queue |
| R-04 | Poor network in delivery zones | High | Medium | Complete offline workflow support |
| R-05 | Driver data privacy concerns | Low | Medium | Data minimization, encrypted storage |
| R-06 | Photo upload failures | Medium | Medium | Retry queue with exponential backoff |
| R-07 | JWT token theft | Low | Critical | Secure storage, token rotation, device binding |
| R-08 | Scalability bottleneck at 10K+ drivers | Medium | High | Stateless architecture, horizontal scaling |
| R-09 | App rejection by Play Store | Low | High | Comply with location policy, background location |
| R-10 | Driver adoption resistance | Medium | Medium | UX simplicity, training program |

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| **Driver** | Delivery executive using this app |
| **Route** | An ordered list of delivery stops for a driver for a given day |
| **Order** | A single customer's subscription delivery for a given day |
| **Delivery** | The act of completing an order at the customer's location |
| **Return** | An order or portion of an order that could not be delivered |
| **Geofence** | A virtual geographic boundary around a delivery address (100m radius) |
| **POD** | Proof of Delivery — photo + GPS + timestamp evidence of delivery |
| **OTP** | One-Time Password for mobile authentication |
| **JWT** | JSON Web Token — stateless authentication token |
| **MMKV** | Mobile Map Key-Value — high-performance local storage |
| **FCM** | Firebase Cloud Messaging — push notification service |
| **Offline Queue** | Local queue of actions pending server sync |
| **Sync Engine** | Background service that uploads queued actions when online |
| **Mock GPS** | Software that reports false GPS coordinates (fraud tool) |
| **DDD** | Domain Driven Design — architecture methodology |
| **SOLID** | Software design principles for maintainable code |
| **ETA** | Estimated Time of Arrival |
| **POC** | Proof of Concept |

---

*Document End — PRODUCT_REQUIREMENT_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
