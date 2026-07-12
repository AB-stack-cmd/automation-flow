import { inngest } from './client';
import { executeWorkflow } from 'engine';

export const runWorkflowFunction = inngest.createFunction(
  { id: 'run-workflow' },
  { event: 'workflow/run' },
  async ({ event, step }) => {
    const { workflowId, triggerNodeName, payload } = event.data;

    const result = await step.run('execute-workflow-graph', async () => {
      return executeWorkflow(workflowId, triggerNodeName, payload);
    });

    return {
      success: result.success,
      executionId: result.executionId,
    };
  }
);
