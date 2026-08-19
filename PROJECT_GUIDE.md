# 📘 Workspace Architecture & Project Guide

Welcome to the **NEURON_FLOW** workspace guide. This document provides a complete breakdown of the monorepo layout, core subprojects, database schemas, API routes, node execution engine, and deployment guides.

---

## 📂 Monorepo Layout Overview

```
.
├── automation-engine/           # Turbo Monorepo (Next.js 15, Inngest Queue & Engine)
│   ├── apps/web/                # Ingest App, Form Builder & API Services
│   │   ├── app/api/forms/       # Form CRUD & POST /api/forms/[id]/submit
│   │   ├── app/api/executions/  # Real-Time Monitoring GET /api/executions/[id]/logs
│   │   ├── app/api/inngest/     # Inngest Background Worker Queue Handlers
│   │   └── components/nodes/    # React Flow UI Nodes (ExcelNode, McpConnectorNode)
│   └── packages/                # Core Monorepo Packages
│       ├── engine/              # Graph Engine (Topological BFS Traversal)
│       ├── nodes/               # Node Definitions (excel, mcp-connector, openai, etc.)
│       ├── sdk/                 # Node Execution SDK & Template Resolvers
│       └── db/                  # Shared Prisma ORM Database Models
│
├── automation-workflow/         # Visual Workflow Canvas Subproject
│   ├── backend/                 # Node.js + Express backend orchestrator
│   │   ├── db.js                # Centralized Prisma Client (SQLite WAL mode enabled)
│   │   ├── engine.js            # Asynchronous BFS Queue Processor
│   │   ├── scheduler.js         # Delayed job daemon & recurring 10s timer scheduler
│   │   ├── rabbitmq.js          # RabbitMQ event queue integration & fallback
│   │   └── server.js            # Express API & SMTP Email Sender
│   ├── frontend/                # React + Vite visual canvas UI
│   │   ├── src/App.tsx          # Workflow editor layout, canvas state & sidebars
│   │   ├── src/CustomNode.tsx   # Visual Cards (ScheduleTrigger, MarketingNode, etc.)
│   │   └── src/CustomEdge.tsx   # Animated edges & connection deletion handles
│   └── prisma/schema.prisma     # SQLite database schema (`dev.db`)
│
├── pages/                       # Root Next.js Pages (Clerk Auth & Dashboard)
│   ├── index.js                 # NEURON_FLOW Landing Page
│   ├── excel.js                 # Excel AI Generator interface
│   ├── sign-in/[[...index]].js  # Clerk Sign-In
│   └── sign-up/[[...index]].js  # Clerk Sign-Up
├── server/                      # Root Companion Express Server (Port 4001)
├── .env                         # Environment Credentials
├── .env.example                 # Environment Template
├── next.config.js               # Next.js & Turbopack configuration
└── package.json                 # Monorepo script orchestrator
```

---

## 🧩 Key Architecture Components

### 1. Root Workspace App (Next.js Dashboard & Clerk Auth)
- **Frontend Port:** `3000` | **Companion API Port:** `4001`
- **Purpose:** Serves as the primary landing dashboard, user authentication gateway, and file sharing vault.
- **Run Command:** `npm run dev:full`

### 2. Automation Engine Monorepo (Next.js 15 + Turbo + Inngest)
- **Port:** `3001`
- **Purpose:** Ingest event pipeline, Form submission processing (`POST /api/forms/[id]/submit`), background worker queueing (`Inngest`), and real-time execution log streaming (`GET /api/executions/[id]/logs`).

### 3. Automation Workflow Designer (React Flow Canvas + Express Engine)
- **Frontend Port:** `5173` | **Backend Port:** `4000`
- **Purpose:** Visual drag-and-drop workflow designer supporting:
  - **Node Types**: Schedule Trigger, Marketing Email, CRM Action, If/Else Filter, Wait Delay, Run JS Script, OpenAI, Slack, Discord, Google Sheets, Excel Processor, MCP Connector.
  - **Pre-Configured Template**: 10s Interval Health Check & Email Dispatcher.
  - **Execution Engine**: Asynchronous BFS queue processor with SQLite WAL mode to eliminate database lock timeouts (`P1008`).

---

## 🗄️ Database Models & Storage

### SQLite Schema (`automation-workflow/prisma/schema.prisma`)
- **`User`**: Account details and workflow owner relation.
- **`Workflow`**: Graph definitions (`nodes`, `edges` JSON payload).
- **`ExecutionLog`**: Execution logs, run status (`pending`, `running`, `success`, `failed`), and output data.
- **`CRMContact`**: Lead contacts table (`id`, `name`, `email`, `status`, `score`).
- **`SimulatedEmail`**: Sent emails log (`to`, `subject`, `body`, `sentAt`).
- **`DelayedExecution`**: Suspended execution state records waiting for timer resumption.
- **`SharedFile`**: S3 & local file sharing records.

### Monorepo Schema (`automation-engine/packages/db/prisma/schema.prisma`)
- **`Form`**: Form definitions linked to workflows (`workflowId`, `triggerNodeName`).
- **`Execution` & `ExecutionData`**: Ingestion run states and step logs.
- **`McpConnection`**: MCP server registrations and tool schemas.

---

## 🚀 Environment & Deployment Setup

### Environment Variables
Setup [.env](file:///d:/.vscode/workspace/.env) using [.env.example](file:///d:/.vscode/workspace/.env.example):
```bash
cp .env.example .env
```

### Production Build Command
Run production builds across the full monorepo stack:
```bash
# 1. Build Root Dashboard
npm run build

# 2. Build Automation Engine Monorepo
npm run build:prod

# 3. Build Workflow Canvas Frontend
cd automation-workflow/frontend && npm run build
```

Happy orchestrating! 🚀
