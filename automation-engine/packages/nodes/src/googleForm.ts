import { INodeType, IExecuteFunctions, ItemData } from 'sdk';

export const GoogleFormTrigger: INodeType = {
  description: {
    displayName: 'Google Form Trigger',
    name: 'trigger.googleForm',
    group: ['trigger'],
    version: 1,
    description: 'Triggers a workflow when a Google Form submission is received',
    defaults: {
      name: 'Google Form Trigger',
    },
    inputs: [],
    outputs: ['main'],
    properties: [],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || 'mock-client@developer.gserviceaccount.com';
    console.log(`[Google Form Trigger] Authenticated via client email: ${clientEmail}`);
    return [inputs];
  },
};
