import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl } from '../lib/config';

export default function DocumentationPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('http://localhost:5173');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    setFlowCanvasUrl(getFlowCanvasUrl());
  }, []);

  const sections = [
    { id: 'getting-started', title: '1. Getting Started', icon: '🚀' },
    { id: 'nodes-triggers', title: '2. Nodes & Triggers', icon: '⚡' },
    { id: 'ingest-engine', title: '3. Ingest Flow & Forms', icon: '📥' },
    { id: 'realtime-monitoring', title: '4. Real-Time Monitoring', icon: '📊' },
    { id: 'excel-mcp', title: '5. Excel & MCP Connector', icon: '🔌' },
    { id: 'api-reference', title: '6. API Reference', icon: '💻' },
    { id: 'deployment', title: '7. Production Deployment', icon: '☁️' },
  ];

  return (
    <>
      <Head>
        <title>Documentation & User Guide | NEURON_FLOW</title>
        <meta name="description" content="Official Documentation for NEURON_FLOW visual workflow automation, nodes, Ingest engine, and API routes." />
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col">
        {/* Header Navigation */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ⚡
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#ff4f00]/10 text-[#ff4f00] border border-[#ff4f00]/20 hidden sm:inline">
                Docs v2.0
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8 text-base font-medium">
              <a href="/" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Dashboard</a>
              <a href={flowCanvasUrl} className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Visual Flow Designer</a>
              <a href="/excel" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Excel AI</a>
              <a href="/docs" className="text-[#ff4f00] border-b-2 border-[#ff4f00] pb-1 font-semibold">Docs</a>
              <a href="/support" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Support</a>
              <a href="/privacy" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Privacy</a>
            </nav>

            <div className="flex items-center gap-3">
              {isLoaded && isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#ff4f00] text-sm font-medium text-white rounded-md transition">
                    Sign In
                  </button>
                </SignInButton>
              )}
              <a
                href={flowCanvasUrl}
                className="px-5 py-2.5 bg-[#ff4f00] text-white font-medium text-base rounded-md hover:bg-[#e04500] transition shadow-sm"
              >
                Launch Visual Editor
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#141417] to-[#09090b] px-6 py-12 border-b border-[#27272a]">
          <div className="max-w-7xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#ff4f00] block mb-2">Developer Documentation</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">NEURON_FLOW Platform Guide</h1>
            <p className="text-sm text-[#a1a1aa] max-w-3xl">
              Complete reference guide for visual node workflows, Ingest submission pipelines, real-time log monitoring, and deployment setups.
            </p>
          </div>
        </section>

        {/* Main Documentation Body */}
        <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar Section Menu */}
          <aside className="lg:col-span-3 space-y-2">
            <div className="sticky top-24 space-y-1">
              <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest block mb-3 px-3">
                Documentation Sections
              </span>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeSection === s.id
                      ? 'bg-[#18181b] text-[#ff4f00] border border-[#ff4f00]/30 font-semibold'
                      : 'text-[#a1a1aa] hover:bg-[#141417] hover:text-white'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>
          </aside>

          {/* Documentation Content Area */}
          <main className="lg:col-span-9 space-y-12 text-[#d4d4d8] leading-relaxed">
            {/* Section 1: Getting Started */}
            <section id="getting-started" className="p-6 bg-[#141417] border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                <h2 className="text-xl font-bold text-white">1. Getting Started & Local Setup</h2>
              </div>
              <p className="text-sm text-[#a1a1aa]">
                NEURON_FLOW connects your applications using visual drag-and-drop node graphs. To run all services locally:
              </p>
              <div className="bg-[#0a0a0c] p-4 rounded-lg border border-[#27272a] font-mono text-xs text-amber-400 select-all">
                # Push database schema & start all services concurrently<br />
                npm run dev:all
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <div className="text-xs font-bold text-white mb-1">Root Landing Dashboard</div>
                  <div className="text-xs font-mono text-[#ff4f00]">http://localhost:3000</div>
                </div>
                <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <div className="text-xs font-bold text-white mb-1">Visual Flow Designer (React Flow)</div>
                  <div className="text-xs font-mono text-[#ff4f00]">http://localhost:5173</div>
                </div>
                <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <div className="text-xs font-bold text-white mb-1">Automation Engine Monorepo</div>
                  <div className="text-xs font-mono text-[#ff4f00]">http://localhost:3001</div>
                </div>
                <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <div className="text-xs font-bold text-white mb-1">Express API Backend Engine</div>
                  <div className="text-xs font-mono text-[#ff4f00]">http://localhost:4000</div>
                </div>
              </div>
            </section>

            {/* Section 2: Nodes & Triggers */}
            <section id="nodes-triggers" className="p-6 bg-[#141417] border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h2 className="text-xl font-bold text-white">2. Visual Nodes & Triggers Guide</h2>
              </div>
              <p className="text-sm text-[#a1a1aa]">
                Workflows start at a trigger entry point and flow through downstream logic, transformations, and action nodes:
              </p>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <span className="font-bold text-amber-400">⏰ Schedule Trigger Node:</span> Triggers workflows on fixed interval timers (e.g. every 10 seconds) or cron expressions.
                </div>
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <span className="font-bold text-sky-400">✉️ Marketing Email Node:</span> Sends real-time SMTP emails or logs simulated outreach payloads.
                </div>
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <span className="font-bold text-emerald-400">🔀 If/Else Filter Node:</span> Splits data paths based on condition evaluation (<code className="text-emerald-300 font-mono">context.trigger.score &gt; 50</code>).
                </div>
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <span className="font-bold text-purple-400">🤖 OpenAI GPT-4o Node:</span> Generates AI summaries and completions based on dynamic prompt expressions.
                </div>
              </div>
            </section>

            {/* Section 3: Ingest Engine & Forms */}
            <section id="ingest-engine" className="p-6 bg-[#141417] border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📥</span>
                <h2 className="text-xl font-bold text-white">3. Ingest Engine & Form Submissions</h2>
              </div>
              <p className="text-sm text-[#a1a1aa]">
                Form submissions are ingested via <code className="text-amber-400 font-mono">POST /api/forms/[id]/submit</code>, queued in Inngest background event processing (<code className="text-amber-400 font-mono">form/submitted</code>), and executed against connected node graphs.
              </p>
              <div className="bg-[#0a0a0c] p-4 rounded-lg border border-[#27272a] font-mono text-xs text-zinc-300">
                curl -X POST http://localhost:3001/api/forms/form-id-123/submit \<br />
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                &nbsp;&nbsp;-d '&#123;"email": "jane@example.com", "name": "Jane Doe"&#125;'
              </div>
            </section>

            {/* Section 4: Real-Time Monitoring */}
            <section id="realtime-monitoring" className="p-6 bg-[#141417] border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h2 className="text-xl font-bold text-white">4. Real-Time Log Monitoring</h2>
              </div>
              <p className="text-sm text-[#a1a1aa]">
                Inspect active workflow runs using <code className="text-amber-400 font-mono">GET /api/executions/[id]/logs</code>. The frontend polls this endpoint every 500ms to stream live node step progression.
              </p>
              <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg text-xs font-mono text-emerald-400">
                ✓ Node progression: Form Ingest ➔ Inngest Event Queue ➔ Graph Engine ➔ Success
              </div>
            </section>

            {/* Section 5: Excel & MCP Connector */}
            <section id="excel-mcp" className="p-6 bg-[#141417] border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔌</span>
                <h2 className="text-xl font-bold text-white">5. Excel & Model Context Protocol (MCP) Nodes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <h3 className="text-sm font-bold text-white mb-1">📈 Excel Node</h3>
                  <p className="text-xs text-[#a1a1aa]">
                    Supports readSheet, writeSheet, appendRow, filterRows, and createWorkbook operations on `.xlsx` files.
                  </p>
                </div>
                <div className="p-4 bg-[#18181b] border border-[#27272a] rounded-lg">
                  <h3 className="text-sm font-bold text-white mb-1">🔌 MCP Connector Node</h3>
                  <p className="text-xs text-[#a1a1aa]">
                    Generic Model Context Protocol client pool for discovering and calling third-party app tools.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6: API Reference */}
            <section id="api-reference" className="p-6 bg-[#141417] border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💻</span>
                <h2 className="text-xl font-bold text-white">6. Core API Reference</h2>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">POST /api/forms/[id]/submit</span>
                  <span className="text-zinc-500">Form Ingest Endpoint</span>
                </div>
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <span className="text-sky-400 font-bold">GET /api/executions/[id]/logs</span>
                  <span className="text-zinc-500">Real-Time Step Logs</span>
                </div>
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <span className="text-amber-400 font-bold">POST /api/workflows/[id]/execute</span>
                  <span className="text-zinc-500">Direct Execution Trigger</span>
                </div>
              </div>
            </section>

            {/* Section 7: Production Deployment */}
            <section id="deployment" className="p-6 bg-[#141417] border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">☁️</span>
                <h2 className="text-xl font-bold text-white">7. Vercel & Production Deployment</h2>
              </div>
              <p className="text-sm text-[#a1a1aa]">
                Configure Vercel project settings:
              </p>
              <ul className="list-disc list-inside text-xs text-[#a1a1aa] space-y-1 font-mono">
                <li><strong className="text-white">Root Directory:</strong> ./ (or automation-engine/apps/web)</li>
                <li><strong className="text-white">Build Command:</strong> npm run build</li>
                <li><strong className="text-white">Output Directory:</strong> .next (or dist for Vite SPA)</li>
              </ul>
            </section>
          </main>
        </div>

        {/* Footer */}
        <footer className="mt-auto bg-[#09090b] text-[#a1a1aa] py-12 px-6 border-t border-[#27272a]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-display text-xl font-bold text-white">NEURON_FLOW</div>
              <p className="text-sm text-[#a1a1aa] mt-1 font-normal">© 2026 NEURON_FLOW. All rights reserved.</p>
            </div>
            <div className="flex gap-6 text-sm text-[#a1a1aa] font-normal">
              <a href={flowCanvasUrl} className="hover:text-[#ff4f00] transition">Visual Flow Designer</a>
              <a href="/excel" className="hover:text-[#ff4f00] transition">Excel AI</a>
              <a href="/docs" className="hover:text-[#ff4f00] transition">Docs</a>
              <a href="/support" className="hover:text-[#ff4f00] transition">Support</a>
              <a href="/privacy" className="hover:text-[#ff4f00] transition">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
