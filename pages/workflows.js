import React, { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl, getDashboardUrl } from '../lib/config';

// Initial default workflow nodes & connections
const DEFAULT_TEMPLATES = {
  healthCheck: {
    name: '10s Interval Health Check & Alert Pipeline',
    description: 'Polls system status periodically, evaluates uptime metrics via logic gates, and dispatches email alerts.',
    nodes: [
      { id: 'node-1', type: 'schedule_trigger', label: '10s Heartbeat', x: 80, y: 180, data: { interval: 10, unit: 'seconds' } },
      { id: 'node-2', type: 'code', label: 'Ping Health Check', x: 340, y: 180, data: { endpoint: 'https://api.system.local/health', timeout: 3000 } },
      { id: 'node-3', type: 'ifelse', label: 'Check Status 200 OK', x: 600, y: 180, data: { condition: 'status === 200', threshold: 100 } },
      { id: 'node-4', type: 'simulated_email', label: 'Alert On-Call Dev', x: 880, y: 80, data: { to: 'ops-team@neuronflow.ai', subject: '🚨 High Priority: Health check failed!' } },
      { id: 'node-5', type: 'slack', label: 'Log Uptime Metric', x: 880, y: 280, data: { channel: '#uptime-logs', message: '✅ System healthy. 100% operational.' } },
      { id: 'node-6', type: 'end', label: 'Execution End', x: 1140, y: 280, data: {} },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2' },
      { id: 'e2-3', source: 'node-2', target: 'node-3' },
      { id: 'e3-4', source: 'node-3', target: 'node-4', label: 'False / Alert' },
      { id: 'e3-5', source: 'node-3', target: 'node-5', label: 'True / Healthy' },
      { id: 'e5-6', source: 'node-5', target: 'node-6' },
    ]
  },
  aiLeadRouter: {
    name: 'AI Lead Scoring & WhatsApp Auto-Responder',
    description: 'Captures incoming CRM leads, analyzes intent using GPT-4o, and sends automated WhatsApp confirmations.',
    nodes: [
      { id: 'node-1', type: 'crm_lead_trigger', label: 'New CRM Lead Ingest', x: 80, y: 180, data: { leadSource: 'Landing Page Form', defaultScore: 40 } },
      { id: 'node-2', type: 'openai', label: 'GPT-4o Intent Analysis', x: 340, y: 180, data: { model: 'gpt-4o', systemPrompt: 'Score buyer intent from 1-100 and summarize key requirements.', temperature: 0.2 } },
      { id: 'node-3', type: 'ifelse', label: 'Score >= 75 (High Priority)', x: 620, y: 180, data: { condition: 'intentScore >= 75', threshold: 75 } },
      { id: 'node-4', type: 'whatsapp', label: 'Send WhatsApp VIP Invite', x: 900, y: 80, data: { phone: '+1 (555) 019-2834', message: 'Hello! Our Senior Architect is ready for your demo.' } },
      { id: 'node-5', type: 'simulated_email', label: 'Nurture Campaign Email', x: 900, y: 280, data: { to: 'lead@prospect.com', subject: 'Welcome to NEURON_FLOW Automation System' } },
      { id: 'node-6', type: 'end', label: 'Lead Processed', x: 1160, y: 180, data: {} },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2' },
      { id: 'e2-3', source: 'node-2', target: 'node-3' },
      { id: 'e3-4', source: 'node-3', target: 'node-4', label: 'VIP Lead' },
      { id: 'e3-5', source: 'node-3', target: 'node-5', label: 'Standard Lead' },
      { id: 'e4-6', source: 'node-4', target: 'node-6' },
      { id: 'e5-6', source: 'node-5', target: 'node-6' },
    ]
  },
  excelAiPipeline: {
    name: 'Excel AI Transformation & Gemini Summarizer',
    description: 'Ingests spreadsheet rows, applies automated LLM calculations and broadcasts summary to Slack.',
    nodes: [
      { id: 'node-1', type: 'start_trigger', label: 'Trigger Batch Process', x: 80, y: 180, data: {} },
      { id: 'node-2', type: 'excel', label: 'Excel AI Row Transformer', x: 320, y: 180, data: { maxRows: 50, formula: '=TRIM(CLEAN(A2:D50))' } },
      { id: 'node-3', type: 'gemini', label: 'Gemini 2.0 Flash Synthesis', x: 600, y: 180, data: { model: 'gemini-2.0-flash', prompt: 'Generate executive summary and revenue variance table.' } },
      { id: 'node-4', type: 'delay', label: 'Buffer Wait (3s)', x: 880, y: 180, data: { duration: 3 } },
      { id: 'node-5', type: 'slack', label: 'Post to #financial-exec', x: 1140, y: 180, data: { channel: '#financial-exec', message: 'Monthly financial audit summary generated.' } },
    ],
    edges: [
      { id: 'e1-2', source: 'node-1', target: 'node-2' },
      { id: 'e2-3', source: 'node-2', target: 'node-3' },
      { id: 'e3-4', source: 'node-3', target: 'node-4' },
      { id: 'e4-5', source: 'node-4', target: 'node-5' },
    ]
  }
};

const NODE_DEFINITIONS = {
  start_trigger: { label: 'Start Trigger', category: 'Trigger', icon: '▶️', color: '#ff4f00', bg: 'bg-[#ff4f00]/10', border: 'border-[#ff4f00]/40', text: 'text-[#ff4f00]' },
  schedule_trigger: { label: 'Schedule Trigger', category: 'Trigger', icon: '⏰', color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/40', text: 'text-cyan-400' },
  google_form_trigger: { label: 'Google Form Webhook', category: 'Trigger', icon: '📝', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  crm_lead_trigger: { label: 'CRM Lead Ingest', category: 'Trigger', icon: '👥', color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/40', text: 'text-purple-400' },
  ifelse: { label: 'If / Else Logic', category: 'Logic', icon: '🔀', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400' },
  delay: { label: 'Delay / Timer', category: 'Logic', icon: '⏳', color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  code: { label: 'Custom Code (JS)', category: 'Logic', icon: '💻', color: '#64748b', bg: 'bg-slate-500/10', border: 'border-slate-500/40', text: 'text-slate-300' },
  openai: { label: 'OpenAI GPT-4o', category: 'AI Core', icon: '🧠', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  gemini: { label: 'Gemini 2.0 Flash', category: 'AI Core', icon: '✨', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/40', text: 'text-blue-400' },
  excel: { label: 'Excel AI Transformer', category: 'Data', icon: '📊', color: '#14b8a6', bg: 'bg-teal-500/10', border: 'border-teal-500/40', text: 'text-teal-400' },
  whatsapp: { label: 'WhatsApp Messenger', category: 'Action', icon: '💬', color: '#22c55e', bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-400' },
  slack: { label: 'Slack Webhook', category: 'Action', icon: '📢', color: '#ec4899', bg: 'bg-pink-500/10', border: 'border-pink-500/40', text: 'text-pink-400' },
  simulated_email: { label: 'SMTP Email Dispatcher', category: 'Action', icon: '📧', color: '#38bdf8', bg: 'bg-sky-500/10', border: 'border-sky-500/40', text: 'text-sky-400' },
  end: { label: 'End / Complete', category: 'Output', icon: '🏁', color: '#71717a', bg: 'bg-zinc-500/10', border: 'border-zinc-500/40', text: 'text-zinc-400' },
};

export default function WorkflowsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('healthCheck');
  const [nodes, setNodes] = useState(DEFAULT_TEMPLATES.healthCheck.nodes);
  const [edges, setEdges] = useState(DEFAULT_TEMPLATES.healthCheck.edges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectingSourceId, setConnectingSourceId] = useState(null);
  
  // Execution & Simulation State
  const [isRunning, setIsRunning] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, completed, error
  const [simProgress, setSimProgress] = useState(0);

  // Canvas Viewport Transforms
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanMouse, setStartPanMouse] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // AI & Server Configuration
  const [wfAiProvider, setWfAiProvider] = useState('openai');
  const [wfAiKey, setWfAiKey] = useState('');
  const [wfKeySaved, setWfKeySaved] = useState(false);
  const [externalCanvasUrl, setExternalCanvasUrl] = useState('');
  const [viewMode, setViewMode] = useState('studio'); // 'studio' | 'external'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const canvasRef = useRef(null);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    const extUrl = getFlowCanvasUrl();
    setExternalCanvasUrl(extUrl);

    const savedKey = localStorage.getItem(`neuron_flow_api_key_${wfAiProvider}`) || localStorage.getItem('neuron_flow_ai_api_key') || '';
    setWfAiKey(savedKey);
  }, [wfAiProvider]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAiKey = () => {
    if (!wfAiKey.trim()) return;
    localStorage.setItem(`neuron_flow_api_key_${wfAiProvider}`, wfAiKey.trim());
    localStorage.setItem('neuron_flow_ai_api_key', wfAiKey.trim());
    setWfKeySaved(true);
    showToast(`Saved ${wfAiProvider.toUpperCase()} API key`);
    setTimeout(() => setWfKeySaved(false), 3000);
  };

  const loadTemplate = (key) => {
    const tpl = DEFAULT_TEMPLATES[key];
    if (!tpl) return;
    setSelectedTemplateKey(key);
    setNodes(JSON.parse(JSON.stringify(tpl.nodes)));
    setEdges(JSON.parse(JSON.stringify(tpl.edges)));
    setSelectedNodeId(null);
    setConnectingSourceId(null);
    setExecutionLogs([]);
    setExecutionStatus('idle');
    setPan({ x: 40, y: 40 });
    setZoom(1);
    showToast(`Loaded Template: ${tpl.name}`);
  };

  // Node Dragging Handlers
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDragOffset({
        x: (e.clientX - pan.x) / zoom - node.x,
        y: (e.clientY - pan.y) / zoom - node.y,
      });
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg' || e.target.classList.contains('canvas-background')) {
      setIsPanning(true);
      setStartPanMouse({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeId(null);
      setConnectingSourceId(null);
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanMouse.x,
        y: e.clientY - startPanMouse.y,
      });
    } else if (draggingNodeId) {
      const newX = Math.round(((e.clientX - pan.x) / zoom - dragOffset.x) / 10) * 10;
      const newY = Math.round(((e.clientY - pan.y) / zoom - dragOffset.y) / 10) * 10;
      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Handle Edge Connecting
  const handleHandleClick = (e, nodeId, handleType) => {
    e.stopPropagation();
    if (handleType === 'source') {
      setConnectingSourceId(nodeId);
      showToast(`Source node selected. Click target handle to connect.`);
    } else if (handleType === 'target') {
      if (connectingSourceId && connectingSourceId !== nodeId) {
        // Check if edge already exists
        const exists = edges.some(edge => edge.source === connectingSourceId && edge.target === nodeId);
        if (!exists) {
          const newEdge = {
            id: `e-${connectingSourceId}-${nodeId}-${Date.now()}`,
            source: connectingSourceId,
            target: nodeId,
          };
          setEdges(prev => [...prev, newEdge]);
          showToast(`Connected node ${connectingSourceId} ➔ ${nodeId}`);
        }
        setConnectingSourceId(null);
      }
    }
  };

  const deleteEdge = (edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    showToast('Removed connection line');
  };

  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    showToast('Deleted node');
  };

  const addNodeToCanvas = (type) => {
    const def = NODE_DEFINITIONS[type];
    const newId = `node-${Date.now().toString().slice(-4)}`;
    const newNode = {
      id: newId,
      type,
      label: def ? def.label : type,
      x: Math.round((-pan.x + 300) / zoom / 10) * 10 + Math.floor(Math.random() * 40),
      y: Math.round((-pan.y + 200) / zoom / 10) * 10 + Math.floor(Math.random() * 40),
      data: type === 'delay' ? { duration: 5 } : type === 'schedule_trigger' ? { interval: 30 } : type === 'openai' ? { model: 'gpt-4o', temperature: 0.7 } : {}
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);
    showToast(`Added ${def ? def.label : type} node`);
  };

  // Run Workflow Simulation Engine
  const runWorkflowSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionStatus('running');
    setExecutionLogs([]);
    setSimProgress(0);

    const logEntry = (node, msg, type = 'info', output = null) => {
      const item = {
        time: new Date().toLocaleTimeString(),
        nodeId: node ? node.id : 'ENGINE',
        nodeLabel: node ? node.label : 'Workflow Engine',
        message: msg,
        type,
        output: output ? JSON.stringify(output, null, 2) : null
      };
      setExecutionLogs(prev => [...prev, item]);
    };

    logEntry(null, `Initiating workflow execution graph (${nodes.length} nodes, ${edges.length} edges)...`, 'start');

    // Find root nodes (no incoming edges) or start triggers
    const targetSet = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !targetSet.has(n.id) || n.type.includes('trigger'));

    if (startNodes.length === 0) {
      logEntry(null, 'Error: No entry trigger node found in workflow graph.', 'error');
      setIsRunning(false);
      setExecutionStatus('error');
      return;
    }

    const visited = new Set();
    const queue = [...startNodes];
    let totalExecuted = 0;

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (!currentNode || visited.has(currentNode.id)) continue;
      visited.add(currentNode.id);
      totalExecuted++;

      setActiveNodeId(currentNode.id);
      setSimProgress(Math.round((totalExecuted / nodes.length) * 100));

      logEntry(currentNode, `Executing node [${currentNode.type.toUpperCase()}]...`, 'running');

      // Simulate step execution delay
      let delayMs = 600;
      if (currentNode.type === 'delay') {
        delayMs = Math.min((currentNode.data?.duration || 2) * 400, 2000);
      } else if (currentNode.type === 'openai' || currentNode.type === 'gemini') {
        delayMs = 900;
      }

      await new Promise(res => setTimeout(res, delayMs));

      // Generate output payload simulation
      let mockOutput = { status: 'success', timestamp: new Date().toISOString() };
      if (currentNode.type === 'crm_lead_trigger') {
        mockOutput = { leadId: 'lead_9042', name: 'Alex Rivera', company: 'Apex Global', email: 'alex@apex.io', score: 85 };
      } else if (currentNode.type === 'openai') {
        mockOutput = { model: 'gpt-4o', intentScore: 92, summary: 'Enterprise automation buyer with urgent deployment timeline.', tokensUsed: 142 };
      } else if (currentNode.type === 'ifelse') {
        mockOutput = { branch: 'TRUE', evaluated: 'intentScore >= 75 (92 >= 75)', result: true };
      } else if (currentNode.type === 'whatsapp') {
        mockOutput = { deliveryStatus: 'SENT', recipientPhone: currentNode.data?.phone || '+15550192834', messageId: 'wa_msg_8849' };
      } else if (currentNode.type === 'simulated_email') {
        mockOutput = { smtpStatus: 'DISPATCHED_250_OK', to: currentNode.data?.to || 'ops@neuronflow.ai', subject: currentNode.data?.subject };
      }

      logEntry(currentNode, `✓ Node completed successfully in ${delayMs}ms`, 'success', mockOutput);

      // Find outbound connected nodes
      const outboundEdges = edges.filter(e => e.source === currentNode.id);
      for (const edge of outboundEdges) {
        const nextNode = nodes.find(n => n.id === edge.target);
        if (nextNode && !visited.has(nextNode.id)) {
          queue.push(nextNode);
        }
      }
    }

    setActiveNodeId(null);
    setIsRunning(false);
    setExecutionStatus('completed');
    setSimProgress(100);
    logEntry(null, `🎉 Workflow pipeline finished cleanly. All ${totalExecuted} nodes executed.`, 'finish');
  };

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const updateSelectedNodeData = (key, val) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, data: { ...n.data, [key]: val } };
      }
      return n;
    }));
  };

  const updateSelectedNodeLabel = (val) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, label: val };
      }
      return n;
    }));
  };

  const exportWorkflowJson = () => {
    const data = {
      name: DEFAULT_TEMPLATES[selectedTemplateKey]?.name || 'Custom Workflow',
      exportedAt: new Date().toISOString(),
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuron-workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Workflow configuration exported to JSON');
  };

  return (
    <>
      <Head>
        <title>Visual Flow Diagram Canvas | NEURON_FLOW</title>
        <meta name="description" content="Visual Flow Diagram Canvas and Workflow Designer for NEURON_FLOW Automation System." />
      </Head>

      <div className={`bg-[#09090b] text-[#f4f4f5] font-sans min-h-screen flex flex-col transition-colors duration-200 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Navigation Header */}
        {!isFullscreen && (
          <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-4 sm:px-6 py-3.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <a href="/" className="flex items-center gap-3 cursor-pointer shrink-0">
                <div className="w-8 h-8 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-[#ff4f00]/30">
                  ⚡
                </div>
                <span className="font-bold text-xl tracking-tight text-white hidden sm:inline">NEURON_FLOW</span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ff4f00]/10 text-[#ff4f00] border border-[#ff4f00]/30">
                  Flow Studio
                </span>
              </a>

              {/* Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium bg-[#141417] p-1 rounded-xl border border-[#27272a]">
                <a href="/" className="px-3 py-1.5 rounded-lg text-xs text-[#a1a1aa] hover:text-white transition">Dashboard</a>
                <a href="/workflows" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#ff4f00] bg-[#ff4f00]/15 border border-[#ff4f00]/30">Visual Flow</a>
                <a href="/connections" className="px-3 py-1.5 rounded-lg text-xs text-[#a1a1aa] hover:text-white transition">Connections</a>
                <a href="/excel" className="px-3 py-1.5 rounded-lg text-xs text-[#a1a1aa] hover:text-white transition">Excel AI</a>
                <a href="/files" className="px-3 py-1.5 rounded-lg text-xs text-[#a1a1aa] hover:text-white transition">File Vault</a>
                <a href="/docs" className="px-3 py-1.5 rounded-lg text-xs text-[#a1a1aa] hover:text-white transition">Docs</a>
              </nav>

              {/* Quick Actions & Auth */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={runWorkflowSimulation}
                  disabled={isRunning}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                    isRunning 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' 
                      : 'bg-[#ff4f00] hover:bg-[#e04500] text-white shadow-[#ff4f00]/25 active:scale-95'
                  }`}
                >
                  <span>{isRunning ? '⏳' : '▶️'}</span>
                  <span>{isRunning ? 'Simulating...' : 'Run Flow'}</span>
                </button>

                <button
                  onClick={exportWorkflowJson}
                  className="hidden sm:flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] text-white border border-[#27272a] hover:border-[#ff4f00]/40 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer"
                >
                  <span>💾</span>
                  <span>Export JSON</span>
                </button>

                {isLoaded && isSignedIn ? (
                  <UserButton afterSignOutUrl="/" />
                ) : (
                  <SignInButton mode="modal">
                    <button className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-white rounded-lg px-3 py-2 text-xs font-medium cursor-pointer">
                      Sign In
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Studio Top Control Ribbon */}
        <div className="bg-[#121215] border-b border-[#27272a] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Template Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[#a1a1aa] font-medium hidden sm:inline">Template:</span>
            <div className="flex items-center gap-1.5">
              {Object.keys(DEFAULT_TEMPLATES).map((key) => (
                <button
                  key={key}
                  onClick={() => loadTemplate(key)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    selectedTemplateKey === key
                      ? 'bg-[#ff4f00]/15 text-[#ff4f00] border border-[#ff4f00]/40 shadow-sm'
                      : 'bg-[#18181b] text-[#a1a1aa] hover:text-white border border-[#27272a]'
                  }`}
                >
                  {key === 'healthCheck' ? '⏱️ Health Alert' : key === 'aiLeadRouter' ? '👥 AI CRM Lead' : '📊 Excel AI'}
                </button>
              ))}
            </div>
          </div>

          {/* AI Key Bar */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[#a1a1aa] hidden md:inline">AI Key:</span>
            <select
              value={wfAiProvider}
              onChange={(e) => setWfAiProvider(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-white text-[11px] rounded-md px-2 py-1 outline-none"
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="anthropic">Claude</option>
            </select>
            <input
              type="password"
              value={wfAiKey}
              onChange={(e) => setWfAiKey(e.target.value)}
              placeholder="API Key..."
              className="bg-[#18181b] border border-[#27272a] text-white text-[11px] rounded-md px-2.5 py-1 w-28 sm:w-36 outline-none font-mono"
            />
            <button
              onClick={handleSaveAiKey}
              className="bg-[#27272a] hover:bg-[#ff4f00] text-white text-[11px] font-bold px-2.5 py-1 rounded-md transition cursor-pointer"
            >
              Save
            </button>
            {wfKeySaved && <span className="text-emerald-400 font-bold">✓</span>}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1.5 border-l border-[#27272a] pl-3">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] rounded-md text-white transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            >
              {isFullscreen ? '🗗' : '⛶'}
            </button>
          </div>
        </div>

        {/* Main Workflow Studio Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
          {/* Left Node Palette Sidebar */}
          <aside className="w-full lg:w-64 bg-[#121215] border-r border-[#27272a] p-4 flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[220px] lg:max-h-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa]">Node Palette</span>
              <span className="text-[10px] bg-[#18181b] text-[#ff4f00] px-2 py-0.5 rounded-full border border-[#27272a] font-mono">
                {nodes.length} on canvas
              </span>
            </div>

            <p className="text-[11px] text-[#71717a] leading-tight">
              Click any node to spawn it onto the interactive diagram canvas.
            </p>

            <div className="flex flex-col gap-2">
              {Object.entries(NODE_DEFINITIONS).map(([type, def]) => (
                <button
                  key={type}
                  onClick={() => addNodeToCanvas(type)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#18181b] hover:bg-[#202025] border border-[#27272a] hover:border-[#ff4f00]/40 transition text-left group cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{def.icon}</span>
                    <div>
                      <span className="text-xs font-semibold text-white group-hover:text-[#ff4f00] transition block">
                        {def.label}
                      </span>
                      <span className="text-[10px] text-[#71717a]">{def.category}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#71717a] group-hover:text-[#ff4f00] group-hover:translate-x-0.5 transition-all">
                    +
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Center Interactive Node Graph Canvas */}
          <main
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="flex-1 relative bg-[#09090b] overflow-hidden select-none cursor-grab active:cursor-grabbing min-h-[480px] lg:min-h-[640px]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255, 79, 0, 0.08) 1.5px, transparent 1.5px)`,
              backgroundSize: '24px 24px',
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          >
            {/* Canvas Action Bar */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#141417]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#27272a] shadow-lg">
              <button
                onClick={() => setZoom(z => Math.min(z + 0.15, 2.0))}
                className="w-7 h-7 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-white flex items-center justify-center font-bold text-xs transition cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <span className="text-xs font-mono px-2 text-[#a1a1aa] min-w-[45px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
                className="w-7 h-7 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-white flex items-center justify-center font-bold text-xs transition cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }); }}
                className="px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-xs text-[#a1a1aa] hover:text-white transition cursor-pointer"
              >
                Reset View
              </button>
            </div>

            {/* Canvas State Indicator Badge */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {connectingSourceId && (
                <div className="px-3 py-1.5 rounded-full bg-[#ff4f00]/20 text-[#ff4f00] border border-[#ff4f00]/40 text-xs font-semibold animate-pulse flex items-center gap-1.5 shadow-lg">
                  <span>⚡</span> Select target node input handle...
                  <button onClick={() => setConnectingSourceId(null)} className="ml-1.5 hover:text-white">✕</button>
                </div>
              )}

              {isRunning && (
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold animate-pulse flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Executing Workflow: {simProgress}%
                </div>
              )}
            </div>

            {/* SVG Connection Edges Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              <defs>
                <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff4f00" />
                  <stop offset="100%" stopColor="#ff7836" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {edges.map((edge) => {
                const srcNode = nodes.find(n => n.id === edge.source);
                const tgtNode = nodes.find(n => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;

                const sx = srcNode.x + 220;
                const sy = srcNode.y + 40;
                const tx = tgtNode.x;
                const ty = tgtNode.y + 40;

                const dx = Math.abs(tx - sx) * 0.5;
                const pathData = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

                const midX = (sx + tx) / 2;
                const midY = (sy + ty) / 2;
                const isActive = activeNodeId === edge.source;

                return (
                  <g key={edge.id} className="pointer-events-auto group">
                    {/* Shadow / Glow path */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isActive ? '#ff4f00' : 'rgba(255, 79, 0, 0.25)'}
                      strokeWidth={isActive ? 4 : 2}
                      strokeDasharray={isActive ? '6 4' : 'none'}
                      className={isActive ? 'animate-pulse' : ''}
                    />

                    {/* Edge Label / Delete Trigger */}
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      className="cursor-pointer"
                      onClick={() => deleteEdge(edge.id)}
                    >
                      <rect
                        x="-10"
                        y="-10"
                        width="20"
                        height="20"
                        rx="10"
                        fill="#18181b"
                        stroke="#ff4f00"
                        strokeWidth="1"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#ff4f00"
                        fontSize="11"
                        fontWeight="bold"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </text>
                      {edge.label && (
                        <text
                          x="0"
                          y="-14"
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Draggable Node Components Container */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {nodes.map((node) => {
                const def = NODE_DEFINITIONS[node.type] || NODE_DEFINITIONS.code;
                const isSelected = selectedNodeId === node.id;
                const isActive = activeNodeId === node.id;
                const isConnectingSource = connectingSourceId === node.id;

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: '220px',
                    }}
                    className={`absolute rounded-2xl bg-[#141417] border-2 transition-shadow duration-200 shadow-xl cursor-move z-20 ${
                      isActive
                        ? 'border-[#ff4f00] shadow-[0_0_24px_rgba(255,79,0,0.5)] ring-2 ring-[#ff4f00]/50 scale-105'
                        : isSelected
                        ? 'border-[#ff4f00] shadow-[0_0_16px_rgba(255,79,0,0.3)]'
                        : isConnectingSource
                        ? 'border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.4)] animate-pulse'
                        : 'border-[#27272a] hover:border-[#3f3f46]'
                    }`}
                  >
                    {/* Left Target Handle */}
                    {node.type !== 'start_trigger' && (
                      <div
                        onClick={(e) => handleHandleClick(e, node.id, 'target')}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#18181b] border-2 border-[#ff4f00] hover:bg-[#ff4f00] hover:scale-125 transition-all flex items-center justify-center cursor-pointer shadow-md z-30"
                        title="Input Handle (Click to connect target)"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                    )}

                    {/* Right Source Handle */}
                    {node.type !== 'end' && (
                      <div
                        onClick={(e) => handleHandleClick(e, node.id, 'source')}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#ff4f00] border-2 border-[#fffefb] hover:scale-125 transition-all flex items-center justify-center cursor-pointer shadow-md z-30"
                        title="Output Handle (Click to draw connection)"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                    )}

                    {/* Node Header */}
                    <div className="p-3.5 flex items-center justify-between border-b border-[#27272a]/60">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${def.bg} border ${def.border} flex items-center justify-center text-sm shadow-inner`}>
                          {def.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white tracking-tight leading-tight">
                            {node.label}
                          </h4>
                          <span className={`text-[10px] font-semibold ${def.text}`}>
                            {def.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                        className="text-[#71717a] hover:text-red-400 text-xs px-1.5 py-0.5 rounded hover:bg-[#18181b] transition"
                        title="Delete node"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Node Body Information Preview */}
                    <div className="p-3 text-[11px] text-[#a1a1aa] flex flex-col gap-1.5 bg-[#0d0d0f]/50 rounded-b-2xl">
                      {node.type === 'schedule_trigger' && (
                        <div className="flex justify-between items-center">
                          <span>Interval:</span>
                          <span className="font-mono text-cyan-400 font-bold">{node.data?.interval || 10}s</span>
                        </div>
                      )}
                      {node.type === 'openai' && (
                        <div className="flex justify-between items-center">
                          <span>Model:</span>
                          <span className="font-mono text-emerald-400 font-bold">{node.data?.model || 'gpt-4o'}</span>
                        </div>
                      )}
                      {node.type === 'gemini' && (
                        <div className="flex justify-between items-center">
                          <span>Engine:</span>
                          <span className="font-mono text-blue-400 font-bold">{node.data?.model || 'gemini-2.0'}</span>
                        </div>
                      )}
                      {node.type === 'ifelse' && (
                        <div className="flex justify-between items-center">
                          <span>Score Gate:</span>
                          <span className="font-mono text-amber-400 font-bold">&gt;= {node.data?.threshold || 75}</span>
                        </div>
                      )}
                      {node.type === 'delay' && (
                        <div className="flex justify-between items-center">
                          <span>Wait:</span>
                          <span className="font-mono text-yellow-400 font-bold">{node.data?.duration || 3}s</span>
                        </div>
                      )}
                      {node.type === 'whatsapp' && (
                        <div className="truncate">
                          <span className="text-[10px] text-[#71717a] block">Target Phone:</span>
                          <span className="font-mono text-green-400 text-[10px]">{node.data?.phone || '+1 555-019-2834'}</span>
                        </div>
                      )}
                      {node.type === 'simulated_email' && (
                        <div className="truncate">
                          <span className="text-[10px] text-[#71717a] block">Recipient:</span>
                          <span className="font-mono text-sky-400 text-[10px]">{node.data?.to || 'ops@neuronflow.ai'}</span>
                        </div>
                      )}

                      {/* Node Status Indicator */}
                      <div className="mt-1 pt-1.5 border-t border-[#27272a] flex items-center justify-between text-[10px]">
                        <span className="text-[#71717a]">Status:</span>
                        <span className={`font-semibold ${isActive ? 'text-[#ff4f00] animate-pulse' : 'text-[#a1a1aa]'}`}>
                          {isActive ? '● Running...' : 'Idle'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Right Inspector & Execution Log Sidebar */}
          <aside className="w-full lg:w-80 bg-[#121215] border-t lg:border-t-0 lg:border-l border-[#27272a] p-4 flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[350px] lg:max-h-none">
            {selectedNode ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa] block">
                      Node Inspector
                    </span>
                    <h3 className="text-sm font-bold text-white">{selectedNode.label}</h3>
                  </div>
                  <span className="text-[10px] bg-[#18181b] text-white px-2 py-1 rounded border border-[#27272a] font-mono">
                    {selectedNode.id}
                  </span>
                </div>

                {/* Node Label Editor */}
                <div>
                  <label className="text-[11px] text-[#a1a1aa] font-semibold block mb-1">Node Title Label</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => updateSelectedNodeLabel(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#ff4f00] text-white text-xs rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                {/* Type-Specific Property Controls */}
                {selectedNode.type === 'schedule_trigger' && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#a1a1aa] font-semibold">Interval (Seconds)</span>
                      <span className="font-mono text-cyan-400">{selectedNode.data?.interval || 10}s</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="120"
                      value={selectedNode.data?.interval || 10}
                      onChange={(e) => updateSelectedNodeData('interval', parseInt(e.target.value))}
                      className="w-full accent-[#ff4f00]"
                    />
                  </div>
                )}

                {selectedNode.type === 'delay' && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#a1a1aa] font-semibold">Pause Duration (Seconds)</span>
                      <span className="font-mono text-yellow-400">{selectedNode.data?.duration || 3}s</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={selectedNode.data?.duration || 3}
                      onChange={(e) => updateSelectedNodeData('duration', parseInt(e.target.value))}
                      className="w-full accent-[#ff4f00]"
                    />
                  </div>
                )}

                {selectedNode.type === 'ifelse' && (
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#a1a1aa] font-semibold">Score Threshold Gate</span>
                      <span className="font-mono text-amber-400">&gt;= {selectedNode.data?.threshold || 75}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={selectedNode.data?.threshold || 75}
                      onChange={(e) => updateSelectedNodeData('threshold', parseInt(e.target.value))}
                      className="w-full accent-[#ff4f00]"
                    />
                  </div>
                )}

                {selectedNode.type === 'openai' && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[11px] text-[#a1a1aa] font-semibold block mb-1">Model Selection</label>
                      <select
                        value={selectedNode.data?.model || 'gpt-4o'}
                        onChange={(e) => updateSelectedNodeData('model', e.target.value)}
                        className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg px-2.5 py-2 outline-none"
                      >
                        <option value="gpt-4o">GPT-4o (Omni Engine)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (High Speed)</option>
                        <option value="o1-preview">o1-Preview (Deep Reasoning)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#a1a1aa] font-semibold block mb-1">System Instructions</label>
                      <textarea
                        rows={3}
                        value={selectedNode.data?.systemPrompt || 'Analyze buyer intent and score 1-100.'}
                        onChange={(e) => updateSelectedNodeData('systemPrompt', e.target.value)}
                        className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg p-2.5 outline-none resize-none font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {selectedNode.type === 'whatsapp' && (
                  <div>
                    <label className="text-[11px] text-[#a1a1aa] font-semibold block mb-1">Phone Number (E.164)</label>
                    <input
                      type="text"
                      value={selectedNode.data?.phone || '+1 555-019-2834'}
                      onChange={(e) => updateSelectedNodeData('phone', e.target.value)}
                      className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg px-3 py-2 outline-none font-mono"
                    />
                  </div>
                )}

                {selectedNode.type === 'simulated_email' && (
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <label className="text-[11px] text-[#a1a1aa] font-semibold block mb-1">Recipient Email</label>
                      <input
                        type="email"
                        value={selectedNode.data?.to || 'ops@neuronflow.ai'}
                        onChange={(e) => updateSelectedNodeData('to', e.target.value)}
                        className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#a1a1aa] font-semibold block mb-1">Subject Line</label>
                      <input
                        type="text"
                        value={selectedNode.data?.subject || 'Alert: Workflow Event Notification'}
                        onChange={(e) => updateSelectedNodeData('subject', e.target.value)}
                        className="w-full bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-[#71717a] border border-dashed border-[#27272a] rounded-xl my-auto">
                <span className="text-2xl mb-2">🖱️</span>
                <p className="text-xs font-semibold text-[#a1a1aa]">No Node Selected</p>
                <p className="text-[11px] mt-1">Click any node on canvas to customize its parameters and properties.</p>
              </div>
            )}

            {/* Live Execution Trace Logs */}
            <div className="mt-auto border-t border-[#27272a] pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1aa]">Execution Trace Logs</span>
                <button
                  onClick={() => setExecutionLogs([])}
                  className="text-[10px] text-[#71717a] hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div
                ref={logContainerRef}
                className="bg-[#09090b] border border-[#27272a] rounded-xl p-2.5 h-44 overflow-y-auto font-mono text-[10px] flex flex-col gap-1.5"
              >
                {executionLogs.length === 0 ? (
                  <div className="text-[#71717a] text-center my-auto">
                    Press &quot;Run Flow&quot; to test graph execution.
                  </div>
                ) : (
                  executionLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded border ${
                        log.type === 'start' || log.type === 'finish'
                          ? 'bg-[#ff4f00]/10 border-[#ff4f00]/30 text-[#ff4f00]'
                          : log.type === 'success'
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                          : log.type === 'error'
                          ? 'bg-red-950/40 border-red-500/30 text-red-300'
                          : 'bg-[#141417] border-[#27272a] text-[#a1a1aa]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[9px] opacity-75">
                        <span>[{log.time}]</span>
                        <span className="font-bold">{log.nodeLabel}</span>
                      </div>
                      <div className="mt-0.5">{log.message}</div>
                      {log.output && (
                        <pre className="mt-1 p-1 bg-black/50 rounded text-[9px] overflow-x-auto text-emerald-400">
                          {log.output}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Toast Floating Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] border border-[#ff4f00] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="text-[#ff4f00]">⚡</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </>
  );
}
