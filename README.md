# 🚀 NEURON_FLOW | Orchestrated Complexity

A state-of-the-art visual workflow automation platform and AI orchestrator dashboard built with **Next.js**, **Express**, **SQLite/Prisma**, **React Flow**, and **Vite**.

---

## 🌟 Key Features

- 🎨 **Visual Drag-and-Drop Workflow Canvas**: Compose complex automation pipelines using React Flow node graphs.
- ⚡ **Instant Start Trigger Nodes**: Prominent **Play SVG Emblems** on all trigger entry points (`StartNode`, `TriggerNode`, `ScheduleTriggerNode`, `GoogleFormTriggerNode`).
- 🎛️ **Dual Sidebar Customization Sliders**:
  - **Node Palette Sliders**: Real-time adjustable **Sidebar Width** (180px–360px) and **Node Scale** (75%–125%).
  - **Node Inspector Sliders**: Range sliders for **Delay Duration**, **Schedule Interval**, **CRM Score Increment**, **If/Else Threshold**, **Google Sheets Row Limit**, and **OpenAI Temperature & Token Length**.
- 🔒 **High-Performance SQLite Engine**: Centralized Prisma client singleton with **WAL Mode** (`PRAGMA journal_mode=WAL;`) and queue concurrency locks preventing database timeouts (`P1008`).
- ⏱️ **Database-Backed Delay Scheduler**: Reliable polling daemon for scheduled timers and delayed multi-step workflow resumptions.

---

## ⚡ Quick Start (Single-Command Run)

### Option 1: Run Locally (Recommended)

Start the dashboard, visual designer, companion API, and backend workflow engine concurrently:

```bash
# Start all local services concurrently
npm run dev:all
```

Once running, access your services:
* **Root Dashboard (Next.js):** [http://localhost:3000](http://localhost:3000)
* **Visual Flow Canvas Editor:** [http://localhost:5173](http://localhost:5173)
* **Workflow Backend Engine API:** [http://localhost:4000](http://localhost:4000) (`/health` OK)
* **Root Companion Express API:** [http://localhost:4001](http://localhost:4001)

---

### Option 2: Run via Docker Compose

Spin up the full containerized production stack:

```bash
# 1. Start all containers in detached mode
npm run docker:up

# 2. Check container health status
npm run docker:status

# 3. Stop containers
npm run docker:down
```

---

## 📂 Repository Structure

```
.
├── automation-workflow/         # Visual Canvas Subproject (React Flow + Express + SQLite)
│   ├── backend/                 # Backend REST Engine, Scheduler & DB Manager
│   │   ├── db.js                # Centralized Prisma Singleton (WAL Mode enabled)
│   │   ├── engine.js            # Graph traversal engine (BFS execution)
│   │   ├── scheduler.js         # Scheduled & delayed job scheduler
│   │   ├── clean_db.js          # SQLite vacuum & log cleanup utility
│   │   └── server.js            # Express API endpoints
│   ├── frontend/                # React Flow SPA
│   │   ├── src/
│   │   │   ├── App.tsx          # Canvas editor, state, & inspector sidebars
│   │   │   └── CustomNode.tsx   # React Flow node visual designs & handles
│   └── prisma/
│       └── schema.prisma        # SQLite schema (Workflow, ExecutionLog, User, CRM)
├── pages/                       # Root Next.js Pages (Landing Page & Excel AI)
├── server/                      # Companion Express API (Port 4001)
├── package.json                 # Root script orchestrator
└── docker-compose.yml          # Container configuration
```

---

## 🛠️ Essential CLI Commands

| Command | Description |
|---|---|
| `npm run dev:all` | Start all local frontend and backend services concurrently |
| `npm run docker:up` | Build and start all services via Docker Compose |
| `npm run docker:status` | Display running status of Docker containers |
| `npm run docker:down` | Stop and teardown Docker containers |
| `npm run db:push:workflow` | Push Prisma schema changes to local SQLite database |
| `npm run dev:full` | Run Next.js dashboard + root server only |

---

Enjoy building automated pipelines with NEURON_FLOW! 🚀
