import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl } from '../lib/config';

export default function PrivacyPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('/workflows');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    setFlowCanvasUrl(getFlowCanvasUrl());
  }, []);

  return (
    <>
      <Head>
        <title>Privacy Policy | NEURON_FLOW</title>
        <meta name="description" content="NEURON_FLOW Privacy Policy, Data Protection, and Security Commitments." />
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-3 sm:px-6 lg:px-8 py-3.5 transition-colors w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
            <a href="/" className="flex items-center gap-2.5 cursor-pointer shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#ff4f00]/30">
                ⚡
              </div>
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ff4f00]/10 text-[#ff4f00] border border-[#ff4f00]/20 hidden sm:inline-block">
                Privacy
              </span>
            </a>

            <Navbar activePage="privacy" />

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
                className="bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold shadow-md shadow-[#ff4f00]/25 rounded-lg px-3.5 sm:px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shrink-0 border border-[#ff4f00] active:scale-95 cursor-pointer"
              >
                <span>⚡</span>
                <span className="hidden xs:inline sm:inline">Launch Visual Editor</span>
                <span className="inline xs:hidden sm:hidden">Launch ⚡</span>
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#141417] to-[#09090b] px-6 py-16 border-b border-[#27272a] text-center">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#ff4f00] block mb-2">Legal & Security</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-sm text-[#a1a1aa]">Last updated: August 18, 2026 • Effective Date: Immediately</p>
          </div>
        </section>

        {/* Content Section */}
        <main className="py-16 px-6 max-w-4xl mx-auto text-[#d4d4d8] leading-relaxed space-y-10">
          <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl">
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              When you use NEURON_FLOW, we collect information required to authenticate your account and execute your visual automation flows:
            </p>
            <ul className="list-disc list-inside text-sm text-[#a1a1aa] mt-3 space-y-1">
              <li>Account profile details (email, name, profile image) via Clerk Authentication.</li>
              <li>Workflow layout definitions (nodes, connection edges, configuration parameters).</li>
              <li>Execution history logs and output payloads generated during automated step runs.</li>
              <li>Encrypted third-party service credentials (API keys, webhook tokens).</li>
            </ul>
          </div>

          <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl">
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              We process data strictly to operate and deliver automation services:
            </p>
            <ul className="list-disc list-inside text-sm text-[#a1a1aa] mt-3 space-y-1">
              <li>Traversing workflow graphs and executing connected integration nodes.</li>
              <li>Dispatching authorized user notifications (SMTP email alerts, Slack messages).</li>
              <li>Queuing background form ingestion tasks via Inngest and RabbitMQ.</li>
              <li>Generating real-time execution logs and performance diagnostic metrics.</li>
            </ul>
          </div>

          <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl">
            <h2 className="text-xl font-bold text-white mb-3">3. Credential Encryption & Data Security</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Security is foundational to NEURON_FLOW. All credentials, tokens, and API secret keys are encrypted at rest using AES-256 encryption (`ENCRYPTION_KEY`). Plain-text keys are never written to logs or displayed in client interfaces.
            </p>
          </div>

          <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl">
            <h2 className="text-xl font-bold text-white mb-3">4. Data Storage & Log Retention</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Database logs are managed using high-performance SQLite WAL mode (`PRAGMA journal_mode=WAL;`). Old execution step logs are automatically cleaned up during routine database vacuum operations. Users may delete workflows and associated data at any time.
            </p>
          </div>

          <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl">
            <h2 className="text-xl font-bold text-white mb-3">5. Cookies & Local Storage</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              We use browser local storage and essential cookies solely to persist session authentication tokens and dark mode visual theme preferences. No tracking or third-party advertising cookies are used.
            </p>
          </div>

          <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl">
            <h2 className="text-xl font-bold text-white mb-3">6. Contact Us</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              If you have questions regarding this Privacy Policy or your data safety, contact our Privacy Officer at <a href="mailto:privacy@neuronflow.local" className="text-[#ff4f00] hover:underline">privacy@neuronflow.local</a> or via our <a href="/support" className="text-[#ff4f00] hover:underline">Support Portal</a>.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-[#09090b] text-[#a1a1aa] py-12 px-6 border-t border-[#27272a]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
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
