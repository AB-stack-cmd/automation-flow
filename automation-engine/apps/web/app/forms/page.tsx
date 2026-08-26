'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Settings,
  Play,
  Copy,
  Check,
  FileText,
  HelpCircle,
  ChevronRight,
  Lock,
  Link as LinkIcon,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    minNumber?: number;
    maxNumber?: number;
    regex?: string;
    regexMessage?: string;
  };
}

interface Workflow {
  id: string;
  name: string;
  definition: string;
  isActive: boolean;
}

interface FormDefinition {
  id?: string;
  name: string;
  definition: FormField[];
  workflowId?: string | null;
  createdAt?: string;
  triggerNodeName?: string | null;
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);

  // Form Editor fields
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [linkedWorkflowId, setLinkedWorkflowId] = useState<string>('');
  const [selectedTriggerNodeName, setSelectedTriggerNodeName] = useState<string>('');
  const [availableTriggers, setAvailableTriggers] = useState<Array<{ name: string; type: string }>>([]);

  useEffect(() => {
    if (linkedWorkflowId && workflows.length > 0) {
      const wf = workflows.find(w => w.id === linkedWorkflowId);
      if (wf) {
        try {
          const def = JSON.parse(wf.definition);
          const triggers = (def.nodes || [])
            .filter((n: any) => n.type.startsWith('trigger.') || n.type.includes('trigger') || n.type.includes('Trigger') || n.type.includes('google_form_trigger'))
            .map((n: any) => ({ name: n.name, type: n.type }));
          setAvailableTriggers(triggers);
        } catch (e) {
          setAvailableTriggers([]);
        }
      } else {
        setAvailableTriggers([]);
      }
    } else {
      setAvailableTriggers([]);
    }
  }, [linkedWorkflowId, workflows]);

  // Interactive test fields
  const [testFormData, setTestFormData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [authType, setAuthType] = useState<string>('none');
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedProd, setCopiedProd] = useState(false);

  // Real-time execution monitoring state
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [realtimeLogs, setRealtimeLogs] = useState<any[]>([]);
  const [realtimeSteps, setRealtimeSteps] = useState<Record<string, any>>({});
  const [realtimeStatus, setRealtimeStatus] = useState<string>('idle');

  useEffect(() => {
    if (!activeExecutionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/executions/${activeExecutionId}/logs`);
        if (res.ok) {
          const data = await res.json();
          setRealtimeStatus(data.status);
          setRealtimeLogs(data.logs || []);
          setRealtimeSteps(data.steps || {});
          if (data.status === 'success' || data.status === 'failed' || data.status === 'completed') {
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error('Failed to poll execution logs:', e);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeExecutionId]);

  // Field types catalog
  const FIELD_TYPES = [
    { type: 'text', label: 'Single Line Text' },
    { type: 'textarea', label: 'Paragraph Text' },
    { type: 'email', label: 'Email Address' },
    { type: 'phone', label: 'Phone Number' },
    { type: 'number', label: 'Number Input' },
    { type: 'url', label: 'Website URL' },
    { type: 'date', label: 'Date Picker' },
    { type: 'time', label: 'Time Picker' },
    { type: 'checkbox', label: 'Checkbox Switch' },
    { type: 'rating', label: 'Star Rating' },
    { type: 'slider', label: 'Range Slider' },
    { type: 'color', label: 'Color Picker' }
  ];

  useEffect(() => {
    fetchForms();
    fetchWorkflows();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms');
      const data = await res.json();
      if (Array.isArray(data)) {
        setForms(data);
        if (data.length > 0 && !selectedForm) {
          selectForm(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load forms', e);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWorkflows(data);
      }
    } catch (e) {
      console.error('Failed to load workflows', e);
    }
  };

  const selectForm = (form: FormDefinition) => {
    setSelectedForm(form);
    setFormName(form.name);

    let parsedFields: FormField[] = [];
    try {
      parsedFields = typeof form.definition === 'string' ? JSON.parse(form.definition) : form.definition;
    } catch (e) {
      parsedFields = [];
    }

    setFields(parsedFields);
    setLinkedWorkflowId(form.workflowId || '');
    setSelectedTriggerNodeName(form.triggerNodeName || '');
    setSelectedField(null);
    setTestFormData({});
    setValidationErrors({});
    setTestResult(null);
    setTestingStatus('idle');

    // Extract auth type from linked workflow trigger node if possible
    if (form.workflowId) {
      const wf = workflows.find(w => w.id === form.workflowId);
      if (wf) {
        try {
          const def = JSON.parse(wf.definition);
          const trigger = def.nodes?.find((n: any) => n.type === 'trigger.webhook');
          setAuthType(trigger?.parameters?.authentication || 'none');
        } catch (e) { }
      }
    }
  };

  const handleCreateNewForm = async () => {
    const defaultFields: FormField[] = [
      { id: 'f_name', type: 'text', name: 'name', label: 'Your Name', placeholder: 'John Doe', required: true },
      { id: 'f_email', type: 'email', name: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { id: 'f_msg', type: 'textarea', name: 'message', label: 'Message', placeholder: 'Write something...' }
    ];

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Form Submission',
          definition: defaultFields
        })
      });
      const data = await res.json();
      await fetchForms();
      selectForm(data);
    } catch (e) {
      alert('Error creating form.');
    }
  };

  const handleSaveForm = async () => {
    if (!selectedForm) return;
    try {
      const res = await fetch(`/api/forms/${selectedForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          definition: fields,
          workflowId: linkedWorkflowId || null,
          triggerNodeName: selectedTriggerNodeName || null
        })
      });
      const data = await res.json();
      alert('Form saved successfully!');
      fetchForms();
      setSelectedForm(data);
    } catch (e) {
      alert('Error saving form.');
    }
  };

  const handleDeleteForm = async () => {
    if (!selectedForm || !confirm('Delete this form?')) return;
    try {
      await fetch(`/api/forms/${selectedForm.id}`, { method: 'DELETE' });
      const remaining = forms.filter(f => f.id !== selectedForm.id);
      setForms(remaining);
      if (remaining.length > 0) {
        selectForm(remaining[0]);
      } else {
        setSelectedForm(null);
      }
      alert('Form deleted.');
    } catch (e) {
      alert('Error deleting form.');
    }
  };

  // Fields manipulation
  const addField = (type: string) => {
    const id = `f_${Date.now()}`;
    const newField: FormField = {
      id,
      type,
      name: `field_${Date.now().toString().slice(-4)}`,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      placeholder: '',
      required: false,
      validation: type === 'number' ? { minNumber: 0, maxNumber: 100 } : {}
    };
    const updated = [...fields, newField];
    setFields(updated);
    setSelectedField(newField);
  };

  const updateFieldData = (fieldId: string, property: keyof FormField, value: any) => {
    const updated = fields.map(f => {
      if (f.id === fieldId) {
        const updatedField = { ...f, [property]: value };
        if (selectedField?.id === fieldId) {
          setSelectedField(updatedField);
        }
        return updatedField;
      }
      return f;
    });
    setFields(updated);
  };

  const updateFieldValidation = (fieldId: string, property: string, value: any) => {
    const updated = fields.map(f => {
      if (f.id === fieldId) {
        const updatedField = {
          ...f,
          validation: {
            ...f.validation,
            [property]: value === '' ? undefined : value
          }
        };
        if (selectedField?.id === fieldId) {
          setSelectedField(updatedField);
        }
        return updatedField;
      }
      return f;
    });
    setFields(updated);
  };

  const removeField = (fieldId: string) => {
    const updated = fields.filter(f => f.id !== fieldId);
    setFields(updated);
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  // Submission Testing
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTestingStatus('loading');
    setTestResult(null);
    setValidationErrors({});
    setActiveExecutionId(null);
    setRealtimeLogs([]);
    setRealtimeSteps({});

    try {
      const url = selectedForm?.id
        ? `/api/forms/${selectedForm.id}/submit`
        : linkedWorkflowId
        ? `/api/workflows/${linkedWorkflowId}/execute`
        : null;

      if (!url) {
        alert('Please save the form or connect an active workflow first.');
        setTestingStatus('idle');
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authType === 'apiKey') {
        headers['X-API-Key'] = 'sk-form-key-test-1234';
      } else if (authType === 'basicAuth') {
        headers['Authorization'] = 'Basic dGVzdC11c2VyOnNlY3JldC1wYXNz';
      }

      const bodyPayload = selectedForm?.id
        ? testFormData
        : { triggerNodeName: selectedTriggerNodeName || 'trigger', payload: testFormData };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (res.status === 400 && data.error) {
        setTestingStatus('error');
        setTestResult(data);
      } else {
        setTestingStatus(res.ok ? 'success' : 'error');
        setTestResult({
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: data
        });

        if (data.executionId) {
          setActiveExecutionId(data.executionId);
          setRealtimeStatus(data.status || 'running');
        }
      }
    } catch (err: any) {
      setTestingStatus('error');
      setTestResult({ error: err.message });
    }
  };

  const handleCopyLink = (url: string, type: 'dev' | 'prod') => {
    const absoluteUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absoluteUrl);
    if (type === 'dev') {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2000);
    } else {
      setCopiedProd(true);
      setTimeout(() => setCopiedProd(false), 2000);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-[#fafafa] font-sans overflow-hidden">
      {/* CDN imports for styling */}
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        body { font-family: 'Inter', sans-serif; }
        .glass-panel {
          background: rgba(18, 18, 18, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .code-block {
          background: #0c0c0e;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

      {/* Main UI Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#09090b]/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="font-bold text-base leading-tight">Neuron Forms</h1>
              <p className="text-[10px] text-zinc-400">n8n-Style Form submission & webhook execution pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </a>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Form List & Linkage */}
          <aside className="w-80 border-r border-white/5 flex flex-col p-6 space-y-6 shrink-0 bg-[#09090b]/50 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Forms Catalog</span>
              <button
                onClick={handleCreateNewForm}
                className="p-1 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-all"
                title="Create Form"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Forms Directory */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {forms.map(form => (
                <button
                  key={form.id}
                  onClick={() => selectForm(form)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${selectedForm?.id === form.id
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className={`w-4 h-4 shrink-0 ${selectedForm?.id === form.id ? 'text-amber-500' : 'text-zinc-500'}`} />
                    <span className="text-xs font-medium truncate">{form.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                </button>
              ))}
              {forms.length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-[10px]">
                  No active forms. Click + to create.
                </div>
              )}
            </div>

            {selectedForm && (
              <div className="pt-6 border-t border-white/5 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Form Settings</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Form Name"
                    className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Workflow Integration */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3 text-amber-500" />
                    Automation Connection
                  </label>
                  <select
                    value={linkedWorkflowId}
                    onChange={(e) => {
                      setLinkedWorkflowId(e.target.value);
                      const wf = workflows.find(w => w.id === e.target.value);
                      if (wf) {
                        try {
                          const def = JSON.parse(wf.definition);
                          const trigger = def.nodes?.find((n: any) => n.type === 'trigger.webhook');
                          setAuthType(trigger?.parameters?.authentication || 'none');
                        } catch (err) { }
                      } else {
                        setAuthType('none');
                      }
                    }}
                    className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">Select Target Workflow</option>
                    {workflows.map(wf => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name} {wf.isActive ? '(Active)' : '(Draft)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* On Event Trigger Node selection */}
                {linkedWorkflowId && availableTriggers.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-amber-500" />
                      On Event (Trigger Node)
                    </label>
                    <select
                      value={selectedTriggerNodeName}
                      onChange={(e) => setSelectedTriggerNodeName(e.target.value)}
                      className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="">Select Trigger Connection</option>
                      {availableTriggers.map(t => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Webhooks Generator display */}
                {linkedWorkflowId && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Development Webhook</span>
                        <span className="text-[8px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded">TEST</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#0c0c0e] border border-white/5 rounded-lg p-2 font-mono text-[9px] text-zinc-300 select-all break-all relative">
                        <span>/api/webhook-test/{linkedWorkflowId.slice(0, 8)}...</span>
                        <button
                          onClick={() => handleCopyLink(`/api/webhook-test/${linkedWorkflowId}`, 'dev')}
                          className="ml-auto p-1 text-zinc-400 hover:text-white"
                        >
                          {copiedDev ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Production Webhook</span>
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded">LIVE</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#0c0c0e] border border-white/5 rounded-lg p-2 font-mono text-[9px] text-zinc-300 select-all break-all relative">
                        <span>/api/webhook/{linkedWorkflowId.slice(0, 8)}...</span>
                        <button
                          onClick={() => handleCopyLink(`/api/webhook/${linkedWorkflowId}`, 'prod')}
                          className="ml-auto p-1 text-zinc-400 hover:text-white"
                        >
                          {copiedProd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {authType !== 'none' && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-white/5 text-[10px] text-zinc-400 flex items-start gap-2 leading-relaxed">
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          Authentication: <span className="text-white font-bold uppercase">{authType === 'basicAuth' ? 'Basic Auth' : 'API Key'}</span>. Mock credentials will be added automatically to manual tests.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={handleSaveForm}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2 rounded-lg transition-all"
                  >
                    Save Form
                  </button>
                  <button
                    onClick={handleDeleteForm}
                    className="p-2 border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Middle panel - Form Builder Canvas */}
          <main className="flex-1 border-r border-white/5 flex flex-col overflow-hidden bg-[#0a0a0c]">
            {selectedForm ? (
              <div className="flex-1 flex overflow-hidden">
                {/* Visual Fields Canvas */}
                <div className="flex-1 flex flex-col p-8 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fields Layout</span>
                    <span className="text-xs text-zinc-500">{fields.length} Elements</span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {fields.map((field, idx) => (
                      <div
                        key={field.id}
                        onClick={() => setSelectedField(field)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${selectedField?.id === field.id
                            ? 'bg-[#121214] border-amber-500/40 shadow-lg'
                            : 'bg-[#121214]/40 border-white/5 hover:border-white/10'
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{field.label || 'Unnamed Field'}</span>
                            {field.required && <span className="text-[8px] bg-rose-500/10 text-rose-400 font-bold px-1.5 py-0.5 rounded">REQUIRED</span>}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            Type: {field.type} • Key: {field.name}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-rose-500 rounded hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="pt-6 shrink-0">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Add Fields</div>
                      <div className="grid grid-cols-2 gap-2">
                        {FIELD_TYPES.map(ft => (
                          <button
                            key={ft.type}
                            onClick={() => addField(ft.type)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-transparent rounded-lg text-left text-xs text-zinc-300 font-medium transition-all"
                          >
                            + {ft.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field Details Editor Panel */}
                <div className="w-80 border-l border-white/5 bg-[#09090b]/20 p-6 overflow-y-auto flex flex-col space-y-6">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Field Properties</div>

                  {selectedField ? (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-medium">Field Label</label>
                        <input
                          type="text"
                          value={selectedField.label}
                          onChange={(e) => updateFieldData(selectedField.id, 'label', e.target.value)}
                          className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-medium">JSON Key / Name</label>
                        <input
                          type="text"
                          value={selectedField.name}
                          onChange={(e) => updateFieldData(selectedField.id, 'name', e.target.value)}
                          className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-medium">Placeholder Text</label>
                        <input
                          type="text"
                          value={selectedField.placeholder || ''}
                          onChange={(e) => updateFieldData(selectedField.id, 'placeholder', e.target.value)}
                          className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-medium">Default Value</label>
                        <input
                          type="text"
                          value={selectedField.defaultValue || ''}
                          onChange={(e) => updateFieldData(selectedField.id, 'defaultValue', e.target.value)}
                          className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-zinc-400 font-medium">Mark as Required</span>
                        <input
                          type="checkbox"
                          checked={selectedField.required || false}
                          onChange={(e) => updateFieldData(selectedField.id, 'required', e.target.checked)}
                          className="rounded border-neutral-800 bg-[#0e0e0e] text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      </div>

                      {/* Numerical validations */}
                      {(selectedField.type === 'number' || selectedField.type === 'slider' || selectedField.type === 'rating') && (
                        <div className="pt-4 border-t border-white/5 space-y-3">
                          <span className="text-[9px] uppercase font-bold text-zinc-400 block">Number Rules</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-500">Min Value</label>
                              <input
                                type="number"
                                value={selectedField.validation?.minNumber ?? ''}
                                onChange={(e) => updateFieldValidation(selectedField.id, 'minNumber', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-[#121214] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-500">Max Value</label>
                              <input
                                type="number"
                                value={selectedField.validation?.maxNumber ?? ''}
                                onChange={(e) => updateFieldValidation(selectedField.id, 'maxNumber', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-[#121214] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Text/String validations */}
                      {['text', 'textarea', 'email', 'url', 'phone'].includes(selectedField.type) && (
                        <div className="pt-4 border-t border-white/5 space-y-3">
                          <span className="text-[9px] uppercase font-bold text-zinc-400 block">Text Limits</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-500">Min Length</label>
                              <input
                                type="number"
                                value={selectedField.validation?.minLength ?? ''}
                                onChange={(e) => updateFieldValidation(selectedField.id, 'minLength', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-[#121214] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-500">Max Length</label>
                              <input
                                type="number"
                                value={selectedField.validation?.maxLength ?? ''}
                                onChange={(e) => updateFieldValidation(selectedField.id, 'maxLength', e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-[#121214] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2">
                            <label className="text-[9px] text-zinc-500">Regex Validation Pattern</label>
                            <input
                              type="text"
                              value={selectedField.validation?.regex || ''}
                              onChange={(e) => updateFieldValidation(selectedField.id, 'regex', e.target.value)}
                              placeholder="e.g. ^[A-Za-z]+$"
                              className="w-full bg-[#121214] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-zinc-600 text-xs leading-relaxed">
                      Select a field in the canvas to edit its validation rules and parameters.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500 text-xs">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-30">description</span>
                Select a form from the directory or create a new one to open the designer.
              </div>
            )}
          </main>

          {/* Right panel - Form Renderer & Submission Tester */}
          <aside className="w-96 border-l border-white/5 bg-[#09090b]/80 p-6 overflow-y-auto flex flex-col space-y-6">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Renderer & Test Client</div>

            {selectedForm ? (
              <div className="space-y-6 text-left">
                {/* Dynamically Rendered Form */}
                <div className="glass-panel p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white mb-2">{formName || 'Form Preview'}</h3>
                  <form onSubmit={handleTestSubmit} className="space-y-3.5">
                    {fields.map(field => {
                      const name = field.name || field.id;
                      const isErr = !!validationErrors[name];

                      return (
                        <div key={field.id} className="space-y-1">
                          <label className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-rose-500 text-xs">*</span>}
                          </label>

                          {field.type === 'textarea' ? (
                            <textarea
                              value={testFormData[name] || ''}
                              onChange={(e) => setTestFormData({ ...testFormData, [name]: e.target.value })}
                              placeholder={field.placeholder}
                              className={`w-full bg-zinc-900 border ${isErr ? 'border-rose-500' : 'border-white/5'} rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500/50`}
                              rows={3}
                            />
                          ) : field.type === 'checkbox' ? (
                            <div className="flex items-center gap-2 py-1">
                              <input
                                type="checkbox"
                                checked={!!testFormData[name]}
                                onChange={(e) => setTestFormData({ ...testFormData, [name]: e.target.checked })}
                                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                              />
                              <span className="text-xs text-zinc-300">{field.placeholder || 'Check to select'}</span>
                            </div>
                          ) : field.type === 'color' ? (
                            <input
                              type="color"
                              value={testFormData[name] || '#facc15'}
                              onChange={(e) => setTestFormData({ ...testFormData, [name]: e.target.value })}
                              className="w-12 h-8 bg-transparent border-0 rounded cursor-pointer block"
                            />
                          ) : field.type === 'slider' ? (
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min={field.validation?.minNumber ?? 0}
                                max={field.validation?.maxNumber ?? 100}
                                value={testFormData[name] ?? field.validation?.minNumber ?? 0}
                                onChange={(e) => setTestFormData({ ...testFormData, [name]: Number(e.target.value) })}
                                className="flex-1 accent-amber-500 cursor-pointer"
                              />
                              <span className="text-xs font-mono w-8 text-right text-zinc-300">
                                {testFormData[name] ?? field.validation?.minNumber ?? 0}
                              </span>
                            </div>
                          ) : field.type === 'rating' ? (
                            <div className="flex items-center gap-1.5 py-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setTestFormData({ ...testFormData, [name]: star })}
                                  className={`text-lg transition-colors ${(testFormData[name] || 0) >= star ? 'text-amber-400' : 'text-zinc-700 hover:text-amber-500/50'
                                    }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
                              value={testFormData[name] || ''}
                              onChange={(e) => setTestFormData({ ...testFormData, [name]: e.target.value })}
                              placeholder={field.placeholder}
                              className={`w-full bg-zinc-900 border ${isErr ? 'border-rose-500' : 'border-white/5'} rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500/50`}
                            />
                          )}

                          {isErr && (
                            <span className="text-[9px] text-rose-500 block font-medium mt-0.5">
                              ⚠️ {validationErrors[name]}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 mt-4"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Submit & Run Pipeline
                    </button>
                  </form>
                </div>

                {/* Submissions Result console */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Response Console</span>

                  {testingStatus === 'loading' && (
                    <div className="p-4 rounded-xl border border-white/5 bg-[#0c0c0e] text-center text-xs text-zinc-400">
                      Executing workflow pipeline...
                    </div>
                  )}

                  {testingStatus === 'error' && (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 text-xs text-rose-400 flex items-start gap-2 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Submission Rejected:</strong>
                        <p className="text-[10px] text-rose-400/80 mt-1">Check fields validation errors on form input.</p>
                      </div>
                    </div>
                  )}

                  {testResult && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${testResult.status < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          HTTP {testResult.status || 400}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">Response Payload</span>
                      </div>

                      <div className="code-block p-4 rounded-xl font-mono text-[9px] text-zinc-300 overflow-x-auto whitespace-pre max-h-64">
                        {JSON.stringify(testResult.body || testResult, null, 2)}
                      </div>
                    </div>
                  )}

                  {testingStatus === 'idle' && !testResult && (
                    <div className="p-6 border border-dashed border-white/5 rounded-xl text-center text-[10px] text-zinc-600 leading-normal">
                      🔌 Fill out form fields and click Submit to run a test execution. Result headers/payloads will be captured here.
                    </div>
                  )}

                  {/* Real-Time Live Execution & Ingest Monitor */}
                  {(activeExecutionId || realtimeLogs.length > 0) && (
                    <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-[#0f0e0c] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${realtimeStatus === 'success' || realtimeStatus === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${realtimeStatus === 'success' || realtimeStatus === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          </span>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            Real-Time Ingest & Node Monitor
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold uppercase">
                          {realtimeStatus}
                        </span>
                      </div>

                      {/* Node progression badges */}
                      <div className="flex items-center justify-between text-[10px] py-1 px-2 rounded-lg bg-zinc-900/80 border border-white/5 font-medium text-zinc-300">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <span>📋 Form Submitted</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                        <div className="flex items-center gap-1 text-amber-400">
                          <span>⚡ Inngest Queue</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                        <div className={`flex items-center gap-1 ${realtimeStatus === 'success' || realtimeStatus === 'completed' ? 'text-emerald-400' : 'text-sky-400'}`}>
                          <span>⚙️ Graph Engine</span>
                        </div>
                      </div>

                      {/* Live log feed */}
                      <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-[9px] text-zinc-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {realtimeLogs.length === 0 ? (
                          <div className="text-zinc-600 italic">Streaming live execution trace...</div>
                        ) : (
                          realtimeLogs.map((log: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-zinc-600 shrink-0">
                                {log.time ? new Date(log.time).toLocaleTimeString() : '•'}
                              </span>
                              <span className={log.message?.includes('Error') || log.message?.includes('failed') ? 'text-rose-400' : log.message?.includes('completed') || log.message?.includes('success') ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-600 text-xs">
                Open a form to preview layout and start test submissions.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
