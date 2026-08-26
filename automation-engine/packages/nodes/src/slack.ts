import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';

export const SlackNode: INodeType = {
  description: {
    displayName: 'Slack',
    name: 'action.slack',
    group: ['messaging'],
    version: 1,
    description: 'Post a message to a Slack channel via webhook',
    defaults: {
      name: 'Slack',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Webhook URL',
        name: 'webhookUrl',
        type: 'string',
        default: '',
        required: true,
        description: 'Slack incoming webhook integration URL',
      },
      {
        displayName: 'Message Text',
        name: 'text',
        type: 'string',
        default: 'Hello from Neuron!',
        required: true,
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    const outputItems: ItemData[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const inputItem = inputs[i];
      
      const webhookUrlExpr = this.getNodeParameter('webhookUrl', i, '') as string;
      const textExpr = this.getNodeParameter('text', i, '') as string;
      
      const webhookUrl = evaluateExpression(webhookUrlExpr, inputItem);
      const text = evaluateExpression(textExpr, inputItem);

      if (!webhookUrl) {
        throw new Error("Missing Slack Webhook URL.");
      }

      const response = await this.helpers.httpRequest({
        url: webhookUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { text },
      });

      outputItems.push({
        json: {
          success: true,
          response,
          text,
        },
        pairedItem: { item: i },
      });
    }

    return [outputItems];
  },
};
