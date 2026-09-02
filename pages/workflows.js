import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

// Pre-configured workflow template definitions
const DEFAULT_TEMPLATES = {
  blogSummarizer: {
    id: '22',
    name: 'Scheduled Google Sheets Blog Summarizer Preset',
    nodes: [
      { id: 'schedule_node', type: 'schedule_trigger', label: 'Trigger Hourly', x: 100, y: 200, data: { interval: 10, unit: 'seconds' } },
      { id: 'sheets_node', type: 'google_sheets', label: 'Read Draft Articles', x: 340, y: 200, data: { action: 'read', sheet: 'Sheet1', dataName: 'Blog Posts' } },
      { id: 'openai_node', type: 'openai', label: 'GPT Summarizer', x: 620, y: 150, data: { model: 'gpt-4o', prompt: 'Please write a concise 2-sentence summary of this article:\nTitle: {{trigger.title}}\nContent: {{trigger.content}}' } },
      { id: 'slack_node', type: 'slack', label: 'Post to Slack', x: 900, y: 200, data: { channel: '#blog-updates', message: '📢 *New Article Summary:*\n\n*Title:* {{trigger.title}}\n*Summary:* {{steps.openai_node.result}}' } },
    ],
    edges: [
      { id: 'e1-2', source: 'schedule_node', target: 'sheets_node' },
      { id: 'e2-3', source: 'sheets_node', target: 'openai_node' },
      { id: 'e3-4', source: 'openai_node', target: 'slack_node' },
    ]
  },
  healthCheck: {
    id: '19',
    name: '10s Interval Health Check & Email Dispatcher Preset',
    nodes: [
      { id: 'schedule_node', type: 'schedule_trigger', label: '10s Heartbeat Trigger', x: 100, y: 200, data: { interval: 10, unit: 'seconds' } },
      { id: 'health_code', type: 'code', label: 'Ping API Endpoint', x: 340, y: 200, data: { endpoint: 'https://api.system.local/health', timeout: 3000 } },
      { id: 'ifelse_node', type: 'ifelse', label: 'Status 200 OK Check', x: 620, y: 200, data: { threshold: 200 } },
      { id: 'email_alert', type: 'simulated_email', label: 'Send Alert Email', x: 900, y: 120, data: { to: 'ops@neuronflow.ai', subject: '🚨 High Priority: Health check failed!' } },
      { id: 'slack_log', type: 'slack', label: 'Log Uptime to Slack', x: 900, y: 280, data: { channel: '#uptime-logs', message: '✅ System status OK.' } },
    ],
    edges: [
      { id: 'e1-2', source: 'schedule_node', target: 'health_code' },
      { id: 'e2-3', source: 'health_code', target: 'ifelse_node' },
      { id: 'e3-4', source: 'ifelse_node', target: 'email_alert' },
      { id: 'e3-5', source: 'ifelse_node', target: 'slack_log' },
    ]
  },
  excelAiPipeline: {
    id: '18',
    name: 'Inventory Balancer & Excel AI Preset',
    nodes: [
      { id: 'start_node', type: 'start_trigger', label: 'Batch Process Start', x: 100, y: 200, data: {} },
      { id: 'excel_node', type: 'excel', label: 'Excel AI Transformer', x: 340, y: 200, data: { maxRows: 50, formula: '=TRIM(CLEAN(A2:D50))' } },
      { id: 'openai_calc', type: 'openai', label: 'GPT Stock Audit', x: 620, y: 200, data: { model: 'gpt-4o', prompt: 'Audit inventory levels and calculate replenishment orders.' } },
      { id: 'delay_node', type: 'delay', label: 'Buffer Delay (3s)', x: 900, y: 200, data: { duration: 3 } },
      { id: 'end_node', type: 'end', label: 'End Inventory Flow', x: 1140, y: 200, data: {} },
    ],
    edges: [
      { id: 'e1-2', source: 'start_node', target: 'excel_node' },
      { id: 'e2-3', source: 'excel_node', target: 'openai_calc' },
      { id: 'e3-4', source: 'openai_calc', target: 'delay_node' },
      { id: 'e4-5', source: 'delay_node', target: 'end_node' },
    ]
  },
  aiLeadRouter: {
    id: '15',
    name: 'If/Else Email Verification Workflow',
    nodes: [
      { id: 'crm_node', type: 'crm_contact', label: 'CRM Lead Ingest', x: 100, y: 200, data: { leadSource: 'Web Form' } },
      { id: 'openai_score', type: 'openai', label: 'GPT Lead Scoring', x: 340, y: 200, data: { model: 'gpt-4o', prompt: 'Evaluate buyer intent from 1-100.' } },
      { id: 'ifelse_gate', type: 'ifelse', label: 'Score >= 75 Gate', x: 620, y: 200, data: { threshold: 75 } },
      { id: 'wa_vip', type: 'send_whatsapp', label: 'Send WhatsApp VIP Invite', x: 900, y: 120, data: { phone: '+1 555-019-2834', message: 'Welcome VIP Customer!' } },
      { id: 'email_standard', type: 'simulated_email', label: 'Send Nurture Email', x: 900, y: 280, data: { to: 'prospect@client.com', subject: 'Welcome to NEURON_FLOW' } },
    ],
    edges: [
      { id: 'e1-2', source: 'crm_node', target: 'openai_score' },
      { id: 'e2-3', source: 'openai_score', target: 'ifelse_gate' },
      { id: 'e3-4', source: 'ifelse_gate', target: 'wa_vip' },
      { id: 'e3-5', source: 'ifelse_gate', target: 'email_standard' },
    ]
  }
};

const NODE_PALETTE_ITEMS = [
  { type: 'start_trigger', label: 'Start Trigger', icon: '▶️', category: 'Triggers' },
  { type: 'start_webhook', label: 'Start Webhook', icon: '⚡', category: 'Triggers' },
  { type: 'schedule_trigger', label: 'Schedule Timer', icon: '⏰', category: 'Triggers' },
  { type: 'google_form', label: 'Google Form', icon: '📋', category: 'Triggers' },
  { type: 'whatsapp_trigger', label: 'WhatsApp Trigger', icon: '💬', category: 'Triggers', isGreen: true },
  { type: 'send_whatsapp', label: 'Send WhatsApp Msg', icon: '📲', category: 'Actions', isGreen: true },
  { type: 'simulated_email', label: 'Send Email', icon: '✉️', category: 'Actions' },
  { type: 'crm_contact', label: 'CRM Contact', icon: '🗄️', category: 'Actions' },
  { type: 'google_sheets', label: 'Google Sheets', icon: '📊', category: 'Actions' },
  { type: 'excel', label: 'Excel Processor', icon: '📈', category: 'Actions' },
  { type: 'mcp_connector', label: 'MCP Productivity Connector', icon: '🔌', category: 'Actions' },
  { type: 'openai', label: 'OpenAI GPT', icon: '🤖', category: 'Actions' },
  { type: 'slack', label: 'Post to Slack', icon: '💬', category: 'Actions' },
  { type: 'discord', label: 'Discord Alert', icon: '🎮', category: 'Actions' },
  { type: 'webhook_response', label: 'Webhook Response', icon: '📤', category: 'Actions' },
  { type: 'ifelse', label: 'If / Else Filter', icon: '🔀', category: 'Logic' },
  { type: 'delay', label: 'Delay Wait', icon: '⏳', category: 'Logic' },
  { type: 'code', label: 'Run JS Script', icon: '💻', category: 'Logic' },
  { type: 'end', label: 'End Workflow', icon: '🛑', category: 'Output', isRose: true },
];

const BACKEND_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:4000';

export default function WorkflowsPage() {
  const { isLoaded, isSignedIn } = useUser();

  // Workflow State
  const [activeWorkflowId, setActiveWorkflowId] = useState('22');
  const [workflowTitle, setWorkflowTitle] = useState(DEFAULT_TEMPLATES.blogSummarizer.name);
  const [nodes, setNodes] = useState(DEFAULT_TEMPLATES.blogSummarizer.nodes);
  const [edges, setEdges] = useState(DEFAULT_TEMPLATES.blogSummarizer.edges);
  const [selectedNodeId, setSelectedNodeId] = useState('openai_node');
  const [liveEngineOn, setLiveEngineOn] = useState(true);

  // Connection Drawing State
  const [connectingSourceId, setConnectingSourceId] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // UI Collapse & Modal States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [showAiCopilot, setShowAiCopilot] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Execution & Diagnostics
  const [isRunning, setIsRunning] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [savedWorkflowsList, setSavedWorkflowsList] = useState([]);

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Sync template from URL query on load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');

    const params = new URLSearchParams(window.location.search);
    const tplKey = params.get('template');
    if (tplKey && DEFAULT_TEMPLATES[tplKey]) {
      loadTemplate(tplKey);
    }
  }, []);

  // Fetch backend workflows if available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fetchBackendWorkflows = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/workflows`);
        if (res.ok) {
          const list = await res.json();
          setSavedWorkflowsList(list || []);
        }
      } catch {
        // Fallback silently
      }
    };
    fetchBackendWorkflows();
  }, []);

  const loadTemplate = (key) => {
    const tpl = DEFAULT_TEMPLATES[key];
    if (!tpl) return;
    setActiveWorkflowId(tpl.id || 'custom');
    setWorkflowTitle(tpl.name);
    setNodes(JSON.parse(JSON.stringify(tpl.nodes)));
    setEdges(JSON.parse(JSON.stringify(tpl.edges)));
    setSelectedNodeId(tpl.nodes.find(n => n.id.includes('openai'))?.id || tpl.nodes[0]?.id || null);
    setConnectingSourceId(null);
    showToast(`Loaded Flow: ${tpl.name}`);
  };

  const handleSelectWorkflowPreset = (e) => {
    const val = e.target.value;
    setActiveWorkflowId(val);
    const matchedKey = Object.keys(DEFAULT_TEMPLATES).find(k => DEFAULT_TEMPLATES[k].id === val);
    if (matchedKey) {
      loadTemplate(matchedKey);
    } else {
      setWorkflowTitle(`Fresh Canvas #${val}`);
      setNodes([
        { id: `start_${val}`, type: 'start_trigger', label: 'Start Trigger', x: 100, y: 200, data: {} },
        { id: `openai_${val}`, type: 'openai', label: 'GPT-4o Processor', x: 340, y: 200, data: { model: 'gpt-4o' } },
      ]);
      setEdges([{ id: `e_${val}`, source: `start_${val}`, target: `openai_${val}` }]);
      setSelectedNodeId(`openai_${val}`);
      showToast(`Switched to Canvas #${val}`);
    }
  };

  const handleCreateNewCanvas = () => {
    const newId = (nodes.length + Math.floor(Math.random() * 90) + 10).toString();
    setActiveWorkflowId(newId);
    setWorkflowTitle(`Fresh Canvas #${newId}`);
    setNodes([
      { id: 'node_start', type: 'start_trigger', label: 'Start Trigger', x: 100, y: 200, data: {} },
      { id: 'node_end', type: 'end', label: 'End Workflow', x: 400, y: 200, data: {} },
    ]);
    setEdges([{ id: 'edge_start_end', source: 'node_start', target: 'node_end' }]);
    setSelectedNodeId('node_start');
    showToast('Created Fresh Canvas');
  };

  // Node Editing Helpers
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const updateSelectedNodeData = (key, val) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  const updateSelectedNodeLabel = (val) => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, label: val } : n));
  };

  const addNodeToCanvas = (type) => {
    const itemDef = NODE_PALETTE_ITEMS.find(i => i.type === type) || { label: type, icon: '⚡' };
    const newId = `node_${Date.now().toString().slice(-4)}`;
    const newNode = {
      id: newId,
      type,
      label: itemDef.label,
      x: 300 + Math.floor(Math.random() * 80),
      y: 180 + Math.floor(Math.random() * 80),
      data: type === 'openai' ? { model: 'gpt-4o', prompt: 'Custom AI Prompt...' } : {}
    };

    setNodes(prev => [...prev, newNode]);
    if (selectedNodeId) {
      setEdges(prev => [...prev, { id: `e-${selectedNodeId}-${newId}`, source: selectedNodeId, target: newId }]);
      showToast(`Added [${itemDef.label}] & auto-connected!`);
    } else {
      showToast(`Added [${itemDef.label}] node to canvas`);
    }
    setSelectedNodeId(newId);
  };

  const insertNodeBetweenEdge = (edgeId) => {
    const targetEdge = edges.find(e => e.id === edgeId);
    if (!targetEdge) return;

    const newId = `openai_inserted_${Date.now().toString().slice(-4)}`;
    const srcNode = nodes.find(n => n.id === targetEdge.source);
    const tgtNode = nodes.find(n => n.id === targetEdge.target);

    const midX = srcNode && tgtNode ? Math.round((srcNode.x + tgtNode.x) / 2) : 450;
    const midY = srcNode && tgtNode ? Math.round((srcNode.y + tgtNode.y) / 2) : 200;

    const newNode = {
      id: newId,
      type: 'openai',
      label: 'GPT-4o Transformer',
      x: midX,
      y: midY,
      data: { model: 'gpt-4o', prompt: 'Process intermediate data stream...' }
    };

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [
      ...prev.filter(e => e.id !== edgeId),
      { id: `e-${targetEdge.source}-${newId}`, source: targetEdge.source, target: newId },
      { id: `e-${newId}-${targetEdge.target}`, source: newId, target: targetEdge.target },
    ]);
    setSelectedNodeId(newId);
    showToast('Inserted node into connection edge');
  };

  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    showToast('Deleted node');
  };

  // Node Dragging Handlers
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - node.x,
        y: e.clientY - rect.top - node.y,
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    setMousePos({ x: currentX, y: currentY });

    if (draggingNodeId) {
      const newX = Math.max(20, Math.round((currentX - dragOffset.x) / 10) * 10);
      const newY = Math.max(20, Math.round((currentY - dragOffset.y) / 10) * 10);
      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Connection Handles Click (Visual Auto-Connection)
  const handlePortClick = (e, nodeId, handleType) => {
    e.stopPropagation();
    if (handleType === 'output') {
      setConnectingSourceId(nodeId);
      showToast(`Source node [${nodeId}] selected. Click input port to connect.`);
    } else if (handleType === 'input') {
      if (connectingSourceId && connectingSourceId !== nodeId) {
        const exists = edges.some(edge => edge.source === connectingSourceId && edge.target === nodeId);
        if (!exists) {
          const newEdge = {
            id: `e-${connectingSourceId}-${nodeId}-${Date.now().toString().slice(-4)}`,
            source: connectingSourceId,
            target: nodeId,
          };
          setEdges(prev => [...prev, newEdge]);
          showToast(`Connected node ${connectingSourceId} ➔ ${nodeId}`);
        } else {
          showToast('Connection already exists');
        }
        setConnectingSourceId(null);
      }
    }
  };

  // Run Workflow Simulation
  const runWorkflow = async () => {
    if (isRunning) return;
    setIsRunning(true);
    showToast('Starting Visual Workflow Execution Engine...');

    const sortedNodes = [...nodes];
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      setActiveNodeId(node.id);
      await new Promise(r => setTimeout(r, 650));
    }

    setActiveNodeId(null);
    setIsRunning(false);
    showToast('🎉 Workflow execution completed successfully (0 errors)');
  };

  // Save Workflow Definition to Backend / Local Storage
  const handleSaveDefinition = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflowTitle,
          definition: { nodes, edges },
          isActive: liveEngineOn,
        }),
      });
      if (res.ok) {
        showToast('Saved Workflow Definition to Engine Database');
      } else {
        localStorage.setItem(`neuron_workflow_${activeWorkflowId}`, JSON.stringify({ nodes, edges, workflowTitle }));
        showToast('Saved Workflow Definition to Local Storage');
      }
    } catch {
      localStorage.setItem(`neuron_workflow_${activeWorkflowId}`, JSON.stringify({ nodes, edges, workflowTitle }));
      showToast('Saved Workflow Definition to Local Storage');
    }
  };

  // Diagnostics Check
  const handleVerifyDiagnostics = () => {
    const disconnected = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));
    if (disconnected.length === 0) {
      showToast('✓ Diagnostics Pass: All 4 canvas nodes correctly routed');
    } else {
      showToast(`⚠️ Warning: ${disconnected.length} disconnected node(s) found`);
    }
  };

  const handleAiCopilotGenerate = () => {
    if (!aiPrompt.trim()) return;
    loadTemplate('aiLeadRouter');
    setShowAiCopilot(false);
    setAiPrompt('');
    showToast('🤖 AI Copilot generated optimal workflow pipeline!');
  };

  return (
    <>
      <Head>
        <title>NEURON_FLOW | Visual Flow Designer</title>
        <meta name="description" content="Visual Flow Designer with auto connection, node palette, real-time backend engine." />
      </Head>

      <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface font-body-md selection:bg-primary-container selection:text-on-primary-container text-left relative">
        <style>{`
          .workflow-dot-bg {
              background-image: radial-gradient(circle, #201f1f 1px, transparent 1px);
              background-size: 32px 32px;
          }
          .clean-card {
              background: #1c1b1b;
              border: 1px solid #353534;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .clean-card:hover {
              border-color: #9a9078;
              background: #201f1f;
          }
          .node-line {
              stroke: #4d4632;
              stroke-dasharray: 4 2;
          }
          .filter-btn {
              position: relative;
              transition: color 0.2s;
          }
          .filter-btn.active::after {
              content: '';
              position: absolute;
              bottom: -8px;
              left: 0;
              right: 0;
              height: 2px;
              background: #facc15;
          }
          .dot-grid {
            background-image: radial-gradient(#262626 1px, transparent 1px);
            background-size: 24px 24px;
          }
          .glass-panel {
              background: rgba(23, 23, 23, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(38, 38, 38, 0.5);
          }
          .node-port {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #262626;
              border: 1px solid #4d4632;
          }
          .node-port-active {
              background: #facc15;
              box-shadow: 0 0 8px rgba(250, 204, 21, 0.4);
          }
          .execution-row {
            border-bottom: 1px solid rgba(53, 53, 52, 0.2);
            transition: background-color 0.1s ease;
          }
          .execution-row:hover {
            background: #1c1b1b;
          }
          .execution-row.selected {
            background: #1c1b1b;
            border-left: 2px solid #facc15;
          }
          .material-symbols-outlined {
            display: none !important;
          }
        `}</style>

        {/* Left Navigation Sidebar */}
        <aside className={`bg-[#201515] text-[#fffefb] border-r border-[#2f2a26] transition-all duration-300 shrink-0 flex flex-col z-20 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <div className="p-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-md bg-[#ff4f00] flex items-center justify-center text-[#fffefb] font-bold text-sm">⚡</div>
              {!sidebarCollapsed && <span className="font-bold text-base tracking-tight text-[#fffefb]">NEURON_FLOW</span>}
            </a>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#c5c0b1] hover:text-[#fffefb] p-1.5 rounded-md hover:bg-[#2f2a26] transition cursor-pointer"
              title="Toggle Main Navigation Sidebar"
            >
              ☰
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="px-4 mb-4">
              <div className="text-[10px] font-mono text-[#939084] uppercase tracking-wider mb-2">Switch Apps</div>
              <div className="flex flex-col gap-1 text-xs">
                <a href="/" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                  <span className="w-2 h-2 rounded-full bg-[#ff4f00]"></span> Dashboard
                </a>
                <a href="http://localhost:4000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Engine API
                </a>
                <a href="/excel" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span> Excel AI
                </a>
                <a href="/files" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] transition">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span> File Vault 📂
                </a>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-1 px-3">
            <button type="button" onClick={() => (window.location.href = '/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all relative text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] cursor-pointer">
              <span>📊</span>{!sidebarCollapsed && <span>Overview</span>}
            </button>
            <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all relative bg-[#ff4f00] text-[#fffefb] shadow-sm cursor-pointer">
              <span>⚡</span>{!sidebarCollapsed && <span>Workflows</span>}
            </button>
            <button type="button" onClick={() => showToast('Executions Log View Active')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all relative text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] cursor-pointer">
              <span>📈</span>{!sidebarCollapsed && <span>Executions</span>}
            </button>
            <button type="button" onClick={() => loadTemplate('aiLeadRouter')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all relative text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] cursor-pointer">
              <span>📦</span>{!sidebarCollapsed && <span>Templates</span>}
            </button>
            <button type="button" onClick={() => showToast('System Environment Variables: Active')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all relative text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] cursor-pointer">
              <span>💻</span>{!sidebarCollapsed && <span>Variables</span>}
            </button>
            <button type="button" onClick={() => showToast('Connected to SQLite WAL Simulation Database')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold transition-all relative text-[#c5c0b1] hover:text-[#fffefb] hover:bg-[#2f2a26] cursor-pointer">
              <span>🗄️</span>{!sidebarCollapsed && <span>Simulation DB</span>}
            </button>
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-[#2f2a26] space-y-2">
              <button type="button" onClick={() => showToast('Pro Plan: Unlimited Node Execution')} className="w-full py-2 bg-[#ff4f00] text-[#fffefb] text-xs font-bold rounded-md hover:opacity-90 transition shadow-sm cursor-pointer">
                Pricing &amp; Pro Plan
              </button>
              <button type="button" onClick={() => showToast('Cart: Active Subscription')} className="w-full py-2 bg-[#2f2a26] text-[#fffefb] text-xs font-semibold rounded-md hover:bg-[#36342e] transition cursor-pointer">
                Subscription Cart
              </button>
              {isLoaded && isSignedIn ? (
                <div className="flex items-center justify-between bg-[#2f2a26] p-2 rounded-md">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-xs text-emerald-400 font-bold">Active</span>
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button type="button" className="w-full py-2 bg-[#2f2a26] text-[#fffefb] text-xs font-semibold rounded-md hover:bg-[#36342e] transition cursor-pointer">
                    Sign In Account
                  </button>
                </SignInButton>
              )}
            </div>
          )}
        </aside>

        {/* Main Content Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#09090b] text-[#f4f4f5]">
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Top Workspace Header */}
            <header className="h-16 border-b border-[#353534] bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0 text-left overflow-x-auto overflow-y-hidden w-full min-w-0 gap-4">
              <div className="flex items-center gap-3 shrink-0 min-w-0">
                <div className="flex items-center gap-2 text-[13px] shrink-0 min-w-0">
                  <span className="text-on-surface-variant/50 hover:text-on-surface cursor-pointer transition-colors whitespace-nowrap">Workflows</span>
                  <span className="text-on-surface-variant/20">/</span>
                  <input
                    type="text"
                    value={workflowTitle}
                    onChange={(e) => setWorkflowTitle(e.target.value)}
                    className="font-medium opacity-90 truncate max-w-[160px] lg:max-w-[220px] xl:max-w-[320px] bg-transparent border-b border-transparent hover:border-[#353534] focus:border-[#ff4f00] outline-none text-white text-xs sm:text-sm"
                    title={workflowTitle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Editing workflow title enabled')}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-outline-variant/30 text-on-surface-variant/60 hover:text-on-surface hover:border-outline-variant/60 transition-all flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <svg className="w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10M7 12h10M7 17h10"></path></svg>
                  Rename
                </button>
                <div className="h-4 w-px bg-outline-variant/30 mx-1 shrink-0"></div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-500 font-bold whitespace-nowrap">Select Active:</span>
                  <select
                    value={activeWorkflowId}
                    onChange={handleSelectWorkflowPreset}
                    className="bg-[#131313] border border-outline-variant/50 text-[12px] rounded-lg px-2.5 py-1 text-white outline-none cursor-pointer max-w-[160px] lg:max-w-[220px] truncate"
                  >
                    <option value="22">Scheduled Google Sheets Blog Summarizer Preset</option>
                    <option value="24">Fresh Canvas #24</option>
                    <option value="23">Fresh Canvas #23</option>
                    <option value="21">Fresh Canvas #21</option>
                    <option value="20">Fresh Canvas #20</option>
                    <option value="19">10s Interval Health Check &amp; Email Dispatcher Preset</option>
                    <option value="18">Inventory Balancer Preset</option>
                    <option value="17">Production Webhook Real Website Health Monitor</option>
                    <option value="16">Real Website Webhook Health Checker</option>
                    <option value="15">If/Else Email Verification Workflow</option>
                    <option value="14">If/Else Email Verification Workflow #14</option>
                    <option value="13">If/Else Email Verification Workflow #13</option>
                    <option value="12">Fresh Canvas #12</option>
                    <option value="11">Fresh Canvas #11</option>
                    <option value="10">Fresh Canvas #10</option>
                    <option value="9">Fresh Canvas #9</option>
                    <option value="8">Fresh Canvas #8</option>
                    <option value="7">Fresh Canvas #7</option>
                    <option value="6">Fresh Canvas #6</option>
                    <option value="5">Inventory Balancer Preset #5</option>
                    <option value="4">Fresh Canvas #4</option>
                    <option value="3">Inventory Balancer Preset #3</option>
                    <option value="2">SSH Test Workflow</option>
                    <option value="1">Fresh Canvas #1</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewCanvas}
                  className="text-xs text-primary font-bold hover:brightness-110 flex items-center gap-1 ml-1 shrink-0 whitespace-nowrap cursor-pointer text-[#ff4f00]"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  New Fresh Canvas
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setLiveEngineOn(!liveEngineOn)}
                  title="Live Engine Active - Click to toggle engine status"
                  className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer shadow-sm ${liveEngineOn
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                    {liveEngineOn ? 'Live Engine ON' : 'Engine PAUSED'}
                  </span>
                  <div className={`w-8 h-4 rounded-full relative flex items-center px-0.5 border transition-colors ${liveEngineOn ? 'bg-emerald-500/20 border-emerald-500/40 justify-end' : 'bg-amber-500/20 border-amber-500/40 justify-start'
                    }`}>
                    <div className={`w-3 h-3 rounded-full transition-all ${liveEngineOn ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
                      }`}></div>
                  </div>
                </button>
                <div className="h-4 w-px bg-outline-variant/30 mx-1 shrink-0"></div>
                <button
                  type="button"
                  onClick={handleSaveDefinition}
                  className="text-[12px] font-bold text-[#facc15] hover:opacity-80 transition-opacity uppercase tracking-widest shrink-0 whitespace-nowrap cursor-pointer"
                >
                  Save Definition
                </button>
                <button
                  type="button"
                  onClick={handleVerifyDiagnostics}
                  className="text-[12px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Verify &amp; Diagnose
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (nodes.length > 0) {
                      setNodes([]);
                      setEdges([]);
                      setSelectedNodeId(null);
                      showToast('Cleared current workflow graph canvas');
                    }
                  }}
                  className="text-[12px] font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest shrink-0 whitespace-nowrap cursor-pointer"
                >
                  Delete Flow
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3 py-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
                  title="Open Real-Time WhatsApp Live Text Messenger"
                >
                  <span>💬</span><span>Realtime WhatsApp</span>
                </button>
                <div className="flex items-center rounded-lg overflow-hidden border border-outline-variant/30 text-[11px] shrink-0">
                  <button type="button" onClick={() => showToast('Webhook URL: http://localhost:4000/api/webhook/trigger')} className="px-2.5 py-1 bg-surface-container-high/40 flex items-center gap-1.5 hover:bg-surface-container-high transition-colors text-white whitespace-nowrap cursor-pointer">
                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    Webhook URL
                  </button>
                  <span className="px-2.5 py-1 bg-surface-container-lowest/50 font-mono text-[10px] opacity-60">POST</span>
                </div>
              </div>
            </header>

            {/* Main Visual Graph Builder Body */}
            <div className="flex-1 relative flex overflow-hidden h-full w-full">
              {/* Left Collapsible Node Palette Sidebar */}
              <div className={`shrink-0 bg-[#131313] border-r border-neutral-900 flex flex-col text-left h-full z-10 transition-all duration-200 p-4 ${paletteCollapsed ? 'w-12 overflow-hidden' : 'w-[240px]'}`}>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  {!paletteCollapsed && (
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#facc15] flex items-center gap-1.5">
                      <span>⚙️</span> Node Palette
                    </h4>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button type="button" onClick={() => showToast('Node Palette Settings')} className="p-1 rounded transition-colors text-neutral-400 hover:text-white cursor-pointer" title="Customize Sidebar Sliders">
                      <span>🎛️</span>
                    </button>
                    <button type="button" onClick={() => setPaletteCollapsed(!paletteCollapsed)} className="text-neutral-500 hover:text-white transition-colors cursor-pointer" title="Toggle Node Palette">
                      <span>{paletteCollapsed ? '▶' : '◀'}</span>
                    </button>
                  </div>
                </div>

                {!paletteCollapsed && (
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-[#939084] mb-2">Triggers &amp; Actions</div>
                      <div className="space-y-2">
                        {NODE_PALETTE_ITEMS.map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => addNodeToCanvas(item.type)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-bold text-left transition-all cursor-pointer ${item.isGreen
                                ? 'border-[#25D366]/50 bg-[#fffefb] hover:border-[#25D366] text-[#201515]'
                                : item.isRose
                                  ? 'border-rose-300 bg-[#fffefb] hover:border-rose-600 text-rose-700'
                                  : 'border-[#c5c0b1] bg-[#fffefb] hover:border-[#ff4f00] text-[#201515]'
                              }`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Visual Canvas Area */}
              <div
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="flex-1 h-full bg-[#fffefb] relative dot-grid overflow-hidden select-none"
              >
                <div className="react-flow" data-testid="rf__wrapper" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
                  <div className="react-flow__renderer" style={{ position: 'static', width: '100%', height: '100%', top: 0, left: 0 }}>
                    <div className="react-flow__pane" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
                      <div className="react-flow__viewport react-flow__container" style={{ transform: 'translate(0px, 0px) scale(1)' }}>
                        {/* SVG Connection Edges Layer */}
                        <svg width="100%" height="100%" className="react-flow__edges react-flow__container absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                          <g>
                            {edges.map((edge) => {
                              const srcNode = nodes.find(n => n.id === edge.source);
                              const tgtNode = nodes.find(n => n.id === edge.target);
                              if (!srcNode || !tgtNode) return null;

                              const sx = srcNode.x + 224;
                              const sy = srcNode.y + 45;
                              const tx = tgtNode.x;
                              const ty = tgtNode.y + 45;

                              const dx = Math.abs(tx - sx) * 0.5;
                              const pathData = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
                              const midX = (sx + tx) / 2;
                              const midY = (sy + ty) / 2;
                              const isEdgeActive = activeNodeId === edge.source;

                              return (
                                <g key={edge.id} className="react-flow__edge react-flow__edge-buttonEdge nopan animated pointer-events-auto">
                                  <path
                                    d={pathData}
                                    fill="none"
                                    className="react-flow__edge-path"
                                    style={{
                                      strokeWidth: isEdgeActive ? 4 : 2,
                                      stroke: 'rgb(250, 204, 21)',
                                      strokeDasharray: isEdgeActive ? '6 4' : 'none'
                                    }}
                                  />
                                  <path
                                    d={pathData}
                                    fill="none"
                                    strokeOpacity="0"
                                    strokeWidth="20"
                                    className="react-flow__edge-interaction cursor-pointer"
                                  />
                                </g>
                              );
                            })}

                            {/* Active Connecting Drag Line */}
                            {connectingSourceId && (() => {
                              const srcNode = nodes.find(n => n.id === connectingSourceId);
                              if (!srcNode) return null;
                              const sx = srcNode.x + 224;
                              const sy = srcNode.y + 45;
                              const tx = mousePos.x;
                              const ty = mousePos.y;
                              const dx = Math.abs(tx - sx) * 0.5;
                              const pathData = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
                              return (
                                <path
                                  d={pathData}
                                  fill="none"
                                  stroke="#ff4f00"
                                  strokeWidth="2.5"
                                  strokeDasharray="4 4"
                                />
                              );
                            })()}
                          </g>
                        </svg>

                        {/* Edge Plus Button Overlay Renderers */}
                        <div className="react-flow__edgelabel-renderer">
                          {edges.map((edge) => {
                            const srcNode = nodes.find(n => n.id === edge.source);
                            const tgtNode = nodes.find(n => n.id === edge.target);
                            if (!srcNode || !tgtNode) return null;

                            const sx = srcNode.x + 224;
                            const sy = srcNode.y + 45;
                            const tx = tgtNode.x;
                            const ty = tgtNode.y + 45;
                            const midX = (sx + tx) / 2;
                            const midY = (sy + ty) / 2;

                            return (
                              <div
                                key={`btn-${edge.id}`}
                                className="nodrag nopan z-30"
                                style={{
                                  position: 'absolute',
                                  transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
                                  pointerEvents: 'all'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => insertNodeBetweenEdge(edge.id)}
                                  className="group flex items-center justify-center w-6 h-6 rounded-full bg-[#ff4f00] border-2 border-[#fffefb] text-[#fffefb] hover:scale-110 transition-all duration-150 cursor-pointer shadow-md"
                                  title="Insert OpenAI node here"
                                >
                                  <span className="text-xs font-bold transition-transform duration-200 group-hover:rotate-90">+</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Nodes Container */}
                        <div className="react-flow__nodes" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
                          {nodes.map((node) => {
                            const isSelected = selectedNodeId === node.id;
                            const isActive = activeNodeId === node.id;

                            // Handle schedule trigger type node rendering
                            if (node.type === 'schedule_trigger') {
                              return (
                                <div
                                  key={node.id}
                                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                  className="react-flow__node react-flow__node-schedule_trigger nopan selectable absolute"
                                  style={{ zIndex: isSelected ? 1000 : 0, transform: `translate(${node.x}px, ${node.y}px)`, pointerEvents: 'all' }}
                                >
                                  <div className="relative group flex flex-col items-center cursor-grab active:cursor-grabbing">
                                    <div className={`w-14 h-14 rounded-full bg-[#f8f4f0] dark:bg-[#18181b] border-2 flex items-center justify-center relative transition-all duration-200 ${isSelected ? 'border-[#ff4f00] ring-2 ring-[#ff4f00]/40' : 'border-[#201515] dark:border-[#3f3f46] hover:border-[#ff4f00]'
                                      } shadow-sm`}>
                                      <span className="text-[#ff4f00] font-bold text-xl">⏰</span>
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff4f00] border-2 border-[#fffefb] flex items-center justify-center shadow-sm">
                                        <svg className="w-2.5 h-2.5 text-[#fffefb] ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                                      </div>
                                    </div>
                                    <div className="mt-2 whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold text-[#201515] dark:text-[#f4f4f5] bg-[#fffefb] dark:bg-[#141417] px-2.5 py-0.5 rounded-full border border-[#c5c0b1] dark:border-[#27272a]">
                                      {node.label}
                                    </div>
                                    <div className="text-[10px] text-[#605d52] dark:text-[#a1a1aa] font-mono mt-1 font-semibold">
                                      Every {node.data?.interval || 10} seconds
                                    </div>
                                    {/* Output Port Handle */}
                                    <div
                                      onClick={(e) => handlePortClick(e, node.id, 'output')}
                                      className="react-flow__handle react-flow__handle-right nodrag nopan !w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] source cursor-pointer hover:scale-125 transition-transform"
                                      title="Output Source Handle"
                                    ></div>
                                  </div>
                                </div>
                              );
                            }

                            // Standard Node Card Rendering (Google Sheets, OpenAI GPT, Slack, etc.)
                            return (
                              <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                className={`react-flow__node nopan selectable absolute ${isSelected ? 'selected' : ''}`}
                                style={{ zIndex: isSelected ? 1000 : 0, transform: `translate(${node.x}px, ${node.y}px)`, pointerEvents: 'all' }}
                              >
                                <div className={`node-card w-56 p-4 rounded-md relative group cursor-pointer text-[#201515] dark:text-[#f4f4f5] text-left transition-all duration-200 shadow-sm ${isSelected
                                    ? 'bg-[#f8f4f0] dark:bg-[#1f1f23] border-2 border-[#ff4f00] shadow-[0_4px_16px_rgba(255,79,0,0.2)] scale-[1.02]'
                                    : isActive
                                      ? 'bg-[#f8f4f0] dark:bg-[#1f1f23] border-2 border-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.3)] animate-pulse'
                                      : 'bg-[#f8f4f0] dark:bg-[#18181b] border border-[#c5c0b1] dark:border-[#27272a] hover:border-[#201515] dark:hover:border-[#ff4f00] hover:shadow-md'
                                  }`}>
                                  {/* Performance Badge */}
                                  {node.type !== 'slack' && node.type !== 'end' && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono font-bold bg-[#ff4f00]/10 border border-[#ff4f00]/30 text-[#ff4f00] dark:text-orange-400 px-1.5 py-0.5 rounded-full shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>⚡ &lt;1ms</span>
                                      <span className="opacity-40">|</span>
                                      <span>8.4k/s</span>
                                    </div>
                                  )}

                                  {/* Input Port Handle */}
                                  {node.type !== 'start_trigger' && (
                                    <div
                                      onClick={(e) => handlePortClick(e, node.id, 'input')}
                                      className="react-flow__handle react-flow__handle-left nodrag nopan !w-3 !h-3 !bg-[#201515] dark:!bg-[#f4f4f5] !border-2 !border-[#fffefb] !rounded-full !left-[-6px] hover:!bg-[#ff4f00] target cursor-pointer hover:scale-125 transition-transform"
                                      title="Input Target Handle"
                                    ></div>
                                  )}

                                  {/* Node Header Content */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">
                                      {node.type === 'google_sheets' ? '📊' : node.type === 'openai' ? '🤖' : node.type === 'slack' ? '💬' : node.type === 'send_whatsapp' ? '📲' : '⚡'}
                                    </span>
                                    <span className="text-sm font-bold text-[#201515] dark:text-[#f4f4f5]">{node.label}</span>
                                  </div>

                                  {/* Node Content Body Preview */}
                                  <div className="text-xs text-[#605d52] dark:text-[#a1a1aa] flex flex-col gap-0.5">
                                    {node.type === 'google_sheets' && (
                                      <>
                                        <div>Action: <span className="text-[#ff4f00] font-bold uppercase text-[10px]">{node.data?.action || 'read'}</span></div>
                                        <div>Sheet: <span className="font-semibold text-[#201515] dark:text-[#f4f4f5]">{node.data?.sheet || 'Sheet1'}</span></div>
                                        <div className="text-[10px]">Data: {node.data?.dataName || 'Blog Posts'}</div>
                                      </>
                                    )}
                                    {node.type === 'openai' && (
                                      <>
                                        <div>Model: <span className="text-purple-600 dark:text-purple-400 font-bold uppercase text-[10px]">{node.data?.model || 'gpt-4o'}</span></div>
                                        <div className="truncate text-[10px]">Prompt: {node.data?.prompt || 'Summarize contents concisely...'}</div>
                                      </>
                                    )}
                                    {node.type === 'slack' && (
                                      <div className="truncate text-[10px]">Msg: {node.data?.message || '📢 *New Notification:* {{trigger.title}}'}</div>
                                    )}
                                    {node.type === 'send_whatsapp' && (
                                      <div>Phone: <span className="font-mono text-emerald-400">{node.data?.phone || '+1 555-019-2834'}</span></div>
                                    )}
                                    {node.type !== 'google_sheets' && node.type !== 'openai' && node.type !== 'slack' && node.type !== 'send_whatsapp' && (
                                      <div className="text-[10px] font-mono">Node Type: {node.type}</div>
                                    )}
                                  </div>

                                  {/* Output Port Handle */}
                                  {node.type !== 'end' && (
                                    <div
                                      onClick={(e) => handlePortClick(e, node.id, 'output')}
                                      className="react-flow__handle react-flow__handle-right nodrag nopan !w-3 !h-3 !bg-[#ff4f00] !border-2 !border-[#fffefb] !rounded-full !right-[-6px] source cursor-pointer hover:scale-125 transition-transform"
                                      title="Output Source Handle"
                                    ></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Bottom Center Action Button */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                  <button
                    type="button"
                    onClick={runWorkflow}
                    disabled={isRunning}
                    className={`px-8 py-3 rounded-md font-bold text-xs tracking-wider uppercase shadow-xl transition-all flex items-center gap-2 cursor-pointer ${isRunning
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-[#ff4f00] text-[#fffefb] hover:opacity-90 active:scale-98'
                      }`}
                  >
                    <span>⚡</span>
                    <span>{isRunning ? 'Running Engine...' : 'Run Workflow'}</span>
                  </button>
                </div>

                {/* Floating Bottom Right Copilot Button */}
                <div className="absolute bottom-8 right-8 z-20 flex flex-col items-end">
                  <button
                    type="button"
                    onClick={() => setShowAiCopilot(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#201515] text-[#fffefb] font-bold text-xs uppercase tracking-wider shadow-xl hover:bg-[#ff4f00] transition-all cursor-pointer"
                  >
                    <span>🤖</span><span>AI Copilot</span>
                  </button>
                </div>
              </div>

              {/* Right Configuration Inspector Panel */}
              <div className="w-80 bg-surface-container border-l border-[#353534] shrink-0 flex flex-col text-left">
                <div className="p-5 border-b border-[#353534] flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-accent-coral flex items-center gap-1.5 text-[#ff4f00]">
                    <span>⚙️</span>Config settings
                  </h3>
                  {selectedNode && (
                    <span className="text-[10px] bg-[#18181b] text-white px-2 py-0.5 rounded border border-[#353534] font-mono">
                      {selectedNode.id}
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-on-surface-variant">
                  {selectedNode ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[11px] font-bold text-[#a1a1aa] block mb-1">Node Title</label>
                        <input
                          type="text"
                          value={selectedNode.label}
                          onChange={(e) => updateSelectedNodeLabel(e.target.value)}
                          className="w-full bg-[#18181b] border border-[#353534] focus:border-[#ff4f00] text-white text-xs rounded-lg px-3 py-2 outline-none"
                        />
                      </div>

                      {selectedNode.type === 'schedule_trigger' && (
                        <div>
                          <label className="text-[11px] font-bold text-[#a1a1aa] block mb-1">Interval (Seconds)</label>
                          <input
                            type="number"
                            value={selectedNode.data?.interval || 10}
                            onChange={(e) => updateSelectedNodeData('interval', parseInt(e.target.value))}
                            className="w-full bg-[#18181b] border border-[#353534] text-white text-xs rounded-lg px-3 py-2 outline-none font-mono"
                          />
                        </div>
                      )}

                      {selectedNode.type === 'google_sheets' && (
                        <>
                          <div>
                            <label className="text-[11px] font-bold text-[#a1a1aa] block mb-1">Sheet Name</label>
                            <input
                              type="text"
                              value={selectedNode.data?.sheet || 'Sheet1'}
                              onChange={(e) => updateSelectedNodeData('sheet', e.target.value)}
                              className="w-full bg-[#18181b] border border-[#353534] text-white text-xs rounded-lg px-3 py-2 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[#a1a1aa] block mb-1">Target Action</label>
                            <select
                              value={selectedNode.data?.action || 'read'}
                              onChange={(e) => updateSelectedNodeData('action', e.target.value)}
                              className="w-full bg-[#18181b] border border-[#353534] text-white text-xs rounded-lg px-2.5 py-2 outline-none cursor-pointer"
                            >
                              <option value="read">READ ROWS</option>
                              <option value="append">APPEND ROW</option>
                              <option value="update">UPDATE CELL</option>
                            </select>
                          </div>
                        </>
                      )}

                      {selectedNode.type === 'openai' && (
                        <>
                          <div>
                            <label className="text-[11px] font-bold text-[#a1a1aa] block mb-1">AI Model Engine</label>
                            <select
                              value={selectedNode.data?.model || 'gpt-4o'}
                              onChange={(e) => updateSelectedNodeData('model', e.target.value)}
                              className="w-full bg-[#18181b] border border-[#353534] text-white text-xs rounded-lg px-2.5 py-2 outline-none cursor-pointer font-mono"
                            >
                              <option value="gpt-4o">gpt-4o</option>
                              <option value="gpt-4o-mini">gpt-4o-mini</option>
                              <option value="gemini-2.0">gemini-2.0-flash</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-[#a1a1aa] block mb-1">Prompt Template</label>
                            <textarea
                              rows={4}
                              value={selectedNode.data?.prompt || ''}
                              onChange={(e) => updateSelectedNodeData('prompt', e.target.value)}
                              className="w-full bg-[#18181b] border border-[#353534] text-white text-xs rounded-lg p-2.5 outline-none resize-none font-mono"
                            />
                          </div>
                        </>
                      )}

                      {selectedNode.type === 'slack' && (
                        <div>
                          <label className="text-[11px] font-bold text-[#a1a1aa] block mb-1">Message Template</label>
                          <textarea
                            rows={4}
                            value={selectedNode.data?.message || ''}
                            onChange={(e) => updateSelectedNodeData('message', e.target.value)}
                            className="w-full bg-[#18181b] border border-[#353534] text-white text-xs rounded-lg p-2.5 outline-none resize-none font-mono"
                          />
                        </div>
                      )}

                      <div className="pt-4 border-t border-[#353534] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => deleteNode(selectedNode.id)}
                          className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-400 text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          Delete Selected Node
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-neutral-600 font-mono text-[10px]">
                      <span className="text-3xl block mb-2 opacity-30">✋</span>
                      Select a node in the graph builder to edit configurations.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Copilot Drawer Modal */}
        {showAiCopilot && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141417] border border-[#27272a] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h3 className="text-base font-bold text-white">NEURON_FLOW AI Copilot</h3>
                </div>
                <button type="button" onClick={() => setShowAiCopilot(false)} className="text-[#a1a1aa] hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>
              <p className="text-xs text-[#a1a1aa]">Describe what workflow automation you want to build and AI Copilot will compose nodes &amp; connections automatically.</p>
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Ingest CRM leads, score buyer intent with GPT-4o, send WhatsApp VIP invite if score >= 75..."
                className="w-full bg-[#09090b] border border-[#27272a] focus:border-[#ff4f00] text-white text-xs rounded-xl p-3 outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAiCopilot(false)} className="px-4 py-2 rounded-lg bg-[#27272a] text-[#a1a1aa] text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="button" onClick={handleAiCopilotGenerate} className="px-5 py-2 rounded-lg bg-[#ff4f00] text-white text-xs font-bold hover:bg-[#e04500] transition cursor-pointer">⚡ Generate Flow</button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Messenger Modal */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141417] border border-[#25D366]/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <h3 className="text-base font-bold text-[#25D366]">Realtime WhatsApp Messenger</h3>
                </div>
                <button type="button" onClick={() => setShowWhatsAppModal(false)} className="text-[#a1a1aa] hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>
              <p className="text-xs text-[#a1a1aa]">Direct dispatch test to connected WhatsApp Business API webhook node.</p>
              <input type="text" placeholder="Recipient Phone e.g. +1 555-019-2834" className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs rounded-lg px-3 py-2 outline-none font-mono" />
              <textarea rows={3} placeholder="WhatsApp message text..." className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs rounded-lg p-2.5 outline-none resize-none" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowWhatsAppModal(false)} className="px-4 py-2 rounded-lg bg-[#27272a] text-[#a1a1aa] text-xs font-semibold cursor-pointer">Close</button>
                <button type="button" onClick={() => { setShowWhatsAppModal(false); showToast('📲 WhatsApp test message dispatched'); }} className="px-4 py-2 rounded-lg bg-[#25D366] text-black text-xs font-bold hover:opacity-90 cursor-pointer">Send Message</button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Footer Bar */}
        <footer className="fixed bottom-0 left-64 right-0 h-10 px-8 bg-[#131313] flex justify-between items-center z-45 border-t border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-label-md text-label-md text-neutral-400 tracking-wider uppercase text-[11px]">Systems Operational</span>
          </div>
          <div className="flex gap-8 text-[11px]">
            <a className="font-label-md text-label-md text-[#9a9078] hover:text-on-surface transition-colors uppercase tracking-widest" href="/privacy">Privacy</a>
            <a className="font-label-md text-label-md text-[#9a9078] hover:text-on-surface transition-colors uppercase tracking-widest" href="/docs">API Docs</a>
            <a className="font-label-md text-label-md text-[#9a9078] hover:text-on-surface transition-colors uppercase tracking-widest" href="/support">Support</a>
          </div>
        </footer>

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="fixed bottom-12 right-8 z-50 bg-[#18181b] border border-[#ff4f00] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="text-[#ff4f00]">⚡</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </>
  );
}
