import React, { useState, useEffect } from 'react';
import { getFlowCanvasUrl, getDashboardUrl } from '../lib/config';

export default function Navbar({ activePage = '' }) {
  const [flowCanvasUrl, setFlowCanvasUrl] = useState('/workflows');
  const [dashboardUrl, setDashboardUrl] = useState('/');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setFlowCanvasUrl(getFlowCanvasUrl());
    setDashboardUrl(getDashboardUrl());
  }, []);

  const getLinkClass = (pageKey) => {
    const isActive = activePage === pageKey;
    return isActive
      ? 'bg-[#ff4f00]/15 border border-[#ff4f00]/60 text-[#ff4f00] rounded-lg px-2.5 py-1.5 font-semibold transition-all shadow-sm shadow-[#ff4f00]/20'
      : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b] border border-transparent hover:border-[#27272a] rounded-lg px-2.5 py-1.5 transition-all';
  };

  return (
    <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 text-xs xl:text-sm font-medium">
      <a href={dashboardUrl} className={getLinkClass('dashboard')}>
        Dashboard
      </a>
      <a href={flowCanvasUrl} className={getLinkClass('visual-designer')}>
        Visual Designer
      </a>
      <a href="/connections" className={getLinkClass('connections')}>
        Node Connections
      </a>
      <a href="/excel" className={getLinkClass('excel')}>
        Excel AI
      </a>
      <a href="/files" className={getLinkClass('files')}>
        File Vault 📂
      </a>
      <a href="/workflows" className={getLinkClass('workflows')}>
        Workflows
      </a>
      <a href="/analytics" className={`${getLinkClass('analytics')} flex items-center gap-1`}>
        Analytics <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#ff4f00]/20 text-[#ff4f00] uppercase">SOON</span>
      </a>
      <a href="/docs" className={getLinkClass('docs')}>
        Docs
      </a>
      <a href="/support" className={getLinkClass('support')}>
        Support
      </a>
      <a href="/privacy" className={getLinkClass('privacy')}>
        Privacy
      </a>
    </nav>
  );
}
