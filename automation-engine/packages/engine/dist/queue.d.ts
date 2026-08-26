import { EventEmitter } from 'events';
export interface ExecutionJobPayload {
    executionId: string;
    workflowId: string;
    targetNodeName: string;
    inputPayload: Record<string, any>;
    waveIndex: number;
    attempt: number;
    enqueuedAt: string;
}
export interface IExecutionQueue {
    enqueueJob(job: ExecutionJobPayload): Promise<void>;
    popNextJob(): Promise<ExecutionJobPayload | null>;
    acquireLock(lockKey: string, ttlMs: number): Promise<boolean>;
    releaseLock(lockKey: string): Promise<void>;
}
export declare class MemoryAsyncExecutionQueue extends EventEmitter implements IExecutionQueue {
    private queue;
    private locks;
    enqueueJob(job: ExecutionJobPayload): Promise<void>;
    popNextJob(): Promise<ExecutionJobPayload | null>;
    acquireLock(lockKey: string, ttlMs: number): Promise<boolean>;
    releaseLock(lockKey: string): Promise<void>;
    getPendingCount(): number;
}
export declare const defaultExecutionQueue: MemoryAsyncExecutionQueue;
