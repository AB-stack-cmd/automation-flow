import { PrismaClient } from '@prisma/client';
import { executeWorkflow } from './engine.js';

const prisma = new PrismaClient();

let isPolling = false;
let intervalId = null;

export async function checkAndResumeDelayedExecutions() {
  if (isPolling) return;
  isPolling = true;

  try {
    const now = new Date();
    // Find all expired delays
    const expiredDelays = await prisma.delayedExecution.findMany({
      where: {
        resumeTime: {
          lte: now
        }
      }
    });

    for (const delay of expiredDelays) {
      console.log(`⏱️ Resuming delayed workflow execution: LogID=${delay.executionId}, NodeID=${delay.nodeId}`);

      // Delete delayed log before running to prevent concurrent scheduling issues
      await prisma.delayedExecution.delete({
        where: { id: delay.id }
      });

      // Get existing execution logs so we can append to them
      const executionLog = await prisma.executionLog.findUnique({
        where: { id: delay.executionId }
      });

      let stepLogs = [];
      if (executionLog && executionLog.logs) {
        try {
          stepLogs = JSON.parse(executionLog.logs);
        } catch (e) {
          stepLogs = [];
        }
      }

      stepLogs.push({
        time: new Date().toISOString(),
        message: `Scheduler: Resume time reached. Executing next steps...`
      });

      const context = JSON.parse(delay.contextData);

      // Async resume without blocking loop
      executeWorkflow(delay.workflowId, delay.executionId, delay.nodeId, context, stepLogs)
        .catch(err => {
          console.error(`Error resuming delayed execution ${delay.executionId}:`, err);
        });
    }

  } catch (error) {
    console.error('Error running scheduler check:', error);
  } finally {
    isPolling = false;
  }
}

export function startScheduler(intervalMs = 2000) {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = setInterval(checkAndResumeDelayedExecutions, intervalMs);
  console.log(`⏰ Scheduler loop started. Checking for delayed actions every ${intervalMs / 1000}s`);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('⏰ Scheduler loop stopped.');
  }
}
