import { INodeType, IExecuteFunctions, ItemData } from 'sdk';
import * as vm from 'vm';

export const CodeNode: INodeType = {
  description: {
    displayName: 'Code',
    name: 'logic.code',
    group: ['logic'],
    version: 1,
    description: 'Execute custom JavaScript code',
    defaults: {
      name: 'Code',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'JavaScript Code',
        name: 'jsCode',
        type: 'string',
        default: '// Loop through all items and update them\nreturn inputData.map(item => {\n  item.json.processed = true;\n  return item;\n});',
        required: true,
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    const jsCode = this.getNodeParameter('jsCode', 0, '') as string;

    const sandbox = {
      inputData: inputs.map((item, index) => ({
        json: { ...item.json },
        binary: item.binary,
        index,
      })),
      console,
    };

    let result: any;
    try {
      const scriptCode = `
        (function() {
          ${jsCode}
        })()
      `;
      result = vm.runInNewContext(scriptCode, sandbox, { timeout: 3000 });
    } catch (err: any) {
      throw new Error(`Code node execution failed: ${err.message}`);
    }

    const outputItems: ItemData[] = [];
    if (Array.isArray(result)) {
      for (let i = 0; i < result.length; i++) {
        const resItem = result[i];
        if (resItem && typeof resItem === 'object') {
          outputItems.push({
            json: resItem.json || resItem,
            binary: resItem.binary,
            pairedItem: { item: i },
          });
        } else {
          outputItems.push({
            json: { value: resItem },
            pairedItem: { item: i },
          });
        }
      }
    } else if (result !== null && result !== undefined) {
      outputItems.push({
        json: result.json || (typeof result === 'object' ? result : { value: result }),
        pairedItem: { item: 0 },
      });
    }

    return [outputItems];
  },
};
