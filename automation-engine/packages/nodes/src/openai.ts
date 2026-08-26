import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const OpenAINode: INodeType = {
  description: {
    displayName: 'OpenAI',
    name: 'action.openai',
    group: ['ai'],
    version: 1,
    description: 'Generate text completion using OpenAI',
    defaults: {
      name: 'OpenAI',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        options: [
          { name: 'GPT-4o', value: 'gpt-4o' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
        ],
        default: 'gpt-4o',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        default: '',
        required: true,
      },
      {
        displayName: 'Temperature',
        name: 'temperature',
        type: 'number',
        default: 0.7,
      },
    ],
  },
  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputs = this.getInputData();
    const outputItems: ItemData[] = [];

    const credentials = await this.getCredentials('openai');
    const apiKey = credentials.apiKey;
    if (!apiKey) {
      throw new Error("Missing OpenAI API Key in credentials.");
    }

    const openai = createOpenAI({
      apiKey,
    });

    for (let i = 0; i < inputs.length; i++) {
      const inputItem = inputs[i];
      
      const modelName = this.getNodeParameter('model', i, 'gpt-4o') as string;
      const promptExpr = this.getNodeParameter('prompt', i, '') as string;
      const temperature = this.getNodeParameter('temperature', i, 0.7) as number;
      
      const prompt = evaluateExpression(promptExpr, inputItem);

      const { text } = await generateText({
        model: openai(modelName),
        prompt,
        temperature,
      });

      outputItems.push({
        json: {
          result: text,
          prompt,
          model: modelName,
        },
        pairedItem: { item: i },
      });
    }

    return [outputItems];
  },
};
