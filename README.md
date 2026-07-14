# 🚀 NEURON_FLOW | Orchestrated Complexity

A premium visual workflow automation engine and dashboard template, combining a **Next.js** dashboard, **Express** REST API engines, and **React Flow** drag-and-drop workflow canvases.

---

## ⚡ Quick Start (Single-Command Run)

You can run the entire multi-service stack either locally or via Docker Compose using a single command.

### Option 1: Run Locally (Recommended for Speed)

This boots up the dashboard and the workflow designer stack instantly. It automatically handles SQLite database synchronization and launches the servers concurrently.

```bash
# 1. Start all services concurrently
npm run dev:all
```

Once running, you can access:
* **Root Dashboard (Next.js):** [http://localhost:3000](http://localhost:3000)
* **Visual Flow Canvas Editor:** [http://localhost:5173](http://localhost:5173)
* **Visual Flow Engine API:** [http://localhost:4000](http://localhost:4000)
* **Root Companion Express API:** [http://localhost:4001](http://localhost:4001)

---

### Option 2: Run via Docker Compose (Includes Postgres + Redis)

If you have Docker Desktop running, you can start the full distributed production-grade stack (including PostgreSQL and Redis queue workers).

```bash
# 1. Spin up all containers in detached mode (built-in build speed optimizations included)
npm run docker:up

# 2. Check container status
npm run docker:status

# 3. Stop and tear down the stack
npm run docker:down
```

Once running via Docker:
* **Root Dashboard (Next.js):** [http://localhost:3000](http://localhost:3000)
* **Visual Flow Canvas Editor:** [http://localhost:5173](http://localhost:5173)
* **Visual Flow Engine API:** [http://localhost:4000](http://localhost:4000)
* **Root Companion Express API:** [http://localhost:4001](http://localhost:4001)
* **Production n8n-style Engine (Next.js):** [http://localhost:5174](http://localhost:5174)

---

## 📂 Project Architecture

```
.
├── automation-workflow/    # Drag-and-drop Visual Canvas (React Flow + Express + SQLite)
├── automation-engine/      # Distributed Production-Grade Engine (Next.js + Postgres + Redis)
├── pages/                  # Root Dashboard Front-End Pages (Next.js)
├── server/                 # Root Companion API Backend (Express)
├── package.json            # Root workspaces orchestrator & scripts runner
└── docker-compose.yml      # Orchestration config for all 6 containers
```

---

## 🛠️ Dev CLI Commands

| Command | Description |
|---|---|
| `npm run dev:all` | Run the complete local dashboard + workflow stack concurrently |
| `npm run docker:up` | Build and start all 6 services via Docker Compose in the background |
| `npm run docker:status` | Check the running status of Docker containers |
| `npm run docker:down` | Stop and remove all Docker containers |
| `npm run dev:full` | Start only the root Next.js dashboard + root companion server |
| `npm run db:push:workflow` | Synchronize/migrate the SQLite database schema |

---

Enjoy your premium-styled development environment! 🚀
