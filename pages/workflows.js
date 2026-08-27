import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl, getDashboardUrl } from '../lib/config';

export default function WorkflowsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('http://localhost:5173');
  const [dashboardUrl, setDashboardUrl] = useState('/');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [canvasError, setCanvasError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    const canvasUrl = getFlowCanvasUrl();
    setFlowCanvasUrl(canvasUrl);
    setDashboardUrl(getDashboardUrl());

    // Health check port 5173
    fetch(canvasUrl, { mode: 'no-cors' })
      .then(() => setCanvasError(false))
      .catch(() => setCanvasError(true));
  }, []);

  const handleOpenDiagram = (e) => {
    if (e) e.preventDefault();
    const url = flowCanvasUrl || 'http://localhost:5173';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const templates = [
    {
      title: '10s Interval Health Check & Email Dispatcher',
      category: 'System Health',
      icon: '⏱️',
      description: 'Periodically pings endpoint health every 10 seconds and triggers SMTP email alerts on failure.',
    },
    {
      title: 'Excel AI Data Transformation Pipeline',
      category: 'Data Processing',
      icon: '📊',
      description: 'Parses spreadsheet rows, applies custom JS transformations, and outputs structured JSON.',
    },
    {
      title: 'Multi-Provider AI Prompt Orchestration',
      category: 'AI Engine',
      icon: '🤖',
      description: 'Chains OpenAI GPT-4o, Anthropic Claude, and Gemini 2.0 nodes with dynamic variable interpolation.',
    },
  ];

  return (
    <>
      <Head>
        <title>Visual Flow Diagram & Workflow Designer | NEURON_FLOW</title>
        <meta name="description" content="Visual React Flow canvas editor and node graph workflow manager for NEURON_FLOW." />
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col transition-colors duration-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ⚡
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ff4f00]/10 text-[#ff4f00] border border-[#ff4f00]/20 hidden sm:inline-block">
                Visual Designer
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium bg-[#121215]/90 p-1.5 rounded-xl border border-[#ff4f00]/30 shadow-[0_0_20px_rgba(255,79,0,0.08)] backdrop-blur-md transition-all duration-300">
              <a href={dashboardUrl} className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Dashboard</a>
              <a href="/workflows" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-[#ff4f00] bg-[#ff4f00]/15 border border-[#ff4f00]/40 shadow-sm shadow-[#ff4f00]/20 transition-all duration-200">Visual Flow Designer</a>
              <a href="/excel" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Excel AI</a>
              <a href="/files" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">File Vault 📂</a>
              <a href="/docs" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Docs</a>
              <a href="/support" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Support</a>
              <a href="/privacy" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Privacy</a>
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

              <button
                onClick={handleOpenDiagram}
                id="open-visual-flow-btn-header"
                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold shadow-md shadow-[#ff4f00]/25 rounded-lg px-3.5 sm:px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shrink-0 border border-[#ff4f00] active:scale-95 cursor-pointer"
              >
                <span>⚡</span>
                <span className="hidden xs:inline sm:inline">Open Visual Flow Diagram</span>
                <span className="inline xs:hidden sm:hidden">Launch Flow ⚡</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#141417] via-[#0d0d0f] to-[#09090b] border-b border-[#27272a] px-6 py-10 lg:py-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ff4f00]/10 border border-[#ff4f00]/30 text-xs font-semibold text-[#ff4f00] mb-3">
                <span className="w-2 h-2 rounded-full bg-[#ff4f00] animate-pulse"></span>
                Interactive React Flow Canvas Engine
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2">
                Visual Flow Diagram & Canvas
              </h1>
              <p className="text-sm sm:text-base text-[#a1a1aa] max-w-2xl">
                Build, connect, and execute node-based workflows in real time. Drag triggers, AI processors, script nodes, and custom webhooks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleOpenDiagram}
                id="open-visual-flow-diagram-hero-btn"
                className="px-6 py-3.5 rounded-xl bg-[#ff4f00] text-white font-semibold hover:bg-[#e04500] active:scale-95 transition shadow-lg shadow-[#ff4f00]/20 flex items-center gap-2 text-base cursor-pointer"
              >
                <span>⚡</span> Open Visual Flow Diagram
              </button>
              <a
                href={flowCanvasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 rounded-xl bg-[#18181b] border border-[#27272a] text-white font-medium hover:bg-[#27272a] hover:border-[#ff4f00] transition flex items-center gap-2 text-base"
              >
                ↗️ Launch in New Window
              </a>
            </div>
          </div>
        </section>

        {/* Main Canvas & Templates Section */}
        <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 flex flex-col gap-8">
          {/* Embedded React Flow Canvas */}
          <div className="bg-[#141417] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Canvas Header Control Bar */}
            <div className="bg-[#18181b] px-6 py-3.5 border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                </div>
                <span className="text-sm font-semibold text-white ml-2">Visual Workflow Diagram Canvas</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono">
                  {flowCanvasUrl}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => {
                    const iframe = document.getElementById('flow-canvas-iframe');
                    if (iframe) iframe.src = flowCanvasUrl;
                  }}
                  className="px-3 py-1.5 rounded bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition flex items-center gap-1.5"
                >
                  🔄 Reload Canvas
                </button>
                <button
                  onClick={handleOpenDiagram}
                  id="open-visual-flow-btn-toolbar"
                  className="px-3.5 py-1.5 rounded bg-[#ff4f00] text-white font-medium hover:bg-[#e04500] transition flex items-center gap-1.5"
                >
                  ⚡ Open Diagram Full Screen
                </button>
              </div>
            </div>

            {/* Canvas Frame Container */}
            <div className="relative w-full h-[650px] bg-[#09090b]">
              <iframe
                id="flow-canvas-iframe"
                src={flowCanvasUrl}
                className="w-full h-full border-0"
                title="Visual Flow Diagram Canvas"
                onLoad={() => setIsIframeLoaded(true)}
              />

              {/* Loading Overlay */}
              {!isIframeLoaded && (
                <div className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
                  <div className="w-12 h-12 rounded-full border-4 border-[#ff4f00] border-t-transparent animate-spin mb-4"></div>
                  <h3 className="text-lg font-bold text-white mb-2">Connecting to Visual Flow Canvas...</h3>
                  <p className="text-sm text-[#a1a1aa] max-w-md mb-6">
                    Loading node editor runtime at <code className="text-[#ff4f00]">{flowCanvasUrl}</code>.
                  </p>
                  <button
                    onClick={handleOpenDiagram}
                    id="open-visual-flow-btn-loading"
                    className="px-5 py-2.5 rounded-xl bg-[#ff4f00] text-white font-medium hover:bg-[#e04500] transition shadow-md"
                  >
                    ⚡ Open Visual Flow Diagram Directly
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick-Start Workflow Templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📚</span> Pre-Configured Workflow Templates
              </h2>
              <span className="text-xs text-[#a1a1aa]">Click template to launch in Visual Designer</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.title}
                  onClick={handleOpenDiagram}
                  className="bg-[#141417] border border-[#27272a] hover:border-[#ff4f00] rounded-xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{tpl.icon}</span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#18181b] text-[#ff4f00] border border-[#27272a]">
                        {tpl.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#ff4f00] transition mb-2">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
                      {tpl.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-[#ff4f00] pt-3 border-t border-[#27272a]">
                    <span>Load Template</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#09090b] border-t border-[#27272a] px-6 py-8 text-center text-xs text-[#a1a1aa]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#ff4f00] flex items-center justify-center text-white font-bold text-xs">⚡</div>
              <span className="font-bold text-white">NEURON_FLOW</span>
              <span>© {new Date().getFullYear()} Monorepo Workflow Engine</span>
            </div>
            <div className="flex items-center gap-6">
              <a href={dashboardUrl} className="hover:text-white transition">Dashboard</a>
              <button onClick={handleOpenDiagram} className="hover:text-[#ff4f00] transition">Visual Flow Designer</button>
              <a href="/excel" className="hover:text-white transition">Excel AI</a>
              <a href="/files" className="hover:text-white transition">File Vault</a>
              <a href="/docs" className="hover:text-white transition">Docs</a>
              <a href="/support" className="hover:text-white transition">Support</a>
              <a href="/privacy" className="hover:text-white transition">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
