# Workspace Architecture & Project Guide

Welcome to the Workspace Project. This workspace contains a hybrid structure comprising a Next.js + Express root app and a subproject named `automation-workflow` which implements a fully featured automation pipeline system.

---

## 📂 Directory Layout

```
.
├── automation-workflow/         # Main automation workflow subproject
│   ├── backend/                 # Express backend server with BullMQ and Prisma
│   │   ├── Dockerfile           # Docker containerisation configuration
│   │   ├── package.json         # Backend dependencies & run scripts
│   │   └── server.js            # Express server entrypoint
│   ├── frontend/                # React + Vite frontend application
│   │   ├── package.json         # Frontend dependencies & run scripts
│   │   ├── src/                 # React source code (React Flow, MUI, App.tsx)
│   │   └── vite.config.ts       # Vite build configuration
│   └── prisma/                  # Prisma ORM Database Models
│       └── schema.prisma        # SQLite database models schema (User, Workflow, ExecutionLog)
│
├── pages/                       # Root Next.js Pages
│   └── index.js                 # Premium landing page UI
├── server/                      # Companion Root Express Server
│   └── index.js                 # Express server endpoints (health, messages)
├── package.json                 # Root script runner and workspaces orchestrator
├── next.config.js               # Next.js configurations
└── README.md                    # Quickstart instructions
```

---

## 🛠️ Main Components

### 1. Root Workspace App (Next.js + Express)
* **Location:** `./`
* **Technologies:** Next.js, React, Express, Concurrently
* **Purpose:** Serves as a premium dashboard starter, connecting a React-based Next.js web application to an Express API seamlessly under a single entrypoint.
* **Commands:**
  * `npm run dev:full` - Run both Next.js frontend (port `3000`) and companion Express server (port `4000`) concurrently.

### 2. Automation Workflow Subproject
* **Location:** `./automation-workflow`
* **Technologies:** SQLite, Prisma Client, Express, BullMQ, React Flow, Material UI, Vite
* **Purpose:** A pipeline builder where users can design node-based logic and trigger automated workflows.
* **Database Models (Prisma):**
  * `User`: Stores user credentials and profile details.
  * `Workflow`: Holds workflow configurations and JSON representations of node graphs.
  * `ExecutionLog`: Keeps track of history, run statuses (pending, running, success, failed), timestamps, and logs.

---

## 🚀 Running the Apps

### Root (Next.js + Express)
To boot the root application stack:
```bash
# In the workspace root directory:
npm install
npm run dev:full
```
* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

### Subproject (Automation Workflow Backend)
To boot the subproject backend:
```bash
cd automation-workflow/backend
npm install
# Migrate/sync SQLite Database
npx prisma db push
# Start backend
npm run dev
```
* **Backend API:** [http://localhost:4000/health](http://localhost:4000/health)

### Subproject (Automation Workflow Frontend)
To boot the subproject frontend:
```bash
cd automation-workflow/frontend
npm install
npm run dev
```
* **Frontend App:** Check terminal output for local port (typically [http://localhost:5173](http://localhost:5173))
