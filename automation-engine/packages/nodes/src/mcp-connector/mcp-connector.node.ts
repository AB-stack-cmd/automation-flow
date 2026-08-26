import { INodeType, IExecuteFunctions, ItemData } from 'sdk';
import { McpClientPool } from './mcp-client-pool';
import { getMcpAppPreset } from './mcp-app-registry';

export const McpConnectorNode: INodeType = {
  description: {
    displayName: 'Productivity App MCP Connector',
    name: 'action.mcpConnector',
    group: ['action'],
    version: 1,
    description: 'Generic API-key based MCP client node for Notion, Airtable, Todoist, ClickUp and custom MCP tools',
    defaults: {
      name: 'MCP Connector',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'App Preset',
        name: 'appName',
        type: 'options',
        options: [
          { name: 'Notion', value: 'notion' },
          { name: 'Airtable', value: 'airtable' },
          { name: 'Todoist', value: 'todoist' },
          { name: 'ClickUp', value: 'clickup' },
          { name: 'Custom MCP Server', value: 'custom' },
        ],
        default: 'notion',
      },
      {
        displayName: 'MCP Server URL',
        name: 'serverUrl',
        type: 'string',
        default: 'https://mcp.notion.com/v1',
      },
      {
        displayName: 'Credential ID / API Key',
        name: 'credentialId',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Selected Tool',
        name: 'selectedTool',
        type: 'string',
        default: '',
      },
      {
        displayName: 'Input Mapping',
        name: 'inputMapping',
        type: 'json',
        default: '{}',
      },
      {
        displayName: 'Action Mode',
        name: 'actionMode',
        type: 'options',
        options: [
          { name: 'Execute Tool', value: 'callTool' },
          { name: 'Discover Tools (list)', value: 'listTools' },
        ],
        default: 'callTool',
      },
    ],
  },

  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputItems = this.getInputData();
    const itemIndex = 0;

    const appName = this.getNodeParameter('appName', itemIndex, 'notion');
    const preset = getMcpAppPreset(appName);
    const serverUrl = this.getNodeParameter('serverUrl', itemIndex, preset.defaultServerUrl);
    const credentialId = this.getNodeParameter('credentialId', itemIndex, '');
    const selectedTool = this.getNodeParameter('selectedTool', itemIndex, '');
    const actionMode = this.getNodeParameter('actionMode', itemIndex, 'callTool');

    let apiKey = '';
    try {
      const creds = await this.getCredentials('api_key');
      apiKey = creds?.apiKey || creds?.key || creds?.token || credentialId;
    } catch {
      apiKey = credentialId;
    }

    if (!apiKey) {
      return [[{
        json: {
          error: {
            message: 'Authentication failed: Missing API Key or Credential ID',
            code: 'AUTH_FAILED',
          },
        },
      }]];
    }

    try {
      const pool = McpClientPool.getInstance();
      const client = await pool.getClient(serverUrl, credentialId || 'default', apiKey);

      if (actionMode === 'listTools') {
        const toolsResult = await client.listTools();
        return [[{
          json: {
            appName,
            serverUrl,
            tools: toolsResult.tools || toolsResult,
          },
        }]];
      }

      if (!selectedTool) {
        return [[{
          json: {
            error: {
              message: 'No MCP tool selected for execution',
              code: 'MISSING_TOOL_SELECTION',
            },
          },
        }]];
      }

      const rawMapping = this.getNodeParameter('inputMapping', itemIndex, {});
      let toolArguments: Record<string, any> = {};

      if (typeof rawMapping === 'string') {
        try {
          toolArguments = JSON.parse(rawMapping);
        } catch {
          toolArguments = {};
        }
      } else if (typeof rawMapping === 'object' && rawMapping !== null) {
        toolArguments = rawMapping;
      }

      const firstInput = inputItems[0]?.json || {};
      for (const [k, v] of Object.entries(toolArguments)) {
        if (typeof v === 'string' && v.startsWith('$json.')) {
          const pathKey = v.slice(6);
          toolArguments[k] = firstInput[pathKey] ?? v;
        }
      }

      const toolResult = await client.callTool({
        name: selectedTool,
        arguments: toolArguments,
      });

      return [[{
        json: {
          success: true,
          tool: selectedTool,
          result: toolResult,
        },
      }]];

    } catch (err: any) {
      const isAuthErr =
        err.status === 401 ||
        err.status === 403 ||
        /401|403|unauthorized|auth|invalid key|forbidden/i.test(err.message || '');

      return [[{
        json: {
          error: {
            message: err.message || 'MCP tool execution failed',
            code: isAuthErr ? 'AUTH_FAILED' : (err.code || 'MCP_EXECUTION_ERROR'),
          },
        },
      }]];
    }
  },
};
