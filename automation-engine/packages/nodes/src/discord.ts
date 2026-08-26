import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';

export const DiscordNode: INodeType = {
  description: {
    displayName: 'Discord',
    name: 'action.discord',
    group: ['messaging'],
    version: 1,
    description: 'Post a message to a Discord channel via webhook',
    defaults: {
      name: 'Discord',
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
        description: 'Discord incoming webhook URL',
      },
      {
        displayName: 'Message Content',
        name: 'content',
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
      const contentExpr = this.getNodeParameter('content', i, '') as string;
      
      const webhookUrl = evaluateExpression(webhookUrlExpr, inputItem);
      const content = evaluateExpression(contentExpr, inputItem);

      if (!webhookUrl) {
        throw new Error("Missing Discord Webhook URL.");
      }

      const response = await this.helpers.httpRequest({
        url: webhookUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { content },
      });

      outputItems.push({
        json: {
          success: true,
          response,
          content,
        },
        pairedItem: { item: i },
      });
    }

    return [outputItems];
  },
};
