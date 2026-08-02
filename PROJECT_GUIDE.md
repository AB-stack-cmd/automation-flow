# 📘 Workspace Architecture & Project Guide

Welcome to the **NEURON_FLOW** workspace guide. This document provides an easy-to-understand breakdown of the workspace layout, core backend/frontend apps, database models, and instructions for running and extending the project.

---

## 📂 Layout Overview

```
.
├── automation-workflow/         # Visual Workflow Canvas & Automation Engine Subproject
│   ├── backend/                 # Node.js + Express backend orchestrator
│   │   ├── db.js                # Shared Prisma client (SQLite WAL mode & connection queue limit)
│   │   ├── engine.js            # Node execution engine (BFS traversal algorithm)
│   │   ├── scheduler.js         # Delayed job & recurring timer scheduler
│   │   ├── clean_db.js          # DB maintenance script (vacuums & clears old execution logs)
│   │   └── server.js            # Express API routes
│   ├── frontend/                # React + Vite drag-and-drop workflow canvas UI
│   │   ├── src/
│   │   │   ├── App.tsx          # Workflow editor layout, canvas state & interactive sidebar sliders
│   │   │   ├── CustomNode.tsx   # React Flow node visual components & Play SVG badges
│   │   │   └── CustomEdge.tsx   # Connection edge buttons & animation wires
│   │   └── vite.config.ts       # Vite build setup
│   └── prisma/                  # Prisma ORM Database Models
│       └── schema.prisma        # SQLite database schema (`dev.db`)
│
├── pages/                       # Root Next.js Pages
│   ├── index.js                 # NEURON_FLOW Landing Page
│   └── excel.js                 # Excel AI Generator interface
├── server/                      # Root Companion Express Server (Port 4001)
├── next.config.js               # Next.js & Turbopack workspace configuration
└── package.json                 # Root monorepo script runner
```

---

## 🧩 Key Architecture Components

### 1. Root Workspace App (Next.js Dashboard + Express API)
- **Frontend Port:** `3000` | **Backend Port:** `4001`
- **Purpose:** Serves as the primary landing page and dashboard gateway.
- **Run Command:** `npm run dev:full`

### 2. Automation Workflow Designer (React Flow Canvas + Express Engine)
- **Frontend Port:** `5173` | **Backend Port:** `4000`
- **Purpose:** Visual drag-and-drop workflow designer supporting:
  - **Visual Start Triggers:** Play SVG emblems on circular start containers (`StartNode`, `TriggerNode`, `ScheduleTriggerNode`, `GoogleFormTriggerNode`).
  - **Left Sidebar Sliders:** Adjust Palette Width (180px–360px) and Node Density Scale (75%–125%).
  - **Right Sidebar Sliders:** Interactive range sliders for Delay duration, Schedule interval, CRM score increment, If/Else threshold score, Google Sheets max row limit, and OpenAI temperature/tokens.
  - **Execution Engine:** Asynchronous BFS queue processor with SQLite WAL mode to eliminate database lock timeouts (`P1008`).

---

## 🗄️ Database Models (SQLite + Prisma)

- **`User`**: Account details and owner relation.
- **`Workflow`**: Workflow definitions (JSON string of node graph structures & connection edges).
- **`ExecutionLog`**: Step-by-step execution history, run status (`running`, `success`, `failed`), and output payloads.
- **`CRMContact`**: Simulated CRM leads table (`id`, `name`, `email`, `status`, `score`).
- **`SimulatedEmail`**: Sent emails log (`to`, `subject`, `body`, `sentAt`).
- **`DelayedExecution`**: Suspended execution state records waiting for timer resumption.

---

## 🚀 Running the Services

### Single Command (All Services):
```bash
npm run dev:all
```

### Manual Individual Commands:
```bash
# 1. Backend Engine
cd automation-workflow/backend
npm run dev

# 2. Frontend Designer
cd automation-workflow/frontend
npm run dev
```

Happy orchestrating! 🚀
