"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultExecutionQueue = exports.MemoryAsyncExecutionQueue = void 0;
const events_1 = require("events");
class MemoryAsyncExecutionQueue extends events_1.EventEmitter {
    queue = [];
    locks = new Map();
    async enqueueJob(job) {
        this.queue.push(job);
        this.emit('job:enqueued', job);
    }
    async popNextJob() {
        if (this.queue.length === 0)
            return null;
        return this.queue.shift() || null;
    }
    async acquireLock(lockKey, ttlMs) {
        const now = Date.now();
        const existingExpiry = this.locks.get(lockKey);
        if (existingExpiry && existingExpiry > now) {
            return false; // Lock taken
        }
        this.locks.set(lockKey, now + ttlMs);
        return true;
    }
    async releaseLock(lockKey) {
        this.locks.delete(lockKey);
    }
    getPendingCount() {
        return this.queue.length;
    }
}
exports.MemoryAsyncExecutionQueue = MemoryAsyncExecutionQueue;
exports.defaultExecutionQueue = new MemoryAsyncExecutionQueue();
