import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';

export const SetNode: INodeType = {
  description: {
    displayName: 'Set',
    name: 'action.set',
    group: ['action'],
    version: 1,
    description: 'Set workflow variables and parameters',
    defaults: {
      name: 'Set',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Values to Set',
        name: 'values',
        type: 'fixedCollection',
        default: {},
        description: 'Key-value pairs to store in item json payload',
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    const outputItems: ItemData[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const inputItem = inputs[i];
      const resolvedJson = { ...inputItem.json };
      
      const values = this.getNodeParameter('values', i, []) as Array<{ name: string; value: any }>;
      for (const pair of values) {
        if (pair.name) {
          resolvedJson[pair.name] = evaluateExpression(pair.value, inputItem);
        }
      }
      
      outputItems.push({
        json: resolvedJson,
        binary: inputItem.binary,
        pairedItem: { item: i },
      });
    }

    return [outputItems];
  },
};
