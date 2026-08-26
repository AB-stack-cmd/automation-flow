"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAINode = void 0;
const sdk_1 = require("sdk");
const openai_1 = require("@ai-sdk/openai");
const ai_1 = require("ai");
exports.OpenAINode = {
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
    async execute() {
        const inputs = this.getInputData();
        const outputItems = [];
        const credentials = await this.getCredentials('openai');
        const apiKey = credentials.apiKey;
        if (!apiKey) {
            throw new Error("Missing OpenAI API Key in credentials.");
        }
        const openai = (0, openai_1.createOpenAI)({
            apiKey,
        });
        for (let i = 0; i < inputs.length; i++) {
            const inputItem = inputs[i];
            const modelName = this.getNodeParameter('model', i, 'gpt-4o');
            const promptExpr = this.getNodeParameter('prompt', i, '');
            const temperature = this.getNodeParameter('temperature', i, 0.7);
            const prompt = (0, sdk_1.evaluateExpression)(promptExpr, inputItem);
            const { text } = await (0, ai_1.generateText)({
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
