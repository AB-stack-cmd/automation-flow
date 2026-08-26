import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export interface McpConnectorNodeData {
  label?: string;
  appName?: string;
  serverUrl?: string;
  selectedTool?: string;
  credentialId?: string;
}

export const McpConnectorNodeComponent = memo(
  ({ data, selected }: { data: McpConnectorNodeData; selected?: boolean }) => {
    const appName = data?.appName || 'Notion';
    const selectedTool = data?.selectedTool || 'Select Tool';
    const serverUrl = data?.serverUrl || 'https://mcp.server/v1';

    return (
      <div
        className={`w-64 p-4 rounded-xl relative cursor-pointer text-[#201515] dark:text-[#f4f4f5] text-left transition-all duration-200 shadow-md ${
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
          <span className="text-xl">🔌</span>
          <div>
            <h4 className="text-xs font-bold tracking-tight text-[#201515] dark:text-[#f4f4f5]">
              {data.label || 'MCP Productivity Connector'}
            </h4>
            <span className="text-[10px] text-[#605d52] dark:text-[#a1a1aa]">Generic MCP API Client</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#71717a] text-[11px]">App Preset:</span>
            <span className="font-bold text-[#ff4f00] uppercase text-[10px] bg-[#ff4f00]/10 px-2 py-0.5 rounded">
              {appName}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[#71717a] text-[10px]">Target MCP Tool:</span>
            <span className="font-mono text-[11px] bg-[#f0ebe1] dark:bg-[#27272a] px-2 py-1 rounded truncate text-[#201515] dark:text-[#f4f4f5]">
              {selectedTool}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-[#e5e0d1] dark:border-[#27272a]">
            <span className="text-[#71717a] text-[10px]">Server:</span>
            <span className="text-[10px] font-mono text-[#a1a1aa] truncate max-w-[120px]">{serverUrl}</span>
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
  }
);

export default McpConnectorNodeComponent;
