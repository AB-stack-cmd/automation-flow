import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export const GeminiNode: INodeType = {
  description: {
    displayName: 'Gemini',
    name: 'action.gemini',
    group: ['ai'],
    version: 1,
    description: 'Generate text completion using Google Gemini',
    defaults: {
      name: 'Gemini',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        options: [
          { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
          { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
        ],
        default: 'gemini-1.5-flash',
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

    const credentials = await this.getCredentials('gemini');
    const apiKey = credentials.apiKey;
    if (!apiKey) {
      throw new Error("Missing Gemini API Key in credentials.");
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    for (let i = 0; i < inputs.length; i++) {
      const inputItem = inputs[i];
      
      const modelName = this.getNodeParameter('model', i, 'gemini-1.5-flash') as string;
      const promptExpr = this.getNodeParameter('prompt', i, '') as string;
      const temperature = this.getNodeParameter('temperature', i, 0.7) as number;
      
      const prompt = evaluateExpression(promptExpr, inputItem);

      const { text } = await generateText({
        model: google(modelName),
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
