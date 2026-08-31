import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl, getDashboardUrl } from '../lib/config';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncedUser, setSyncedUser] = useState(null);
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('/workflows');
  const [dashboardUrl, setDashboardUrl] = useState('/');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    setFlowCanvasUrl(getFlowCanvasUrl());
    setDashboardUrl(getDashboardUrl());
  }, []);

  const handleReloadCanvas = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenFullScreen = () => {
    window.location.href = flowCanvasUrl;
  };

  const handleLoadTemplate = (templateKey) => {
    const targetUrl = `/workflows?template=${templateKey}`;
    if (iframeRef.current) {
      iframeRef.current.src = targetUrl;
    } else {
      window.location.href = targetUrl;
    }
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
        <title>NEURON_FLOW | Visual Flow Designer & Workflow Automation</title>
        <meta name="description" content="Visual Flow Diagram Canvas and Workflow Automation Engine for NEURON_FLOW." />
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col transition-colors duration-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-3 sm:px-6 lg:px-8 py-3.5 transition-colors w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
            {/* Brand / Logo */}
            <a href="/" className="flex items-center gap-2.5 cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#ff4f00]/30">
                ⚡
              </div>
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
            </a>

            {/* Navigation Links */}
            <Navbar activePage="dashboard" />

            {/* Right Action Group */}
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

        {/* Main Production Canvas UI Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 flex flex-col gap-8">
          <div className="bg-[#141417] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-[#18181b] px-4 sm:px-6 py-3.5 border-b border-[#27272a] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                </div>
                <span className="text-sm font-semibold text-white ml-2">Visual Workflow Diagram Canvas</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono">/workflows</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={handleReloadCanvas}
                  className="px-3 py-1.5 rounded bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition flex items-center gap-1.5 cursor-pointer"
                >
                  🔄 Reload Canvas
                </button>
                <button
                  id="open-visual-flow-btn-toolbar"
                  onClick={handleOpenFullScreen}
                  className="px-3.5 py-1.5 rounded bg-[#ff4f00] text-white font-medium hover:bg-[#e04500] transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#ff4f00]/20"
                >
                  ⚡ Open Diagram Full Screen
                </button>
              </div>
            </div>
            <div className="relative w-full h-[650px] bg-[#09090b]">
              <iframe
                ref={iframeRef}
                id="flow-canvas-iframe"
                src="/workflows"
                className="w-full h-full border-0"
                title="Visual Flow Diagram Canvas"
              ></iframe>
            </div>
          </div>

          {/* Pre-Configured Workflow Templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📚</span> Pre-Configured Workflow Templates
              </h2>
              <span className="text-xs text-[#a1a1aa]">Click template to launch in Visual Designer</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Template 1 */}
              <div
                onClick={() => handleLoadTemplate('healthCheck')}
                className="bg-[#141417] border border-[#27272a] hover:border-[#ff4f00] rounded-xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">⏱️</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#18181b] text-[#ff4f00] border border-[#27272a]">
                      System Health
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#ff4f00] transition mb-2">
                    10s Interval Health Check &amp; Email Dispatcher
                  </h3>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
                    Periodically pings endpoint health every 10 seconds and triggers SMTP email alerts on failure.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-[#ff4f00] pt-3 border-t border-[#27272a]">
                  <span>Load Template</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              {/* Template 2 */}
              <div
                onClick={() => handleLoadTemplate('excelAiPipeline')}
                className="bg-[#141417] border border-[#27272a] hover:border-[#ff4f00] rounded-xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">📊</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#18181b] text-[#ff4f00] border border-[#27272a]">
                      Data Processing
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#ff4f00] transition mb-2">
                    Excel AI Data Transformation Pipeline
                  </h3>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
                    Parses spreadsheet rows, applies custom JS transformations, and outputs structured JSON.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-[#ff4f00] pt-3 border-t border-[#27272a]">
                  <span>Load Template</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              {/* Template 3 */}
              <div
                onClick={() => handleLoadTemplate('aiLeadRouter')}
                className="bg-[#141417] border border-[#27272a] hover:border-[#ff4f00] rounded-xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🤖</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#18181b] text-[#ff4f00] border border-[#27272a]">
                      AI Engine
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#ff4f00] transition mb-2">
                    Multi-Provider AI Prompt Orchestration
                  </h3>
                  <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
                    Chains OpenAI GPT-4o, Anthropic Claude, and Gemini 2.0 nodes with dynamic variable interpolation.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-[#ff4f00] pt-3 border-t border-[#27272a]">
                  <span>Load Template</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-[#09090b] text-[#a1a1aa] py-8 px-6 border-t border-[#27272a]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-display text-xl font-bold text-white">NEURON_FLOW</div>
              <p className="text-sm text-[#a1a1aa] mt-1 font-normal">© 2026 NEURON_FLOW. Synchronized visual flow designer.</p>
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


