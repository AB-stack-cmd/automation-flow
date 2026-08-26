"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackNode = void 0;
const sdk_1 = require("sdk");
exports.SlackNode = {
    description: {
        displayName: 'Slack',
        name: 'action.slack',
        group: ['messaging'],
        version: 1,
        description: 'Post a message to a Slack channel via webhook',
        defaults: {
            name: 'Slack',
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
                description: 'Slack incoming webhook integration URL',
            },
            {
                displayName: 'Message Text',
                name: 'text',
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
            const textExpr = this.getNodeParameter('text', i, '');
            const webhookUrl = (0, sdk_1.evaluateExpression)(webhookUrlExpr, inputItem);
            const text = (0, sdk_1.evaluateExpression)(textExpr, inputItem);
            if (!webhookUrl) {
                throw new Error("Missing Slack Webhook URL.");
            }
            const response = await this.helpers.httpRequest({
                url: webhookUrl,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { text },
            });
            outputItems.push({
                json: {
                    success: true,
                    response,
                    text,
                },
                pairedItem: { item: i },
            });
        }
        return [outputItems];
    },
};
