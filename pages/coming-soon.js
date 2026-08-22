import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl } from '../lib/config';

export default function ComingSoonPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('http://localhost:5173');

  const { feature, route, name } = router.query;

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    setFlowCanvasUrl(getFlowCanvasUrl());
  }, []);

  const pageTitle = name || feature || (route ? route.replace('/', '').toUpperCase() : 'Feature');
  const displayTitle = pageTitle ? `${pageTitle.charAt(0).toUpperCase()}${pageTitle.slice(1)} Page` : 'Feature';

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail('');
    }, 800);
  };

  const upcomingFeatures = [
    {
      title: 'Workflows & Engine Hub',
      icon: '⚡',
      route: '/workflows',
      badge: 'Phase 7.0',
      description: 'Centralized DAG visual workflow manager with multi-tenant scheduling & execution concurrency.',
      progress: 85,
    },
    {
      title: 'Analytics & Live Metrics',
      icon: '📊',
      route: '/analytics',
      badge: 'Phase 7.1',
      description: 'Real-time telemetry, step-by-step performance tracing, error breakdown, and API throughput graphs.',
      progress: 70,
    },
    {
      title: 'Integration Marketplace',
      icon: '🔌',
      route: '/integrations',
      badge: 'Phase 7.2',
      description: '50+ pre-built app connectors including HubSpot, Salesforce, Notion, GitHub, and custom Webhook nodes.',
      progress: 60,
    },
    {
      title: 'Team Workspaces & RBAC',
      icon: '👥',
      route: '/team',
      badge: 'Phase 7.3',
      description: 'Collaborative workflow editing, granular access controls, organization management, and audit logs.',
      progress: 50,
    },
    {
      title: 'Settings & API Keys Vault',
      icon: '⚙️',
      route: '/settings',
      badge: 'Phase 7.4',
      description: 'Encrypted secret keys manager, SMTP configuration, custom webhook endpoints, and usage quotas.',
      progress: 90,
    },
    {
      title: 'AI Agent Builder',
      icon: '🤖',
      route: '/agent-builder',
      badge: 'Phase 7.5',
      description: 'Autonomous multi-modal AI agents powered by OpenAI GPT-4o, Anthropic Claude, and Gemini 2.0.',
      progress: 75,
    },
  ];

  return (
    <>
      <Head>
        <title>{displayTitle} Coming Soon | NEURON_FLOW</title>
        <meta name="description" content="This page is under active development on the NEURON_FLOW platform roadmap." />
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col transition-colors duration-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ⚡
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ff4f00]/10 text-[#ff4f00] border border-[#ff4f00]/20">
                Roadmap Active
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8 text-base font-medium">
              <a href="/" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Dashboard</a>
              <a href={flowCanvasUrl} className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Visual Flow Designer</a>
              <a href="/excel" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Excel AI</a>
              <a href="/files" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">File Vault 📂</a>
              <a href="/docs" className="text-[#a1a1aa] hover:text-[#ff4f00] transition">Docs</a>
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
                Launch Editor
              </a>
            </div>
          </div>
        </header>

        {/* Hero Banner - Coming Soon Focus */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#141417] via-[#0d0d0f] to-[#09090b] px-6 py-20 lg:py-24 border-b border-[#27272a] text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#ff4f00]/10 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff4f00]/10 border border-[#ff4f00]/30 text-sm font-semibold text-[#ff4f00] mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4f00] animate-ping"></span>
              Under Active Development & Integration
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              {displayTitle} is <span className="text-[#ff4f00]">Coming Soon</span>
            </h1>

            <p className="text-base sm:text-lg text-[#a1a1aa] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              We are actively integrating this feature into the NEURON_FLOW monorepo ecosystem. Complete with real-time execution pipelines, visual canvas interfaces, and high-performance daemons.
            </p>

            {/* Notification Early Access Form */}
            <div className="max-w-md mx-auto mb-12 bg-[#141417] p-4 rounded-xl border border-[#27272a] shadow-lg">
              {subscribed ? (
                <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
                  <span>✨</span> You are on the early access VIP list! We will notify you upon launch.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for early access..."
                    className="flex-1 px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-sm text-white focus:outline-none focus:border-[#ff4f00] transition"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 bg-[#ff4f00] text-white text-sm font-medium rounded-lg hover:bg-[#e04500] transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {loading ? 'Subscribing...' : 'Notify Me 🚀'}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
              <a
                href="/"
                className="px-6 py-3 bg-[#18181b] border border-[#27272a] hover:border-[#ff4f00] text-white rounded-lg transition flex items-center gap-2"
              >
                ← Back to Dashboard
              </a>
              <a
                href={flowCanvasUrl}
                className="px-6 py-3 bg-[#ff4f00] text-white rounded-lg hover:bg-[#e04500] transition flex items-center gap-2 shadow-sm"
              >
                ⚡ Launch Visual Flow Designer
              </a>
              <a
                href="/excel"
                className="px-6 py-3 bg-[#18181b] border border-[#27272a] hover:border-[#ff4f00] text-white rounded-lg transition flex items-center gap-2"
              >
                📊 Try Excel AI
              </a>
            </div>
          </div>
        </section>

        {/* Upcoming Platform Roadmap Grid */}
        <section className="max-w-6xl mx-auto px-6 py-16 w-full flex-1">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#ff4f00] block mb-2">
              NEURON_FLOW Master Blueprint
            </span>
            <h2 className="font-display text-3xl font-bold text-white mb-3">
              Explore Features Currently In Progress
            </h2>
            <p className="text-sm text-[#a1a1aa] max-w-xl mx-auto">
              Our engineering team is executing multi-phase updates to connect node runtimes, databases, and visual canvas workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFeatures.map((item) => {
              const isCurrentTarget =
                (route && item.route === route) ||
                (feature && item.title.toLowerCase().includes(String(feature).toLowerCase()));

              return (
                <div
                  key={item.title}
                  className={`bg-[#141417] border rounded-xl p-6 flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                    isCurrentTarget
                      ? 'border-[#ff4f00] shadow-[0_0_30px_rgba(255,79,0,0.15)] ring-1 ring-[#ff4f00]'
                      : 'border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  {isCurrentTarget && (
                    <div className="absolute top-0 right-0 bg-[#ff4f00] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                      Current Target
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#1f1f23] border border-[#27272a] flex items-center justify-center text-2xl">
                        {item.icon}
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed mb-6 font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-2 font-medium">
                      <span>Integration Progress</span>
                      <span className="text-[#ff4f00] font-semibold">{item.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#1f1f23] rounded-full overflow-hidden border border-[#27272a]">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff4f00] to-[#ff7d40] rounded-full transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto bg-[#09090b] text-[#a1a1aa] py-12 px-6 border-t border-[#27272a]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-display text-xl font-bold text-white">NEURON_FLOW</div>
              <p className="text-sm text-[#a1a1aa] mt-1 font-normal">
                © 2026 NEURON_FLOW. Synchronized dark theme workflow engine.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[#a1a1aa] font-normal">
              <a href="/" className="hover:text-[#ff4f00] transition">Dashboard</a>
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
