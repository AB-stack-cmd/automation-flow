# 🚀 NEURON_FLOW | UX Enhancement Roadmap & Agent Execution Blueprint

This document outlines the master feature roadmap, detailed implementation plans, and copy-pasteable execution prompts designed for AI coding agents to autonomously build and integrate each phase of the **NEURON_FLOW** platform.

---

## 📐 System Architecture Overview

The NEURON_FLOW workspace consists of three core applications running in harmony:
1. **Root Next.js Dashboard (`http://localhost:3000`)**: Landing page & Excel AI visual editor (`pages/index.js`, `pages/excel.js`).
2. **SQLite Visual Workflow Designer (`http://localhost:5173`)**: React Flow canvas frontend (`automation-workflow/frontend`) + Express backend (`automation-workflow/backend`).
3. **Production Engine Monorepo (`http://localhost:5174`)**: Next.js production workflow app (`automation-engine/apps/web`) backed by PostgreSQL, BullMQ, and Redis.

---

## 🛠️ Phase 1: Inter-Service Connection & Unified Navigation Gateway

### 📋 Technical Implementation Plan
* **Goal**: Provide a unified header across all 3 services (`:3000`, `:5173`, `:5174`) so users can switch tools with single-click navigation without breaking session context.
* **Target Files**:
  * `pages/index.js` (Root Next.js)
  * `pages/excel.js` (Excel AI)
  * `automation-workflow/frontend/src/App.tsx` (React Flow Canvas)
  * `automation-engine/apps/web/app/layout.tsx` (Production Engine)
* **Key Tasks**:
  1. Create a shared navigation component styling standard with links to:
     - Dashboard (`http://localhost:3000`)
     - Visual Flow Canvas (`http://localhost:5173`)
     - Production Engine (`http://localhost:5174`)
     - Excel AI Generator (`http://localhost:3000/excel`)
  2. Implement an active service pill indicator showing running service health checks.

### 🤖 Agent Execution Prompt
```markdown
PROMPT: Build a unified top navigation bar across NEURON_FLOW services.

Please add a clean, dark-themed navigation bar header to the top of pages/index.js, pages/excel.js, and automation-workflow/frontend/src/App.tsx. 

Requirements:
1. Include the logo "NEURON_FLOW" with a glowing yellow/red hub icon on the left.
2. Add quick-switch navigation links:
   - "Dashboard" -> http://localhost:3000
   - "Visual Designer" -> http://localhost:5173
   - "Production Engine" -> http://localhost:5174
   - "Excel AI" -> http://localhost:3000/excel
3. Highlight the active link based on current page URL.
4. Add a live status pill on the top right showing "Services Active: 4000 / 3000".
5. Use Tailwind CSS glassmorphism styles (bg-surface/80 backdrop-blur-xl border-b border-white/10).
```

---

## ⚡ Phase 2: Live Canvas Execution Debugger & Visual Node States

### 📋 Technical Implementation Plan
* **Goal**: Provide live visual feedback on the React Flow canvas during workflow execution. Highlight active execution paths with animated edge pulses and show step status/payloads directly on node cards.
* **Target Files**:
  * `automation-workflow/frontend/src/App.tsx`
  * `automation-workflow/frontend/src/CustomNode.tsx`
  * `automation-workflow/backend/engine.js`
  * `automation-workflow/backend/server.js` (WebSocket / SSE stream)
* **Key Tasks**:
  1. Add a Server-Sent Events (SSE) or WebSocket route `/api/executions/:id/stream` in `server.js` to broadcast node execution progress in real-time.
  2. Update `CustomNode.tsx` to display status badges (`Pending`, `Executing`, `Success`, `Error`) and step duration (e.g. `12ms`).
  3. Animate React Flow connection edges during active step runs with animated glowing stroke CSS.
  4. Add an "Inspect Payload" drawer when clicking any node card to view input/output JSON.

### 🤖 Agent Execution Prompt
```markdown
PROMPT: Build a live visual debugger and node step inspector for the visual workflow canvas.

Please enhance automation-workflow/frontend/src/App.tsx and CustomNode.tsx:

Requirements:
1. Modify CustomNode.tsx to accept an `executionStatus` prop ('pending' | 'running' | 'success' | 'failed') and step execution duration in milliseconds.
2. Render a subtle status badge on top-right of node cards:
   - Running: Pulsing yellow border & spinner icon
   - Success: Small green checkmark pill with duration (e.g. "14ms")
   - Error: Red error alert pill
3. In App.tsx, add a right-side drawer panel "Node Output Inspector" that opens when clicking a node. Show the node's `inputs` and `outputs` formatted in clean syntax-highlighted JSON.
4. When a workflow run is triggered, dynamically update the canvas edge styles (`animated: true`, `style: { stroke: '#facc15' }`) for edges connected to currently executing nodes.
```

---

## 🎨 Phase 3: Searchable Node Palette, Workflow Templates & DAG Auto-Layout

### 📋 Technical Implementation Plan
* **Goal**: Improve builder productivity with a searchable drag-and-drop node sidebar, pre-built workflow templates, and auto-arrange layout.
* **Target Files**:
  * `automation-workflow/frontend/src/App.tsx`
  * `automation-workflow/frontend/src/Sidebar.tsx` (New Component)
  * `automation-workflow/frontend/src/templates.ts` (New File)
* **Key Tasks**:
  1. Create a searchable node palette grouped by categories:
     - ⚡ **Triggers**: Webhook, Schedule, CRM Event, Google Form
     - 🔀 **Logic**: If/Else, Delay, Code Runner
     - 🤖 **AI Core**: OpenAI GPT-4o, Gemini Flash, Sentiment Analysis
     - 📢 **Actions**: Send Email, Slack Alert, CRM Contact, Google Sheets
  2. Add a "Template Gallery" dropdown to load pre-built workflows (e.g., *Lead Scoring Pipeline*, *Slack Webhook Alert*).
  3. Add an "Auto Layout" button that uses graph layout math to format messy node graphs into clean horizontal/vertical layouts.

### 🤖 Agent Execution Prompt
```markdown
PROMPT: Build a searchable node sidebar, template gallery, and auto-layout button for the workflow editor.

Please update automation-workflow/frontend:

Requirements:
1. Create a left sidebar component with a search input at top.
2. Categorize draggable nodes under 4 collapsible headers: Triggers, Logic & Flow, AI Core, and Actions.
3. Allow dragging any node item from the sidebar onto the React Flow canvas to instantiate it at drop position (`onDrop` & `onDragOver`).
4. Add a "Templates" modal header button with 3 ready-to-use workflows:
   - "AI Lead Qualification": Trigger ➔ If/Else ➔ Send Email / Update CRM
   - "Webhook to Slack": Webhook ➔ AI Classify ➔ Slack Message
   - "Google Sheets Sync": Schedule ➔ Read Sheet ➔ Send Email
5. Add an "Auto Arrange" button in the canvas toolbar that calculates clean node positions (X/Y grid spacing) and animates nodes into organized layout positions.
```

---

## 🧠 Phase 4: Multi-Provider AI Core & Integration Nodes

### 📋 Technical Implementation Plan
* **Goal**: Expand AI and integration capabilities by adding dedicated nodes for OpenAI, Gemini, Claude, Slack, Discord, and Google Sheets.
* **Target Files**:
  * `automation-engine/packages/nodes/src/`
  * `automation-workflow/backend/engine.js`
* **Key Tasks**:
  1. Create `googleSheets.ts`, `slack.ts`, `discord.ts`, and `openai.ts` node implementations.
  2. Support template string interpolation in all node parameter inputs (`{{$json.email}}`, `{{$json.score}}`).
  3. Add real HTTP execution helpers with fallback handling for unconfigured API keys.

### 🤖 Agent Execution Prompt
```markdown
PROMPT: Implement multi-provider AI and integration nodes with template string substitution.

Please extend automation-workflow/backend/engine.js:

Requirements:
1. Add full support for the following node types:
   - `openai`: Takes `prompt`, `model` ('gpt-4o' | 'gpt-4o-mini'), and `systemMessage`. Returns generated text.
   - `gemini`: Takes `prompt` and `model` ('gemini-1.5-flash'). Returns generated text.
   - `slack`: Takes `webhookUrl` and `text`. Sends HTTP POST payload to Slack webhook.
   - `discord`: Takes `webhookUrl` and `content`. Sends HTTP POST payload to Discord webhook.
   - `google_sheets`: Supports `action` ('read' | 'append'). Appends or reads row objects.
2. Ensure all string parameters undergo template interpolation using `interpolateTemplate(val, context)`.
3. Safely fallback to simulated mock output with informative log entries if API keys (e.g. OPENAI_API_KEY) are unset.
```

---

## 📊 Phase 5: Excel AI ➔ Workflow Execution Pipeline Bridge

### 📋 Technical Implementation Plan
* **Goal**: Connect the Excel AI visual spreadsheet tool directly to workflow execution pipelines.
* **Target Files**:
  * `pages/excel.js`
  * `pages/api/run-workflow-excel.js` (New API Route)
  * `automation-workflow/backend/server.js`
* **Key Tasks**:
  1. Add a "Trigger Workflow Pipeline" action button on each row in `pages/excel.js`.
  2. Add a batch workflow trigger option to process selected spreadsheet rows in parallel.
  3. Display live execution status badges directly inside the Excel table cells (`Pending...` ➔ `Success`).

### 🤖 Agent Execution Prompt
```markdown
PROMPT: Build the Excel AI to Workflow Pipeline Bridge.

Please update pages/excel.js and create a new Next.js API route pages/api/run-workflow-excel.js:

Requirements:
1. In pages/excel.js, add a dropdown selector in the toolbar to pick an active Workflow (fetch list from http://localhost:4000/api/workflows).
2. Add a new action column in the handsontable/spreadsheet table: "Run Pipeline 🚀".
3. When clicked, post the current row data as JSON payload to `http://localhost:4000/api/workflows/:id/execute`.
4. Add a "Batch Run All Rows" button that triggers execution for every row in parallel with a live progress bar.
5. Display the execution status (`Success`, `Execution ID: #...`) in a dedicated table column.
```

---

## 📌 Implementation Checklist & Progress Tracker

- [ ] **Phase 1**: Inter-Service Navigation Bar & Header Gateway
- [ ] **Phase 2**: Live Canvas Execution Debugger & Node Inspector
- [ ] **Phase 3**: Searchable Node Palette & DAG Auto-Layout
- [ ] **Phase 4**: Multi-Provider AI Core & Integration Nodes
- [ ] **Phase 5**: Excel AI ➔ Workflow Execution Bridge
