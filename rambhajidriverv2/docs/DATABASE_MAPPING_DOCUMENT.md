# DATABASE MAPPING DOCUMENT
## GharTak — Driver Delivery Mobile Application
### Fresh Box Subscription Delivery Platform

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-06-18  
**Status:** Approved for Development  
**Classification:** Internal — Engineering  
**Prepared By:** Senior Database Architect  

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [MySQL Relational Schema Design](#2-mysql-relational-schema-design)
3. [Table Schemas & Definitions](#3-table-schemas--definitions)
4. [Client-Server Model Mapping](#4-client-server-model-mapping)
5. [Database Indexing & Query Optimizations](#5-database-indexing--query-optimizations)
6. [Data Retention & Cleanup Schedules](#6-data-retention--cleanup-schedules)

---

## 1. Introduction

This Database Mapping Document details the **MySQL schema** for the GharTak delivery platform. It defines the tables, indexes, constraints, and client-side models that support driver route execution, proof-of-delivery uploads, return processing, and security audit logs.

---

## 2. MySQL Relational Schema Design

The following Entity-Relationship diagram outlines the tables managed by the Express backend and referenced by the Driver app.

```mermaid
erDiagram
    DRIVERS ||--o{ ROUTES : executes
    ROUTES ||--|{ ORDERS : contains
    ORDERS ||--|{ ORDER_ITEMS : details
    ORDERS ||--o{ RETURNS : has
    DRIVERS ||--o{ AUDIT_LOGS : performs
    DRIVERS ||--o{ DEVICE_BINDINGS : binds

    DRIVERS {
        int id PK
        string name
        string phone UNIQUE
        string role
        string status
        datetime created_at
    }

    ROUTES {
        int id PK
        int driver_id FK
        date route_date
        string status
        decimal total_distance
        datetime created_at
    }

    ORDERS {
        int id PK
        int route_id FK
        string customer_name
        string phone
        string address
        decimal latitude
        decimal longitude
        string status
        string delivery_instructions
        string pod_photo_url
        datetime delivered_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        string product_name
        string product_category
        int quantity
        decimal unit_price
    }

    RETURNS {
        int id PK
        int order_id FK
        string reason
        int adjusted_quantity
        string status
        string return_photo_url
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int driver_id FK
        string event_type
        decimal latitude
        decimal longitude
        string device_info
        datetime created_at
    }

    DEVICE_BINDINGS {
        int id PK
        int driver_id FK
        string device_fingerprint UNIQUE
        string device_model
        string os_version
        datetime created_at
    }
```

---

## 3. Table Schemas & Definitions

### 3.1 Table: `drivers`
Stores the delivery executives' credentials, status, and role metadata.
```sql
CREATE TABLE `drivers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(15) NOT NULL UNIQUE,
  `role` ENUM('DRIVER', 'LEAD_DRIVER', 'ADMIN') DEFAULT 'DRIVER',
  `status` ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_drivers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.2 Table: `routes`
Stores daily route assignments for drivers.
```sql
CREATE TABLE `routes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `driver_id` INT NOT NULL,
  `route_date` DATE NOT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  `total_distance` DECIMAL(8,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  INDEX `idx_routes_driver_date` (`driver_id`, `route_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.3 Table: `orders`
Stores customer delivery orders associated with specific routes.
```sql
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_id` INT NOT NULL,
  `customer_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(15) NOT NULL,
  `address` TEXT NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `status` ENUM('ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'RETURNED', 'FAILED') DEFAULT 'ASSIGNED',
  `delivery_instructions` TEXT DEFAULT NULL,
  `pod_photo_url` VARCHAR(255) DEFAULT NULL,
  `delivered_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  INDEX `idx_orders_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.4 Table: `order_items`
Details the vegetables, fruits, water subscriptions, and products within each order.
```sql
CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_name` VARCHAR(150) NOT NULL,
  `product_category` ENUM('VEGETABLES', 'FRUITS', 'EXOTIC_VEGETABLES', 'WATER_SUBSCRIPTION', 'OTHER') NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.5 Table: `returns`
Tracks items returned by customers during delivery.
```sql
CREATE TABLE `returns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `adjusted_quantity` INT NOT NULL DEFAULT 0,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  `return_photo_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_returns_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.6 Table: `audit_logs`
Stores events for security compliance, session actions, and delivery status changes.
```sql
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `driver_id` INT NOT NULL,
  `event_type` VARCHAR(50) NOT NULL,
  `latitude` DECIMAL(10,8) DEFAULT NULL,
  `longitude` DECIMAL(11,8) DEFAULT NULL,
  `device_info` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  INDEX `idx_audit_driver_event` (`driver_id`, `event_type`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.7 Table: `device_bindings`
Binds device fingerprints to drivers to enforce single-session policies.
```sql
CREATE TABLE `device_bindings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `driver_id` INT NOT NULL,
  `device_fingerprint` VARCHAR(255) NOT NULL UNIQUE,
  `device_model` VARCHAR(100) DEFAULT NULL,
  `os_version` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. Client-Server Model Mapping

This table maps server-side database types to client-side JavaScript representations.

| Database Field | MySQL Type | Client-Side Model Mapping |
|----------------|------------|---------------------------|
| `drivers.role` | `ENUM` | String literal union: `'DRIVER' \| 'LEAD_DRIVER' \| 'ADMIN'` |
| `routes.route_date` | `DATE` | String: `'YYYY-MM-DD'` |
| `orders.latitude` / `longitude` | `DECIMAL` | Numbers: `latitude` / `longitude` float |
| `orders.status` | `ENUM` | String literal union: `'ASSIGNED' \| 'IN_TRANSIT' \| 'COMPLETED' \| 'RETURNED' \| 'FAILED'` |
| `order_items.product_category` | `ENUM` | String: `'VEGETABLES' \| 'FRUITS' \| 'EXOTIC_VEGETABLES' \| 'WATER_SUBSCRIPTION'` |
| `returns.adjusted_quantity` | `INT` | Number |
| `audit_logs.device_info` | `TEXT` | Serialized JSON String |

---

## 5. Database Indexing & Query Optimizations

To maintain fast response times as the platform scales to 50,000 drivers:
- **Composite Index**: `idx_routes_driver_date` accelerates the daily endpoint `GET /api/v1/routes/:driverId?date=YYYY-MM-DD`.
- **Foreign Keys**: Enforces referential integrity at the database layer.
- **Table Partitioning**: As `audit_logs` scales to tens of millions of records, partitioning by range based on `created_at` optimizes query performance and history pruning.

---

## 6. Data Retention & Cleanup Schedules

- **`audit_logs`**: Retained for **90 days** in the primary MySQL instance, then archived to object storage (cold storage) and purged from MySQL.
- **`device_bindings`**: Persisted indefinitely. Cleaned only during administrative overrides.
- **`routes` & `orders`**: Active records are retained for **180 days** for operations reconciliation, then archived to warehouse schemas.

---

*Document End — DATABASE_MAPPING_DOCUMENT.md v1.0.0*  
*© 2026 GharTak Technologies. All rights reserved.*
