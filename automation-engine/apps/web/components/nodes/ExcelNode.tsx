import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export interface ExcelNodeData {
  label?: string;
  operation?: 'readSheet' | 'writeSheet' | 'appendRow' | 'filterRows' | 'createWorkbook';
  sheetName?: string;
  sourceType?: 'binary' | 'filePath' | 'url';
  outputFormat?: 'json' | 'binary';
}

export const ExcelNodeComponent = memo(({ data, selected }: { data: ExcelNodeData; selected?: boolean }) => {
  const operation = data?.operation || 'readSheet';
  const sheetName = data?.sheetName || 'Sheet1';
  const sourceType = data?.sourceType || 'binary';

  return (
    <div
      className={`w-60 p-4 rounded-xl relative cursor-pointer text-[#201515] dark:text-[#f4f4f5] text-left transition-all duration-200 shadow-md ${
        selected
          ? 'bg-[#f8f4f0] dark:bg-[#1f1f23] border-2 border-[#ff4f00] shadow-[0_4px_16px_rgba(255,79,0,0.25)] scale-[1.02]'
          : 'bg-[#fffefb] dark:bg-[#18181b] border border-[#c5c0b1] dark:border-[#27272a] hover:border-[#ff4f00]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !left-[-6px]"
      />
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e5e0d1] dark:border-[#27272a]">
        <span className="text-xl">📈</span>
        <div>
          <h4 className="text-xs font-bold tracking-tight text-[#201515] dark:text-[#f4f4f5]">
            {data.label || 'Excel Processor'}
          </h4>
          <span className="text-[10px] text-[#605d52] dark:text-[#a1a1aa]">.xlsx File Transformation</span>
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-[#71717a] text-[11px]">Operation:</span>
          <span className="font-semibold text-[#ff4f00] bg-[#ff4f00]/10 px-2 py-0.5 rounded text-[10px] uppercase">
            {operation}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#71717a] text-[11px]">Sheet:</span>
          <span className="font-mono text-[11px] text-[#201515] dark:text-[#f4f4f5]">{sheetName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#71717a] text-[11px]">Source:</span>
          <span className="text-[10px] text-[#a1a1aa] font-medium">{sourceType}</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px]"
      />
    </div>
  );
});

export default ExcelNodeComponent;
