export interface AsyncExecutionResult {
    success: boolean;
    executionId: string;
    totalWavesProcessed: number;
    error?: string;
    webhookResponse?: any;
}
export declare function executeWorkflowAsync(workflowId: string, triggerNodeName: string, triggerPayload: Record<string, any>): Promise<AsyncExecutionResult>;
