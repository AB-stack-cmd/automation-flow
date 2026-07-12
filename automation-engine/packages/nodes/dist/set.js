"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetNode = void 0;
const sdk_1 = require("sdk");
exports.SetNode = {
    description: {
        displayName: 'Set',
        name: 'action.set',
        group: ['action'],
        version: 1,
        description: 'Set workflow variables and parameters',
        defaults: {
            name: 'Set',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Values to Set',
                name: 'values',
                type: 'fixedCollection',
                default: {},
                description: 'Key-value pairs to store in item json payload',
            },
        ],
    },
    async execute() {
        const inputs = this.getInputData();
        const outputItems = [];
        for (let i = 0; i < inputs.length; i++) {
            const inputItem = inputs[i];
            const resolvedJson = { ...inputItem.json };
            const values = this.getNodeParameter('values', i, []);
            for (const pair of values) {
                if (pair.name) {
                    resolvedJson[pair.name] = (0, sdk_1.evaluateExpression)(pair.value, inputItem);
                }
            }
            outputItems.push({
                json: resolvedJson,
                binary: inputItem.binary,
                pairedItem: { item: i },
            });
        }
        return [outputItems];
    },
};
