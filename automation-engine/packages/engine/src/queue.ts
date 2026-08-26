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

export class MemoryAsyncExecutionQueue extends EventEmitter implements IExecutionQueue {
  private queue: ExecutionJobPayload[] = [];
  private locks: Map<string, number> = new Map();

  async enqueueJob(job: ExecutionJobPayload): Promise<void> {
    this.queue.push(job);
    this.emit('job:enqueued', job);
  }

  async popNextJob(): Promise<ExecutionJobPayload | null> {
    if (this.queue.length === 0) return null;
    return this.queue.shift() || null;
  }

  async acquireLock(lockKey: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const existingExpiry = this.locks.get(lockKey);

    if (existingExpiry && existingExpiry > now) {
      return false; // Lock taken
    }

    this.locks.set(lockKey, now + ttlMs);
    return true;
  }

  async releaseLock(lockKey: string): Promise<void> {
    this.locks.delete(lockKey);
  }

  getPendingCount(): number {
    return this.queue.length;
  }
}

export const defaultExecutionQueue = new MemoryAsyncExecutionQueue();
