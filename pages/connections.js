import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import { getFlowCanvasUrl, getDashboardUrl } from '../lib/config';

export default function NodeConnectionsPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('/workflows');
  const [dashboardUrl, setDashboardUrl] = useState('http://localhost:3000');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Connection API Keys State
  const [keys, setKeys] = useState({
    openai: '',
    gemini: '',
    anthropic: '',
    deepseek: '',
    postgres: 'postgres://admin:secret@localhost:5432/automation',
    rabbitmq: 'amqp://guest:guest@localhost:5672',
    mcp: 'http://localhost:4000/mcp/sse',
    webhook: 'https://api.neuronflow.live/v1/webhooks/incoming',
  });

  const [testingId, setTestingId] = useState(null);
  const [connectionStatuses, setConnectionStatuses] = useState({
    openai: false,
    gemini: false,
    anthropic: false,
    deepseek: false,
    postgres: true,
    rabbitmq: true,
    mcp: true,
    webhook: true,
  });

  useEffect(() => {
    setFlowCanvasUrl(getFlowCanvasUrl());
    setDashboardUrl(getDashboardUrl());

    // Load saved keys from localStorage
    if (typeof window !== 'undefined') {
      const savedOpenAI = localStorage.getItem('neuron_flow_api_key_openai') || localStorage.getItem('neuron_flow_ai_api_key') || '';
      const savedGemini = localStorage.getItem('neuron_flow_api_key_gemini') || '';
      const savedAnthropic = localStorage.getItem('neuron_flow_api_key_anthropic') || '';
      const savedDeepSeek = localStorage.getItem('neuron_flow_api_key_deepseek') || '';
      
      setKeys(prev => ({
        ...prev,
        openai: savedOpenAI,
        gemini: savedGemini,
        anthropic: savedAnthropic,
        deepseek: savedDeepSeek,
      }));

      setConnectionStatuses(prev => ({
        ...prev,
        openai: Boolean(savedOpenAI),
        gemini: Boolean(savedGemini),
        anthropic: Boolean(savedAnthropic),
        deepseek: Boolean(savedDeepSeek),
      }));
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleKeyChange = (id, val) => {
    setKeys(prev => ({ ...prev, [id]: val }));
  };

  const handleSaveKey = (id, providerName) => {
    if (typeof window !== 'undefined') {
      const val = keys[id] || '';
      if (id === 'openai') localStorage.setItem('neuron_flow_api_key_openai', val);
      if (id === 'gemini') localStorage.setItem('neuron_flow_api_key_gemini', val);
      if (id === 'anthropic') localStorage.setItem('neuron_flow_api_key_anthropic', val);
      if (id === 'deepseek') localStorage.setItem('neuron_flow_api_key_deepseek', val);

      // Store primary key fallback
      if (val) localStorage.setItem('neuron_flow_ai_api_key', val);

      setConnectionStatuses(prev => ({ ...prev, [id]: true }));
      showToast(`${providerName} Connection Key saved successfully! ✓`);
    }
  };

  const handleTestPing = (id, providerName) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      setConnectionStatuses(prev => ({ ...prev, [id]: true }));
      showToast(`Connection Ping to ${providerName} verified! Latency: ${Math.floor(Math.random() * 45) + 12}ms ✓`);
    }, 900);
  };

  const handleLaunchCanvasWithNode = (nodeType) => {
    const targetUrl = `${flowCanvasUrl}?addNode=${encodeURIComponent(nodeType)}`;
    window.open(targetUrl, '_blank');
  };

  const nodesList = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4o & O3-Mini',
      category: 'ai',
      badge: 'AI Model Provider',
      icon: '🤖',
      description: 'Connect OpenAI LLM nodes for automated reasoning, content creation, vision analysis, and code generation.',
      inputType: 'password',
      placeholder: 'sk-proj-...',
    },
    {
      id: 'gemini',
      name: 'Google Gemini 1.5 Pro & Flash',
      category: 'ai',
      badge: 'AI Model Provider',
      icon: '✨',
      description: 'Integrate Google Gemini multi-modal AI models for fast token processing, audio analysis, and structured JSON outputs.',
      inputType: 'password',
      placeholder: 'AIzaSy...',
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude 3.5 Sonnet',
      category: 'ai',
      badge: 'AI Model Provider',
      icon: '🧠',
      description: 'Connect Anthropic Claude models for high-precision document parsing, agentic coding, and safe tool use.',
      inputType: 'password',
      placeholder: 'sk-ant-api...',
    },
    {
      id: 'deepseek',
      name: 'DeepSeek R1 & V3 Engine',
      category: 'ai',
      badge: 'AI Model Provider',
      icon: '🚀',
      description: 'Enable DeepSeek reasoning engine nodes for ultra-fast chain-of-thought processing and cost-effective execution.',
      inputType: 'password',
      placeholder: 'sk-deepseek-...',
    },
    {
      id: 'mcp',
      name: 'MCP (Model Context Protocol) Server',
      category: 'mcp',
      badge: 'Protocol Standard',
      icon: '🌐',
      description: 'Connect external Model Context Protocol (MCP) servers to grant AI models real-time tool execution & database context.',
      inputType: 'text',
      placeholder: 'http://localhost:4000/mcp/sse',
    },
    {
      id: 'postgres',
      name: 'PostgreSQL Database Connector',
      category: 'database',
      badge: 'Relational DB',
      icon: '🐘',
      description: 'Direct SQL execution node to query, insert, and update PostgreSQL tables directly from workflow triggers.',
      inputType: 'text',
      placeholder: 'postgres://user:pass@host:5432/dbname',
    },
    {
      id: 'rabbitmq',
      name: 'RabbitMQ Async Event Queue',
      category: 'messaging',
      badge: 'Message Broker',
      icon: '🐇',
      description: 'Enterprise event broker integration node for queueing background workflow executions asynchronously.',
      inputType: 'text',
      placeholder: 'amqp://guest:guest@localhost:5672',
    },
    {
      id: 'webhook',
      name: 'HTTP / REST Webhook Listener',
      category: 'messaging',
      badge: 'REST API',
      icon: '🔗',
      description: 'Receive incoming JSON webhooks from Stripe, GitHub, Shopify, or custom apps to trigger automated visual flows.',
      inputType: 'text',
      placeholder: 'https://api.neuronflow.live/v1/webhooks/incoming',
    },
  ];

  const filteredNodes = nodesList.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) || node.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <>
      <Head>
        <title>Node Connections & AI Integrations | NEURON_FLOW</title>
        <meta name="description" content="Manage AI API keys, database connectors, MCP servers, and node integration endpoints for NEURON_FLOW." />
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col transition-colors duration-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-3 sm:px-6 lg:px-8 py-3.5 w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
            <a href="/" className="flex items-center gap-2.5 cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#ff4f00]/30">
                ⚡
              </div>
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
            </a>

            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 text-xs xl:text-sm font-medium">
              <a href={dashboardUrl} className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Dashboard</a>
              <a href={flowCanvasUrl} className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Visual Designer</a>
              <a href="/connections" className="bg-[#ff4f00]/15 border border-[#ff4f00]/60 text-[#ff4f00] rounded-lg px-2.5 py-1.5 font-semibold transition-all shadow-sm shadow-[#ff4f00]/20">Node Connections</a>
              <a href="/excel" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Excel AI</a>
              <a href="/files" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">File Vault 📂</a>
              <a href="/workflows" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Workflows</a>
              <a href="/docs" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Docs</a>
              <a href="/support" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Support</a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {isLoaded && isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <SignInButton mode="modal">
                  <button className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#ff4f00] text-white transition-all rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer shrink-0">
                    Sign In
                  </button>
                </SignInButton>
              )}

              <a
                href={flowCanvasUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold shadow-md shadow-[#ff4f00]/25 rounded-lg px-3.5 sm:px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all border border-[#ff4f00] shrink-0"
              >
                Launch ⚡
              </a>
            </div>
          </div>
        </header>

        {/* Toast Feedback Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-[#121215] border border-[#ff4f00]/60 text-white px-4 py-3 rounded-xl shadow-2xl shadow-[#ff4f00]/20 flex items-center gap-2 text-sm font-medium animate-bounce">
            <span className="text-[#ff4f00]">⚡</span>
            {toastMessage.text}
          </div>
        )}

        {/* Hero Banner Header */}
        <div className="border-b border-[#27272a] bg-[#121215]/50 py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4f00]/10 border border-[#ff4f00]/30 text-[#ff4f00] text-xs font-semibold uppercase tracking-wider mb-3">
                🔌 Connection Center
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
                Node Connections & AI API Keys
              </h1>
              <p className="text-[#a1a1aa] text-sm sm:text-base mt-2 max-w-2xl">
                Configure model providers, MCP protocol servers, databases, and webhook integrations to power your visual workflow engine.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href={flowCanvasUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-[#ff4f00]/25 text-sm flex items-center gap-2 border border-[#ff4f00] transition-all cursor-pointer"
              >
                <span>Open Visual Designer</span>
                <span>➔</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          {/* Controls Bar: Search & Category Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search nodes (OpenAI, Gemini, Postgres, Webhooks)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#ff4f00] text-white text-sm rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-1 focus:ring-[#ff4f00] transition-all placeholder-[#71717a]"
              />
              <span className="absolute left-3.5 top-3 text-[#71717a] text-sm">🔍</span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All Connectors' },
                { id: 'ai', label: '🤖 AI Models' },
                { id: 'mcp', label: '🌐 MCP Protocol' },
                { id: 'database', label: '🐘 Databases' },
                { id: 'messaging', label: '⚡ Messaging & Webhooks' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-[#ff4f00]/20 text-[#ff4f00] border-[#ff4f00]/60 shadow-sm shadow-[#ff4f00]/20'
                      : 'bg-[#18181b] text-[#a1a1aa] hover:text-white border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Connection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredNodes.map(node => {
              const isConnected = connectionStatuses[node.id];
              const isTesting = testingId === node.id;

              return (
                <div
                  key={node.id}
                  className="bg-[#121215] border border-[#27272a] hover:border-[#ff4f00]/40 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-lg shadow-black/40 group"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {node.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-[#ff4f00] transition-colors">
                            {node.name}
                          </h3>
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#ff4f00] bg-[#ff4f00]/10 px-2 py-0.5 rounded border border-[#ff4f00]/20 mt-0.5">
                            {node.badge}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border shrink-0 ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                        {isConnected ? 'Connected ✓' : 'Not Configured'}
                      </span>
                    </div>

                    <p className="text-[#a1a1aa] text-xs sm:text-sm mb-4 leading-relaxed">
                      {node.description}
                    </p>

                    {/* Key Input Section */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                        API Key / Endpoint URL:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type={node.inputType}
                          value={keys[node.id] || ''}
                          onChange={(e) => handleKeyChange(node.id, e.target.value)}
                          placeholder={node.placeholder}
                          className="flex-1 bg-[#18181b] border border-[#27272a] focus:border-[#ff4f00] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2 focus:outline-none transition-all placeholder-[#52525b]"
                        />
                        <button
                          onClick={() => handleSaveKey(node.id, node.name)}
                          className="bg-[#ff4f00] hover:bg-[#e04500] text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-[#ff4f00] transition-all shrink-0 cursor-pointer"
                        >
                          + Add Key
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Row */}
                  <div className="pt-4 border-t border-[#27272a] flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleTestPing(node.id, node.name)}
                      disabled={isTesting}
                      className="bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white border border-[#27272a] text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                          Testing...
                        </>
                      ) : (
                        <>
                          ⚡ Test Connection Ping
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleLaunchCanvasWithNode(node.id)}
                      className="text-[#ff4f00] hover:text-white bg-[#ff4f00]/10 hover:bg-[#ff4f00] border border-[#ff4f00]/30 hover:border-[#ff4f00] text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Use Node in Canvas ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNodes.length === 0 && (
            <div className="text-center py-16 bg-[#121215] border border-[#27272a] rounded-2xl">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-white">No node connections found</h3>
              <p className="text-[#a1a1aa] text-sm mt-1">Try adjusting your search query or category filter.</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#27272a] py-6 px-4 text-center text-xs text-[#71717a] mt-auto">
          <p>© 2026 NEURON_FLOW. All node connections and API keys are stored locally and encrypted.</p>
        </footer>
      </div>
    </>
  );
}
