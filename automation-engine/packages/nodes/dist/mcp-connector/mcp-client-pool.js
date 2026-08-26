"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClientPool = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
class McpClientPool {
    static instance;
    pool = new Map();
    mockClients = new Map();
    constructor() { }
    static getInstance() {
        if (!McpClientPool.instance) {
            McpClientPool.instance = new McpClientPool();
        }
        return McpClientPool.instance;
    }
    getPoolKey(serverUrl, credentialId) {
        return `${serverUrl}::${credentialId}`;
    }
    registerMockClient(serverUrl, credentialId, mockClient) {
        const key = this.getPoolKey(serverUrl, credentialId);
        this.mockClients.set(key, mockClient);
    }
    async getClient(serverUrl, credentialId, apiKey) {
        const key = this.getPoolKey(serverUrl, credentialId);
        if (this.mockClients.has(key)) {
            return this.mockClients.get(key);
        }
        const existing = this.pool.get(key);
        if (existing) {
            existing.lastUsedAt = new Date();
            return existing.client;
        }
        const transport = new streamableHttp_js_1.StreamableHTTPClientTransport(new URL(serverUrl), {
            requestInit: {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            },
        });
        const client = new index_js_1.Client({ name: 'workflow-platform', version: '1.0.0' }, { capabilities: {} });
        await client.connect(transport);
        this.pool.set(key, {
            client,
            serverUrl,
            credentialId,
            lastUsedAt: new Date(),
        });
        return client;
    }
    clearPool() {
        this.pool.clear();
        this.mockClients.clear();
    }
}
exports.McpClientPool = McpClientPool;
