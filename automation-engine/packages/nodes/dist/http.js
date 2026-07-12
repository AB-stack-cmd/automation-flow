"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpRequestNode = void 0;
const sdk_1 = require("sdk");
exports.HttpRequestNode = {
    description: {
        displayName: 'HTTP Request',
        name: 'action.httpRequest',
        group: ['action'],
        version: 1,
        description: 'Perform an HTTP request',
        defaults: {
            name: 'HTTP Request',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Method',
                name: 'method',
                type: 'options',
                options: [
                    { name: 'GET', value: 'GET' },
                    { name: 'POST', value: 'POST' },
                    { name: 'PUT', value: 'PUT' },
                    { name: 'DELETE', value: 'DELETE' },
                ],
                default: 'GET',
            },
            {
                displayName: 'URL',
                name: 'url',
                type: 'string',
                default: '',
                required: true,
            },
            {
                displayName: 'Headers',
                name: 'headers',
                type: 'fixedCollection',
                default: {},
            },
            {
                displayName: 'Body',
                name: 'body',
                type: 'string',
                default: '',
            },
        ],
    },
    async execute() {
        const inputs = this.getInputData();
        const outputItems = [];
        for (let i = 0; i < inputs.length; i++) {
            const inputItem = inputs[i];
            const method = this.getNodeParameter('method', i, 'GET');
            const urlExpr = this.getNodeParameter('url', i, '');
            const bodyExpr = this.getNodeParameter('body', i, '');
            const url = (0, sdk_1.evaluateExpression)(urlExpr, inputItem);
            const bodyString = (0, sdk_1.evaluateExpression)(bodyExpr, inputItem);
            let parsedBody = null;
            if (bodyString) {
                try {
                    parsedBody = JSON.parse(bodyString);
                }
                catch (e) {
                    parsedBody = bodyString;
                }
            }
            const headersParam = this.getNodeParameter('headers', i, {});
            const headers = {};
            for (const [key, valExpr] of Object.entries(headersParam)) {
                headers[key] = (0, sdk_1.evaluateExpression)(valExpr, inputItem);
            }
            const response = await this.helpers.httpRequest({
                url,
                method,
                headers,
                body: parsedBody,
            });
            outputItems.push({
                json: typeof response === 'object' && response !== null ? response : { response },
                pairedItem: { item: i },
            });
        }
        return [outputItems];
    },
};
