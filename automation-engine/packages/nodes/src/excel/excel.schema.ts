import { z } from 'zod';

export const ExcelNodeConfigSchema = z.object({
  operation: z.enum(['readSheet', 'writeSheet', 'appendRow', 'filterRows', 'createWorkbook']),
  sourceType: z.enum(['binary', 'filePath', 'url']).optional().default('binary'),
  sheetName: z.string().optional().default('Sheet1'),
  headerRow: z.boolean().optional().default(true),
  range: z.string().optional(),
  outputFormat: z.enum(['json', 'binary']).optional().default('json'),
  maxFileSizeBytes: z.number().optional().default(25 * 1024 * 1024), // 25MB cap
  filterColumn: z.string().optional(),
  filterValue: z.string().optional(),
  filterOperator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan']).optional().default('equals'),
  binaryPropertyName: z.string().optional().default('data'),
});

export type ExcelNodeConfig = z.infer<typeof ExcelNodeConfigSchema>;
