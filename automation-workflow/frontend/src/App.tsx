import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  TriggerNode,
  MarketingNode,
  CRMNode,
  LogicNode,
  DelayNode,
  CodeNode
} from './CustomNode';

const nodeTypes = {
  trigger: TriggerNode,
  marketing_email: MarketingNode,
  crm_action: CRMNode,
  ifelse: LogicNode,
  delay: DelayNode,
  code: CodeNode
};

const BACKEND_URL = 'http://localhost:4000';

export default function App() {
  // Workflow States
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  
  // React Flow States
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // UI Panels / Selections
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'crm' | 'emails'>('logs');
  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);

  // Form Inputs for Mock CRM trigger
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadScore, setNewLeadScore] = useState(60);

  // Fetch all workflows
  const fetchWorkflows = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/workflows`);
      const data = await res.json();
      setWorkflows(data);
      if (data.length > 0 && !currentWorkflow) {
        loadWorkflow(data[0]);
      }
    } catch (e) {
      console.error('Error fetching workflows:', e);
    }
  };

  // Load selected workflow definition into canvas
  const loadWorkflow = (wf: any) => {
    setCurrentWorkflow(wf);
    try {
      const def = JSON.parse(wf.definition);
      setNodes(def.nodes || []);
      setEdges(def.edges || []);
      setSelectedNode(null);
    } catch (e) {
      setNodes([]);
      setEdges([]);
    }
  };

  // Run fetch cycles on mount
  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Poll executions, CRM, and email logs
  const fetchMockData = useCallback(async () => {
    if (!currentWorkflow) return;
    try {
      // 1. Fetch Executions
      const execRes = await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}/executions`);
      const execs = await execRes.json();
      setExecutions(execs);

      // 2. Fetch CRM Database
      const crmRes = await fetch(`${BACKEND_URL}/api/crm/contacts`);
      const contacts = await crmRes.json();
      setCrmContacts(contacts);

      // 3. Fetch Sent Emails
      const emailsRes = await fetch(`${BACKEND_URL}/api/marketing/emails`);
      const emails = await emailsRes.json();
      setSimulatedEmails(emails);
    } catch (e) {
      console.error('Error polling simulation logs:', e);
    }
  }, [currentWorkflow]);

  useEffect(() => {
    fetchMockData();
    const interval = setInterval(fetchMockData, 3000);
    return () => clearInterval(interval);
  }, [fetchMockData]);

  // Connect node sockets
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#facc15' } }, eds)),
    [setEdges]
  );

  // Select node to configure parameters
  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update properties of a node
  const updateNodeData = (field: string, val: any) => {
    if (!selectedNode) return;
    const updated = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        [field]: val
      }
    };
    setSelectedNode(updated);
    setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? updated : n)));
  };

  // Add specific node template to canvas
  const addNode = (type: string) => {
    const id = `${type}_${Date.now()}`;
    let label = '';
    let category = '';
    let extraData = {};

    switch (type) {
      case 'trigger':
        label = 'Webhook Listener';
        extraData = { triggerType: 'webhook' };
        break;
      case 'crm_lead_trigger':
        label = 'CRM New Lead';
        extraData = { triggerType: 'crm' };
        break;
      case 'marketing_email':
        label = 'Welcome Campaign';
        extraData = { to: '{{trigger.email}}', subject: 'Excited to have you!', body: 'Hi {{trigger.name}}, let\'s get started!' };
        break;
      case 'crm_action':
        label = 'Score Nurture';
        extraData = { actionType: 'create_or_update', status: 'contact', scoreChange: '15' };
        break;
      case 'ifelse':
        label = 'Lead Score Check';
        extraData = { condition: 'context.trigger.score > 50' };
        break;
      case 'delay':
        label = 'Wait Timer';
        extraData = { seconds: '5' };
        break;
      case 'code':
        label = 'Enrich Data';
        extraData = { code: 'context.trigger.score += 10;\nreturn context.trigger;' };
        break;
    }

    const newNode = {
      id,
      type,
      position: { x: 300 + Math.random() * 50, y: 150 + Math.random() * 50 },
      data: { label, category, ...extraData }
    };

    setNodes((nds) => nds.concat(newNode));
  };

  // Save changes to DB
  const handleSave = async () => {
    if (!currentWorkflow) return;
    try {
      const definition = { nodes, edges };
      const res = await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentWorkflow.name,
          definition
        })
      });
      await res.json();
      alert('Workflow saved successfully!');
      fetchWorkflows();
    } catch (e) {
      alert('Failed to save workflow');
    }
  };

  // Create new empty workflow
  const handleCreateNew = async () => {
    try {
      const defaultDef = {
        nodes: [
          { id: 't1', type: 'crm_lead_trigger', position: { x: 80, y: 180 }, data: { label: 'CRM Lead Created', triggerType: 'crm' } }
        ],
        edges: []
      };

      const res = await fetch(`${BACKEND_URL}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Flow Engine #${workflows.length + 1}`,
          definition: defaultDef
        })
      });
      const createdWorkflow = await res.json();
      setWorkflows([...workflows, createdWorkflow]);
      loadWorkflow(createdWorkflow);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete current workflow
  const handleDelete = async () => {
    if (!currentWorkflow) return;
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}`, {
        method: 'DELETE'
      });
      const updated = workflows.filter(w => w.id !== currentWorkflow.id);
      setWorkflows(updated);
      if (updated.length > 0) {
        loadWorkflow(updated[0]);
      } else {
        setCurrentWorkflow(null);
        setNodes([]);
        setEdges([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Manual Trigger Execute Workflow
  const handleRunManual = async () => {
    if (!currentWorkflow) return;
    try {
      const testEmail = prompt('Enter trigger email for simulation:', 'jane.doe@example.com');
      if (!testEmail) return;
      
      await fetch(`${BACKEND_URL}/api/workflows/${currentWorkflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          name: 'Jane Doe',
          score: 75
        })
      });
      alert('Execution run triggered!');
      fetchMockData();
    } catch (e) {
      console.error(e);
    }
  };

  // Form Submit for CRM Lead simulation
  const handleCrmLeadTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadEmail) return;
    try {
      await fetch(`${BACKEND_URL}/api/crm/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeadName || 'Simulated Lead',
          email: newLeadEmail,
          status: 'lead',
          score: newLeadScore
        })
      });
      setNewLeadName('');
      setNewLeadEmail('');
      alert('Simulated Lead Created! Active "CRM Lead Trigger" workflows will now execute.');
      fetchMockData();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset database simulation tables
  const handleResetDb = async () => {
    if (!confirm('Clear all mock contacts, execution records, and emails?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/crm/reset`, { method: 'POST' });
      fetchMockData();
      setSelectedExecution(null);
      alert('Database simulation reset successfully.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#131313] text-[#e5e2e1] overflow-hidden select-none font-sans">
      
      {/* Top Header */}
      <header className="flex justify-between items-center h-16 px-6 bg-[#1a1a1a] border-b border-neutral-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#facc15] text-2xl">hub</span>
          <span className="font-bold text-lg tracking-wider text-[#facc15]">NEURON_FLOW</span>
          <span className="text-xs text-neutral-500 font-mono">v2.0 Orchestrator</span>
        </div>

        {/* Workflow Switcher Controls */}
        <div className="flex items-center gap-3">
          <select
            value={currentWorkflow?.id || ''}
            onChange={(e) => {
              const wf = workflows.find(w => w.id === parseInt(e.target.value, 10));
              if (wf) loadWorkflow(wf);
            }}
            className="bg-neutral-800 border border-neutral-700 text-white rounded px-3 py-1.5 text-sm outline-none focus:border-[#facc15]"
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded px-3 py-1.5 text-xs font-semibold border border-neutral-700 transition"
          >
            <span className="material-symbols-outlined text-xs">add</span> New Flow
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 bg-neutral-800 hover:bg-rose-950/40 text-rose-400 rounded px-3 py-1.5 text-xs font-semibold border border-rose-900/30 transition"
          >
            <span className="material-symbols-outlined text-xs">delete</span> Delete
          </button>
        </div>

        {/* Save & Run Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDb}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded text-xs font-bold border border-neutral-700 transition"
          >
            Reset Simulation
          </button>
          <button
            onClick={handleSave}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded text-xs font-bold border border-neutral-700 transition"
          >
            Save Flow
          </button>
          <button
            onClick={handleRunManual}
            className="bg-[#facc15] hover:opacity-90 text-black px-5 py-2 rounded text-xs font-bold transition flex items-center gap-1 shadow-md shadow-amber-500/10"
          >
            <span className="material-symbols-outlined text-sm font-bold">play_arrow</span> Run Flow
          </button>
        </div>
      </header>

      {/* Main Builder & Settings Grid */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side: Drag Palette */}
        <div className="w-56 bg-[#1a1a1a] border-r border-neutral-800 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Triggers</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => addNode('trigger')}
                className="flex items-center gap-2 p-2 rounded bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 text-xs font-bold transition text-left"
              >
                <span className="material-symbols-outlined text-sm">bolt</span> Webhook Trigger
              </button>
              <button
                onClick={() => addNode('crm_lead_trigger')}
                className="flex items-center gap-2 p-2 rounded bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 text-xs font-bold transition text-left"
              >
                <span className="material-symbols-outlined text-sm">group_add</span> CRM Lead Created
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Actions</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => addNode('marketing_email')}
                className="flex items-center gap-2 p-2 rounded bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 border border-sky-900/30 text-xs font-bold transition text-left"
              >
                <span className="material-symbols-outlined text-sm">mail</span> Send Email
              </button>
              <button
                onClick={() => addNode('crm_action')}
                className="flex items-center gap-2 p-2 rounded bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 text-xs font-bold transition text-left"
              >
                <span className="material-symbols-outlined text-sm">account_circle</span> CRM Update
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Logic & Timing</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => addNode('ifelse')}
                className="flex items-center gap-2 p-2 rounded bg-fuchsia-950/20 hover:bg-fuchsia-950/40 text-fuchsia-400 border border-fuchsia-900/30 text-xs font-bold transition text-left"
              >
                <span className="material-symbols-outlined text-sm">alt_route</span> If / Else
              </button>
              <button
                onClick={() => addNode('delay')}
                className="flex items-center gap-2 p-2 rounded bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 border border-amber-900/30 text-xs font-bold transition text-left"
              >
                <span className="material-symbols-outlined text-sm">schedule</span> Delay Timer
              </button>
              <button
                onClick={() => addNode('code')}
                className="flex items-center gap-2 p-2 rounded bg-teal-950/20 hover:bg-teal-950/40 text-teal-300 border border-teal-900/30 text-xs font-bold transition text-left"
              >
                <span className="material-symbols-outlined text-sm">code</span> Run Script
              </button>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="mt-auto p-3 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-500 leading-relaxed">
            <span className="font-bold text-neutral-400 block mb-1">How to connect:</span>
            Drag connections from the right-hand sockets to any input socket. Use Save Flow and trigger using CRM Lead Form.
          </div>
        </div>

        {/* Center: React Flow Canvas */}
        <div className="flex-1 h-full bg-[#131313] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
          >
            <Controls />
            <Background color="#333" gap={16} />
          </ReactFlow>
        </div>

        {/* Right Side: Parameter Details Panel */}
        <div className="w-80 bg-[#1a1a1a] border-l border-neutral-800 shrink-0 flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#facc15] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">settings</span> 
              {selectedNode ? 'Node Settings' : 'Details Panel'}
            </h3>
            {selectedNode && (
              <button
                onClick={() => {
                  setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                  setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                  setSelectedNode(null);
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Delete Node
              </button>
            )}
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {selectedNode ? (
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block text-neutral-400 font-bold mb-1">Node Title</label>
                  <input
                    type="text"
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => updateNodeData('label', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#facc15]"
                  />
                </div>

                {/* Conditional configuration based on node type */}
                {selectedNode.type === 'trigger' && (
                  <div>
                    <label className="block text-neutral-400 font-bold mb-1">Webhook URL (Target)</label>
                    <div className="bg-black/40 p-2 rounded font-mono text-[10px] break-all select-all text-emerald-400">
                      {`${BACKEND_URL}/api/webhooks/${currentWorkflow?.id || 'id'}`}
                    </div>
                    <span className="text-[10px] text-neutral-500 block mt-1">Send a POST request to this URL to trigger execution.</span>
                  </div>
                )}

                {selectedNode.type === 'marketing_email' && (
                  <>
                    <div>
                      <label className="block text-neutral-400 font-bold mb-1">Recipient</label>
                      <input
                        type="text"
                        value={selectedNode.data?.to || ''}
                        onChange={(e) => updateNodeData('to', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15]"
                        placeholder="{{trigger.email}}"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 font-bold mb-1">Subject</label>
                      <input
                        type="text"
                        value={selectedNode.data?.subject || ''}
                        onChange={(e) => updateNodeData('subject', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15]"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 font-bold mb-1">Body Context</label>
                      <textarea
                        value={selectedNode.data?.body || ''}
                        onChange={(e) => updateNodeData('body', e.target.value)}
                        rows={5}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15] font-mono text-[11px]"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'crm_action' && (
                  <>
                    <div>
                      <label className="block text-neutral-400 font-bold mb-1">Action Mode</label>
                      <select
                        value={selectedNode.data?.actionType || 'create_or_update'}
                        onChange={(e) => updateNodeData('actionType', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15]"
                      >
                        <option value="create_or_update">Create / Update Contact</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-400 font-bold mb-1">Contact Email</label>
                      <input
                        type="text"
                        value={selectedNode.data?.email || ''}
                        onChange={(e) => updateNodeData('email', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15]"
                        placeholder="{{trigger.email}}"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 font-bold mb-1">Status Target</label>
                      <select
                        value={selectedNode.data?.status || 'lead'}
                        onChange={(e) => updateNodeData('status', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15]"
                      >
                        <option value="lead">Lead</option>
                        <option value="contact">Contact</option>
                        <option value="customer">Customer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-400 font-bold mb-1">Score Modifier</label>
                      <input
                        type="number"
                        value={selectedNode.data?.scoreChange || '0'}
                        onChange={(e) => updateNodeData('scoreChange', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15]"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'ifelse' && (
                  <div>
                    <label className="block text-neutral-400 font-bold mb-1">Logical Expression</label>
                    <input
                      type="text"
                      value={selectedNode.data?.condition || ''}
                      onChange={(e) => updateNodeData('condition', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15] font-mono text-[11px]"
                      placeholder="context.trigger.score > 50"
                    />
                    <span className="text-[10px] text-neutral-500 block mt-1.5 leading-relaxed">
                      Evaluate standard inputs like <code>context.trigger.email</code> or <code>context.trigger.score</code>.
                    </span>
                  </div>
                )}

                {selectedNode.type === 'delay' && (
                  <div>
                    <label className="block text-neutral-400 font-bold mb-1">Delay Duration (Seconds)</label>
                    <input
                      type="number"
                      value={selectedNode.data?.seconds || ''}
                      onChange={(e) => updateNodeData('seconds', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15]"
                    />
                  </div>
                )}

                {selectedNode.type === 'code' && (
                  <div>
                    <label className="block text-neutral-400 font-bold mb-1">JavaScript Code</label>
                    <textarea
                      value={selectedNode.data?.code || ''}
                      onChange={(e) => updateNodeData('code', e.target.value)}
                      rows={8}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-white outline-none focus:border-[#facc15] font-mono text-[11px]"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-neutral-500 text-xs">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">gesture</span>
                Select a node to inspect and change its attributes.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Historical Traces & Simulation Dashboards */}
      <div className="h-64 bg-[#1a1a1a] border-t border-neutral-800 flex flex-col shrink-0">
        
        {/* Dashboard Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/50 shrink-0 text-xs font-bold text-neutral-400">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 border-r border-neutral-800 transition flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'bg-[#1a1a1a] text-white border-t border-t-[#facc15]' : 'hover:bg-neutral-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">history</span> Execution Logs
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-6 py-3 border-r border-neutral-800 transition flex items-center gap-1.5 ${
              activeTab === 'crm' ? 'bg-[#1a1a1a] text-white border-t border-t-[#facc15]' : 'hover:bg-neutral-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">contacts</span> Simulated CRM DB
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`px-6 py-3 border-r border-neutral-800 transition flex items-center gap-1.5 ${
              activeTab === 'emails' ? 'bg-[#1a1a1a] text-white border-t border-t-[#facc15]' : 'hover:bg-neutral-800/40'
            }`}
          >
            <span className="material-symbols-outlined text-sm">drafts</span> Simulated Sent Emails
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden flex">
          
          {activeTab === 'logs' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Executions log left column */}
              <div className="w-80 border-r border-neutral-800 overflow-y-auto shrink-0 p-2 flex flex-col gap-1.5">
                {executions.length === 0 ? (
                  <div className="text-center py-10 text-neutral-500 text-xs">No executions recorded.</div>
                ) : (
                  executions.map((exec) => {
                    const dateStr = new Date(exec.startedAt).toLocaleTimeString();
                    return (
                      <div
                        key={exec.id}
                        onClick={() => setSelectedExecution(exec)}
                        className={`p-2 rounded border cursor-pointer transition text-xs text-left ${
                          selectedExecution?.id === exec.id
                            ? 'bg-neutral-800 border-[#facc15]'
                            : 'bg-neutral-900/30 border-neutral-800 hover:bg-neutral-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold font-mono">Run #{exec.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            exec.status === 'success' ? 'bg-emerald-950 text-emerald-400' :
                            exec.status === 'failed' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400 animate-pulse'
                          }`}>
                            {exec.status}
                          </span>
                        </div>
                        <div className="text-neutral-500 text-[10px]">{dateStr}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Execution log step trace list */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-left bg-neutral-950 text-neutral-300">
                {selectedExecution ? (
                  <div>
                    <h4 className="text-white font-bold mb-2 pb-1.5 border-b border-neutral-800 flex justify-between">
                      <span>Detailed Trace for Log #{selectedExecution.id}</span>
                      <span className="text-neutral-500">Started: {new Date(selectedExecution.startedAt).toLocaleString()}</span>
                    </h4>
                    <div className="flex flex-col gap-1">
                      {selectedExecution.logs ? (
                        JSON.parse(selectedExecution.logs).map((step: any, idx: number) => (
                          <div key={idx} className="flex gap-4 hover:bg-neutral-900/50 p-0.5">
                            <span className="text-neutral-600 shrink-0">[{new Date(step.time).toLocaleTimeString()}]</span>
                            <span className="text-[#facc15] shrink-0 font-bold">{step.nodeType ? `[${step.nodeType.toUpperCase()}]` : '[SYSTEM]'}</span>
                            <span className="text-neutral-200">{step.message}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-neutral-600">No trace logs recorded.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-neutral-600 text-center py-10">Select an execution from the left bar to inspect the runtime trace.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="flex-1 flex overflow-hidden p-4 gap-6">
              
              {/* Simulate Contact insert form */}
              <form onSubmit={handleCrmLeadTrigger} className="w-80 shrink-0 flex flex-col gap-3 text-xs bg-neutral-900 p-3 rounded border border-neutral-800 text-left">
                <h4 className="font-bold text-[#facc15] mb-1">Simulate Lead Creation Event</h4>
                <div>
                  <label className="block text-neutral-400 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Lead Score: {newLeadScore}</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={newLeadScore}
                    onChange={(e) => setNewLeadScore(parseInt(e.target.value, 10))}
                    className="w-full accent-[#facc15]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2 rounded text-black transition mt-auto"
                >
                  Create & Trigger CRM Workflow
                </button>
              </form>

              {/* CRM DB Table */}
              <div className="flex-1 overflow-y-auto rounded border border-neutral-800 bg-[#151515]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Lead Score</th>
                      <th className="p-2.5">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmContacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-neutral-500 font-bold">No simulated database contacts.</td>
                      </tr>
                    ) : (
                      crmContacts.map((c) => (
                        <tr key={c.id} className="border-b border-neutral-800 hover:bg-neutral-800/10">
                          <td className="p-2.5 font-mono">{c.id}</td>
                          <td className="p-2.5 font-bold text-white">{c.name}</td>
                          <td className="p-2.5 font-mono text-neutral-300">{c.email}</td>
                          <td className="p-2.5">
                            <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-neutral-700">
                              {c.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-[#facc15]">{c.score}</td>
                          <td className="p-2.5 text-neutral-500 text-[10px]">{new Date(c.createdAt).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {activeTab === 'emails' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {simulatedEmails.length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-neutral-500 font-bold text-xs">Simulated mail inbox is empty. Send email nodes to generate mails here.</div>
                ) : (
                  simulatedEmails.map((email) => (
                    <div key={email.id} className="bg-neutral-900 border border-neutral-800 rounded p-3 text-left text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-800 mb-2">
                        <div>
                          <span className="text-neutral-500">To:</span> <span className="font-bold text-sky-400 font-mono">{email.to}</span>
                        </div>
                        <span className="text-[10px] text-neutral-500">{new Date(email.sentAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="font-bold text-white mb-1">Subject: {email.subject}</div>
                      <p className="text-neutral-300 font-mono text-[11px] bg-black/30 p-2 rounded whitespace-pre-wrap">{email.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
