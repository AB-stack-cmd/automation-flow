"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsNode = void 0;
exports.GoogleSheetsNode = {
    description: {
        displayName: 'Google Sheets',
        name: 'action.googleSheets',
        group: ['action'],
        version: 1,
        description: 'Reads rows or appends rows to a spreadsheet database',
        defaults: {
            name: 'Google Sheets',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                options: [
                    { name: 'Read Rows', value: 'read' },
                    { name: 'Append Row', value: 'write' },
                ],
                default: 'read',
            },
            {
                displayName: 'Sheet Name',
                name: 'sheetName',
                type: 'string',
                default: 'Sheet1',
            },
        ],
    },
    async execute() {
        const action = this.getNodeParameter('action', 0, 'read');
        const sheetName = this.getNodeParameter('sheetName', 0, 'Sheet1');
        const inputItems = this.getInputData();
        const outputItems = [];
        for (let i = 0; i < inputItems.length; i++) {
            if (action === 'read') {
                // Mock sheets reading
                outputItems.push({
                    json: {
                        title: 'Mock Article Title from Sheets',
                        content: 'This is the mock spreadsheet content representing draft posts.',
                        status: 'draft',
                        sheetName,
                    },
                });
            }
            else {
                // Mock sheets appending
                outputItems.push({
                    json: {
                        success: true,
                        message: `Appended row to ${sheetName}`,
                        appendedAt: new Date().toISOString(),
                    },
                });
            }
        }
        return [outputItems];
    },
};
