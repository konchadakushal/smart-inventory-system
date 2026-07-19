# LogiSmart: Smart Inventory & Warehouse Management System

LogiSmart is an enterprise-grade, monorepo-based Smart Inventory and Warehouse Management System. The application is built using a modern decoupled architecture: a Node.js & Express.js backend implementing the **Model-View-Controller (MVC)** design pattern, and a React (Vite) frontend using **Vanilla CSS3** for premium visual styling and glassmorphism layouts.

---

## Folder Layout

The project structure is organized as follows:

```text
smart-inventory-system/
├── .gitignore               # Root-level Git ignores (excludes node_modules, .env, scratch, zip archives)
├── .env.example             # Global environment configuration template
├── database/
│   ├── schema.sql           # Database tables structures, columns, and indexes (includes reset tokens)
│   └── seed.sql             # Initial system accounts, catalogs, and audit trail seeds
├── server/                  # Backend Node.js & Express application
│   ├── config/              # MySQL connection pool configuration
│   ├── controllers/         # Express routing controllers (MVC)
│   ├── middleware/          # Security headers, logging, JWT checking, error handling
│   ├── models/              # Prepared statements SQL data models (MVC)
│   ├── services/            # Business logic validations and transactional blocks (MVC)
│   ├── routes/              # Express API endpoint declarations
│   ├── utils/               # JWT helpers, passwords encrypt, standard response envelopes
│   ├── validators/          # request body schemas (express-validator)
│   ├── .env.example         # Template for environment configuration
│   ├── .gitignore           # Backend Git ignore rules
│   ├── package.json         # Backend node scripts and libraries
│   └── server.js            # Main bootstrapper entry point
├── client/                  # Frontend React (Vite) application
│   ├── public/              # Static frontend assets
│   ├── src/
│   │   ├── components/      # Reusable UI widgets (Layout, Sidebar, Charts, Table, Modal)
│   │   ├── context/         # Auth session context & Toast notification context
│   │   ├── pages/           # Views (Login, Dashboard, Products, Suppliers, Stock, Reports, Users, ResetPassword)
│   │   ├── services/        # Axios API interceptor configurations and services wrapper
│   │   ├── App.jsx          # Root page routing paths mapping and allowedRoles limits
│   │   └── index.css        # Vanilla CSS variable design tokens and animations
│   ├── index.html           # Document wrapper and Google fonts link
│   ├── .gitignore           # Frontend Git ignore rules
│   ├── package.json         # Frontend build scripts
│   └── vite.config.js       # Vite configuration file
└── README.md                # Project documentation (This file)
```

---

## System Requirements

Ensure you have the following installed on your system:
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)
* **MySQL Server** (v8.0 or higher)

---

## Local Setup & Installation

Follow these steps to run the application locally:

### 1. Database Configuration
1. Open your MySQL client (e.g. Command Line, MySQL Workbench) and execute the schema and seed scripts to build and seed the database:
   ```sql
   -- Create database and tables structures
   CREATE DATABASE smart_inventory;
   USE smart_inventory;
   SOURCE database/schema.sql;

   -- Import initial test data and catalogs
   SOURCE database/seed.sql;
   ```

### 2. Backend Server Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Copy the template configuration file:
   ```bash
   cp .env.example .env
   ```
3. Open the newly created `.env` file and configure your database host, port, user credentials, and JWT secret key:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=smart_inventory
   DB_PORT=3306
   JWT_SECRET=use_a_long_random_alphanumeric_string_for_production
   JWT_EXPIRES_IN=24h
   ```
4. Install backend dependencies and start the hot-reloading development server:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend React Setup
1. Open a new terminal window, and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install frontend packages (includes UI libraries and export engines like `jspdf` and `xlsx`):
   ```bash
   npm install
   ```
3. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
4. Navigate to `http://localhost:5173` to access the application.

---

## Authentication & Role Clearances

Access to operations is protected by JSON Web Tokens (JWT). The following default accounts are seeded for testing:

| Role | Username / Email | Password | Authorization Level & Restrictions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smartinventory.com` | `admin123` | **Full access**. Can CRUD products, suppliers, warehouses, settings, and manage operator accounts. |
| **Manager** | `manager@smartinventory.com` | `admin123` | **Intermediate**. Can CRUD products/suppliers/warehouses. Cannot delete items or manage user accounts. |
| **Staff** | `staff@smartinventory.com` | `admin123` | **Operational / Read-Only**. Isolated to view and adjust stock for their assigned warehouse only. Cannot delete records, manage users, or export reports. |

### Staff Operations Restrictions (RBAC)
Staff user accounts are strictly restricted throughout the application:
- **Assigned Warehouse Isolation**: When a Staff operator logs in, their dashboard metrics, capacity graphs, and transaction histories are filtered exclusively to their assigned warehouse.
- **Stock Movements Protection**: Staff can execute Stock In and Stock Out adjustments for their assigned warehouse but are blocked from initiating Stock Transfers.
- **Action Blocking**: Sidebar menus, CRUD buttons, and CSV imports are dynamically hidden for Staff.
- **API Guard**: A backend middleware intercepts all user actions and returns a 403 Forbidden error if a Staff user bypasses the UI constraints.
- **Reports Limits**: Staff can view the audit logs but the CSV, Excel, and PDF export options are hidden.

---

## Forgot Password Flow

If a user forgets their password, they can reset it securely:
1. Click **"Forgot Password?"** on the Sign In page.
2. Enter their registered email address.
3. The system generates a cryptographically secure random token valid for **15 minutes**.
4. In **Development Mode**, a yellow developer helper card displays the generated reset link (`http://localhost:5173/reset-password?token=...`) so you can test the flow without setting up an SMTP email server.
5. Clicking the link takes the user to the **Reset Password** page where a real-time complexity checklist evaluates their password (requires at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character).
6. Saving the new password hashes it via `bcrypt` and invalidates the reset token immediately to prevent reuse.

---

## Production Deployment Guide

Follow these steps to prepare the monorepo for production:

### 1. Building the Frontend Bundle
1. Navigate to the `client` folder and build the production package:
   ```bash
   cd client
   ```
2. Build the production package:
   ```bash
   npm run build
   ```
   This compiles all JSX/JS elements, optimizes CSS styles, and outputs optimized HTML/JS bundles inside `client/dist`.
3. Serve this static bundle using a web server like **Nginx** or **Apache**.

### 2. Express Server Production Configuration
1. Navigate to the `server` folder:
   ```bash
   cd server
   ```
2. Configure `.env` file to production mode:
   ```env
   NODE_ENV=production
   PORT=80
   ```
   In production, detailed database error traces are omitted from API envelopes to prevent information disclosure.
3. Run the backend service continuously using a process manager like **PM2**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "logismart-backend"
   ```

---

## Git & GitHub Readiness Checklist

Before committing or pushing to a public repository:
1. Make sure no `.env` files are tracked by Git (run `git status` to verify).
2. The root-level, `server/`, and `client/` `.gitignore` files exclude all dependencies, environmental variables, build outputs, and local zip archives.
3. Keep `package.json` and `package-lock.json` tracked to preserve dependency integrity.
