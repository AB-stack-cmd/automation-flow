import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';

export const IfNode: INodeType = {
  description: {
    displayName: 'IF',
    name: 'logic.if',
    group: ['logic'],
    version: 1,
    description: 'Branch paths based on conditions',
    defaults: {
      name: 'IF',
    },
    inputs: ['main'],
    outputs: ['main', 'main'], // Port 0: True, Port 1: False
    properties: [
      {
        displayName: 'Condition Expression',
        name: 'condition',
        type: 'string',
        default: '',
        description: 'JavaScript logic or templates evaluated to boolean (e.g. {{$json.score}} > 50)',
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    const trueBranch: ItemData[] = [];
    const falseBranch: ItemData[] = [];

    for (let i = 0; i < inputs.length; i++) {
      const inputItem = inputs[i];
      const condition = this.getNodeParameter('condition', i, '') as string;
      const resolvedCondition = evaluateExpression(condition, inputItem);
      
      let isTrue = false;
      try {
        if (typeof resolvedCondition === 'boolean') {
          isTrue = resolvedCondition;
        } else if (typeof resolvedCondition === 'number') {
          isTrue = Boolean(resolvedCondition);
        } else {
          const run = new Function(`return Boolean(${resolvedCondition});`);
          isTrue = run();
        }
      } catch (err) {
        console.error(`IF node condition evaluation failed ("${resolvedCondition}"):`, err);
        isTrue = false;
      }

      if (isTrue) {
        trueBranch.push({ ...inputItem, pairedItem: { item: i } });
      } else {
        falseBranch.push({ ...inputItem, pairedItem: { item: i } });
      }
    }

    return [trueBranch, falseBranch];
  },
};
