import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl, getDashboardUrl } from '../lib/config';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncedUser, setSyncedUser] = useState(null);
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('http://localhost:5173');
  const [dashboardUrl, setDashboardUrl] = useState('/');
  const [aiKeyProvider, setAiKeyProvider] = useState('openai');
  const [aiApiKeyInput, setAiApiKeyInput] = useState('');
  const [aiKeySavedMsg, setAiKeySavedMsg] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    setFlowCanvasUrl(getFlowCanvasUrl());
    setDashboardUrl(getDashboardUrl());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existing = localStorage.getItem(`neuron_flow_api_key_${aiKeyProvider}`) || localStorage.getItem('neuron_flow_ai_api_key') || '';
    setAiApiKeyInput(existing);
  }, [aiKeyProvider]);

  const handleAddAiKey = () => {
    if (!aiApiKeyInput.trim()) return;
    localStorage.setItem(`neuron_flow_api_key_${aiKeyProvider}`, aiApiKeyInput.trim());
    localStorage.setItem('neuron_flow_ai_api_key', aiApiKeyInput.trim());
    setAiKeySavedMsg(true);
    setTimeout(() => setAiKeySavedMsg(false), 3000);
  };

  // Automatic Prisma Sync when user signs in via Clerk
  useEffect(() => {
    if (isSignedIn && user) {
      const syncUserToPrisma = async () => {
        try {
          const res = await fetch('/api/user/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress || `${user.id}@clerk.local`,
              name: user.fullName || user.firstName || 'Clerk User',
              imageUrl: user.imageUrl,
            }),
          });
          const data = await res.json();
          if (data.success) {
            setSyncedUser(data.user);
          }
        } catch (e) {
          console.error('Failed to sync Clerk user to Prisma:', e);
        }
      };
      syncUserToPrisma();
    }
  }, [isSignedIn, user]);

  return (
    <>
      <Head>
        <title>NEURON_FLOW | Workflow Automation</title>
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col transition-colors duration-200">
        {/* Navigation Bar (nav-bar) */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-3 sm:px-6 lg:px-8 py-3.5 transition-colors w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
            {/* Brand / Logo */}
            <a href="/" className="flex items-center gap-2.5 cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#ff4f00]/30">
                ⚡
              </div>
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
            </a>

            {/* Navigation Links (Responsive Flex Container) */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 text-xs xl:text-sm font-medium">
              <a href={dashboardUrl} className="bg-[#ff4f00]/15 border border-[#ff4f00]/60 text-[#ff4f00] rounded-lg px-2.5 py-1.5 font-semibold transition-all shadow-sm shadow-[#ff4f00]/20">Dashboard</a>
              <a href={flowCanvasUrl} className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Visual Designer</a>
              <a href="/connections" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Node Connections</a>
              <a href="/excel" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Excel AI</a>
              <a href="/files" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">File Vault 📂</a>
              <a href="/workflows" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Workflows</a>
              <a href="/analytics" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1">
                Analytics <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#ff4f00]/20 text-[#ff4f00] uppercase">SOON</span>
              </a>
              <a href="/docs" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Docs</a>
              <a href="/support" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Support</a>
              <a href="/privacy" className="text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all">Privacy</a>
            </nav>

            {/* Right Action Group - Always Visible and Perfectly Aligned */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="hidden 2xl:inline-flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] text-white rounded-lg px-3 py-1.5 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#ff4f00] animate-pulse"></span>
                Dark Theme 🌙
              </div>

              {isLoaded && isSignedIn ? (
                <div className="flex items-center gap-2 shrink-0">
                  {syncedUser && (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20 hidden xl:inline">
                      Synced ✓
                    </span>
                  )}
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#ff4f00] text-white transition-all rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer shrink-0">
                    Sign In
                  </button>
                </SignInButton>
              )}

              {/* Primary Header Launch Button */}
              <a
                href={flowCanvasUrl}
                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold shadow-md shadow-[#ff4f00]/25 rounded-lg px-3.5 sm:px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shrink-0 border border-[#ff4f00] active:scale-95 cursor-pointer"
                id="header-launch-visual-editor-btn"
              >
                <span>⚡</span>
                <span className="hidden xs:inline sm:inline">Launch Visual Editor</span>
                <span className="inline xs:hidden sm:hidden">Launch ⚡</span>
              </a>
            </div>
          </div>
        </header>

        {/* Hero Band */}
        <section className="bg-[#09090b] px-4 sm:px-6 py-12 sm:py-18 lg:py-24 text-center max-w-5xl mx-auto flex flex-col items-center justify-center transition-colors">
          <div className="inline-flex items-center justify-center gap-2.5 px-4 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-xs sm:text-sm font-medium text-[#f4f4f5] mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4f00] animate-pulse"></span>
            NEURON_FLOW Workflow Engine 2.0
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-tight text-white mb-6 text-center">
            Automation for everyone. <br className="hidden sm:inline" />
            <span className="text-[#ff4f00]">Orchestrated effortlessly.</span>
          </h1>

          <p className="text-sm sm:text-lg lg:text-xl text-[#a1a1aa] max-w-2xl mb-8 leading-relaxed font-normal text-center">
            Connect your apps and automate workflows using intuitive node graphs, real-time trigger execution, and custom script runtimes. Automatically synchronized with your system theme.
          </p>

          {/* Quick Launch Control Card - Front Page Center */}
          <div className="w-full max-w-2xl bg-[#141417] border border-[#27272a] hover:border-[#ff4f00]/50 rounded-2xl p-4 sm:p-6 mb-8 shadow-xl shadow-black/40 text-left transition-all">
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">All Systems Operational</span>
              </div>
              <span className="text-xs text-[#a1a1aa] font-mono">Front Page Launcher</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={flowCanvasUrl}
                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold px-4 py-3.5 rounded-xl text-sm flex items-center justify-between gap-2 shadow-lg shadow-[#ff4f00]/30 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer border border-[#ff4f00]"
                id="hero-launch-visual-editor-btn"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚡</span>
                  <div className="flex flex-col text-left">
                    <span className="leading-tight font-extrabold text-white text-base">Launch Visual Editor</span>
                    <span className="text-[11px] text-white/80 font-normal">React Flow Canvas</span>
                  </div>
                </div>
                <span className="text-xl font-bold transition-transform group-hover:translate-x-1">→</span>
              </a>

              <a
                href="/excel"
                className="bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] hover:border-[#ff4f00] text-white font-semibold px-4 py-3.5 rounded-xl text-sm flex items-center justify-between gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
                id="hero-launch-excel-ai-btn"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div className="flex flex-col text-left">
                    <span className="leading-tight font-bold text-white text-base">Launch Excel AI</span>
                    <span className="text-[11px] text-[#a1a1aa] font-normal">Spreadsheet Automation</span>
                  </div>
                </div>
                <span className="text-xl text-[#a1a1aa] font-bold transition-transform group-hover:translate-x-1 group-hover:text-white">→</span>
              </a>
            </div>

            {/* AI API Connection Key Section */}
            <div className="mt-4 pt-4 border-t border-[#27272a] flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔑</span>
                  <span className="text-xs font-bold text-white">AI API Connection Key</span>
                </div>
                {aiKeySavedMsg ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                    Key Saved & Connected ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-[#a1a1aa] font-mono">OpenAI / Gemini / Anthropic</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={aiKeyProvider}
                  onChange={(e) => setAiKeyProvider(e.target.value)}
                  className="bg-[#09090b] border border-[#27272a] focus:border-[#ff4f00] text-white text-xs rounded-lg px-2.5 py-2 outline-none cursor-pointer"
                >
                  <option value="openai">OpenAI (sk-...)</option>
                  <option value="gemini">Gemini (AIza...)</option>
                  <option value="anthropic">Anthropic (sk-ant...)</option>
                  <option value="deepseek">DeepSeek (sk-...)</option>
                </select>

                <input
                  type="password"
                  value={aiApiKeyInput}
                  onChange={(e) => setAiApiKeyInput(e.target.value)}
                  placeholder={`Enter ${aiKeyProvider.toUpperCase()} API key...`}
                  className="flex-1 bg-[#09090b] border border-[#27272a] focus:border-[#ff4f00] text-white text-xs rounded-lg px-3 py-2 outline-none font-mono"
                />

                <button
                  type="button"
                  onClick={handleAddAiKey}
                  className="bg-[#ff4f00] hover:bg-[#e04500] active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>+</span> Add Key
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center text-center gap-3 sm:gap-4 w-full">
            <a
              href={flowCanvasUrl}
              className="bg-[#ff4f00] text-white font-bold shadow-md hover:bg-[#e04500] px-6 py-3 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              🚀 Launch Visual Flow Editor
            </a>
            <a
              href="/docs"
              className="bg-[#18181b] border border-[#27272a] text-[#f4f4f5] hover:bg-[#27272a] hover:border-[#ff4f00] px-5 py-3 rounded-xl text-sm sm:text-base font-medium flex items-center justify-center gap-2 transition-all"
            >
              📚 Documentation
            </a>
            <a
              href="/files"
              className="bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white px-5 py-3 rounded-xl text-sm sm:text-base font-medium flex items-center justify-center gap-2 transition-all"
            >
              📂 File Vault
            </a>
          </div>
        </section>

        {/* Content Band */}
        <section className="bg-[#0c0c0e] border-y border-[#27272a] py-16 px-6 transition-colors">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-sm uppercase tracking-widest font-semibold text-[#ff4f00] block mb-2">Features & Capabilities</span>
              <h2 className="font-display text-3xl lg:text-4xl font-medium text-white">Three powered platforms in one monorepo</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Visual Designer */}
              <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-[#3f3f46] transition">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#1f1f23] border border-[#27272a] flex items-center justify-center text-2xl mb-4">
                    ⚡
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Visual React Flow Canvas</h3>
                  <p className="text-base text-[#a1a1aa] leading-relaxed mb-6 font-normal">
                    Compose webhooks, logic gates, delays, Google Sheets triggers, and AI agents on a responsive 12px rounded canvas.
                  </p>
                </div>
                <a
                  href={flowCanvasUrl}
                  className="btn-md w-full bg-[#ff4f00] text-white hover:bg-[#e04500]"
                >
                  Open Canvas Editor →
                </a>
              </div>

              {/* Card 2: Production Monorepo Engine */}
              <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-[#3f3f46] transition">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#ff4f00] text-white flex items-center justify-center text-2xl mb-4 font-bold">
                    🚀
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Production Engine</h3>
                  <p className="text-base text-[#a1a1aa] leading-relaxed mb-6 font-normal">
                    Backend execution daemon powered by Express, SQLite WAL mode, database concurrency queues, and background scheduled timers.
                  </p>
                </div>
                <a
                  href="http://localhost:4000/health"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-md w-full bg-[#ff4f00] text-white hover:bg-[#e04500]"
                >
                  Check Engine Health →
                </a>
              </div>

              {/* Card 3: Excel AI Spreadsheet */}
              <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-[#3f3f46] transition">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#1f1f23] border border-[#27272a] flex items-center justify-center text-2xl mb-4">
                    📊
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Excel AI Automation</h3>
                  <p className="text-base text-[#a1a1aa] leading-relaxed mb-6 font-normal">
                    Generate rows via prompts or synthetic AI data models, customize cell values, and export clean .xlsx files directly.
                  </p>
                </div>
                <a
                  href="/excel"
                  className="btn-md w-full bg-[#ff4f00] text-white hover:bg-[#e04500]"
                >
                  Launch Excel AI →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Showcase Grid */}
        <section className="py-20 px-6 max-w-6xl mx-auto text-center">
          <span className="text-sm uppercase tracking-widest font-semibold text-[#ff4f00] block mb-2">Connected Ecosystem</span>
          <h2 className="font-display text-3xl font-medium text-white mb-12">Integrate with your essential apps</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { name: 'Google Sheets', icon: '📊', type: 'Database' },
              { name: 'OpenAI GPT-4o', icon: '🤖', type: 'AI Agent' },
              { name: 'Slack Alerts', icon: '💬', type: 'Messaging' },
              { name: 'Discord Webhooks', icon: '🎮', type: 'Notifications' },
              { name: 'CRM Contacts', icon: '👥', type: 'Sales' },
              { name: 'Custom JS Script', icon: '💻', type: 'Code Logic' },
              { name: 'Timer Scheduler', icon: '⏰', type: 'Cron' },
              { name: 'Google Forms', icon: '📋', type: 'Triggers' },
            ].map((app) => (
              <div key={app.name} className="p-5 bg-[#141417] border border-[#27272a] rounded-xl text-left flex items-center gap-4 hover:border-[#ff4f00] transition">
                <span className="text-2xl">{app.icon}</span>
                <div>
                  <div className="text-base font-medium text-[#f4f4f5]">{app.name}</div>
                  <div className="text-sm text-[#a1a1aa] font-normal">{app.type}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto bg-[#09090b] text-[#a1a1aa] py-12 px-6 border-t border-[#27272a]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-display text-xl font-bold text-white">NEURON_FLOW</div>
              <p className="text-sm text-[#a1a1aa] mt-1 font-normal">© 2026 NEURON_FLOW. Synchronized dark theme overview dashboard.</p>
            </div>
            <div className="flex gap-6 text-sm text-[#a1a1aa] font-normal">
              <a href={flowCanvasUrl} className="hover:text-[#ff4f00] transition">Visual Flow Designer</a>
              <a href="/excel" className="hover:text-[#ff4f00] transition">Excel AI</a>
              <a href="/support" className="hover:text-[#ff4f00] transition">Support</a>
              <a href="/privacy" className="hover:text-[#ff4f00] transition">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

