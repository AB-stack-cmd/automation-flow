"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mcp_connector_node_1 = require("./mcp-connector.node");
const mcp_client_pool_1 = require("./mcp-client-pool");
function mockContext(params, inputItems = []) {
    return {
        getInputData() {
            return inputItems;
        },
        getNodeParameter(name, itemIndex, defaultValue) {
            return params[name] !== undefined ? params[name] : defaultValue;
        },
        async getCredentials() {
            if (params.authFail) {
                throw new Error('401 Unauthorized - Invalid API Key');
            }
            return { apiKey: params.apiKey || 'test-key-123' };
        },
        helpers: {
            async httpRequest() {
                return {};
            },
            returnJsonArray(data) {
                const arr = Array.isArray(data) ? data : [data];
                return arr.map((json) => ({ json }));
            },
        },
    };
}
(0, vitest_1.describe)('McpConnectorNode', () => {
    const serverUrl = 'https://mcp.notion.com/v1';
    const credentialId = 'cred-notion-001';
    (0, vitest_1.beforeEach)(() => {
        mcp_client_pool_1.McpClientPool.getInstance().clearPool();
    });
    (0, vitest_1.it)('discovers tools from MCP server (listTools)', async () => {
        const mockClient = {
            listTools: async () => ({
                tools: [
                    { name: 'create_page', description: 'Create Notion Page' },
                    { name: 'query_database', description: 'Query Notion Database' },
                ],
            }),
            callTool: async () => ({}),
        };
        mcp_client_pool_1.McpClientPool.getInstance().registerMockClient(serverUrl, credentialId, mockClient);
        const ctx = mockContext({
            appName: 'notion',
            serverUrl,
            credentialId,
            actionMode: 'listTools',
            apiKey: 'valid-api-key',
        });
        const [outputs] = await mcp_connector_node_1.McpConnectorNode.execute.call(ctx);
        (0, vitest_1.expect)(outputs.length).toBe(1);
        (0, vitest_1.expect)(outputs[0].json.tools).toHaveLength(2);
        (0, vitest_1.expect)(outputs[0].json.tools[0].name).toBe('create_page');
    });
    (0, vitest_1.it)('executes selected MCP tool (callTool)', async () => {
        const mockClient = {
            listTools: async () => ({ tools: [] }),
            callTool: async ({ name, arguments: args }) => ({
                content: [{ type: 'text', text: `Page created with title: ${args.title}` }],
            }),
        };
        mcp_client_pool_1.McpClientPool.getInstance().registerMockClient(serverUrl, credentialId, mockClient);
        const ctx = mockContext({
            appName: 'notion',
            serverUrl,
            credentialId,
            selectedTool: 'create_page',
            inputMapping: { title: '$json.title' },
            actionMode: 'callTool',
            apiKey: 'valid-api-key',
        }, [{ json: { title: 'Project Roadmap' } }]);
        const [outputs] = await mcp_connector_node_1.McpConnectorNode.execute.call(ctx);
        (0, vitest_1.expect)(outputs.length).toBe(1);
        (0, vitest_1.expect)(outputs[0].json.success).toBe(true);
        (0, vitest_1.expect)(outputs[0].json.tool).toBe('create_page');
        (0, vitest_1.expect)(outputs[0].json.result.content[0].text).toContain('Project Roadmap');
    });
    (0, vitest_1.it)('returns AUTH_FAILED error code on 401/403 authorization failure', async () => {
        const mockClient = {
            listTools: async () => {
                const err = new Error('401 Unauthorized access token');
                err.status = 401;
                throw err;
            },
            callTool: async () => {
                const err = new Error('401 Unauthorized access token');
                err.status = 401;
                throw err;
            },
        };
        mcp_client_pool_1.McpClientPool.getInstance().registerMockClient(serverUrl, credentialId, mockClient);
        const ctx = mockContext({
            appName: 'notion',
            serverUrl,
            credentialId,
            selectedTool: 'create_page',
            apiKey: 'invalid-key',
        });
        const [outputs] = await mcp_connector_node_1.McpConnectorNode.execute.call(ctx);
        (0, vitest_1.expect)(outputs.length).toBe(1);
        (0, vitest_1.expect)(outputs[0].json.error).toBeDefined();
        (0, vitest_1.expect)(outputs[0].json.error.code).toBe('AUTH_FAILED');
    });
});
