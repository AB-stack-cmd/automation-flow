import { prisma } from './db.js';
import { executeWorkflow } from './engine.js';

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

    // Run scheduler check for workflows matching their custom timer settings
    await checkAndTriggerScheduledWorkflows();

  } catch (error) {
    console.error('Error running scheduler check:', error);
  } finally {
    isPolling = false;
  }
}

// Parses a cron expression and returns the next execution date
function parseCronNextRun(cronStr, referenceDate) {
  const parts = cronStr.trim().split(/\s+/);
  let sec = '0', min, hour, dom, mon, dow;
  
  if (parts.length === 6) {
    [sec, min, hour, dom, mon, dow] = parts;
  } else if (parts.length === 5) {
    [min, hour, dom, mon, dow] = parts;
  } else {
    throw new Error('Invalid cron expression format');
  }

  function parseField(field, minVal, maxVal) {
    if (field === '*') return null;
    const values = new Set();
    const subParts = field.split(',');
    for (const part of subParts) {
      if (part.includes('/')) {
        const [range, stepStr] = part.split('/');
        const step = parseInt(stepStr, 10);
        let start = minVal, end = maxVal;
        if (range !== '*') {
          if (range.includes('-')) {
            const [s, e] = range.split('-');
            start = parseInt(s, 10);
            end = parseInt(e, 10);
          } else {
            start = parseInt(range, 10);
          }
        }
        for (let i = start; i <= end; i += step) {
          values.add(i);
        }
      } else if (part.includes('-')) {
        const [s, e] = part.split('-');
        const start = parseInt(s, 10);
        const end = parseInt(e, 10);
        for (let i = start; i <= end; i++) {
          values.add(i);
        }
      } else {
        values.add(parseInt(part, 10));
      }
    }
    return values;
  }

  const secSet = parseField(sec, 0, 59);
  const minSet = parseField(min, 0, 59);
  const hourSet = parseField(hour, 0, 23);
  const domSet = parseField(dom, 1, 31);
  const monSet = parseField(mon, 1, 12);
  const dowSet = parseField(dow, 0, 6);

  const limitDate = new Date(referenceDate);
  limitDate.setFullYear(limitDate.getFullYear() + 5);

  let next = new Date(referenceDate);
  next.setSeconds(next.getSeconds() + 1);
  next.setMilliseconds(0);

  while (next < limitDate) {
    if (monSet && !monSet.has(next.getMonth() + 1)) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      continue;
    }
    if (domSet && !domSet.has(next.getDate())) {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      continue;
    }
    if (dowSet && !dowSet.has(next.getDay())) {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      continue;
    }
    if (hourSet && !hourSet.has(next.getHours())) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0, 0, 0);
      continue;
    }
    if (minSet && !minSet.has(next.getMinutes())) {
      next.setMinutes(next.getMinutes() + 1);
      next.setSeconds(0, 0);
      continue;
    }
    if (secSet && !secSet.has(next.getSeconds())) {
      next.setSeconds(next.getSeconds() + 1);
      continue;
    }
    return next;
  }
  
  return new Date(referenceDate.getTime() + 60 * 1000);
}

export function calculateNextRun(data, referenceDate = new Date()) {
  const { scheduleType, intervalValue, intervalUnit, customDate, cronExpression } = data;
  const now = new Date(referenceDate);

  if (scheduleType === 'date') {
    if (!customDate) return new Date(now.getTime() + 60 * 60 * 1000);
    const targetDate = new Date(customDate);
    return targetDate > now ? targetDate : new Date('2099-12-31T23:59:59Z');
  }

  if (scheduleType === 'cron') {
    try {
      return parseCronNextRun(cronExpression || '*/10 * * * * *', now);
    } catch (e) {
      console.error('Cron parsing error, falling back to 1 minute:', e);
      return new Date(now.getTime() + 60 * 1000);
    }
  }

  const value = Math.max(1, parseInt(intervalValue, 10) || 10);
  const unit = intervalUnit || 'seconds';
  const next = new Date(now);

  switch (unit) {
    case 'seconds':
      next.setSeconds(next.getSeconds() + value);
      break;
    case 'minutes':
      next.setMinutes(next.getMinutes() + value);
      break;
    case 'hours':
      next.setHours(next.getHours() + value);
      break;
    case 'days':
      next.setDate(next.getDate() + value);
      break;
    case 'weeks':
      next.setDate(next.getDate() + value * 7);
      break;
    case 'months':
      next.setMonth(next.getMonth() + value);
      break;
    case 'years':
      next.setFullYear(next.getFullYear() + value);
      break;
    default:
      next.setSeconds(next.getSeconds() + value);
      break;
  }
  return next;
}

export async function checkAndTriggerScheduledWorkflows() {
  try {
    const now = new Date();
    const activeWorkflows = await prisma.workflow.findMany({
      where: { isActive: true }
    });

    for (const workflow of activeWorkflows) {
      let definition;
      try {
        definition = JSON.parse(workflow.definition);
      } catch (e) {
        continue;
      }

      if (!definition || !definition.nodes) continue;

      const scheduleNode = definition.nodes.find(n => n.type === 'schedule_trigger');
      if (!scheduleNode) continue;

      if (!scheduleNode.data) scheduleNode.data = {};

      const nextRunStr = scheduleNode.data.nextRun;
      let nextRunDate = nextRunStr ? new Date(nextRunStr) : null;

      if (!nextRunDate || isNaN(nextRunDate.getTime())) {
        nextRunDate = now;
      }

      if (now >= nextRunDate) {
        console.log(`⏰ Triggering scheduled workflow: "${workflow.name}" (ID=${workflow.id})`);

        let calculatedNextRun = calculateNextRun(scheduleNode.data, now);
        // Safety guard: ensure next run is strictly in the future (minimum 10s)
        if (calculatedNextRun <= now) {
          calculatedNextRun = new Date(now.getTime() + 10000);
        }

        scheduleNode.data.lastRun = now.toISOString();
        scheduleNode.data.nextRun = calculatedNextRun.toISOString();

        // Update workflow definition in DB BEFORE starting execution logs or sub-workflows
        try {
          await prisma.workflow.update({
            where: { id: workflow.id },
            data: { definition: JSON.stringify(definition) }
          });
        } catch (updateErr) {
          console.error(`Error updating scheduled workflow nextRun for ID=${workflow.id}:`, updateErr.message);
          continue;
        }

        const execution = await prisma.executionLog.create({
          data: {
            workflowId: workflow.id,
            status: 'running',
            logs: JSON.stringify([{ time: now.toISOString(), message: `Triggered by schedule: ${scheduleNode.data.label || 'Schedule'}` }]),
            triggerData: JSON.stringify({ triggeredAt: now.toISOString() })
          }
        });

        const context = { trigger: { triggeredAt: now.toISOString() }, steps: {} };
        executeWorkflow(workflow.id, execution.id, scheduleNode.id, context)
          .catch(err => {
            console.error(`Error executing scheduled workflow ${workflow.id}:`, err);
          });
      }
    }
  } catch (error) {
    console.error('Error running checkAndTriggerScheduledWorkflows:', error);
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
