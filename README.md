# 🚀 NEURON_FLOW | Orchestrated Complexity

A state-of-the-art visual workflow automation platform, Ingest Engine, and AI orchestrator dashboard built with **Next.js 16**, **Clerk Authentication**, **Better-Auth**, **Inngest**, **Express**, **SQLite/Prisma**, **RabbitMQ**, **React Flow**, and **Vite**.

---

## 🌟 Key Features

- 🔒 **Clerk & Better-Auth Authentication**: Integrated `@clerk/nextjs` authentication for seamless sign-in/sign-up flows with automatic Prisma database user synchronization (`/api/user/sync`) and Better-Auth session management.
- 📈 **Excel Data Transformation Node**: Native `.xlsx` file manipulation supporting operations: `readSheet`, `writeSheet`, `appendRow`, `filterRows`, and `createWorkbook` with format outputs in JSON/binary.
- 🔌 **Model Context Protocol (MCP) Connector**: Dynamic MCP server connector supporting tool schema discovery, credential binding, and standard tool execution across external services.
- 📥 **Automated Ingest Flow & Form Submissions**: Seamless form ingestion pipeline (`POST /api/forms/[id]/submit`) with background queue event dispatch via **Inngest** (`form/submitted`) and graph node execution.
- ⚡ **Real-Time Execution Monitoring**: Real-time log streaming API (`GET /api/executions/[id]/logs`) and animated progression monitor UI with sub-second polling and step trace output.
- ⏰ **10-Second Interval Health Check Template**: Pre-configured schedule-to-email workflow template (`ScheduleTriggerNode` set to 10s interval connected to `MarketingNode` email dispatcher).
- 🌙 **Universal Dark Mode Design**: Enforced high-contrast, obsidian dark-themed UI system across the Next.js landing dashboard, Excel AI workspace, and React Flow visual canvas editor.
- 🎨 **Visual Drag-and-Drop Workflow Canvas**: Compose complex, multi-step automation pipelines using React Flow node graphs.
- 🎛️ **Dual Sidebar Customization Sliders**:
  - **Node Palette Sliders**: Real-time adjustable **Sidebar Width** (180px–360px) and **Node Scale** (75%–125%).
  - **Node Inspector Sliders**: Range sliders for **Delay Duration**, **Schedule Interval**, **CRM Score Increment**, **If/Else Threshold**, **Google Sheets Row Limit**, and **OpenAI Temperature & Token Length**.
- 🐇 **Asynchronous Queue Engine & Topological Waves**: Graph execution engine supporting topological wave partitioning, graph validation, and **RabbitMQ** queue worker processing with seamless fallback to in-memory queues.
- 📧 **SMTP & Email Notification System**: Configurable SMTP integration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) for real-time automated email delivery and simulated contact outreach.
- 🔒 **High-Performance SQLite Engine**: Centralized Prisma client singleton with **WAL Mode** (`PRAGMA journal_mode=WAL;`) and queue concurrency locks preventing database timeouts (`P1008`).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Root Dashboard** | Next.js 16 (Turbopack), React 19, Tailwind CSS (Dark Mode), Clerk Auth |
| **Automation Engine** | Next.js 15, Turbopack, Inngest Queue, Prisma, Zod |
| **Visual Canvas Editor** | React 19, Vite, React Flow, TypeScript |
| **Backend Engines** | Express 5, Node.js (ESM), RabbitMQ, Delay Daemon, Scheduler |
| **Database & Storage** | SQLite (WAL Mode), PostgreSQL / Prisma ORM v5, AWS S3 Vault |
| **Integrations** | Model Context Protocol (MCP), Excel XLSX, SMTP Email, OpenAI API, Google Sheets API |
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
* **Automation Engine Monorepo:** [http://localhost:3001](http://localhost:3001)
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

Centralized configuration via root `.env` and template [.env.example](file:///d:/.vscode/workspace/.env.example):

```env
# Core Server & Database URLs
DATABASE_URL="postgres://user:password@localhost:5432/neuron_flow?sslmode=require"
WORKFLOW_DATABASE_URL="file:./dev.db"
PORT=4000
EXPRESS_PORT=4001
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3001"

# Clerk & Better-Auth Secrets
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
BETTER_AUTH_SECRET="your-production-secret-key"

# Queue & Services
RABBITMQ_URL="amqp://localhost:5672"
RABBITMQ_QUEUE_NAME="neuron_flow_queue"

# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="abirsarkar123455@gmail.com"
SMTP_PASS="nwgzyfszujchvles"
SMTP_SECURE=false
EMAIL_FROM="NEURON_FLOW Automation <noreply@neuronflow.local>"

# AI & Integrations
OPENAI_API_KEY="sk-proj-your-openai-key"
```

---

## 📂 Repository Structure

```
.
├── automation-engine/           # Next.js 15 + Turbo Monorepo Ingest & Node Package Engine
│   ├── apps/web/                # Web Dashboard, Form Submission & Inngest API
│   │   ├── app/api/forms/       # Form Management & Submit Endpoints
│   │   ├── app/api/executions/  # Real-Time Execution Log Monitoring API
│   │   ├── app/api/inngest/     # Inngest Background Queue Workers & Route Handler
│   │   └── components/nodes/    # Visual Canvas Components (ExcelNode, McpConnectorNode)
│   └── packages/                # Monorepo Core Libraries (db, sdk, nodes, engine)
│       ├── engine/              # Graph Executor (topological BFS traversal)
│       └── nodes/               # Node Definitions (excel, mcp-connector, openai, slack, etc.)
├── automation-workflow/         # Visual Canvas Subproject (React Flow + Express + SQLite)
│   ├── backend/                 # Backend REST Engine, Queue & Scheduler
│   │   ├── db.js                # Centralized Prisma Singleton (WAL Mode enabled)
│   │   ├── engine.js            # Graph traversal engine (Topological wave execution)
│   │   ├── rabbitmq.js          # RabbitMQ message queue integration & fallback
│   │   ├── scheduler.js         # Scheduled & delayed job scheduler (10s timers)
│   │   └── server.js            # Express API endpoints & SMTP sender
│   ├── frontend/                # React Flow SPA
│   │   ├── src/App.tsx          # Canvas editor, state, & inspector sidebars
│   │   ├── src/CustomNode.tsx   # Custom Node UI Cards (ScheduleTrigger, MarketingNode)
│   │   └── src/CustomEdge.tsx   # Animated edges & connection deletion badges
│   └── prisma/schema.prisma     # SQLite schema (User, Workflow, ExecutionLog, CRM)
├── pages/                       # Root Next.js Pages (Clerk Auth & Dashboard)
│   ├── index.js                 # Dark Mode Landing Page & Clerk User Sync
│   ├── sign-in/[[...index]].js  # Clerk Sign-In Page
│   └── sign-up/[[...index]].js  # Clerk Sign-Up Page
├── .env                         # Production Environment Credentials
├── .env.example                 # Production Environment Template
├── package.json                 # Monorepo script orchestrator
└── docker-compose.yml           # Container configuration
```

---

## 🛠️ Production Build Verification

All production builds across the monorepo have been audited and verified:

```bash
# 1. Root Next.js Dashboard Build
npm run build                     # ✓ Compiled successfully (Next.js 16 Turbopack)

# 2. Automation Engine Monorepo Build
npm run build:prod                # ✓ 4/4 Tasks successful (Next.js 15 + Turbo)

# 3. Automation Workflow Frontend Build
cd automation-workflow/frontend && npm run build  # ✓ Built dist bundle in 1.05s
```

Enjoy building automated pipelines with NEURON_FLOW! 🚀
