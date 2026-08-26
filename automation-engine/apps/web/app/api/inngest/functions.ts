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

export const processFormSubmissionFunction = inngest.createFunction(
  { id: 'process-form-submission' },
  { event: 'form/submitted' },
  async ({ event, step }) => {
    const { formId, formName, workflowId, triggerNodeName, payload } = event.data;

    // Step 1: Ingest payload & sanitize
    const sanitizedData = await step.run('sanitize-form-payload', async () => {
      return {
        ...payload,
        _ingestedAt: new Date().toISOString(),
        _sourceForm: formName || formId,
      };
    });

    // Step 2: Trigger graph workflow if workflowId is set
    let executionResult: any = null;
    if (workflowId) {
      executionResult = await step.run('execute-form-workflow-graph', async () => {
        return executeWorkflow(workflowId, triggerNodeName || 'trigger', sanitizedData);
      });
    }

    return {
      success: true,
      formId,
      executionId: executionResult?.executionId || null,
      status: executionResult?.status || 'ingested',
    };
  }
);
