# 🚀 NEURON_FLOW | Orchestrated Complexity

A state-of-the-art visual workflow automation platform and AI orchestrator dashboard built with **Next.js**, **Clerk Authentication**, **Express**, **SQLite/Prisma**, **RabbitMQ**, **React Flow**, and **Vite**.

---

## 🌟 Key Features

- 🔒 **Clerk Authentication & User Sync**: Integrated `@clerk/nextjs` authentication for seamless sign-in/sign-up flows with automatic Prisma database user synchronization (`/api/user/sync`).
- 🌙 **Universal Dark Mode Design**: Enforced high-contrast, obsidian dark-themed UI system across the Next.js landing dashboard, Excel AI workspace, and React Flow visual canvas editor.
- 🎨 **Visual Drag-and-Drop Workflow Canvas**: Compose complex, multi-step automation pipelines using React Flow node graphs.
- ⚡ **Instant Start Trigger Nodes**: Prominent **Play SVG Emblems** on all trigger entry points (`StartNode`, `TriggerNode`, `ScheduleTriggerNode`, `GoogleFormTriggerNode`).
- 🎛️ **Dual Sidebar Customization Sliders**:
  - **Node Palette Sliders**: Real-time adjustable **Sidebar Width** (180px–360px) and **Node Scale** (75%–125%).
  - **Node Inspector Sliders**: Range sliders for **Delay Duration**, **Schedule Interval**, **CRM Score Increment**, **If/Else Threshold**, **Google Sheets Row Limit**, and **OpenAI Temperature & Token Length**.
- 🐇 **Asynchronous Queue Engine & Topological Waves**: Graph execution engine supporting topological wave partitioning, graph validation, and **RabbitMQ** queue worker processing with seamless fallback to in-memory queues.
- 📧 **SMTP & Email Notification System**: Configurable SMTP integration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) for real-time automated email delivery and simulated contact outreach.
- 🔒 **High-Performance SQLite Engine**: Centralized Prisma client singleton with **WAL Mode** (`PRAGMA journal_mode=WAL;`) and queue concurrency locks preventing database timeouts (`P1008`).
- ⏱️ **Database-Backed Delay Scheduler**: Reliable polling daemon for scheduled timers and delayed multi-step workflow resumptions.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Dashboard** | Next.js 16, React 19, Tailwind CSS (Dark Mode), Clerk Auth |
| **Visual Canvas Editor** | React 19, Vite, React Flow, TypeScript |
| **Backend Engines** | Express 5, Node.js (ESM), RabbitMQ, Delay Daemon |
| **Database & Storage** | SQLite (WAL Mode), Prisma ORM v5 |
| **Integrations** | SMTP Email, OpenAI API, Google Sheets API, Clerk Auth |
| **DevOps & Containerization** | Docker, Docker Compose, Concurrently |

---

## ⚡ Quick Start

### Option 1: Run Locally (Recommended)

Start the Next.js dashboard, visual flow designer, companion API, and backend workflow engine concurrently:

```bash
# Push Prisma schema and start all local services concurrently
npm run dev:all
```

Once running, access your services:
* **Root Dashboard & Clerk Auth (Next.js):** [http://localhost:3000](http://localhost:3000)
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

## 🔑 Environment Configuration

Centralized configuration via root `env.js` and `.env`:

```env
# Database & Core Ports
DATABASE_URL="file:./dev.db?connection_limit=1&socket_timeout=30"
PORT=4000
EXPRESS_PORT=4001

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Queue & Services
RABBITMQ_URL="amqp://localhost:5672"
RABBITMQ_QUEUE_NAME="neuron_flow_queue"

# SMTP Email Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="password"
EMAIL_FROM="NEURON_FLOW Automation <noreply@neuronflow.local>"

# AI & Integrations
OPENAI_API_KEY="your-openai-key"
```

---

## 📂 Repository Structure

```
.
├── automation-workflow/         # Visual Canvas Subproject (React Flow + Express + SQLite)
│   ├── backend/                 # Backend REST Engine, Queue & Scheduler
│   │   ├── db.js                # Centralized Prisma Singleton (WAL Mode enabled)
│   │   ├── engine.js            # Graph traversal engine (Topological wave execution)
│   │   ├── rabbitmq.js          # RabbitMQ message queue integration & fallback
│   │   ├── scheduler.js         # Scheduled & delayed job scheduler
│   │   ├── clean_db.js          # SQLite vacuum & log cleanup utility
│   │   └── server.js            # Express API endpoints & SMTP sender
│   ├── frontend/                # React Flow SPA
│   │   ├── src/
│   │   │   ├── App.tsx          # Canvas editor, state, & inspector sidebars
│   │   │   ├── CustomNode.tsx   # React Flow node visual designs & handles
│   │   │   └── CustomEdge.tsx   # Animated edges & connection deletion badges
│   └── prisma/
│       └── schema.prisma        # SQLite schema (User, Workflow, ExecutionLog, CRM)
├── pages/                       # Root Next.js Pages (Clerk Auth & Dashboard)
│   ├── _app.js                  # ClerkProvider wrapper
│   ├── index.js                 # Dark Mode Landing Page & Clerk User Sync
│   ├── sign-in/[[...index]].js  # Clerk Sign-In Page
│   ├── sign-up/[[...index]].js  # Clerk Sign-Up Page
│   └── api/user/sync.js         # Clerk -> Prisma User Synchronization Endpoint
├── server/                      # Companion Express API (Port 4001)
├── env.js                       # Centralized Environment Loader
├── package.json                 # Root script orchestrator
└── docker-compose.yml           # Container configuration
```

---

## 🛠️ Essential CLI Commands

| Command | Description |
|---|---|
| `npm run dev:all` | Push database schema and start all Next.js, Vite, and Express services concurrently |
| `npm run docker:up` | Build and start all services via Docker Compose |
| `npm run docker:status` | Display running status of Docker containers |
| `npm run docker:down` | Stop and teardown Docker containers |
| `npm run db:push:workflow` | Push Prisma schema changes to local SQLite database |
| `npm run dev:full` | Run Next.js dashboard + root companion server only |

---

Enjoy building automated pipelines with NEURON_FLOW! 🚀

