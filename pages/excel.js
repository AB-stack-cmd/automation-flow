import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function ExcelAutomation() {
  const { isLoaded, isSignedIn } = useUser();
  // Grid State
  const [columns, setColumns] = useState(['Name', 'Email', 'Company', 'Role', 'Status']);
  const [rows, setRows] = useState([
    ['Alice Johnson', 'alice@acme.com', 'Acme Corp', 'Product Manager', 'Active'],
    ['Bob Smith', 'bob@cyberdyne.co', 'Cyberdyne Systems', 'Software Engineer', 'Pending'],
    ['Charlie Brown', 'charlie@stark.com', 'Stark Industries', 'Lead Designer', 'Active'],
    ['Diana Prince', 'diana@wayne.com', 'Wayne Enterprises', 'Security Specialist', 'Inactive'],
  ]);

  // UI Control State
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [rowCount, setRowCount] = useState(10);
  const [apiType, setApiType] = useState('mock'); // mock, openai, gemini
  const [apiKey, setApiKey] = useState('');
  const [activeCell, setActiveCell] = useState(null); // { r, c }
  const [editingHeaderIndex, setEditingHeaderIndex] = useState(null);
  const [headerInputVal, setHeaderInputVal] = useState('');
  const [toast, setToast] = useState(null);
  const [newColInput, setNewColInput] = useState('');
  const [isSavingServer, setIsSavingServer] = useState(false);

  // Status metrics
  const [metrics, setMetrics] = useState({
    totalRows: 4,
    totalCols: 5,
    fileSizeEst: '0.8 KB',
    aiCalls: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    // Update metrics when rows/columns change
    setMetrics({
      totalRows: rows.length,
      totalCols: columns.length,
      fileSizeEst: `${Math.max(0.2, (rows.length * columns.length * 0.05 + 0.5).toFixed(1))} KB`,
      aiCalls: metrics.aiCalls
    });
  }, [rows, columns]);

  // Load API Key from localStorage if available
  useEffect(() => {
    const savedKey = localStorage.getItem(`neuron_flow_api_key_${apiType}`);
    if (savedKey) setApiKey(savedKey);
    else setApiKey('');
  }, [apiType]);

  const saveApiKey = (keyVal) => {
    setApiKey(keyVal);
    localStorage.setItem(`neuron_flow_api_key_${apiType}`, keyVal);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add Row
  const handleAddRow = () => {
    const newRow = Array(columns.length).fill('');
    setRows([...rows, newRow]);
    showToast('Row added at the bottom');
  };

  // Add Column
  const handleAddColumn = () => {
    const newColName = `Column ${columns.length + 1}`;
    setColumns([...columns, newColName]);
    setRows(rows.map(row => [...row, '']));
    showToast(`Added column "${newColName}"`);
  };

  // Delete Row
  const handleDeleteRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    showToast('Row deleted');
  };

  // Delete Column
  const handleDeleteColumn = (colIndex) => {
    if (columns.length <= 1) {
      showToast('Cannot delete the last column', 'error');
      return;
    }
    const updatedCols = columns.filter((_, i) => i !== colIndex);
    const updatedRows = rows.map(row => row.filter((_, i) => i !== colIndex));
    setColumns(updatedCols);
    setRows(updatedRows);
    showToast(`Deleted column "${columns[colIndex]}"`);
  };

  // Edit Cell
  const handleCellChange = (rIndex, cIndex, val) => {
    const updated = rows.map((row, ri) => {
      if (ri === rIndex) {
        return row.map((cell, ci) => (ci === cIndex ? val : cell));
      }
      return row;
    });
    setRows(updated);
  };

  // Rename Column
  const handleRenameColumnSubmit = (index) => {
    if (!headerInputVal.trim()) {
      setEditingHeaderIndex(null);
      return;
    }
    const updated = [...columns];
    updated[index] = headerInputVal.trim();
    setColumns(updated);
    setEditingHeaderIndex(null);
    showToast(`Renamed column to "${headerInputVal}"`);
  };

  // Clear Grid
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? Columns will be preserved.')) {
      setRows([]);
      showToast('Cleared all rows');
    }
  };

  const handleAddColumnWithName = () => {
    const name = newColInput.trim() || `Column ${columns.length + 1}`;
    setColumns([...columns, name]);
    setRows(rows.map(row => [...row, '']));
    setNewColInput('');
    showToast(`Added column "${name}"`);
  };

  const handleRenameColumnDirect = (index, newName) => {
    const updated = [...columns];
    updated[index] = newName;
    setColumns(updated);
  };

  const handleSaveToWorkspace = async () => {
    if (rows.length === 0) {
      showToast('Cannot export an empty table', 'error');
      return;
    }

    setIsSavingServer(true);
    showToast('Saving to workspace...', 'success');

    try {
      const response = await fetch('/api/save-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columns, rows }),
      });

      const resJson = await response.json();
      if (resJson.success) {
        showToast(`Saved to workspace: ${resJson.fileName}`, 'success');
      } else {
        throw new Error(resJson.message || 'Server failed to save.');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save to workspace', 'error');
    } finally {
      setIsSavingServer(false);
    }
  };

  // Presets trigger
  const applyPreset = (presetType) => {
    let presetCols = [];
    let presetPrompt = '';

    switch (presetType) {
      case 'leads':
        presetCols = ['Company', 'Contact Name', 'Email', 'Phone', 'Lead Score', 'Status'];
        presetPrompt = 'Generate a high-quality list of software and corporate sales leads based in North America and Western Europe, including lead scores from 1-100 and pipeline statuses.';
        break;
      case 'tasks':
        presetCols = ['Task ID', 'Task Name', 'Assignee', 'Priority', 'Status', 'Due Date'];
        presetPrompt = 'Generate agile workflow tasks for a web application development project, including descriptive task names, realistic assignees, priority rankings, and completion statuses.';
        break;
      case 'inventory':
        presetCols = ['SKU', 'Product Name', 'Category', 'Unit Cost', 'In Stock', 'Supplier'];
        presetPrompt = 'Generate retail inventory items for an electronics and smart home gadgets store, including detailed product names, costs in $, stock levels, and vendor names.';
        break;
      case 'feedback':
        presetCols = ['Customer', 'Satisfaction', 'Sentiment', 'Comments', 'Date'];
        presetPrompt = 'Generate customer service survey feedback entries, detailing customer names, satisfaction ratings from 1-5, qualitative sentiment assessments, and realistic comments about features/support.';
        break;
      default:
        return;
    }

    setColumns(presetCols);
    setPrompt(presetPrompt);
    setRows([]);
    showToast(`Applied preset for "${presetType.toUpperCase()}"`);
  };

  // AI Generator Engine
  const generateWithAI = async () => {
    if (columns.length === 0) {
      showToast('Please add at least one column first', 'error');
      return;
    }

    setIsGenerating(true);
    setMetrics(prev => ({ ...prev, aiCalls: prev.aiCalls + 1 }));

    try {
      if (apiType === 'mock') {
        // Smart Local Generator fallback
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate networking
        const generated = runLocalMockAIEngine(prompt, rowCount, columns);
        setRows([...rows, ...generated]);
        showToast(`AI successfully generated ${rowCount} rows`);
      } else {
        // Real API Calls
        if (!apiKey) {
          throw new Error(`API key is required for ${apiType.toUpperCase()}`);
        }

        let resultRows = [];
        if (apiType === 'openai') {
          resultRows = await callOpenAIAPI(prompt, rowCount, columns, apiKey);
        } else if (apiType === 'gemini') {
          resultRows = await callGeminiAPI(prompt, rowCount, columns, apiKey);
        }

        if (resultRows && resultRows.length > 0) {
          setRows([...rows, ...resultRows]);
          showToast(`AI successfully generated ${resultRows.length} rows`);
        } else {
          throw new Error('API returned an empty or invalid format');
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'AI Generation failed. Check key & logs.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Call OpenAI API Client-Side
  const callOpenAIAPI = async (userPrompt, count, cols, key) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an Excel data generator. You MUST generate realistic tabular test data. 
            Return a JSON object containing a "data" property which is an array of arrays (rows). 
            Each row array MUST contain exactly ${cols.length} values corresponding in order to these columns: ${JSON.stringify(cols)}. 
            Do NOT truncate descriptions or emails. Respond ONLY with valid raw JSON.`
          },
          {
            role: 'user',
            content: `Create ${count} rows of data. Custom prompt/context: "${userPrompt}"`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `OpenAI API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const parsedObj = JSON.parse(resJson.choices[0].message.content);
    return parsedObj.data || [];
  };

  // Call Gemini API Client-Side
  const callGeminiAPI = async (userPrompt, count, cols, key) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an Excel tabular data generation assistant. Generate ${count} realistic data rows.
            The columns/headers in order are: ${JSON.stringify(cols)}.
            Custom contextual description/prompt: "${userPrompt}"
            You MUST return a JSON object with a single key "data", containing an array of arrays representing the rows. 
            Ensure each row has exactly ${cols.length} items. Keep the JSON raw and clean without markdown packaging.`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const resJson = await response.json();
    const rawText = resJson.candidates[0].content.parts[0].text;
    const parsedObj = JSON.parse(rawText);
    return parsedObj.data || [];
  };

  // Local Heuristics-Based Smart Mock AI Engine
  const runLocalMockAIEngine = (userPrompt, count, cols) => {
    const promptLower = userPrompt.toLowerCase();
    
    // Core data pools
    const firstNames = ['John', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Sophia', 'Mason', 'Isabella', 'William', 'James', 'Mia', 'Lucas', 'Charlotte', 'Ethan', 'Harper', 'Alexander', 'Evelyn', 'Michael', 'Abigail'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const domains = ['gmail.com', 'yahoo.com', 'acme.org', 'techcorp.io', 'globex.net', 'startup.co', 'venture.dev', 'enterprise.xyz'];
    const techCompanies = ['Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems', 'Tyrell Corp', 'Umbrella Corporation', 'Globex', 'Initech', 'Hooli', 'Aperture Science', 'Vehement Capital', 'Soylent Corp', 'InGen'];
    const jobs = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'DevOps Analyst', 'Marketing Strategist', 'Account Director', 'VP of Operations', 'Solutions Architect', 'QA Engineer', 'Fullstack Developer', 'HR Coordinator'];
    const statuses = ['Active', 'Pending', 'Inactive', 'On Hold', 'Completed', 'In Progress'];
    const leadStatuses = ['New', 'Contacted', 'Qualified', 'Nurturing', 'Closed Won', 'Closed Lost'];
    const taskPriorities = ['High', 'Medium', 'Low', 'Critical'];
    const productNames = ['Quantum Laptop Pro', 'Omni Keyboard v2', 'Supernova UltraWide Monitor', 'Holographic Mouse', 'Neuron Link Hub', 'Cybernetic Soundbar', 'Carbon Fibre Stand', 'Matrix VR Goggles', 'Fusion SSD 2TB', 'AI Processing Grid'];
    const productCategories = ['Electronics', 'Accessories', 'Displays', 'Storage', 'Virtual Reality', 'Computing'];
    const feedbackComments = [
      'Amazing response time and high-quality build. Highly recommended!',
      'Great UI but requires some documentation adjustments.',
      'Integrating this with our stack was simple and fast.',
      'Slightly higher latency than expected, but feature set is massive.',
      'The drag-and-drop workspace is absolutely stellar.',
      'Satisfied with the support response. Will continue using.',
      'Decent performance, but pricing structure is a bit confusing.',
      'Exactly what we needed to scale our automated pipelines.'
    ];

    const generated = [];

    for (let i = 0; i < count; i++) {
      const row = cols.map(column => {
        const colLower = column.toLowerCase();

        // 1. Check for specific common column names using matches
        if (colLower.includes('name') || colLower === 'client' || colLower === 'customer' || colLower === 'assignee' || colLower === 'owner') {
          const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
          const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
          return `${fn} ${ln}`;
        }
        
        if (colLower.includes('email') || colLower.includes('mail')) {
          const fn = firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase();
          const ln = lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase();
          const dom = domains[Math.floor(Math.random() * domains.length)];
          return `${fn}.${ln}@${dom}`;
        }

        if (colLower.includes('company') || colLower === 'organization' || colLower === 'employer' || colLower === 'supplier' || colLower === 'vendor') {
          return techCompanies[Math.floor(Math.random() * techCompanies.length)];
        }

        if (colLower.includes('role') || colLower.includes('title') || colLower === 'job' || colLower.includes('position')) {
          return jobs[Math.floor(Math.random() * jobs.length)];
        }

        if (colLower === 'status' || colLower === 'stage') {
          if (promptLower.includes('lead') || promptLower.includes('sale')) {
            return leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
          }
          return statuses[Math.floor(Math.random() * statuses.length)];
        }

        if (colLower === 'priority') {
          return taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
        }

        if (colLower.includes('phone') || colLower.includes('tel') || colLower.includes('contact') || colLower.includes('mobile')) {
          const code = Math.floor(Math.random() * 900) + 100;
          const mid = Math.floor(Math.random() * 900) + 100;
          const end = Math.floor(Math.random() * 9000) + 1000;
          return `+1 (${code}) ${mid}-${end}`;
        }

        if (colLower.includes('product') || colLower === 'item' || colLower === 'sku') {
          if (colLower === 'sku') {
            return `SKU-NEO-${Math.floor(Math.random() * 9000) + 1000}`;
          }
          return productNames[Math.floor(Math.random() * productNames.length)];
        }

        if (colLower.includes('category') || colLower === 'department') {
          return productCategories[Math.floor(Math.random() * productCategories.length)];
        }

        if (colLower.includes('cost') || colLower.includes('price') || colLower.includes('amount') || colLower.includes('budget') || colLower.includes('revenue')) {
          const val = (Math.random() * 450 + 10).toFixed(2);
          return `$${val}`;
        }

        if (colLower.includes('date') || colLower === 'due' || colLower === 'created' || colLower === 'deadline') {
          const d = new Date();
          d.setDate(d.getDate() + Math.floor(Math.random() * 30) - 15);
          return d.toISOString().split('T')[0];
        }

        if (colLower.includes('feedback') || colLower.includes('comment') || colLower.includes('review') || colLower.includes('description') || colLower.includes('note')) {
          return feedbackComments[Math.floor(Math.random() * feedbackComments.length)];
        }

        if (colLower.includes('rating') || colLower.includes('score')) {
          if (colLower.includes('score')) {
            return Math.floor(Math.random() * 100) + 1;
          }
          return (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0 rating
        }

        if (colLower.includes('id') || colLower === 'no' || colLower === 'index') {
          if (colLower === 'task id' || colLower === 'bug id') return `TSK-${100 + i}`;
          return `${i + 1}`;
        }

        // Generic fallback values
        return `${column} Row ${i + 1}`;
      });
      generated.push(row);
    }

    return generated;
  };

  // Client-Side Excel Export logic using XLSX package
  const handleExportExcel = async () => {
    if (rows.length === 0) {
      showToast('Cannot export an empty table', 'error');
      return;
    }

    try {
      showToast('Preparing workbook...');
      
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule.default || XLSXModule;
      
      // Build AoA
      const dataToExport = [columns, ...rows];
      
      // Convert to sheet
      const ws = XLSX.utils.aoa_to_sheet(dataToExport);
      
      // Apply basic column widths
      const wscols = columns.map(c => ({ wch: Math.max(String(c || '').length + 4, 15) }));
      ws['!cols'] = wscols;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Neuron AI Grid');
      
      const fileName = `neuron_flow_data_${Date.now().toString().slice(-6)}.xlsx`;
      XLSX.writeFile(wb, fileName);

      showToast('Downloaded .xlsx file successfully!');
    } catch (err) {
      console.error(err);
      showToast('Export failed. Check logs.', 'error');
    }
  };

  return (
    <>
      <Head>
        <title>Excel AI Automation | NEURON_FLOW</title>
        <style>{`
          body {
            background-color: #09090b !important;
            color: #f4f4f5 !important;
            font-family: 'Inter', sans-serif;
            transition: background-color 0.2s, color 0.2s;
          }
          .glass-panel {
            background: #141417;
            border: 1px solid #27272a;
            border-radius: 12px;
          }
          .excel-grid input {
            background: transparent;
            border: none;
            outline: none;
            width: 100%;
            height: 100%;
            padding: 8px 12px;
            color: #f4f4f5;
          }
          .excel-grid input:focus {
            background: #1f1f23;
            box-shadow: inset 0 0 0 2px #ff4f00;
          }
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #18181b;
          }
          ::-webkit-scrollbar-thumb {
            background: #3f3f46;
            border-radius: 6px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #ff4f00;
          }
        `}</style>
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-sans min-h-screen relative overflow-x-hidden transition-colors">

        {/* Glow overlay */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-container/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Global Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-xl backdrop-blur-md flex items-center gap-3 transition-all duration-300 transform translate-y-0 border ${
            toast.type === 'error' 
              ? 'bg-red-950/90 border-red-500/30 text-red-200' 
              : 'bg-neutral-900/90 border-primary-container/30 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-primary-container animate-pulse'}`}></div>
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <header className="fixed top-0 w-full z-40 bg-surface/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/" className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-white/5 transition-all">
                ← Dashboard
              </Link>
              <div className="h-4 w-[1px] bg-white/10"></div>
              <div className="flex items-center gap-2">
                <span className="text-[#facc15] font-bold tracking-widest text-lg font-mono">NEURON_FLOW</span>
                <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-primary-container/10 border border-primary-container/20 text-[#facc15] rounded">EXCEL_AI</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-xs">
              <a className="text-neutral-400 hover:text-white transition-colors" href="http://localhost:3000">Dashboard</a>
              <a className="text-neutral-400 hover:text-white transition-colors" href="http://localhost:5173">Visual Designer</a>
              <a className="text-[#facc15] font-bold border-b border-[#facc15] pb-0.5" href="/excel">Excel AI</a>
              <a className="text-neutral-400 hover:text-white transition-colors" href="/files">File Vault 📂</a>
            </nav>
            <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Services Active: 4000 / 3000 / 5173
              </div>
              {isLoaded && isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <SignInButton mode="modal">
                  <button className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white rounded text-xs">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </header>

        {/* Main Work Area */}
        <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: AI Config & Presets */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Presets Card */}
            <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
              <h2 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">Quick Flow Presets</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => applyPreset('leads')} className="px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 hover:border-primary-container/30 border border-white/5 text-left rounded-lg transition-all group">
                  <p className="text-xs font-bold text-white group-hover:text-primary-container transition-colors">Sales Leads</p>
                  <p className="text-[10px] text-neutral-500 mt-1">CRM profiles & scoring</p>
                </button>
                <button onClick={() => applyPreset('tasks')} className="px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 hover:border-primary-container/30 border border-white/5 text-left rounded-lg transition-all group">
                  <p className="text-xs font-bold text-white group-hover:text-primary-container transition-colors">Task Tracker</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Agile boards & statuses</p>
                </button>
                <button onClick={() => applyPreset('inventory')} className="px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 hover:border-primary-container/30 border border-white/5 text-left rounded-lg transition-all group">
                  <p className="text-xs font-bold text-white group-hover:text-primary-container transition-colors">Product Inventory</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Retail SKU & supplies</p>
                </button>
                <button onClick={() => applyPreset('feedback')} className="px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 hover:border-primary-container/30 border border-white/5 text-left rounded-lg transition-all group">
                  <p className="text-xs font-bold text-white group-hover:text-primary-container transition-colors">User Feedback</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Survey satisfaction & rating</p>
                </button>
              </div>
            </div>

            {/* Schema Manager Card */}
            <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
              <h2 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">Spreadsheet Schema</h2>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newColInput}
                    onChange={(e) => setNewColInput(e.target.value)}
                    placeholder="New column name..."
                    className="flex-1 bg-neutral-900 border border-white/5 focus:border-[#facc15] focus:ring-0 rounded px-3 py-1.5 text-xs text-neutral-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumnWithName();
                    }}
                  />
                  <button
                    onClick={handleAddColumnWithName}
                    className="px-3 py-1.5 bg-primary-container text-black text-xs font-bold rounded hover:opacity-90 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {columns.map((col, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-neutral-900/60 border border-white/5 px-3 py-1.5 rounded">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => handleRenameColumnDirect(idx, e.target.value)}
                        className="bg-transparent border-none text-xs text-white p-0 focus:ring-0 w-32"
                      />
                      <button
                        onClick={() => handleDeleteColumn(idx)}
                        className="text-neutral-500 hover:text-red-400 text-xs px-1"
                        title="Delete column"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Generator Panel */}
            <div className="glass-panel p-6 rounded-xl flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">AI Generator Config</h2>
                <div className="w-2 h-2 rounded-full bg-primary-container animate-ping"></div>
              </div>

              {/* Prompt Textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-400">Custom Generation Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the context of data you want to generate. For example: 'Create B2B technology sales leads in Silicon Valley with high intent signals...'"
                  rows={4}
                  className="w-full bg-neutral-900 border border-white/5 focus:border-[#facc15] focus:ring-0 rounded-lg p-3 text-xs text-neutral-200 placeholder-neutral-600 resize-none transition-colors"
                />
              </div>

              {/* Row Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-neutral-400">Rows to generate</span>
                  <span className="text-primary-container font-mono">{rowCount} rows</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value))}
                  className="w-full accent-primary-container h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* API Configuration */}
              <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-neutral-400">AI Model Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setApiType('mock')}
                      className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${
                        apiType === 'mock' 
                          ? 'bg-primary-container text-black border-primary-container' 
                          : 'bg-neutral-900 text-neutral-400 border-white/5 hover:border-neutral-700'
                      }`}
                    >
                      Mock Engine
                    </button>
                    <button
                      onClick={() => setApiType('openai')}
                      className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${
                        apiType === 'openai' 
                          ? 'bg-primary-container text-black border-primary-container' 
                          : 'bg-neutral-900 text-neutral-400 border-white/5 hover:border-neutral-700'
                      }`}
                    >
                      OpenAI
                    </button>
                    <button
                      onClick={() => setApiType('gemini')}
                      className={`py-2 text-[10px] font-bold uppercase rounded border transition-all ${
                        apiType === 'gemini' 
                          ? 'bg-primary-container text-black border-primary-container' 
                          : 'bg-neutral-900 text-neutral-400 border-white/5 hover:border-neutral-700'
                      }`}
                    >
                      Gemini
                    </button>
                  </div>
                </div>

                {apiType !== 'mock' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-neutral-400">{apiType.toUpperCase()} API Key</label>
                      <span className="text-[9px] text-neutral-600 font-mono">Saved locally</span>
                    </div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => saveApiKey(e.target.value)}
                      placeholder={`Paste your ${apiType.toUpperCase()} API key...`}
                      className="w-full bg-neutral-900 border border-white/5 focus:border-[#facc15] focus:ring-0 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-600 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={generateWithAI}
                disabled={isGenerating}
                className={`w-full py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all glow-btn ${
                  isGenerating 
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-[#facc15] border-primary-container hover:opacity-95 text-black font-semibold shadow-lg shadow-[#facc15]/10 active:scale-98'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Executing AI Orchestration...
                  </>
                ) : (
                  <>
                    <span>✨</span> Generate Rows with AI
                  </>
                )}
              </button>
            </div>
            
            {/* Live Analytics Dashboard widget */}
            <div className="glass-panel p-6 rounded-xl flex flex-col gap-4">
              <h2 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">Live Workbook Analytics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-neutral-500 uppercase font-semibold">Total Columns</p>
                  <p className="text-xl font-bold text-white font-mono mt-1">{metrics.totalCols}</p>
                </div>
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-neutral-500 uppercase font-semibold">Total Rows</p>
                  <p className="text-xl font-bold text-white font-mono mt-1">{metrics.totalRows}</p>
                </div>
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-neutral-500 uppercase font-semibold">Estimated File Size</p>
                  <p className="text-xl font-bold text-[#facc15] font-mono mt-1">{metrics.fileSizeEst}</p>
                </div>
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-neutral-500 uppercase font-semibold">AI Calls Triggered</p>
                  <p className="text-xl font-bold text-emerald-400 font-mono mt-1">{metrics.aiCalls}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel: Interactive Sheet Grid */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Grid Operations Header */}
            <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-2">
                <button onClick={handleAddRow} className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs border border-white/5 hover:border-neutral-700 rounded transition-all flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">+</span> Add Row
                </button>
                <button onClick={handleAddColumn} className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs border border-white/5 hover:border-neutral-700 rounded transition-all flex items-center gap-1.5">
                  <span className="text-[#facc15] font-bold">+</span> Add Column
                </button>
                <button onClick={handleClearAll} className="px-4 py-2 bg-neutral-900 hover:bg-red-950/30 text-neutral-400 hover:text-red-400 font-semibold text-xs border border-white/5 hover:border-red-900/30 rounded transition-all flex items-center gap-1.5">
                  <span>🗑</span> Clear Grid
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded transition-all flex items-center gap-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  title="Download workbook file directly to your downloads folder"
                >
                  <span>📥</span> Download Excel (.xlsx)
                </button>
                <button
                  onClick={handleSaveToWorkspace}
                  disabled={isSavingServer}
                  className={`px-4 py-2.5 rounded text-xs font-bold transition-all flex items-center gap-2 border ${
                    isSavingServer
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white border-white/5 hover:border-neutral-700 active:scale-95 shadow-lg shadow-black/10'
                  }`}
                  title="Save workbook file directly into your local workspace folder"
                >
                  <span>💾</span> {isSavingServer ? 'Saving...' : 'Save to Workspace'}
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col border border-white/5">
              
              {/* Spreadsheet Grid Wrapper (Horizontal / Vertical scroll) */}
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                  
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-neutral-900/80 border-b border-white/5">
                      <th className="w-12 text-center text-[10px] text-neutral-500 border-r border-white/5 font-mono select-none py-3">#</th>
                      {columns.map((col, cIdx) => (
                        <th key={cIdx} className="relative group border-r border-white/5 text-xs text-neutral-300 font-semibold py-3 px-3">
                          {editingHeaderIndex === cIdx ? (
                            <input
                              type="text"
                              value={headerInputVal}
                              onChange={(e) => setHeaderInputVal(e.target.value)}
                              onBlur={() => handleRenameColumnSubmit(cIdx)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameColumnSubmit(cIdx);
                                if (e.key === 'Escape') setEditingHeaderIndex(null);
                              }}
                              autoFocus
                              className="bg-neutral-950 border border-primary-container px-2 py-1 text-xs text-white rounded w-full outline-none"
                            />
                          ) : (
                            <div className="flex items-center justify-between">
                              <span
                                onDoubleClick={() => {
                                  setEditingHeaderIndex(cIdx);
                                  setHeaderInputVal(col);
                                }}
                                className="cursor-pointer hover:text-white transition-colors block truncate w-full"
                                title="Double click to rename"
                              >
                                {col}
                              </span>
                              <div className="hidden group-hover:flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-900/95 pl-1 rounded">
                                <button
                                  onClick={() => {
                                    setEditingHeaderIndex(cIdx);
                                    setHeaderInputVal(col);
                                  }}
                                  className="text-neutral-500 hover:text-primary-container text-[10px] px-1"
                                  title="Rename column"
                                >
                                  ✏
                                </button>
                                <button
                                  onClick={() => handleDeleteColumn(cIdx)}
                                  className="text-neutral-500 hover:text-red-400 text-[10px] px-1"
                                  title="Delete column"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}
                        </th>
                      ))}
                      <th className="w-14 py-3"></th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-white/5 excel-grid">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 2} className="text-center py-12 text-sm text-neutral-500">
                          No rows generated yet. Click <span className="text-primary-container font-semibold">"Add Row"</span> or trigger the <span className="text-primary-container font-semibold">AI Generator</span> to add entries.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/[0.01] transition-all group">
                          {/* Row Index */}
                          <td className="w-12 text-center text-[10px] text-neutral-600 border-r border-white/5 font-mono select-none py-2">
                            {rIdx + 1}
                          </td>
                          
                          {/* Grid Cells */}
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border-r border-white/5 p-0 relative">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                onFocus={() => setActiveCell({ r: rIdx, c: cIdx })}
                                onBlur={() => setActiveCell(null)}
                                className="text-xs"
                              />
                            </td>
                          ))}

                          {/* Row Actions */}
                          <td className="w-14 text-center py-2 px-1">
                            <button
                              onClick={() => handleDeleteRow(rIdx)}
                              className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 text-xs px-2 py-1 transition-opacity duration-200"
                              title="Delete row"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                </table>
              </div>

              {/* Status footer for keyboard helper */}
              <div className="bg-neutral-950/60 px-4 py-3 border-t border-white/5 text-[10px] text-neutral-500 flex items-center justify-between">
                <div>
                  💡 <span className="font-semibold text-neutral-400">Pro-Tip:</span> Double-click any header text to rename the column.
                </div>
                <div className="font-mono text-neutral-600">
                  SECURE CLIENT-SIDE TRANSACTION
                </div>
              </div>

            </div>

            {/* Explanation Guide / Card */}
            <div className="glass-panel p-6 rounded-xl flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-white">How the Excel AI Automation Works</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                NEURON_FLOW integrates AI agents directly into standard tabular environments. By customizing your schema headers (columns) and descriptive generation goals:
              </p>
              <ul className="list-disc pl-4 text-xs text-neutral-400 flex flex-col gap-2 mt-1 leading-relaxed">
                <li>
                  <strong className="text-neutral-300">Custom Columns:</strong> You define the specific data layout needed. The AI respects this design and maps values to corresponding attributes accurately.
                </li>
                <li>
                  <strong className="text-neutral-300">Mock AI Engine:</strong> Creates highly realistic, category-aware payloads without configuration. Great for testing rapid mocks.
                </li>
                <li>
                  <strong className="text-neutral-300">OpenAI & Gemini Connectors:</strong> Direct client-to-API integrations using your own private API keys to construct authentic, custom-shaped data records dynamically.
                </li>
                <li>
                  <strong className="text-neutral-300">Excel Core Export:</strong> Compiles the reactive DOM grid state into a binary byte layout and packages it into a native `.xlsx` spreadsheet, downloadable instantly.
                </li>
              </ul>
            </div>

          </div>

        </main>
      </div>
    </>
  );
}
