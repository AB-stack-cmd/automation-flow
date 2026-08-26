"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookTrigger = void 0;
exports.WebhookTrigger = {
    description: {
        displayName: 'Webhook Trigger',
        name: 'trigger.webhook',
        group: ['trigger'],
        version: 1,
        description: 'Triggers the workflow when an HTTP POST request lands on its endpoint',
        defaults: {
            name: 'Webhook Trigger',
        },
        inputs: [],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Authentication',
                name: 'authentication',
                type: 'options',
                options: [
                    { name: 'None', value: 'none' },
                    { name: 'Basic Auth', value: 'basicAuth' },
                    { name: 'Header API Key', value: 'apiKey' },
                ],
                default: 'none',
            },
        ],
    },
    async execute() {
        const inputs = this.getInputData();
        // Return received payload items
        return [inputs];
    },
};
