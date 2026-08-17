import { describe, it, expect, beforeEach } from 'vitest';
import { McpConnectorNode } from './mcp-connector.node';
import { McpClientPool } from './mcp-client-pool';
import { IExecuteFunctions, ItemData } from 'sdk';

function mockContext(params: Record<string, any>, inputItems: ItemData[] = []): IExecuteFunctions {
  return {
    getInputData() {
      return inputItems;
    },
    getNodeParameter(name: string, itemIndex: number, defaultValue?: any) {
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
      returnJsonArray(data: any) {
        const arr = Array.isArray(data) ? data : [data];
        return arr.map((json) => ({ json }));
      },
    },
  };
}

describe('McpConnectorNode', () => {
  const serverUrl = 'https://mcp.notion.com/v1';
  const credentialId = 'cred-notion-001';

  beforeEach(() => {
    McpClientPool.getInstance().clearPool();
  });

  it('discovers tools from MCP server (listTools)', async () => {
    const mockClient = {
      listTools: async () => ({
        tools: [
          { name: 'create_page', description: 'Create Notion Page' },
          { name: 'query_database', description: 'Query Notion Database' },
        ],
      }),
      callTool: async () => ({}),
    };

    McpClientPool.getInstance().registerMockClient(serverUrl, credentialId, mockClient);

    const ctx = mockContext({
      appName: 'notion',
      serverUrl,
      credentialId,
      actionMode: 'listTools',
      apiKey: 'valid-api-key',
    });

    const [outputs] = await McpConnectorNode.execute.call(ctx);
    expect(outputs.length).toBe(1);
    expect(outputs[0].json.tools).toHaveLength(2);
    expect(outputs[0].json.tools[0].name).toBe('create_page');
  });

  it('executes selected MCP tool (callTool)', async () => {
    const mockClient = {
      listTools: async () => ({ tools: [] }),
      callTool: async ({ name, arguments: args }: any) => ({
        content: [{ type: 'text', text: `Page created with title: ${args.title}` }],
      }),
    };

    McpClientPool.getInstance().registerMockClient(serverUrl, credentialId, mockClient);

    const ctx = mockContext(
      {
        appName: 'notion',
        serverUrl,
        credentialId,
        selectedTool: 'create_page',
        inputMapping: { title: '$json.title' },
        actionMode: 'callTool',
        apiKey: 'valid-api-key',
      },
      [{ json: { title: 'Project Roadmap' } }]
    );

    const [outputs] = await McpConnectorNode.execute.call(ctx);
    expect(outputs.length).toBe(1);
    expect(outputs[0].json.success).toBe(true);
    expect(outputs[0].json.tool).toBe('create_page');
    expect(outputs[0].json.result.content[0].text).toContain('Project Roadmap');
  });

  it('returns AUTH_FAILED error code on 401/403 authorization failure', async () => {
    const mockClient = {
      listTools: async () => {
        const err: any = new Error('401 Unauthorized access token');
        err.status = 401;
        throw err;
      },
      callTool: async () => {
        const err: any = new Error('401 Unauthorized access token');
        err.status = 401;
        throw err;
      },
    };

    McpClientPool.getInstance().registerMockClient(serverUrl, credentialId, mockClient);

    const ctx = mockContext({
      appName: 'notion',
      serverUrl,
      credentialId,
      selectedTool: 'create_page',
      apiKey: 'invalid-key',
    });

    const [outputs] = await McpConnectorNode.execute.call(ctx);
    expect(outputs.length).toBe(1);
    expect(outputs[0].json.error).toBeDefined();
    expect(outputs[0].json.error.code).toBe('AUTH_FAILED');
  });
});
