import { z } from 'zod';
export declare const ExcelNodeConfigSchema: z.ZodObject<{
    operation: z.ZodEnum<{
        readSheet: "readSheet";
        writeSheet: "writeSheet";
        appendRow: "appendRow";
        filterRows: "filterRows";
        createWorkbook: "createWorkbook";
    }>;
    sourceType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        url: "url";
        binary: "binary";
        filePath: "filePath";
    }>>>;
    sheetName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    headerRow: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    range: z.ZodOptional<z.ZodString>;
    outputFormat: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        json: "json";
        binary: "binary";
    }>>>;
    maxFileSizeBytes: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    filterColumn: z.ZodOptional<z.ZodString>;
    filterValue: z.ZodOptional<z.ZodString>;
    filterOperator: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        equals: "equals";
        contains: "contains";
        greaterThan: "greaterThan";
        lessThan: "lessThan";
    }>>>;
    binaryPropertyName: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type ExcelNodeConfig = z.infer<typeof ExcelNodeConfigSchema>;
