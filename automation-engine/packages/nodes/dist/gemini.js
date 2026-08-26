"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiNode = void 0;
const sdk_1 = require("sdk");
const google_1 = require("@ai-sdk/google");
const ai_1 = require("ai");
exports.GeminiNode = {
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
    async execute() {
        const inputs = this.getInputData();
        const outputItems = [];
        const credentials = await this.getCredentials('gemini');
        const apiKey = credentials.apiKey;
        if (!apiKey) {
            throw new Error("Missing Gemini API Key in credentials.");
        }
        const google = (0, google_1.createGoogleGenerativeAI)({
            apiKey,
        });
        for (let i = 0; i < inputs.length; i++) {
            const inputItem = inputs[i];
            const modelName = this.getNodeParameter('model', i, 'gemini-1.5-flash');
            const promptExpr = this.getNodeParameter('prompt', i, '');
            const temperature = this.getNodeParameter('temperature', i, 0.7);
            const prompt = (0, sdk_1.evaluateExpression)(promptExpr, inputItem);
            const { text } = await (0, ai_1.generateText)({
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
