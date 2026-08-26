"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const excel_node_1 = require("./excel.node");
function mockContext(params, inputItems = []) {
    return {
        getInputData() {
            return inputItems;
        },
        getNodeParameter(name, itemIndex, defaultValue) {
            return params[name] !== undefined ? params[name] : defaultValue;
        },
        async getCredentials() {
            return {};
        },
        helpers: {
            async httpRequest() {
                return Buffer.from([]);
            },
            returnJsonArray(data) {
                const arr = Array.isArray(data) ? data : [data];
                return arr.map((json) => ({ json }));
            },
        },
    };
}
(0, vitest_1.describe)('ExcelNode', () => {
    (0, vitest_1.it)('creates a new workbook and returns binary data', async () => {
        const inputItems = [
            { json: { name: 'Alice', score: 95 } },
            { json: { name: 'Bob', score: 88 } },
        ];
        const ctx = mockContext({
            operation: 'createWorkbook',
            sheetName: 'TestSheet',
            binaryPropertyName: 'data',
        }, inputItems);
        const [outputs] = await excel_node_1.ExcelNode.execute.call(ctx);
        (0, vitest_1.expect)(outputs.length).toBe(1);
        (0, vitest_1.expect)(outputs[0].json.success).toBe(true);
        (0, vitest_1.expect)(outputs[0].json.rowCount).toBe(2);
        (0, vitest_1.expect)(outputs[0].binary?.data).toBeDefined();
        (0, vitest_1.expect)(outputs[0].binary?.data.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
    (0, vitest_1.it)('reads sheet rows from generated binary data', async () => {
        // Step 1: create workbook binary
        const createCtx = mockContext({
            operation: 'createWorkbook',
            sheetName: 'Data',
            binaryPropertyName: 'data',
        }, [{ json: { id: 1, title: 'Item 1' } }, { json: { id: 2, title: 'Item 2' } }]);
        const [created] = await excel_node_1.ExcelNode.execute.call(createCtx);
        const binaryData = created[0].binary?.data;
        // Step 2: read created workbook
        const readCtx = mockContext({
            operation: 'readSheet',
            sourceType: 'binary',
            sheetName: 'Data',
            headerRow: true,
            binaryPropertyName: 'data',
        }, [{ json: {}, binary: { data: binaryData } }]);
        const [readOutputs] = await excel_node_1.ExcelNode.execute.call(readCtx);
        (0, vitest_1.expect)(readOutputs.length).toBe(2);
        (0, vitest_1.expect)(readOutputs[0].json).toEqual({ id: 1, title: 'Item 1' });
        (0, vitest_1.expect)(readOutputs[1].json).toEqual({ id: 2, title: 'Item 2' });
    });
    (0, vitest_1.it)('filters rows based on column value', async () => {
        // Create workbook with data
        const createCtx = mockContext({ operation: 'createWorkbook', sheetName: 'Scores' }, [
            { json: { user: 'Alice', role: 'admin' } },
            { json: { user: 'Bob', role: 'guest' } },
            { json: { user: 'Charlie', role: 'admin' } },
        ]);
        const [created] = await excel_node_1.ExcelNode.execute.call(createCtx);
        const binaryData = created[0].binary?.data;
        const filterCtx = mockContext({
            operation: 'filterRows',
            sourceType: 'binary',
            sheetName: 'Scores',
            headerRow: true,
            filterColumn: 'role',
            filterValue: 'admin',
            filterOperator: 'equals',
        }, [{ json: {}, binary: { data: binaryData } }]);
        const [filterOutputs] = await excel_node_1.ExcelNode.execute.call(filterCtx);
        (0, vitest_1.expect)(filterOutputs.length).toBe(2);
        (0, vitest_1.expect)(filterOutputs[0].json.user).toBe('Alice');
        (0, vitest_1.expect)(filterOutputs[1].json.user).toBe('Charlie');
    });
    (0, vitest_1.it)('handles missing binary source data gracefully without crashing', async () => {
        const ctx = mockContext({
            operation: 'readSheet',
            sourceType: 'binary',
        }, [{ json: {} }]);
        const [outputs] = await excel_node_1.ExcelNode.execute.call(ctx);
        (0, vitest_1.expect)(outputs.length).toBe(1);
        (0, vitest_1.expect)(outputs[0].json.error).toBeDefined();
        (0, vitest_1.expect)(outputs[0].json.error.code).toBe('MISSING_SOURCE_DATA');
    });
    (0, vitest_1.it)('enforces maximum file size limit', async () => {
        const ctx = mockContext({
            operation: 'createWorkbook',
            maxFileSizeBytes: 10, // unreasonably small limit
        }, [{ json: { heavy: 'data'.repeat(100) } }]);
        const [outputs] = await excel_node_1.ExcelNode.execute.call(ctx);
        (0, vitest_1.expect)(outputs.length).toBe(1);
        (0, vitest_1.expect)(outputs[0].json.error).toBeDefined();
        (0, vitest_1.expect)(outputs[0].json.error.code).toBe('FILE_TOO_LARGE');
    });
});
