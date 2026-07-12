/**
 * Walks the compiled graph using a data-arrival work-queue,
 * executing matching INodeType actions and writing step reports.
 */
export declare function executeWorkflow(workflowId: string, triggerNodeName: string, triggerPayload: Record<string, any>): Promise<{
    success: boolean;
    executionId: string;
    webhookResponse: any;
    error?: undefined;
} | {
    success: boolean;
    executionId: string;
    error: any;
    webhookResponse: null;
}>;
