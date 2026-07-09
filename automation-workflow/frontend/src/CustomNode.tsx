import { memo } from 'react';
import { Handle, Position } from 'reactflow';

// Custom icons using inline SVG or standard representation since we want absolute reliability
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-sky-400" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.07-.3.1-.61.1-.94 0-1.66-1.34-3-3-3-1.66 0-3 1.34-3 3 0 .33.03.64.1.94H12.93zM11 17c.07-.3.1-.61.1-.94 0-2.21-1.79-4-4-4-2.21 0-4 1.79-4 4 0 .33.03.64.1.94h7.8z" />
  </svg>
);

const LogicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-fuchsia-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-4 2a1 1 0 10-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Trigger Node (Output Only)
export const TriggerNode = memo(({ data, selected }: any) => {
  const isCrm = data?.triggerType === 'crm';
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-neutral-900/90 text-white min-w-[200px] shadow-lg transition-all duration-300 ${
      selected ? 'border-emerald-500 shadow-emerald-500/20' : 'border-emerald-500/40 hover:border-emerald-500/70'
    }`}>
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-emerald-500/10">
          {isCrm ? <UsersIcon /> : <PlayIcon />}
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Trigger</div>
          <div className="text-sm font-bold truncate">{data.label || 'Webhook Input'}</div>
        </div>
      </div>
      <div className="mt-2 text-xxs text-neutral-400 text-left truncate">
        {isCrm ? 'Triggers on Lead Created' : 'POST /api/webhooks/*'}
      </div>
      <Handle type="source" position={Position.Right} id="output" className="!w-2.5 !h-2.5 !bg-emerald-400 !border-neutral-900" />
    </div>
  );
});

// Marketing Node (Input & Output)
export const MarketingNode = memo(({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-neutral-900/90 text-white min-w-[200px] shadow-lg transition-all duration-300 ${
      selected ? 'border-sky-500 shadow-sky-500/20' : 'border-sky-500/40 hover:border-sky-500/70'
    }`}>
      <Handle type="target" position={Position.Left} id="input" className="!w-2.5 !h-2.5 !bg-sky-400 !border-neutral-900" />
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-sky-500/10">
          <MailIcon />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-400">Marketing</div>
          <div className="text-sm font-bold truncate">{data.label || 'Send Email'}</div>
        </div>
      </div>
      <div className="mt-2 text-xxs text-neutral-400 text-left truncate">
        To: {data.to || '{{trigger.email}}'}
      </div>
      <Handle type="source" position={Position.Right} id="output" className="!w-2.5 !h-2.5 !bg-sky-400 !border-neutral-900" />
    </div>
  );
});

// CRM Action Node (Input & Output)
export const CRMNode = memo(({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-neutral-900/90 text-white min-w-[200px] shadow-lg transition-all duration-300 ${
      selected ? 'border-indigo-500 shadow-indigo-500/20' : 'border-indigo-500/40 hover:border-indigo-500/70'
    }`}>
      <Handle type="target" position={Position.Left} id="input" className="!w-2.5 !h-2.5 !bg-indigo-400 !border-neutral-900" />
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-indigo-500/10">
          <UsersIcon />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">CRM Sales</div>
          <div className="text-sm font-bold truncate">{data.label || 'Create Contact'}</div>
        </div>
      </div>
      <div className="mt-2 text-xxs text-neutral-400 text-left truncate">
        Score Change: {data.scoreChange || '0'}
      </div>
      <Handle type="source" position={Position.Right} id="output" className="!w-2.5 !h-2.5 !bg-indigo-400 !border-neutral-900" />
    </div>
  );
});

// Logic Node (Input & Dual Output: True/False)
export const LogicNode = memo(({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-neutral-900/90 text-white min-w-[220px] shadow-lg transition-all duration-300 ${
      selected ? 'border-fuchsia-500 shadow-fuchsia-500/20' : 'border-fuchsia-500/40 hover:border-fuchsia-500/70'
    }`}>
      <Handle type="target" position={Position.Left} id="input" className="!w-2.5 !h-2.5 !bg-fuchsia-400 !border-neutral-900" />
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-fuchsia-500/10">
          <LogicIcon />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400">Logic If/Else</div>
          <div className="text-sm font-bold truncate">{data.label || 'Filter Score'}</div>
        </div>
      </div>
      <div className="mt-2 text-xxs text-neutral-300 text-left font-mono bg-black/40 px-2 py-1 rounded truncate">
        {data.condition || 'true'}
      </div>

      {/* Dual outputs */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-neutral-800 text-xxs font-bold">
        <div className="text-emerald-400 flex items-center gap-1">
          <span>✔ True</span>
        </div>
        <div className="text-rose-400 flex items-center gap-1">
          <span>✖ False</span>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="true" 
        style={{ top: '80%' }}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-neutral-900" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="false" 
        style={{ top: '92%' }}
        className="!w-2.5 !h-2.5 !bg-rose-400 !border-neutral-900" 
      />
    </div>
  );
});

// Delay Node (Input & Output)
export const DelayNode = memo(({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-neutral-900/90 text-white min-w-[200px] shadow-lg transition-all duration-300 ${
      selected ? 'border-amber-500 shadow-amber-500/20' : 'border-amber-500/40 hover:border-amber-500/70'
    }`}>
      <Handle type="target" position={Position.Left} id="input" className="!w-2.5 !h-2.5 !bg-amber-400 !border-neutral-900" />
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-amber-500/10">
          <ClockIcon />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Delay Timer</div>
          <div className="text-sm font-bold truncate">{data.label || 'Wait'}</div>
        </div>
      </div>
      <div className="mt-2 text-xxs text-neutral-400 text-left truncate">
        Duration: {data.seconds || '10'} seconds
      </div>
      <Handle type="source" position={Position.Right} id="output" className="!w-2.5 !h-2.5 !bg-amber-400 !border-neutral-900" />
    </div>
  );
});

// Script / Code execution Node
export const CodeNode = memo(({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-neutral-900/90 text-white min-w-[200px] shadow-lg transition-all duration-300 ${
      selected ? 'border-emerald-400 shadow-emerald-400/20' : 'border-emerald-400/40 hover:border-emerald-400/70'
    }`}>
      <Handle type="target" position={Position.Left} id="input" className="!w-2.5 !h-2.5 !bg-emerald-400 !border-neutral-900" />
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-emerald-500/10">
          <CodeIcon />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Run Code</div>
          <div className="text-sm font-bold truncate">{data.label || 'JS Script'}</div>
        </div>
      </div>
      <div className="mt-2 text-xxs text-neutral-400 text-left font-mono bg-black/40 px-2 py-1 rounded truncate">
        {data.code ? data.code.substring(0, 20) + '...' : 'return {};'}
      </div>
      <Handle type="source" position={Position.Right} id="output" className="!w-2.5 !h-2.5 !bg-emerald-400 !border-neutral-900" />
    </div>
  );
});
