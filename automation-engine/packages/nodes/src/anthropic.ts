import { INodeType, IExecuteFunctions, ItemData, evaluateExpression } from 'sdk';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export const AnthropicNode: INodeType = {
  description: {
    displayName: 'Anthropic',
    name: 'action.anthropic',
    group: ['ai'],
    version: 1,
    description: 'Generate text completion using Anthropic Claude',
    defaults: {
      name: 'Anthropic',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        options: [
          { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20240620' },
          { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
          { name: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
        ],
        default: 'claude-3-5-sonnet-20240620',
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

    const credentials = await this.getCredentials('anthropic');
    const apiKey = credentials.apiKey;
    if (!apiKey) {
      throw new Error("Missing Anthropic API Key in credentials.");
    }

    const anthropic = createAnthropic({
      apiKey,
    });

    for (let i = 0; i < inputs.length; i++) {
      const inputItem = inputs[i];
      
      const modelName = this.getNodeParameter('model', i, 'claude-3-5-sonnet-20240620') as string;
      const promptExpr = this.getNodeParameter('prompt', i, '') as string;
      const temperature = this.getNodeParameter('temperature', i, 0.7) as number;
      
      const prompt = evaluateExpression(promptExpr, inputItem);

      const { text } = await generateText({
        model: anthropic(modelName),
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
