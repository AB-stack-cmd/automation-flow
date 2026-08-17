import { INodeType, IExecuteFunctions, ItemData } from 'sdk';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import { ExcelNodeConfigSchema } from './excel.schema';

export const ExcelNode: INodeType = {
  description: {
    displayName: 'Excel Processor',
    name: 'action.excel',
    group: ['action'],
    version: 1,
    description: 'Read, write, append, filter, or create Excel (.xlsx) files',
    defaults: {
      name: 'Excel Processor',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Read Sheet', value: 'readSheet' },
          { name: 'Write Sheet', value: 'writeSheet' },
          { name: 'Append Row', value: 'appendRow' },
          { name: 'Filter Rows', value: 'filterRows' },
          { name: 'Create Workbook', value: 'createWorkbook' },
        ],
        default: 'readSheet',
      },
      {
        displayName: 'Source Type',
        name: 'sourceType',
        type: 'options',
        options: [
          { name: 'Binary Buffer', value: 'binary' },
          { name: 'File Path', value: 'filePath' },
          { name: 'URL', value: 'url' },
        ],
        default: 'binary',
      },
      {
        displayName: 'Sheet Name',
        name: 'sheetName',
        type: 'string',
        default: 'Sheet1',
      },
      {
        displayName: 'Header Row',
        name: 'headerRow',
        type: 'boolean',
        default: true,
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        options: [
          { name: 'JSON', value: 'json' },
          { name: 'Binary', value: 'binary' },
        ],
        default: 'json',
      },
    ],
  },

  async execute(this: IExecuteFunctions): Promise<ItemData[][]> {
    const inputItems = this.getInputData();
    const rawConfig = {
      operation: this.getNodeParameter('operation', 0, 'readSheet'),
      sourceType: this.getNodeParameter('sourceType', 0, 'binary'),
      sheetName: this.getNodeParameter('sheetName', 0, 'Sheet1'),
      headerRow: this.getNodeParameter('headerRow', 0, true),
      range: this.getNodeParameter('range', 0, undefined),
      outputFormat: this.getNodeParameter('outputFormat', 0, 'json'),
      maxFileSizeBytes: Number(this.getNodeParameter('maxFileSizeBytes', 0, 25 * 1024 * 1024)),
      filterColumn: this.getNodeParameter('filterColumn', 0, undefined),
      filterValue: this.getNodeParameter('filterValue', 0, undefined),
      filterOperator: this.getNodeParameter('filterOperator', 0, 'equals'),
      binaryPropertyName: this.getNodeParameter('binaryPropertyName', 0, 'data'),
    };

    const parsed = ExcelNodeConfigSchema.safeParse(rawConfig);
    if (!parsed.success) {
      return [[{
        json: {
          error: {
            message: `Invalid configuration: ${parsed.error.message}`,
            code: 'INVALID_CONFIG',
          },
        },
      }]];
    }
    const config = parsed.data;
    const outputItems: ItemData[] = [];

    try {
      if (config.operation === 'createWorkbook' || config.operation === 'writeSheet') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(config.sheetName || 'Sheet1');

        const rowsToWrite: Record<string, any>[] = [];
        for (const item of inputItems) {
          if (item.json && typeof item.json === 'object') {
            rowsToWrite.push(item.json);
          }
        }

        if (rowsToWrite.length > 0) {
          const keys = Object.keys(rowsToWrite[0]);
          worksheet.columns = keys.map((key) => ({ header: key, key }));
          rowsToWrite.forEach((row) => worksheet.addRow(row));
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const bufferObj = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);

        if (bufferObj.length > config.maxFileSizeBytes) {
          return [[{
            json: {
              error: {
                message: `Generated file exceeds size limit of ${config.maxFileSizeBytes} bytes`,
                code: 'FILE_TOO_LARGE',
              },
            },
          }]];
        }

        outputItems.push({
          json: {
            success: true,
            operation: config.operation,
            sheetName: config.sheetName,
            rowCount: rowsToWrite.length,
            fileSize: bufferObj.length,
          },
          binary: {
            [config.binaryPropertyName]: {
              data: bufferObj.toString('base64'),
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              fileName: `${config.sheetName || 'workbook'}.xlsx`,
            },
          },
        });

        return [outputItems];
      }

      // Read / Append / Filter operations require reading existing workbook
      let fileBuffer: Buffer | null = null;
      const firstItem = inputItems[0] || { json: {} };

      if (config.sourceType === 'binary') {
        const binaryProp = firstItem.binary?.[config.binaryPropertyName];
        if (binaryProp && binaryProp.data) {
          if (Buffer.isBuffer(binaryProp.data)) {
            fileBuffer = binaryProp.data;
          } else if (typeof binaryProp.data === 'string') {
            fileBuffer = Buffer.from(binaryProp.data, 'base64');
          }
        } else if (firstItem.json && firstItem.json.buffer) {
          fileBuffer = Buffer.from(firstItem.json.buffer);
        }
      } else if (config.sourceType === 'filePath') {
        const filePath = this.getNodeParameter('filePath', 0, firstItem.json?.filePath);
        if (filePath && fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size > config.maxFileSizeBytes) {
            return [[{
              json: {
                error: {
                  message: `File size ${stats.size} exceeds maximum limit of ${config.maxFileSizeBytes} bytes`,
                  code: 'FILE_TOO_LARGE',
                },
              },
            }]];
          }
          fileBuffer = fs.readFileSync(filePath);
        }
      } else if (config.sourceType === 'url') {
        const fileUrl = this.getNodeParameter('fileUrl', 0, firstItem.json?.url);
        if (fileUrl) {
          const fetched = await this.helpers.httpRequest({ url: fileUrl, method: 'GET' });
          if (typeof fetched === 'string') {
            fileBuffer = Buffer.from(fetched);
          } else if (Buffer.isBuffer(fetched)) {
            fileBuffer = fetched;
          }
        }
      }

      if (!fileBuffer) {
        return [[{
          json: {
            error: {
              message: `No binary buffer, valid file path, or URL provided for operation ${config.operation}`,
              code: 'MISSING_SOURCE_DATA',
            },
          },
        }]];
      }

      if (fileBuffer.length > config.maxFileSizeBytes) {
        return [[{
          json: {
            error: {
              message: `File size (${fileBuffer.length} bytes) exceeds limit of ${config.maxFileSizeBytes} bytes`,
              code: 'FILE_TOO_LARGE',
            },
          },
        }]];
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as any);

      const worksheet = workbook.getWorksheet(config.sheetName) || workbook.worksheets[0];
      if (!worksheet) {
        return [[{
          json: {
            error: {
              message: `Worksheet "${config.sheetName}" not found in workbook`,
              code: 'WORKSHEET_NOT_FOUND',
            },
          },
        }]];
      }

      if (config.operation === 'readSheet') {
        const headers: string[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1 && config.headerRow) {
            row.eachCell((cell) => {
              headers.push(String(cell.value ?? ''));
            });
          } else {
            const rowObj: Record<string, any> = {};
            row.eachCell((cell, colNumber) => {
              const key = config.headerRow && headers[colNumber - 1] ? headers[colNumber - 1] : `col_${colNumber}`;
              rowObj[key] = cell.value;
            });
            outputItems.push({ json: rowObj });
          }
        });
      } else if (config.operation === 'filterRows') {
        const headers: string[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1 && config.headerRow) {
            row.eachCell((cell) => {
              headers.push(String(cell.value ?? ''));
            });
          } else {
            const rowObj: Record<string, any> = {};
            row.eachCell((cell, colNumber) => {
              const key = config.headerRow && headers[colNumber - 1] ? headers[colNumber - 1] : `col_${colNumber}`;
              rowObj[key] = cell.value;
            });

            if (config.filterColumn) {
              const val = String(rowObj[config.filterColumn] ?? '');
              const targetVal = String(config.filterValue ?? '');
              let matches = false;

              if (config.filterOperator === 'equals') matches = val === targetVal;
              else if (config.filterOperator === 'contains') matches = val.includes(targetVal);
              else if (config.filterOperator === 'greaterThan') matches = Number(val) > Number(targetVal);
              else if (config.filterOperator === 'lessThan') matches = Number(val) < Number(targetVal);

              if (matches) outputItems.push({ json: rowObj });
            } else {
              outputItems.push({ json: rowObj });
            }
          }
        });
      } else if (config.operation === 'appendRow') {
        for (const item of inputItems) {
          if (item.json && typeof item.json === 'object') {
            worksheet.addRow(item.json);
          }
        }
        const updatedBuffer = await workbook.xlsx.writeBuffer();
        const bufferObj = Buffer.isBuffer(updatedBuffer) ? updatedBuffer : Buffer.from(updatedBuffer as ArrayBuffer);

        outputItems.push({
          json: {
            success: true,
            operation: 'appendRow',
            sheetName: worksheet.name,
            appendedCount: inputItems.length,
            fileSize: bufferObj.length,
          },
          binary: {
            [config.binaryPropertyName]: {
              data: bufferObj.toString('base64'),
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              fileName: `${worksheet.name}.xlsx`,
            },
          },
        });
      }

      return [outputItems];
    } catch (err: any) {
      return [[{
        json: {
          error: {
            message: err.message || 'Excel processing failed',
            code: err.code || 'EXCEL_PROCESSING_ERROR',
          },
        },
      }]];
    }
  },
};
