import { describe, it, expect } from 'vitest';
import { ExcelNode } from './excel.node';
import { IExecuteFunctions, ItemData } from 'sdk';

function mockContext(params: Record<string, any>, inputItems: ItemData[] = []): IExecuteFunctions {
  return {
    getInputData() {
      return inputItems;
    },
    getNodeParameter(name: string, itemIndex: number, defaultValue?: any) {
      return params[name] !== undefined ? params[name] : defaultValue;
    },
    async getCredentials() {
      return {};
    },
    helpers: {
      async httpRequest() {
        return Buffer.from([]);
      },
      returnJsonArray(data: any) {
        const arr = Array.isArray(data) ? data : [data];
        return arr.map((json) => ({ json }));
      },
    },
  };
}

describe('ExcelNode', () => {
  it('creates a new workbook and returns binary data', async () => {
    const inputItems: ItemData[] = [
      { json: { name: 'Alice', score: 95 } },
      { json: { name: 'Bob', score: 88 } },
    ];
    const ctx = mockContext(
      {
        operation: 'createWorkbook',
        sheetName: 'TestSheet',
        binaryPropertyName: 'data',
      },
      inputItems
    );

    const [outputs] = await ExcelNode.execute.call(ctx);
    expect(outputs.length).toBe(1);
    expect(outputs[0].json.success).toBe(true);
    expect(outputs[0].json.rowCount).toBe(2);
    expect(outputs[0].binary?.data).toBeDefined();
    expect(outputs[0].binary?.data.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  });

  it('reads sheet rows from generated binary data', async () => {
    // Step 1: create workbook binary
    const createCtx = mockContext(
      {
        operation: 'createWorkbook',
        sheetName: 'Data',
        binaryPropertyName: 'data',
      },
      [{ json: { id: 1, title: 'Item 1' } }, { json: { id: 2, title: 'Item 2' } }]
    );
    const [created] = await ExcelNode.execute.call(createCtx);
    const binaryData = created[0].binary?.data;

    // Step 2: read created workbook
    const readCtx = mockContext(
      {
        operation: 'readSheet',
        sourceType: 'binary',
        sheetName: 'Data',
        headerRow: true,
        binaryPropertyName: 'data',
      },
      [{ json: {}, binary: { data: binaryData! } }]
    );

    const [readOutputs] = await ExcelNode.execute.call(readCtx);
    expect(readOutputs.length).toBe(2);
    expect(readOutputs[0].json).toEqual({ id: 1, title: 'Item 1' });
    expect(readOutputs[1].json).toEqual({ id: 2, title: 'Item 2' });
  });

  it('filters rows based on column value', async () => {
    // Create workbook with data
    const createCtx = mockContext(
      { operation: 'createWorkbook', sheetName: 'Scores' },
      [
        { json: { user: 'Alice', role: 'admin' } },
        { json: { user: 'Bob', role: 'guest' } },
        { json: { user: 'Charlie', role: 'admin' } },
      ]
    );
    const [created] = await ExcelNode.execute.call(createCtx);
    const binaryData = created[0].binary?.data;

    const filterCtx = mockContext(
      {
        operation: 'filterRows',
        sourceType: 'binary',
        sheetName: 'Scores',
        headerRow: true,
        filterColumn: 'role',
        filterValue: 'admin',
        filterOperator: 'equals',
      },
      [{ json: {}, binary: { data: binaryData! } }]
    );

    const [filterOutputs] = await ExcelNode.execute.call(filterCtx);
    expect(filterOutputs.length).toBe(2);
    expect(filterOutputs[0].json.user).toBe('Alice');
    expect(filterOutputs[1].json.user).toBe('Charlie');
  });

  it('handles missing binary source data gracefully without crashing', async () => {
    const ctx = mockContext(
      {
        operation: 'readSheet',
        sourceType: 'binary',
      },
      [{ json: {} }]
    );

    const [outputs] = await ExcelNode.execute.call(ctx);
    expect(outputs.length).toBe(1);
    expect(outputs[0].json.error).toBeDefined();
    expect(outputs[0].json.error.code).toBe('MISSING_SOURCE_DATA');
  });

  it('enforces maximum file size limit', async () => {
    const ctx = mockContext(
      {
        operation: 'createWorkbook',
        maxFileSizeBytes: 10, // unreasonably small limit
      },
      [{ json: { heavy: 'data'.repeat(100) } }]
    );

    const [outputs] = await ExcelNode.execute.call(ctx);
    expect(outputs.length).toBe(1);
    expect(outputs[0].json.error).toBeDefined();
    expect(outputs[0].json.error.code).toBe('FILE_TOO_LARGE');
  });
});
