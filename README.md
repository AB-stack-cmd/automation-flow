# 🚀 NEURON_FLOW | Orchestrated Complexity

A state-of-the-art visual workflow automation platform, Ingest Engine, and AI orchestrator dashboard built with **Next.js 16 (Turbopack)**, **Clerk Authentication**, **Inngest**, **Express**, **SQLite / PostgreSQL (Prisma)**, **RabbitMQ**, **React Flow**, and **Vite**.

---

## 🔄 Complete Application Flow of Work

NEURON_FLOW operates through a synchronized, multi-tiered architecture that bridges visual canvas design with high-throughput event processing and real-time execution telemetry.

```mermaid
flowchart TD
    subgraph UI ["1. User Interface & Canvas Layer"]
        A["Root Dashboard (:3000)<br/>Clerk Auth & Workspace"] --> B["Visual Canvas Designer (:5173)<br/>React Flow & Node Palette"]
        A --> C["Excel AI & File Vault (:3000)<br/>Data Ingest & File Operations"]
    end

    subgraph INGEST ["2. Ingest & Event Trigger Layer"]
        B --> D["Express Workflow Engine (:4000)<br/>DAG Compiler & Scheduler"]
        E["Form Submit & Webhooks (:3001)<br/>POST /api/forms/[id]/submit"] --> F["Inngest / RabbitMQ Queue<br/>form/submitted Events"]
    end

    subgraph ENGINE ["3. Execution Engine & Multi-Provider Core"]
        D --> G["Topological Wave Executor<br/>BFS Node Graph Traversal"]
        F --> G
        G --> H1["AI Core (GPT-4o, Claude, Gemini)"]
        G --> H2["Excel Node (exceljs transformations)"]
        G --> H3["MCP Connector Node (Tools & Presets)"]
        G --> H4["Communication (Slack, Discord, Email)"]
    end

    subgraph MONITOR ["4. Real-Time Telemetry & Data Layer"]
        H1 & H2 & H3 & H4 --> I["SQLite / Postgres DB (Prisma WAL)"]
        I --> J["Real-Time Log Monitor (:3001)<br/>GET /api/executions/[id]/logs"]
        J --> B
    end
```

### 📋 Step-by-Step Execution Lifecycle

1. **Workspace Entry & Authentication**: Users authenticate via `@clerk/nextjs` on the Root Dashboard (`:3000`). User profiles automatically synchronize with the Prisma database (`/api/user/sync`).
2. **Visual Workflow Design**: On the Visual Canvas (`:5173` or `/workflows`), users compose DAG automation flows by connecting Triggers (Schedule, Webhook, Google Form) to Action Nodes (OpenAI, Excel Processor, MCP Connector, Slack, Email). Sliders allow real-time control of node density, zoom scale, and parameters (delays, thresholds, temperatures).
3. **Event Ingestion & Queue Dispatch**: External form triggers hit `POST /api/forms/[id]/submit`, placing `form/submitted` events into **Inngest** or **RabbitMQ**. Scheduled timer daemons continuously evaluate active cron workflows.
4. **Topological Wave Execution**: The core graph engine (`packages/engine`) calculates node dependencies and processes topological waves in parallel using `NodeExecutor` plugins. Payload template interpolation (e.g., `{{trigger.email}}`, `{{timestamp}}`) dynamically passes state between steps.
5. **Real-Time Telemetry & Monitoring**: As nodes run, state transitions (`Pending` ➔ `Executing` ➔ `Success` / `Error`) are broadcast via log streaming (`GET /api/executions/[id]/logs`). Visual badges update live on the React Flow canvas.

---

## 🌟 Key Features

- 🔒 **Clerk & Better-Auth Integration**: Seamless authentication flows with automatic database user synchronization (`/api/user/sync`).
- 📊 **Native Excel Data Transformation Node**: `exceljs`-powered `.xlsx` manipulation with support for `readSheet`, `writeSheet`, `appendRow`, `filterRows`, and `createWorkbook` (JSON/binary formats up to 25MB).
- 🔌 **Model Context Protocol (MCP) Connector**: Generic productivity node interfacing with MCP servers (Notion, Airtable, GitHub, Slack) via encrypted API credentials and `tools/call`.
- 📥 **Automated Form Ingestion & Inngest Queueing**: High-concurrency form submit handler (`POST /api/forms/[id]/submit`) emitting background events to **Inngest**.
- ⚡ **Real-Time Canvas Debugger & Log Telemetry**: Live step-by-step log streaming API (`GET /api/executions/[id]/logs`) with animated node status badges on the visual canvas.
- ⏰ **Schedule & Delay Daemons**: Built-in interval timer daemons (e.g., 10s Health Check & Email Dispatcher template).
- 🌙 **Universal Obsidian Dark Mode**: Unified visual styling across Next.js 16 dashboard pages, Vite visual designer, and documentation portals.
- 🎛️ **Dual Sidebar Customization Sliders**: Dynamic layout sliders for canvas sidebar width (180px–360px) and node scale (75%–125%), alongside node-specific parameter sliders.
- 🐇 **Asynchronous Queue Engine & Topological Waves**: Topological wave graph solver with RabbitMQ integration and seamless in-memory fallback.
- 📧 **SMTP & Email Notification System**: Configurable SMTP integration for real-time automated email delivery and contact outreach.

---

## 📐 Service & Port Architecture

| Service / App | Port | Technology | Purpose |
|---|---|---|---|
| **Root Dashboard** | `http://localhost:3000` | Next.js 16 (Turbopack), React 19 | Landing page, Clerk Auth, Excel AI (`/excel`), File Vault (`/files`), Docs (`/docs`) |
| **Monorepo Production Engine** | `http://localhost:3001` | Next.js 15, Turbo, Inngest | Form submission ingest, Inngest background queue, real-time log monitoring API |
| **Workflow Engine API** | `http://localhost:4000` | Express 5, Node.js (ESM) | Graph traversal engine, SQLite Prisma connection (WAL mode), scheduler daemon |
| **Express Companion API** | `http://localhost:4001` | Express 5, Node.js | Microservice utility server (`/health`, `/api/health`, `/api/message`) |
| **Visual Flow Canvas Editor** | `http://localhost:5173` | React 19, Vite, React Flow | Drag-and-drop visual workflow editor & node inspector |

---

## ⚡ Quick Start

### Option 1: Run All Services Locally (Recommended)

Start the entire monorepo stack (Dashboard, Workflow Engine, Companion API, Production Engine, Visual Designer) with a single command:

```bash
# Push Prisma schema and launch all microservices concurrently
npm run dev:all
```

Access the application portals:
* 🌐 **Root Dashboard & Workspace:** [http://localhost:3000](http://localhost:3000)
* ⚡ **Visual Flow Canvas Editor:** [http://localhost:5173](http://localhost:5173)
* 📊 **Excel AI Workspace:** [http://localhost:3000/excel](http://localhost:3000/excel)
* 🚀 **Production Engine Monorepo:** [http://localhost:3001](http://localhost:3001)
* 🛠️ **Express Companion API:** [http://localhost:4001](http://localhost:4001)

---

### Option 2: Run via Docker Compose

Spin up the containerized production environment:

```bash
# 1. Build and launch all containers
npm run docker:up

# 2. Inspect container status
npm run docker:status

# 3. Stop containers
npm run docker:down
```

---

## 🧪 Testing & Application Crawler

NEURON_FLOW includes an automated web crawler and route verification script:

```bash
# Run the automated application crawler across frontend & API routes
npm run crawl
```

The crawler tests all primary frontend pages (`/`, `/workflows`, `/excel`, `/docs`, `/privacy`, `/support`, `/files`, `/coming-soon`) and Express companion API endpoints (`/health`, `/api/health`, `/api/message`), reporting status codes, page titles, body byte sizes, and discovered internal link hrefs.

---

## 🔑 Environment Configuration

Centralized configuration via root `.env` (template provided in [.env.example](file:///d:/.vscode/workspace/.env.example)):

```env
# Core Server & Database URLs
DATABASE_URL="postgres://user:password@localhost:5432/neuron_flow?sslmode=require"
WORKFLOW_DATABASE_URL="file:./dev.db"
PORT=4000
EXPRESS_PORT=4001
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3001"

# Clerk Authentication Secrets
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Queue & Services
RABBITMQ_URL="amqp://localhost:5672"
RABBITMQ_QUEUE_NAME="neuron_flow_queue"

# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="app-password"
SMTP_SECURE=false
EMAIL_FROM="NEURON_FLOW Automation <noreply@neuronflow.local>"

# AI & Provider Keys
OPENAI_API_KEY="sk-proj-your-openai-key"
```

---

## 📂 Repository Structure

```
.
├── automation-engine/           # Next.js 15 + Turbo Monorepo Ingest & Node Package Engine
│   ├── apps/web/                # Web Dashboard, Form Submission & Inngest API
│   │   ├── app/api/forms/       # Form Ingest & Submission Endpoints
│   │   ├── app/api/executions/  # Real-Time Execution Log Telemetry API
│   │   ├── app/api/inngest/     # Inngest Background Queue Workers & Route Handler
│   │   └── components/nodes/    # Visual Node Cards (ExcelNode, McpConnectorNode)
│   └── packages/                # Monorepo Core Libraries
│       ├── engine/              # Graph Executor (Topological BFS Traversal)
│       └── nodes/               # Node Executors (excel, mcp-connector, openai, anthropic, gemini, slack)
├── automation-workflow/         # Visual Canvas Subproject (React Flow + Express + SQLite)
│   ├── backend/                 # Backend REST Engine, Queue & Scheduler
│   │   ├── db.js                # Centralized Prisma Singleton (WAL Mode)
│   │   ├── engine.js            # Graph traversal engine (Topological wave execution)
│   │   ├── rabbitmq.js          # RabbitMQ message queue & fallback
│   │   ├── scheduler.js         # Scheduled & delayed job scheduler (10s timers)
│   │   └── server.js            # Express API endpoints & SMTP sender
│   ├── frontend/                # React Flow Canvas SPA
│   │   ├── src/App.tsx          # Canvas editor, state, & inspector sidebars
│   │   ├── src/CustomNode.tsx   # Custom Node UI Cards (Status Badges)
│   │   └── src/CustomEdge.tsx   # Animated edges & connection deletion controls
│   └── prisma/schema.prisma     # SQLite Schema (User, Workflow, ExecutionLog, McpConnection)
├── pages/                       # Root Next.js Pages (Clerk Auth & Dashboard)
│   ├── index.js                 # Dark Mode Landing Page & Clerk User Sync
│   ├── excel.js                 # Excel AI Workspace Page
│   ├── files.js                 # Neuron Vault File System Page
│   ├── docs.js                  # Documentation Page
│   ├── coming-soon.js           # Feature Roadmap Page
│   ├── sign-in/[[...index]].js  # Clerk Sign-In Page
│   └── sign-up/[[...index]].js  # Clerk Sign-Up Page
├── scripts/                     # Utility & Diagnostic Scripts
│   ├── crawl-app.js             # Automated Route & API Crawler
│   ├── test-throughput.js       # Execution Throughput Benchmark
│   └── verify-prisma.ts         # Prisma Database Verification
├── server/                      # Express Companion Utility API (`:4001`)
│   └── index.js                 # Health & Microservice Endpoints
├── .env                         # Active Environment Configuration
├── package.json                 # Monorepo Script Orchestrator
└── docker-compose.yml           # Container Orchestration Manifest
```

---

## 🛠️ Production Build & Verification

All builds across the monorepo compile cleanly:

```bash
# 1. Root Next.js Dashboard Build
npm run build                     # ✓ Compiled successfully (Next.js 16 Turbopack)

# 2. Automation Engine Monorepo Build
npm run build:prod                # ✓ All package builds successful

# 3. Visual Flow Frontend Build
cd automation-workflow/frontend && npm run build  # ✓ Vite bundle built successfully

# 4. Route Crawler Audit
npm run crawl                     # ✓ All 8 frontend routes & companion APIs 200 OK
```

Enjoy building automated pipelines with **NEURON_FLOW**! 🚀

