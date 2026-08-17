"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelNodeConfigSchema = void 0;
const zod_1 = require("zod");
exports.ExcelNodeConfigSchema = zod_1.z.object({
    operation: zod_1.z.enum(['readSheet', 'writeSheet', 'appendRow', 'filterRows', 'createWorkbook']),
    sourceType: zod_1.z.enum(['binary', 'filePath', 'url']).optional().default('binary'),
    sheetName: zod_1.z.string().optional().default('Sheet1'),
    headerRow: zod_1.z.boolean().optional().default(true),
    range: zod_1.z.string().optional(),
    outputFormat: zod_1.z.enum(['json', 'binary']).optional().default('json'),
    maxFileSizeBytes: zod_1.z.number().optional().default(25 * 1024 * 1024), // 25MB cap
    filterColumn: zod_1.z.string().optional(),
    filterValue: zod_1.z.string().optional(),
    filterOperator: zod_1.z.enum(['equals', 'contains', 'greaterThan', 'lessThan']).optional().default('equals'),
    binaryPropertyName: zod_1.z.string().optional().default('data'),
});
