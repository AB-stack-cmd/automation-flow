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

// Circle end node trigger style
export const EndNode = memo(({ data, selected }: any) => {
  return (
    <div className="relative group flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full bg-[#0a0a0a] border flex items-center justify-center relative transition-all duration-300 ${
        selected ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.2)]' : 'border-white/5 hover:border-rose-500/30'
      }`}>
        <span className="material-symbols-outlined !text-xl opacity-60 text-white">
          stop_circle
        </span>
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-widest font-medium opacity-40">
        {data.label || 'End'}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-[#ef4444]"
      />
    </div>
  );
});

// Circle start node trigger style
export const StartNode = memo(({ data, selected }: any) => {
  return (
    <div className="relative group flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full bg-[#0a0a0a] border flex items-center justify-center relative transition-all duration-300 ${
        selected ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'border-white/5 hover:border-amber-500/30'
      }`}>
        <span className="material-symbols-outlined !text-xl opacity-60 text-white">
          play_arrow
        </span>
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-widest font-medium opacity-40">
        {data.label || 'Start Trigger'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-amber-500"
      />
    </div>
  );
});

// Google Form Webhook Trigger card style
export const GoogleFormTriggerNode = memo(({ data, selected }: any) => {
  return (
    <div className={`node-card w-56 p-4 rounded-xl relative group cursor-pointer text-[#e5e2e1] text-left transition-all duration-300 ${
      selected
        ? 'bg-[#131313]/90 border-green-500 shadow-[0_0_12px_rgba(22,163,74,0.15)]'
        : 'bg-[#131313]/90 border-green-600/30 hover:border-green-600/50 shadow-[0_0_12px_rgba(22,163,74,0.05)]'
    }`}>
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined text-green-400 !text-[18px]">description</span>
        <span className="text-[11px] font-bold tracking-tight opacity-80">{data.label || 'Google Form Trigger'}</span>
      </div>
      <div className="text-[8px] font-mono text-neutral-400 flex flex-col gap-1">
        <div className="text-[7px] uppercase tracking-widest text-green-400 font-bold mb-1">Webhook Endpoint</div>
        <div className="bg-black/60 p-1.5 rounded truncate text-[7px]" title={data.webhookUrl}>
          {data.webhookUrl || 'Generate after save'}
        </div>
        <p className="text-[7px] leading-normal opacity-60 mt-1">
          💡 Paste this URL into Google Apps Script `onSubmit` event trigger to link form submissions!
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-green-500"
      />
    </div>
  );
});

// Schedule Trigger node style
export const ScheduleTriggerNode = memo(({ data, selected }: any) => {
  const type = data?.scheduleType || 'interval';
  const val = data?.intervalValue || 10;
  const unit = data?.intervalUnit || 'seconds';
  const cron = data?.cronExpression || '*/10 * * * * *';
  const cDate = data?.customDate ? new Date(data.customDate).toLocaleString() : '';

  let scheduleText = `Every ${val} ${unit}`;
  if (type === 'cron') scheduleText = `Cron: ${cron}`;
  if (type === 'date') scheduleText = `Once: ${cDate || 'Not Set'}`;

  return (
    <div className="relative group flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full bg-[#0a0a0a] border flex items-center justify-center relative transition-all duration-300 ${
        selected ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : 'border-white/5 hover:border-amber-400/30'
      }`}>
        <span className="material-symbols-outlined !text-xl opacity-60 text-amber-400" data-icon="alarm">
          alarm
        </span>
      </div>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-widest font-semibold text-neutral-400">
        {data.label || 'Schedule'}
      </div>
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] text-neutral-500">
        {scheduleText}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-amber-400 hover:!border-amber-400"
      />
    </div>
  );
});

// Google Sheets action/read/write card style
export const GoogleSheetsNode = memo(({ data, selected }: any) => {
  const action = data?.action || 'read';
  const sheetName = data?.sheetName || 'Sheet1';
  const mockType = data?.mockDataType || 'blog_news';
  const isRead = action === 'read';

  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-green-500"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-50 !text-[18px] text-emerald-500" data-icon="table_chart">table_chart</span>
        <span className="text-[11px] font-bold tracking-tight opacity-90 text-white">{data.label || 'Google Sheets'}</span>
      </div>
      <div className="text-[9px] font-mono text-neutral-400 flex flex-col gap-0.5 text-left">
        <div>Action: <span className="text-emerald-400 font-bold uppercase text-[8px]">{action}</span></div>
        <div>Sheet: <span className="opacity-80 text-white">{sheetName}</span></div>
        {isRead && <div>Data: <span className="opacity-60">{mockType === 'blog_news' ? 'Blog Posts' : mockType === 'crm_leads' ? 'CRM Leads' : 'Custom JSON'}</span></div>}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-green-500"
      />
    </div>
  );
});

// OpenAI GPT Node Card Style
export const OpenAINode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-purple-500"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-60 !text-[18px] text-purple-400" data-icon="psychology">psychology</span>
        <span className="text-[11px] font-bold tracking-tight opacity-90 text-white">{data.label || 'OpenAI GPT'}</span>
      </div>
      <div className="text-[9px] font-mono text-neutral-400 flex flex-col gap-0.5 text-left">
        <div>Model: <span className="text-purple-300 font-bold uppercase text-[8px]">{data.model || 'gpt-4o'}</span></div>
        <div className="truncate opacity-70">Prompt: {data.prompt || 'Summarize text...'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-purple-500"
      />
    </div>
  );
});

// Slack Integration Node Card Style
export const SlackNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-teal-400"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-60 !text-[18px] text-teal-400" data-icon="forum">forum</span>
        <span className="text-[11px] font-bold tracking-tight opacity-90 text-white">{data.label || 'Post to Slack'}</span>
      </div>
      <div className="text-[9px] font-mono text-neutral-400 flex flex-col gap-0.5 text-left">
        <div className="truncate opacity-70">Message: {data.text || 'Slack notification'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-teal-400"
      />
    </div>
  );
});

// Discord Integration Node Card Style
export const DiscordNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-indigo-400"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-60 !text-[18px] text-indigo-400" data-icon="mark_chat_read">mark_chat_read</span>
        <span className="text-[11px] font-bold tracking-tight opacity-90 text-white">{data.label || 'Discord Alert'}</span>
      </div>
      <div className="text-[9px] font-mono text-neutral-400 flex flex-col gap-0.5 text-left">
        <div className="truncate opacity-70">Message: {data.content || 'Discord message'}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-indigo-400"
      />
    </div>
  );
});

// Respond to Webhook Node Card Style
export const RespondToWebhookNode = memo(({ data, selected }: any) => {
  const mode = data?.responseMode || 'json';
  const status = data?.statusCode || '200';
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !left-[-4px] hover:!bg-blue-400"
      />
      <div className="flex items-center gap-3 mb-2.5">
        <span className="material-symbols-outlined opacity-60 !text-[18px] text-blue-400" data-icon="send">send</span>
        <span className="text-[11px] font-bold tracking-tight opacity-90 text-white">{data.label || 'Webhook Response'}</span>
      </div>
      <div className="text-[9px] font-mono text-neutral-400 flex flex-col gap-0.5 text-left">
        <div>Status: <span className="text-blue-400 font-bold">{status}</span></div>
        <div>Mode: <span className="uppercase text-[8px] opacity-80">{mode}</span></div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-[#0a0a0a] !border !border-white/20 !rounded-full !right-[-4px] hover:!bg-blue-400"
      />
    </div>
  );
});

