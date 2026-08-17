# Agent Task: Excel Node + Generic Productivity-App MCP Connector Node

## Context
Building two nodes for an n8n-style workflow automation platform.
Stack (locked, do not deviate): TypeScript/Node.js, Prisma + PostgreSQL, BullMQ + Redis, React Flow (canvas), Express (API layer).

Both nodes plug into the existing node executor interface:
```ts
interface NodeExecutor {
  type: string;
  execute(input: NodeInput, context: ExecutionContext): Promise<NodeOutput>;
  validate?(config: NodeConfig): ValidationResult;
}
```

---

## Node 1 — Excel Node (`excel.node.ts`)

**Purpose:** Read/write/transform `.xlsx` files inside a workflow run.

**Library:** `exceljs` (streaming support, formula + style preservation — better than SheetJS for write-heavy workflows).

**Operations to implement:**
| Operation | Description |
|---|---|
| `readSheet` | Load workbook (from file path, URL, or binary buffer passed by prior node), return rows as JSON |
| `writeSheet` | Take JSON array from input, write/append to a sheet, return file buffer |
| `appendRow` | Append single/batch rows to existing sheet without full rewrite |
| `filterRows` | Apply a JS expression / column filter, output matching rows |
| `createWorkbook` | Build a new `.xlsx` from scratch with named sheets |

**Config schema (Prisma `NodeConfig.data` JSON):**
```ts
interface ExcelNodeConfig {
  operation: 'readSheet' | 'writeSheet' | 'appendRow' | 'filterRows' | 'createWorkbook';
  sourceType: 'binary' | 'filePath' | 'url';
  sheetName?: string;
  headerRow?: boolean;       // treat row 1 as keys
  range?: string;            // e.g. "A1:D50"
  outputFormat: 'json' | 'binary';
}
```

**Requirements:**
- Stream large files (>10MB) — do not load fully into memory via `exceljs.stream.xlsx`.
- Binary output must attach to `NodeOutput.binary` so downstream nodes (e.g. email/upload) can consume it.
- Validate file size against a configurable cap before processing (default 25MB).
- Errors (corrupt file, missing sheet) surface as `NodeOutput.error`, not thrown exceptions — executor must keep the workflow run alive for error-branch routing.

**Tasks for agent:**
1. `src/nodes/excel/excel.node.ts` — executor implementation
2. `src/nodes/excel/excel.schema.ts` — Zod schema for config validation
3. `src/nodes/excel/excel.node.test.ts` — unit tests: read, write, append, malformed file
4. Register node in the node registry (`src/nodes/registry.ts`)
5. React Flow node UI component: `apps/web/components/nodes/ExcelNode.tsx` (operation dropdown, sheet name input, file input/output ports)

---

## Node 2 — Generic Productivity-App Connector (API-key based, MCP-backed)

**Purpose:** One node type that can talk to *any* productivity app (Notion, Airtable, Todoist, ClickUp, etc.) by connecting to that app's MCP server using a user-supplied API key — no per-app custom node needed.

**Design:** Node acts as an MCP *client*. On save, it connects to the target MCP server, discovers available tools, and lets the user pick one + fill its input schema. At execution time it just calls that tool.

**Flow:**
1. User selects "Productivity App Connector" node, picks app from a registry (or enters a custom MCP server URL).
2. User pastes API key → stored via existing credential encryption service (do not store plaintext; reuse `CredentialsService.encrypt`).
3. Node calls the MCP server's `tools/list` to discover available actions, caches the schema.
4. User picks a tool + maps input fields from previous node's output (existing expression/mapping UI).
5. On workflow run, executor calls `tools/call` with resolved inputs and returns the MCP tool result as `NodeOutput.json`.

**MCP client setup:**
```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function connectMcp(serverUrl: string, apiKey: string) {
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
  });
  const client = new Client({ name: 'workflow-platform', version: '1.0.0' });
  await client.connect(transport);
  return client;
}
```

**Data model addition (Prisma):**
```prisma
model McpConnection {
  id           String   @id @default(cuid())
  workflowId   String
  nodeId       String
  serverUrl    String
  appName      String
  credentialId String   // FK to existing encrypted Credential table
  toolSchema   Json      // cached tools/list result
  selectedTool String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Config schema:**
```ts
interface McpConnectorConfig {
  appName: string;
  serverUrl: string;
  credentialId: string;
  selectedTool: string;
  inputMapping: Record<string, string>; // field -> expression referencing prior node output
  retryOnAuthError: boolean;
}
```

**Requirements:**
- Auth failures (401/expired key) must produce a distinct `NodeOutput.error.code = 'AUTH_FAILED'` so the UI can prompt for key re-entry, not a generic failure.
- Tool schema cache refresh: expose a "Reconnect / refresh tools" action, don't force re-fetch on every run (avoid rate-limit hits).
- Connection pooling: reuse the MCP client per `(serverUrl, credentialId)` pair within a single execution batch (BullMQ worker), don't reconnect per node call.
- Timeout + retry: wrap `tools/call` with the existing job-level retry/backoff policy already used for HTTP nodes.
- This node must NOT hardcode any specific app's logic — it's a generic MCP client + credential + schema-driven form. App-specific presets (Notion, Airtable, etc.) are just a registry entry: `{ appName, defaultServerUrl, docsUrl }`, nothing more.

**Tasks for agent:**
1. `src/nodes/mcp-connector/mcp-connector.node.ts` — executor
2. `src/nodes/mcp-connector/mcp-client-pool.ts` — connection pooling/reuse
3. `src/nodes/mcp-connector/mcp-app-registry.ts` — known app presets (server URL templates)
4. `prisma/schema.prisma` — add `McpConnection` model, migration
5. `apps/web/components/nodes/McpConnectorNode.tsx` — UI: app picker, API key input (masked, routes to CredentialsService), tool picker, dynamic form generated from `toolSchema.inputSchema`
6. `src/nodes/mcp-connector/mcp-connector.node.test.ts` — mock MCP server, test discovery + call + auth-failure path

---

## Acceptance Criteria
- [ ] Both nodes registered and selectable on canvas
- [ ] Excel node handles files up to 25MB without OOM
- [ ] MCP connector node works against at least 2 real MCP servers in dev (pick 2 with public MCP endpoints for testing)
- [ ] Credentials never logged or stored in plaintext (confirm via existing CredentialsService audit)
- [ ] Both nodes have error-branch output wired so workflow doesn't hard-crash on failure
- [ ] Unit test coverage ≥ existing node baseline in repo