"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualTrigger = void 0;
exports.ManualTrigger = {
    description: {
        displayName: 'Manual Trigger',
        name: 'trigger.manual',
        group: ['trigger'],
        version: 1,
        description: 'Manually trigger a workflow run',
        defaults: {
            name: 'Manual Trigger',
        },
        inputs: [],
        outputs: ['main'],
        properties: [],
    },
    async execute() {
        const inputs = this.getInputData();
        return [inputs];
    },
};
