import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [syncedUser, setSyncedUser] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
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
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Mona+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: "class",
              theme: {
                extend: {
                  colors: {
                    "primary": "#ff4f00",
                    "on-primary": "#fffefb",
                    "ink": "#201515",
                    "ink-soft": "#2f2a26",
                    "ink-mid": "#36342e",
                    "body": "#605d52",
                    "body-mid": "#939084",
                    "mute": "#c5c0b1",
                    "canvas": "#fffefb",
                    "canvas-soft": "#f8f4f0"
                  },
                  borderRadius: {
                    "none": "0px",
                    "sm": "6px",
                    "md": "12px",
                    "pill": "9999px"
                  },
                  fontFamily: {
                    "display": ["Mona Sans", "Degular Display", "Inter", "sans-serif"],
                    "body": ["Inter", "sans-serif"]
                  }
                }
              }
            }
        <style>{`
          html, body {
            background-color: #09090b !important;
            color: #f4f4f5 !important;
          }
        `}</style>
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col transition-colors duration-200">
        {/* Navigation Bar (nav-bar) */}
        <header className="sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] px-6 py-4 transition-colors">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-[#ff4f00] flex items-center justify-center text-[#fffefb] font-bold text-lg shadow-sm">
                ⚡
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-[#201515] dark:text-[#ffffff]">NEURON_FLOW</span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
              <a href="http://localhost:3000" className="text-[#ff4f00] border-b-2 border-[#ff4f00] pb-1">Dashboard</a>
              <a href="http://localhost:5173" className="text-[#201515] dark:text-[#e4e4e7] hover:text-[#ff4f00] dark:hover:text-[#ff4f00] transition">Visual Flow Designer</a>
              <a href="/excel" className="text-[#201515] dark:text-[#e4e4e7] hover:text-[#ff4f00] dark:hover:text-[#ff4f00] transition">Excel AI</a>
              <a href="/files" className="text-[#201515] dark:text-[#e4e4e7] hover:text-[#ff4f00] dark:hover:text-[#ff4f00] transition">File Vault 📂</a>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1f1f23] border border-[#27272a] text-[#e4e4e7]">
                <span className="w-2 h-2 rounded-full bg-[#ff4f00] animate-pulse"></span>
                Dark Mode Active 🌙
              </div>

              {isLoaded && isSignedIn ? (
                <div className="flex items-center gap-2">
                  {syncedUser && (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-500/20 hidden lg:inline">
                      Prisma Synced ✓
                    </span>
                  )}
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#ff4f00] text-xs font-semibold text-white rounded-md transition">
                    Sign In
                  </button>
                </SignInButton>
              )}

              <a
                href="http://localhost:5173"
                className="px-5 py-2.5 bg-[#ff4f00] text-[#fffefb] font-semibold text-sm rounded-md hover:opacity-95 transition shadow-sm"
              >
                Launch Visual Editor
              </a>
            </div>
          </div>
        </header>

        {/* Hero Band (hero-band) */}
        <section className="bg-[#fffefb] dark:bg-[#121212] px-6 py-20 lg:py-28 text-center max-w-5xl mx-auto flex flex-col items-center transition-colors">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f8f4f0] dark:bg-[#1f1f23] border border-[#c5c0b1] dark:border-[#27272a] text-xs font-semibold text-[#201515] dark:text-[#f4f4f5] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#ff4f00] animate-pulse"></span>
            NEURON_FLOW Workflow Engine 2.0
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-none text-[#201515] dark:text-[#ffffff] mb-6">
            Automation for everyone. <br />
            <span className="text-[#ff4f00]">Orchestrated effortlessly.</span>
          </h1>

          <p className="text-lg lg:text-xl text-[#605d52] dark:text-[#a1a1aa] max-w-2xl mb-10 leading-relaxed">
            Connect your apps and automate workflows using intuitive node graphs, real-time trigger execution, and custom script runtimes. Automatically synchronized with your system theme.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="http://localhost:5173"
              className="px-8 py-3.5 bg-[#ff4f00] text-[#fffefb] text-base font-semibold rounded-md shadow-md hover:opacity-90 transition active:scale-98"
            >
              Start Automating Free
            </a>
            <a
              href="/excel"
              className="px-8 py-3.5 bg-[#fffefb] dark:bg-[#1f1f23] border border-[#201515] dark:border-[#3f3f46] text-[#201515] dark:text-[#f4f4f5] text-base font-semibold rounded-md hover:bg-[#f8f4f0] dark:hover:bg-[#27272a] transition"
            >
              Try Excel AI Generator
            </a>
          </div>
        </section>

        {/* Content Band Cream (content-band-cream) */}
        <section className="bg-[#f8f4f0] dark:bg-[#18181b] border-y border-[#c5c0b1] dark:border-[#27272a] py-16 px-6 transition-colors">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#201515] dark:text-[#ff4f00] block mb-2">Features & Capabilities</span>
              <h2 className="font-display text-3xl lg:text-4xl font-medium text-[#201515] dark:text-[#ffffff]">Three powered platforms in one monorepo</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Visual Designer */}
              <div className="bg-[#fffefb] dark:bg-[#1f1f23] border border-[#c5c0b1] dark:border-[#27272a] rounded-md p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <div>
                  <div className="w-12 h-12 rounded-md bg-[#f8f4f0] dark:bg-[#27272a] border border-[#201515] dark:border-[#3f3f46] flex items-center justify-center text-2xl mb-4">
                    ⚡
                  </div>
                  <h3 className="text-xl font-semibold text-[#201515] dark:text-[#ffffff] mb-2">Visual React Flow Canvas</h3>
                  <p className="text-sm text-[#605d52] dark:text-[#a1a1aa] leading-relaxed mb-6">
                    Compose webhooks, logic gates, delays, Google Sheets triggers, and AI agents on a responsive 12px rounded canvas.
                  </p>
                </div>
                <a
                  href="http://localhost:5173"
                  className="w-full py-2.5 bg-[#201515] dark:bg-[#ff4f00] text-[#fffefb] text-xs font-semibold rounded-md text-center hover:opacity-90 transition"
                >
                  Open Canvas Editor →
                </a>
              </div>

              {/* Card 2: Production Monorepo Engine */}
              <div className="bg-[#201515] dark:bg-[#27272a] text-[#fffefb] rounded-md p-6 flex flex-col justify-between shadow-md border dark:border-[#3f3f46]">
                <div>
                  <div className="w-12 h-12 rounded-md bg-[#ff4f00] text-[#fffefb] flex items-center justify-center text-2xl mb-4 font-bold">
                    🚀
                  </div>
                  <h3 className="text-xl font-semibold text-[#fffefb] mb-2">Production Engine</h3>
                  <p className="text-sm text-[#c5c0b1] dark:text-[#a1a1aa] leading-relaxed mb-6">
                    Backend execution daemon powered by Express, SQLite WAL mode, database concurrency queues, and background scheduled timers.
                  </p>
                </div>
                <a
                  href="http://localhost:4000/health"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-[#ff4f00] text-[#fffefb] text-xs font-bold rounded-md text-center hover:opacity-90 transition"
                >
                  Check Engine Health →
                </a>
              </div>

              {/* Card 3: Excel AI Spreadsheet */}
              <div className="bg-[#fffefb] dark:bg-[#1f1f23] border border-[#c5c0b1] dark:border-[#27272a] rounded-md p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <div>
                  <div className="w-12 h-12 rounded-md bg-[#f8f4f0] dark:bg-[#27272a] border border-[#201515] dark:border-[#3f3f46] flex items-center justify-center text-2xl mb-4">
                    📊
                  </div>
                  <h3 className="text-xl font-semibold text-[#201515] dark:text-[#ffffff] mb-2">Excel AI Automation</h3>
                  <p className="text-sm text-[#605d52] dark:text-[#a1a1aa] leading-relaxed mb-6">
                    Generate rows via prompts or synthetic AI data models, customize cell values, and export clean .xlsx files directly.
                  </p>
                </div>
                <a
                  href="/excel"
                  className="w-full py-2.5 bg-[#201515] dark:bg-[#ff4f00] text-[#fffefb] text-xs font-semibold rounded-md text-center hover:opacity-90 transition"
                >
                  Launch Excel AI →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Showcase Grid */}
        <section className="py-20 px-6 max-w-6xl mx-auto text-center">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#ff4f00] block mb-2">Connected Ecosystem</span>
          <h2 className="font-display text-3xl font-medium text-[#201515] dark:text-[#ffffff] mb-12">Integrate with your essential apps</h2>

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
              <div key={app.name} className="p-5 bg-[#f8f4f0] dark:bg-[#18181b] border border-[#c5c0b1] dark:border-[#27272a] rounded-md text-left flex items-center gap-4 hover:border-[#201515] dark:hover:border-[#ff4f00] transition">
                <span className="text-2xl">{app.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-[#201515] dark:text-[#f4f4f5]">{app.name}</div>
                  <div className="text-xs text-[#939084] dark:text-[#a1a1aa]">{app.type}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer (footer) */}
        <footer className="mt-auto bg-[#201515] dark:bg-[#09090b] text-[#f8f4f0] py-12 px-6 border-t dark:border-[#27272a]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-display text-xl font-bold text-[#fffefb]">NEURON_FLOW</div>
              <p className="text-xs text-[#c5c0b1] mt-1">© 2026 NEURON_FLOW. System theme auto-synchronized.</p>
            </div>
            <div className="flex gap-6 text-xs text-[#c5c0b1]">
              <a href="http://localhost:5173" className="hover:text-[#ff4f00] transition">Visual Flow Designer</a>
              <a href="/excel" className="hover:text-[#ff4f00] transition">Excel AI</a>
              <a href="http://localhost:4000/health" className="hover:text-[#ff4f00] transition">Engine Status</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

