"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicNode = void 0;
const sdk_1 = require("sdk");
const anthropic_1 = require("@ai-sdk/anthropic");
const ai_1 = require("ai");
exports.AnthropicNode = {
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
    async execute() {
        const inputs = this.getInputData();
        const outputItems = [];
        const credentials = await this.getCredentials('anthropic');
        const apiKey = credentials.apiKey;
        if (!apiKey) {
            throw new Error("Missing Anthropic API Key in credentials.");
        }
        const anthropic = (0, anthropic_1.createAnthropic)({
            apiKey,
        });
        for (let i = 0; i < inputs.length; i++) {
            const inputItem = inputs[i];
            const modelName = this.getNodeParameter('model', i, 'claude-3-5-sonnet-20240620');
            const promptExpr = this.getNodeParameter('prompt', i, '');
            const temperature = this.getNodeParameter('temperature', i, 0.7);
            const prompt = (0, sdk_1.evaluateExpression)(promptExpr, inputItem);
            const { text } = await (0, ai_1.generateText)({
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
