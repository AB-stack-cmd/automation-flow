export interface McpAppPreset {
    appName: string;
    displayName: string;
    defaultServerUrl: string;
    docsUrl: string;
    description: string;
}
export declare const MCP_APP_REGISTRY: Record<string, McpAppPreset>;
export declare function getMcpAppPreset(appName: string): McpAppPreset;
