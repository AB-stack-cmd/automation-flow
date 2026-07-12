import { INodeType, IExecuteFunctions, ItemData } from 'sdk';

export const ManualTrigger: INodeType = {
  description: {
    displayName: 'Manual Trigger',
    name: 'trigger.manual',
    group: ['trigger'],
    version: 1,
    description: 'Manually trigger a workflow run',
    defaults: {
      name: 'Manual Trigger',
    },
    inputs: [],
    outputs: ['main'],
    properties: [],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    return [inputs];
  },
};
