import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface McpClientPoolEntry {
  client: Client;
  serverUrl: string;
  credentialId: string;
  lastUsedAt: Date;
}

export class McpClientPool {
  private static instance: McpClientPool;
  private pool: Map<string, McpClientPoolEntry> = new Map();
  private mockClients: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): McpClientPool {
    if (!McpClientPool.instance) {
      McpClientPool.instance = new McpClientPool();
    }
    return McpClientPool.instance;
  }

  private getPoolKey(serverUrl: string, credentialId: string): string {
    return `${serverUrl}::${credentialId}`;
  }

  public registerMockClient(serverUrl: string, credentialId: string, mockClient: any) {
    const key = this.getPoolKey(serverUrl, credentialId);
    this.mockClients.set(key, mockClient);
  }

  public async getClient(serverUrl: string, credentialId: string, apiKey: string): Promise<Client | any> {
    const key = this.getPoolKey(serverUrl, credentialId);

    if (this.mockClients.has(key)) {
      return this.mockClients.get(key);
    }

    const existing = this.pool.get(key);
    if (existing) {
      existing.lastUsedAt = new Date();
      return existing.client;
    }

    const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    });

    const client = new Client({ name: 'workflow-platform', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);

    this.pool.set(key, {
      client,
      serverUrl,
      credentialId,
      lastUsedAt: new Date(),
    });

    return client;
  }

  public clearPool(): void {
    this.pool.clear();
    this.mockClients.clear();
  }
}
