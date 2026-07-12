"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RespondToWebhookNode = void 0;
exports.RespondToWebhookNode = {
    description: {
        displayName: 'Respond to Webhook',
        name: 'action.respondToWebhook',
        group: ['action'],
        version: 1,
        description: 'Sends custom HTTP headers, status code, and payload response to the caller',
        defaults: {
            name: 'Respond to Webhook',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Response Mode',
                name: 'responseMode',
                type: 'options',
                options: [
                    { name: 'JSON', value: 'json' },
                    { name: 'Text / Raw', value: 'text' },
                    { name: 'HTML Page', value: 'html' },
                    { name: 'Redirect Client', value: 'redirect' },
                ],
                default: 'json',
            },
            {
                displayName: 'HTTP Status Code',
                name: 'statusCode',
                type: 'number',
                default: 200,
            },
            {
                displayName: 'Response Body',
                name: 'responseBody',
                type: 'string',
                default: '{"success": true, "message": "Submission complete!"}',
            },
            {
                displayName: 'Redirect URL',
                name: 'redirectUrl',
                type: 'string',
                default: '',
            },
        ],
    },
    async execute() {
        const inputs = this.getInputData();
        return [inputs];
    },
};
