import { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Custom Node Card Style
const nodeCardClass = (selected: boolean) =>
  `node-card w-48 p-4 rounded-xl relative group cursor-pointer text-[#e5e2e1] text-left transition-all duration-300 ${
    selected
      ? 'bg-[#131313]/90 border-[#ef4444]/60 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
      : 'bg-[#131313]/40 border-white/5 hover:bg-[#131313]/60 hover:border-white/10'
  }`;

// Circle start node trigger style
export const TriggerNode = memo(({ data, selected }: any) => {
  const isCrm = data?.triggerType === 'crm';
  return (
    <div className="relative group flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full bg-[#0a0a0a] border flex items-center justify-center relative transition-all duration-300 ${
        selected ? 'border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.2)]' : 'border-white/5 hover:border-[#ef4444]/30'
      }`}>
        <span className="material-symbols-outlined !text-xl opacity-60 text-white" data-icon={isCrm ? 'group_add' : 'alarm'}>
          {isCrm ? 'group_add' : 'alarm'}
        </span>
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-widest font-medium opacity-40">
        {data.label || 'Start'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-[#ef4444] hover:!border-[#ef4444]"
      />
    </div>
  );
});

// Marketing Node
export const MarketingNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-[#ef4444]"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-40 !text-[18px] text-sky-400" data-icon="mail">mail</span>
        <span className="text-[11px] font-medium tracking-tight opacity-80">{data.label || 'Send Email'}</span>
      </div>
      <div className="text-[9px] font-mono opacity-30 truncate">
        {data.subject || 'Welcome email'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-[#ef4444]"
      />
    </div>
  );
});

// CRM Node
export const CRMNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-[#ef4444]"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-40 !text-[18px] text-indigo-400" data-icon="database">database</span>
        <span className="text-[11px] font-medium tracking-tight opacity-80">{data.label || 'CRM Contact'}</span>
      </div>
      <div className="text-[9px] font-mono opacity-30 truncate">
        Score: {data.scoreChange || '0'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-[#ef4444]"
      />
    </div>
  );
});

// Logic If/Else Node
export const LogicNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-[#ef4444]"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-40 !text-[18px] text-fuchsia-400" data-icon="call_split">call_split</span>
        <span className="text-[11px] font-medium tracking-tight opacity-80">{data.label || 'If/Else'}</span>
      </div>
      
      <div className="flex flex-col gap-1.5 text-[8px] uppercase tracking-[0.12em] font-medium mt-1">
        <div className="flex items-center justify-end gap-2 text-emerald-400">Yes <div className="w-1 h-1 rounded-full bg-emerald-400"></div></div>
        <div className="flex items-center justify-end gap-2 text-[#ef4444]">No <div className="w-1 h-1 rounded-full bg-[#ef4444]"></div></div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '65%' }}
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-emerald-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '85%' }}
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-[#ef4444]"
      />
    </div>
  );
});

// Delay Node
export const DelayNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-[#ef4444]"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-40 !text-[18px] text-amber-400" data-icon="schedule">schedule</span>
        <span className="text-[11px] font-medium tracking-tight opacity-80">{data.label || 'Wait'}</span>
      </div>
      <div className="text-[9px] font-mono opacity-30 truncate">
        {data.seconds || '5'} seconds delay
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-[#ef4444]"
      />
    </div>
  );
});

// Code Node
export const CodeNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-[#ef4444]"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-40 !text-[18px] text-emerald-400" data-icon="terminal">terminal</span>
        <span className="text-[11px] font-medium tracking-tight opacity-80">{data.label || 'Script'}</span>
      </div>
      <div className="text-[9px] font-mono opacity-30 truncate">
        {data.code ? 'eval custom script' : 'JS logic'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-[#ef4444]"
      />
    </div>
  );
});
