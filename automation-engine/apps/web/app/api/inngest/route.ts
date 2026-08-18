import { serve } from 'inngest/next';
import { inngest } from './client';
import { runWorkflowFunction, processFormSubmissionFunction } from './functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runWorkflowFunction, processFormSubmissionFunction],
});
