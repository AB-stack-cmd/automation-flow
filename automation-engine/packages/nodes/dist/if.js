"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IfNode = void 0;
const sdk_1 = require("sdk");
exports.IfNode = {
    description: {
        displayName: 'IF',
        name: 'logic.if',
        group: ['logic'],
        version: 1,
        description: 'Branch paths based on conditions',
        defaults: {
            name: 'IF',
        },
        inputs: ['main'],
        outputs: ['main', 'main'], // Port 0: True, Port 1: False
        properties: [
            {
                displayName: 'Condition Expression',
                name: 'condition',
                type: 'string',
                default: '',
                description: 'JavaScript logic or templates evaluated to boolean (e.g. {{$json.score}} > 50)',
            },
        ],
    },
    async execute() {
        const inputs = this.getInputData();
        const trueBranch = [];
        const falseBranch = [];
        for (let i = 0; i < inputs.length; i++) {
            const inputItem = inputs[i];
            const condition = this.getNodeParameter('condition', i, '');
            const resolvedCondition = (0, sdk_1.evaluateExpression)(condition, inputItem);
            let isTrue = false;
            try {
                if (typeof resolvedCondition === 'boolean') {
                    isTrue = resolvedCondition;
                }
                else if (typeof resolvedCondition === 'number') {
                    isTrue = Boolean(resolvedCondition);
                }
                else {
                    const run = new Function(`return Boolean(${resolvedCondition});`);
                    isTrue = run();
                }
            }
            catch (err) {
                console.error(`IF node condition evaluation failed ("${resolvedCondition}"):`, err);
                isTrue = false;
            }
            if (isTrue) {
                trueBranch.push({ ...inputItem, pairedItem: { item: i } });
            }
            else {
                falseBranch.push({ ...inputItem, pairedItem: { item: i } });
            }
        }
        return [trueBranch, falseBranch];
    },
};
