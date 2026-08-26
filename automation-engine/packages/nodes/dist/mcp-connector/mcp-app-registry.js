"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCP_APP_REGISTRY = void 0;
exports.getMcpAppPreset = getMcpAppPreset;
exports.MCP_APP_REGISTRY = {
    notion: {
        appName: 'notion',
        displayName: 'Notion',
        defaultServerUrl: 'https://mcp.notion.com/v1',
        docsUrl: 'https://developers.notion.com',
        description: 'Manage pages, databases, and blocks in Notion',
    },
    airtable: {
        appName: 'airtable',
        displayName: 'Airtable',
        defaultServerUrl: 'https://mcp.airtable.com/v1',
        docsUrl: 'https://airtable.com/api',
        description: 'Read and update records in Airtable bases',
    },
    todoist: {
        appName: 'todoist',
        displayName: 'Todoist',
        defaultServerUrl: 'https://mcp.todoist.com/v1',
        docsUrl: 'https://developer.todoist.com',
        description: 'Create and complete tasks and projects in Todoist',
    },
    clickup: {
        appName: 'clickup',
        displayName: 'ClickUp',
        defaultServerUrl: 'https://mcp.clickup.com/v1',
        docsUrl: 'https://clickup.com/api',
        description: 'Manage tasks, lists, and workspaces in ClickUp',
    },
    custom: {
        appName: 'custom',
        displayName: 'Custom MCP Server',
        defaultServerUrl: '',
        docsUrl: 'https://modelcontextprotocol.io',
        description: 'Connect to any custom MCP compliant server URL',
    },
};
function getMcpAppPreset(appName) {
    return exports.MCP_APP_REGISTRY[appName.toLowerCase()] || exports.MCP_APP_REGISTRY.custom;
}
