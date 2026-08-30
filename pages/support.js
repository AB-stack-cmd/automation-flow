import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { getFlowCanvasUrl } from '../lib/config';

export default function SupportPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', category: 'general', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('/workflows');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFlowCanvasUrl(getFlowCanvasUrl());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.add('dark');
    setFlowCanvasUrl(getFlowCanvasUrl());
  }, []);

  const faqs = [
    {
      q: 'How do I trigger workflows automatically on a 10-second interval?',
      a: 'Drag the Schedule Trigger node onto your visual flow canvas, set the schedule type to "interval", enter "10" for interval value, and choose "seconds". Click active toggle to start execution.',
    },
    {
      q: 'Can I import and export Excel (.xlsx) data inside workflow nodes?',
      a: 'Yes! The Excel Processor node supports readSheet, writeSheet, appendRow, filterRows, and createWorkbook operations with JSON or binary outputs.',
    },
    {
      q: 'How does the Ingest Engine work with Form Submissions?',
      a: 'When a user submits a form via POST /api/forms/[id]/submit, the payload is automatically queued in Inngest (form/submitted) and passed to the graph execution engine for real-time node traversal.',
    },
    {
      q: 'How are my API keys and credentials secured?',
      a: 'All third-party credentials (OpenAI, Slack, MCP tokens) are encrypted at rest using AES-256 encryption via ENCRYPTION_KEY before storing in the database.',
    },
    {
      q: 'Where can I inspect live execution logs?',
      a: 'You can open the Real-Time Ingest Monitor in the Forms builder or use GET /api/executions/[id]/logs to stream live node step timing and logs.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', category: 'general', message: '' });
    }, 4000);
  };

  return (
    <>
      <Head>
        <title>Support & Help Center | NEURON_FLOW</title>
        <meta name="description" content="NEURON_FLOW Customer Support, Documentation, FAQs, and Help Center." />
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-[#27272a] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ⚡
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
            </a>

            <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium bg-[#121215]/90 p-1.5 rounded-xl border border-[#ff4f00]/30 shadow-[0_0_20px_rgba(255,79,0,0.08)] backdrop-blur-md transition-all duration-300">
              <a href="/" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Dashboard</a>
              <a href={flowCanvasUrl} className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Visual Flow Designer</a>
              <a href="/excel" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200">Excel AI</a>
              <a href="/workflows" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium text-[#a1a1aa] hover:text-white hover:bg-[#ff4f00]/10 hover:border-[#ff4f00]/30 border border-transparent transition-all duration-200 flex items-center gap-1.5">
                Workflows <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#ff4f00]/20 text-[#ff4f00] border border-[#ff4f00]/30 uppercase">SOON</span>
              </a>
              <a href="/support" className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold text-[#ff4f00] bg-[#ff4f00]/15 border border-[#ff4f00]/40 shadow-sm shadow-[#ff4f00]/20 transition-all duration-200">Support</a>
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

        {/* Hero & Search Header */}
        <section className="bg-gradient-to-b from-[#141417] to-[#09090b] px-6 py-16 border-b border-[#27272a] text-center">
          <div className="max-w-4xl mx-auto">
            <span className="text-sm font-semibold uppercase tracking-wider text-[#ff4f00] block mb-2">Help Center & Support</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">How can we help you today?</h1>
            <p className="text-base text-[#a1a1aa] max-w-2xl mx-auto mb-8">
              Explore FAQs, search documentation, or submit a direct ticket to our engineering team.
            </p>

            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search articles, nodes, triggers, or error codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#18181b] border border-[#3f3f46] focus:border-[#ff4f00] text-white px-5 py-3.5 pl-12 rounded-xl outline-none text-sm transition shadow-lg"
              />
              <span className="absolute left-4 top-3.5 text-lg text-[#71717a]">🔍</span>
            </div>
          </div>
        </section>

        {/* Support Options Cards */}
        <section className="py-12 px-6 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl hover:border-[#ff4f00] transition">
              <div className="text-3xl mb-3">📖</div>
              <h3 className="text-lg font-bold text-white mb-2">Workflow Documentation</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Step-by-step guides on configuring triggers, custom JS script blocks, and MCP connectors.
              </p>
            </div>

            <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl hover:border-[#ff4f00] transition">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="text-lg font-bold text-white mb-2">Developer Community</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Connect with engineers building custom automation workflows, node plugins, and integrations.
              </p>
            </div>

            <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl hover:border-[#ff4f00] transition">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">System Status</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                All core engines, Express APIs, Inngest event queues, and database nodes are operational.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* FAQ Accordion */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              {filteredFaqs.length === 0 ? (
                <div className="p-6 bg-[#141417] border border-[#27272a] rounded-xl text-center text-sm text-[#71717a]">
                  No matching topics found for "{searchQuery}".
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-[#141417] border border-[#27272a] rounded-xl overflow-hidden transition"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-white hover:text-[#ff4f00] transition"
                    >
                      <span>{faq.q}</span>
                      <span className="text-base text-[#ff4f00]">{activeFaq === idx ? '−' : '+'}</span>
                    </button>
                    {activeFaq === idx && (
                      <div className="px-6 pb-4 text-sm text-[#a1a1aa] leading-relaxed border-t border-[#27272a] pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Contact Support Form */}
            <div className="lg:col-span-5 bg-[#141417] border border-[#27272a] p-6 rounded-xl h-fit">
              <h2 className="font-display text-xl font-bold text-white mb-2">Submit a Ticket</h2>
              <p className="text-xs text-[#a1a1aa] mb-6">Need help with a complex workflow setup? Send us a message.</p>

              {submitted ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium">
                  ✓ Ticket submitted successfully! Our engineering team will respond shortly.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#ff4f00] text-white px-3.5 py-2.5 rounded-lg text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#ff4f00] text-white px-3.5 py-2.5 rounded-lg text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#ff4f00] text-white px-3.5 py-2.5 rounded-lg text-sm outline-none"
                    >
                      <option value="general">General Question</option>
                      <option value="bug">Report a Bug / Issue</option>
                      <option value="node">Node / Integration Help</option>
                      <option value="billing">Account & Billing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a1a1aa] uppercase mb-1">Message</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your issue or workflow requirement..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] focus:border-[#ff4f00] text-white px-3.5 py-2.5 rounded-lg text-sm outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-md w-full bg-[#ff4f00] hover:bg-[#e04500] text-white font-semibold shadow-sm"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

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
