import { serve } from 'inngest/next';
import { inngest } from './client';
import { runWorkflowFunction } from './functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runWorkflowFunction],
});
