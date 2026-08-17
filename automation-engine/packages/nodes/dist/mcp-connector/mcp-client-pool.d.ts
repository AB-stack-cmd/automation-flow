import { Client } from '@modelcontextprotocol/sdk/client/index.js';
export interface McpClientPoolEntry {
    client: Client;
    serverUrl: string;
    credentialId: string;
    lastUsedAt: Date;
}
export declare class McpClientPool {
    private static instance;
    private pool;
    private mockClients;
    private constructor();
    static getInstance(): McpClientPool;
    private getPoolKey;
    registerMockClient(serverUrl: string, credentialId: string, mockClient: any): void;
    getClient(serverUrl: string, credentialId: string, apiKey: string): Promise<Client | any>;
    clearPool(): void;
}
