"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordNode = void 0;
const sdk_1 = require("sdk");
exports.DiscordNode = {
    description: {
        displayName: 'Discord',
        name: 'action.discord',
        group: ['messaging'],
        version: 1,
        description: 'Post a message to a Discord channel via webhook',
        defaults: {
            name: 'Discord',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Webhook URL',
                name: 'webhookUrl',
                type: 'string',
                default: '',
                required: true,
                description: 'Discord incoming webhook URL',
            },
            {
                displayName: 'Message Content',
                name: 'content',
                type: 'string',
                default: 'Hello from Neuron!',
                required: true,
            },
        ],
    },
    async execute() {
        const inputs = this.getInputData();
        const outputItems = [];
        for (let i = 0; i < inputs.length; i++) {
            const inputItem = inputs[i];
            const webhookUrlExpr = this.getNodeParameter('webhookUrl', i, '');
            const contentExpr = this.getNodeParameter('content', i, '');
            const webhookUrl = (0, sdk_1.evaluateExpression)(webhookUrlExpr, inputItem);
            const content = (0, sdk_1.evaluateExpression)(contentExpr, inputItem);
            if (!webhookUrl) {
                throw new Error("Missing Discord Webhook URL.");
            }
            const response = await this.helpers.httpRequest({
                url: webhookUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { content },
            });
            outputItems.push({
                json: {
                    success: true,
                    response,
                    content,
                },
                pairedItem: { item: i },
            });
        }
        return [outputItems];
    },
};
