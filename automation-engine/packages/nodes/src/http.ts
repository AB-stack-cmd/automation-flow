import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';

export const HttpRequestNode: INodeType = {
  description: {
    displayName: 'HTTP Request',
    name: 'action.httpRequest',
    group: ['action'],
    version: 1,
    description: 'Perform an HTTP request',
    defaults: {
      name: 'HTTP Request',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        options: [
          { name: 'GET', value: 'GET' },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
        ],
        default: 'GET',
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'fixedCollection',
        default: {},
      },
      {
        displayName: 'Body',
        name: 'body',
        type: 'string',
        default: '',
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    const outputItems: ItemData[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const inputItem = inputs[i];
      
      const method = this.getNodeParameter('method', i, 'GET') as string;
      const urlExpr = this.getNodeParameter('url', i, '') as string;
      const bodyExpr = this.getNodeParameter('body', i, '') as string;
      
      const url = evaluateExpression(urlExpr, inputItem);
      const bodyString = evaluateExpression(bodyExpr, inputItem);
      
      let parsedBody: any = null;
      if (bodyString) {
        try {
          parsedBody = JSON.parse(bodyString);
        } catch (e) {
          parsedBody = bodyString;
        }
      }

      const headersParam = this.getNodeParameter('headers', i, {}) as Record<string, any>;
      const headers: Record<string, string> = {};
      for (const [key, valExpr] of Object.entries(headersParam)) {
        headers[key] = evaluateExpression(valExpr, inputItem);
      }

      const response = await this.helpers.httpRequest({
        url,
        method,
        headers,
        body: parsedBody,
      });

      outputItems.push({
        json: typeof response === 'object' && response !== null ? response : { response },
        pairedItem: { item: i },
      });
    }

    return [outputItems];
  },
};
