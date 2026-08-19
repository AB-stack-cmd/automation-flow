import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl, getDashboardUrl } from '../lib/config';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncedUser, setSyncedUser] = useState(null);
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('http://localhost:5173');
  const [dashboardUrl, setDashboardUrl] = useState('/');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    setFlowCanvasUrl(getFlowCanvasUrl());
    setDashboardUrl(getDashboardUrl());
  }, []);

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
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-6 py-4 transition-colors">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-[#ff4f00] flex items-center justify-center text-[#ffffff] font-bold text-lg shadow-sm">
                ⚡
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-base font-medium">
              <a href={dashboardUrl} className="text-[#ff4f00] border-b-2 border-[#ff4f00] pb-1 font-semibold">Dashboard</a>
              <a href={flowCanvasUrl} className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Visual Flow Designer</a>
              <a href="/excel" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Excel AI</a>
              <a href="/files" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">File Vault 📂</a>
              <a href="/docs" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Docs</a>
              <a href="/support" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Support</a>
              <a href="/privacy" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Privacy</a>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium bg-[#1f1f23] border border-[#27272a] text-[#e4e4e7]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff4f00] animate-pulse"></span>
                Dark Theme Active 🌙
              </div>

              {isLoaded && isSignedIn ? (
                <div className="flex items-center gap-2">
                  {syncedUser && (
                    <span className="text-sm font-medium text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-500/20 hidden lg:inline">
                      Prisma Synced ✓
                    </span>
                  )}
                  <UserButton afterSignOutUrl="/" />
                </div>
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

        {/* Hero Band */}
        <section className="bg-[#09090b] px-6 py-20 lg:py-28 text-center max-w-5xl mx-auto flex flex-col items-center transition-colors">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-sm font-medium text-[#f4f4f5] mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4f00] animate-pulse"></span>
            NEURON_FLOW Workflow Engine 2.0
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-none text-white mb-6">
            Automation for everyone. <br />
            <span className="text-[#ff4f00]">Orchestrated effortlessly.</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-[#a1a1aa] max-w-2xl mb-10 leading-relaxed font-normal">
            Connect your apps and automate workflows using intuitive node graphs, real-time trigger execution, and custom script runtimes. Automatically synchronized with your system theme.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href={flowCanvasUrl}
              className="px-8 py-3.5 bg-[#ff4f00] text-white text-base font-medium rounded-md shadow-md hover:bg-[#e04500] transition active:scale-98"
            >
              Start Automating Free
            </a>
            <a
              href="/docs"
              className="px-8 py-3.5 bg-[#18181b] border border-[#27272a] text-[#f4f4f5] text-base font-medium rounded-md hover:bg-[#27272a] hover:border-[#ff4f00] transition"
            >
              📚 Platform Documentation
            </a>
            <a
              href="/excel"
              className="px-8 py-3.5 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] text-base font-medium rounded-md hover:bg-[#27272a] hover:text-white transition"
            >
              Excel AI
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
                  className="w-full py-3 bg-[#ff4f00] text-white text-sm font-medium rounded-md text-center hover:bg-[#e04500] transition"
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
                  className="w-full py-3 bg-[#ff4f00] text-white text-sm font-semibold rounded-md text-center hover:bg-[#e04500] transition"
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
                  className="w-full py-3 bg-[#ff4f00] text-white text-sm font-medium rounded-md text-center hover:bg-[#e04500] transition"
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
              <a href="http://localhost:5173" className="hover:text-[#ff4f00] transition">Visual Flow Designer</a>
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

