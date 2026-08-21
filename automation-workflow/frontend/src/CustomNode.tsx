import { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Custom Node Card Style (Constant Uniform Dimensions)
const nodeCardClass = (selected: boolean) =>
  `node-card w-56 p-4 rounded-md relative group cursor-pointer text-[#201515] dark:text-[#f4f4f5] text-left transition-all duration-200 shadow-sm ${
    selected
      ? 'bg-[#f8f4f0] dark:bg-[#1f1f23] border-2 border-[#ff4f00] shadow-[0_4px_16px_rgba(255,79,0,0.2)] scale-[1.02]'
      : 'bg-[#f8f4f0] dark:bg-[#18181b] border border-[#c5c0b1] dark:border-[#27272a] hover:border-[#201515] dark:hover:border-[#ff4f00] hover:shadow-md'
  }`;

// Circle start node trigger style with Orange Play Badge
export const TriggerNode = memo(({ data, selected }: any) => {
  const isCrm = data?.triggerType === 'crm';
  return (
    <div className="relative group flex flex-col items-center cursor-grab active:cursor-grabbing">
      <div className={`w-14 h-14 rounded-full bg-[#f8f4f0] dark:bg-[#18181b] border-2 flex items-center justify-center relative transition-all duration-200 ${
        selected ? 'border-[#ff4f00] shadow-[0_0_14px_rgba(255,79,0,0.35)] scale-105' : 'border-[#201515] dark:border-[#3f3f46] hover:border-[#ff4f00] shadow-sm'
      }`}>
        <span className="text-[#ff4f00] font-bold text-xl">
          {isCrm ? '👥' : '⚡'}
        </span>

        {/* Play SVG Overlay Badge in Primary Orange */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff4f00] border-2 border-[#fffefb] flex items-center justify-center shadow-sm">
          <svg className="w-2.5 h-2.5 text-[#fffefb] ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="mt-2 whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold text-[#201515] dark:text-[#f4f4f5] bg-[#fffefb] dark:bg-[#141417] px-2.5 py-0.5 rounded-full border border-[#c5c0b1] dark:border-[#27272a]">
        {data.label || 'Start Trigger'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] hover:scale-125 transition-transform"
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
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">✉️</span>
        <span className="text-sm font-semibold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Send Email'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] font-medium truncate">
        {data.subject || 'Welcome email'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] hover:scale-125 transition-transform"
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
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🗄️</span>
        <span className="text-sm font-semibold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'CRM Contact'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] font-medium truncate">
        Score Change: <span className="font-bold text-[#201515] dark:text-[#f4f4f5]">+{data.scoreChange || '10'}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] hover:scale-125 transition-transform"
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
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔀</span>
        <span className="text-sm font-semibold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'If/Else Filter'}</span>
      </div>
      
      <div className="flex flex-col gap-1 text-[11px] font-semibold mt-2 pt-2 border-t border-[#c5c0b1] dark:border-[#27272a]">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400"><span>True / Yes</span> <span className="w-2 h-2 rounded-full bg-emerald-600"></span></div>
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400"><span>False / No</span> <span className="w-2 h-2 rounded-full bg-rose-600"></span></div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '55%' }}
        className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-[#fffefb] !rounded-full !right-[-6px]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '85%' }}
        className="!w-3 !h-3 !bg-rose-600 !border-2 !border-[#fffefb] !rounded-full !right-[-6px]"
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
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⏳</span>
        <span className="text-sm font-semibold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Wait Delay'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] font-medium">
        Pause for <span className="font-bold text-[#201515] dark:text-[#f4f4f5]">{data.seconds || '5'}s</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] hover:scale-125 transition-transform"
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
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💻</span>
        <span className="text-sm font-semibold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Run JS Script'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] font-mono truncate">
        {data.code ? 'eval custom script' : 'JS Logic Code'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] hover:scale-125 transition-transform"
      />
    </div>
  );
});

// Circle end node trigger style
export const EndNode = memo(({ data, selected }: any) => {
  return (
    <div className="relative group flex flex-col items-center cursor-grab active:cursor-grabbing">
      <div className={`w-14 h-14 rounded-full bg-[#f8f4f0] dark:bg-[#18181b] border-2 flex items-center justify-center relative transition-all duration-200 ${
        selected ? 'border-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.3)] scale-105' : 'border-[#201515] dark:border-[#3f3f46] hover:border-rose-600 shadow-sm'
      }`}>
        <span className="text-rose-600 font-bold text-xl">🛑</span>
      </div>
      <div className="mt-2 whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold text-[#201515] dark:text-[#f4f4f5] bg-[#fffefb] dark:bg-[#141417] px-2.5 py-0.5 rounded-full border border-[#c5c0b1] dark:border-[#27272a]">
        {data.label || 'End'}
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px]"
      />
    </div>
  );
});

// Circle start node trigger style
export const StartNode = memo(({ data, selected }: any) => {
  return (
    <div className="relative group flex flex-col items-center cursor-grab active:cursor-grabbing">
      <div className={`w-14 h-14 rounded-full bg-[#f8f4f0] dark:bg-[#18181b] border-2 flex items-center justify-center relative transition-all duration-200 ${
        selected ? 'border-[#ff4f00] shadow-[0_0_14px_rgba(255,79,0,0.35)] scale-105' : 'border-[#201515] dark:border-[#3f3f46] hover:border-[#ff4f00] shadow-sm'
      }`}>
        <svg className="w-6 h-6 text-[#ff4f00] ml-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>

        {/* Play SVG Overlay Badge */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff4f00] border-2 border-[#fffefb] flex items-center justify-center shadow-sm">
          <svg className="w-2.5 h-2.5 text-[#fffefb] ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <div className="mt-2 whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold text-[#201515] dark:text-[#f4f4f5] bg-[#fffefb] dark:bg-[#141417] px-2.5 py-0.5 rounded-full border border-[#c5c0b1] dark:border-[#27272a]">
        {data.label || 'Start Trigger'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] hover:scale-125 transition-transform"
      />
    </div>
  );
});

// Google Form Webhook Trigger card style
export const GoogleFormTriggerNode = memo(({ data, selected }: any) => {
  return (
    <div className={`node-card w-60 p-4 rounded-md relative group cursor-pointer text-[#201515] dark:text-[#f4f4f5] text-left transition-all duration-200 shadow-sm ${
      selected
        ? 'bg-[#f8f4f0] dark:bg-[#1f1f23] border-2 border-[#ff4f00] shadow-[0_4px_16px_rgba(255,79,0,0.2)] scale-[1.02]'
        : 'bg-[#f8f4f0] dark:bg-[#18181b] border border-[#c5c0b1] dark:border-[#27272a] hover:border-[#201515] dark:hover:border-[#ff4f00] hover:shadow-md'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📋</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Google Form Trigger'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-wider text-[#ff4f00] font-bold">Webhook Endpoint</div>
        <div className="bg-[#fffefb] dark:bg-[#0a0a0a] border border-[#c5c0b1] dark:border-[#27272a] p-1.5 rounded text-[10px] font-mono truncate select-all" title={data.webhookUrl}>
          {data.webhookUrl || 'http://localhost:4000/api/webhook/form'}
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
    <div className="relative group flex flex-col items-center cursor-grab active:cursor-grabbing">
      <div className={`w-14 h-14 rounded-full bg-[#f8f4f0] dark:bg-[#18181b] border-2 flex items-center justify-center relative transition-all duration-200 ${
        selected ? 'border-[#ff4f00] shadow-[0_0_14px_rgba(255,79,0,0.35)] scale-105' : 'border-[#201515] dark:border-[#3f3f46] hover:border-[#ff4f00] shadow-sm'
      }`}>
        <span className="text-[#ff4f00] font-bold text-xl">⏰</span>

        {/* Play SVG Overlay Badge matching node color */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff4f00] border-2 border-[#fffefb] flex items-center justify-center shadow-sm">
          <svg className="w-2.5 h-2.5 text-[#fffefb] ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="mt-2 whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold text-[#201515] dark:text-[#f4f4f5] bg-[#fffefb] dark:bg-[#141417] px-2.5 py-0.5 rounded-full border border-[#c5c0b1] dark:border-[#27272a]">
        {data.label || 'Schedule'}
      </div>
      <div className="text-[10px] text-[#605d52] dark:text-[#a1a1aa] font-mono mt-1 font-semibold">
        {scheduleText}
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
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📊</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Google Sheets'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-0.5">
        <div>Action: <span className="text-[#ff4f00] font-bold uppercase text-[10px]">{action}</span></div>
        <div>Sheet: <span className="font-semibold text-[#201515] dark:text-[#f4f4f5]">{sheetName}</span></div>
        {isRead && <div className="text-[10px]">Data: {mockType === 'blog_news' ? 'Blog Posts' : mockType === 'crm_leads' ? 'CRM Leads' : 'Custom JSON'}</div>}
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

// OpenAI GPT Node Card Style
export const OpenAINode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'OpenAI GPT'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-0.5">
        <div>Model: <span className="text-purple-600 dark:text-purple-400 font-bold uppercase text-[10px]">{data.model || 'gpt-4o'}</span></div>
        <div className="truncate text-[10px]">Prompt: {data.prompt || 'Summarize text...'}</div>
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

// Slack Integration Node Card Style
export const SlackNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💬</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Post to Slack'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa]">
        <div className="truncate text-[10px]">Msg: {data.text || 'Slack alert message'}</div>
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

// Discord Integration Node Card Style
export const DiscordNode = memo(({ data, selected }: any) => {
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎮</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Discord Alert'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa]">
        <div className="truncate text-[10px]">Msg: {data.content || 'Discord message'}</div>
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
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📤</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Webhook Response'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-0.5">
        <div>Status: <span className="text-[#ff4f00] font-bold">{status}</span></div>
        <div>Mode: <span className="uppercase text-[10px] font-semibold">{mode}</span></div>
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

// Excel Node Component
export const ExcelNode = memo(({ data, selected }: any) => {
  const operation = data?.operation || 'readSheet';
  const sheetName = data?.sheetName || 'Sheet1';
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📊</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Excel Processor'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-0.5">
        <div>Op: <span className="text-[#ff4f00] font-semibold">{operation}</span></div>
        <div>Sheet: <span className="font-mono text-[11px]">{sheetName}</span></div>
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

// MCP Productivity App Connector Node Component
export const McpConnectorNode = memo(({ data, selected }: any) => {
  const appName = data?.appName || 'Notion';
  const selectedTool = data?.selectedTool || 'Select MCP Tool';
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔌</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'MCP Connector'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-0.5">
        <div>App: <span className="text-[#ff4f00] uppercase font-semibold text-[10px]">{appName}</span></div>
        <div className="truncate text-[10px]">Tool: <span className="font-mono">{selectedTool}</span></div>
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

// WhatsApp Trigger Node Component (Starts workflow when incoming WhatsApp message is received)
export const WhatsAppTriggerNode = memo(({ data, selected }: any) => {
  return (
    <div className="relative group flex flex-col items-center cursor-grab active:cursor-grabbing">
      <div className={`w-14 h-14 rounded-full bg-[#25D366]/10 dark:bg-[#25D366]/20 border-2 flex items-center justify-center relative transition-all duration-200 ${
        selected ? 'border-[#25D366] shadow-[0_0_14px_rgba(37,211,102,0.4)] scale-105' : 'border-[#25D366]/60 hover:border-[#25D366] shadow-sm'
      }`}>
        <span className="text-2xl">💬</span>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#25D366] border-2 border-[#fffefb] flex items-center justify-center shadow-sm">
          <svg className="w-2.5 h-2.5 text-[#fffefb] ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="mt-2 whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold text-[#25D366] dark:text-[#25D366] bg-[#fffefb] dark:bg-[#141417] px-2.5 py-0.5 rounded-full border border-[#25D366]/40 shadow-xs">
        {data.label || 'WhatsApp Trigger'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#25D366] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] hover:scale-125 transition-transform"
      />
    </div>
  );
});

// WhatsApp Action Node Component (Sends outbound WhatsApp message)
export const WhatsAppNode = memo(({ data, selected }: any) => {
  const recipient = data?.recipientPhone || data?.to || '{{trigger.from}}';
  const message = data?.messageText || data?.text || 'WhatsApp message';
  return (
    <div className={nodeCardClass(selected)}>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#25D366]"
      />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💬</span>
        <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{data.label || 'Send WhatsApp Msg'}</span>
      </div>
      <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-0.5">
        <div className="truncate text-[10px]">To: <span className="font-mono text-[#25D366]">{recipient}</span></div>
        <div className="truncate text-[10px]">Msg: <span>{message}</span></div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-[#25D366] !border-2 !border-[#fffefb] !rounded-full !right-[-6px]"
      />
    </div>
  );
});


