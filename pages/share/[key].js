import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PublicSharePage() {
  const router = useRouter();
  const { key } = router.query;

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    if (key) {
      fetchFileInfo(key);
    }
  }, [key]);

  const fetchFileInfo = async (accessKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/info/${accessKey}`);
      const data = await res.json();
      if (data.success) {
        setFile(data.file);
      } else {
        setError(data.error || 'Shared file could not be found');
      }
    } catch (e) {
      console.error('Fetch File Info Error:', e);
      setError('Network error fetching file information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!file) return;
    setDownloading(true);

    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.originalName || 'file';
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Refresh file stats after download
    setTimeout(() => {
      setDownloading(false);
      if (key) fetchFileInfo(key);
    }, 1500);
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return '📁';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    if (mimeType.includes('video/')) return '🎥';
    if (mimeType.includes('audio/')) return '🎵';
    return '📝';
  };

  return (
    <>
      <Head>
        <title>{file ? `${file.originalName} | Download Shared File` : 'Download Shared File'}</title>
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
                    "primary-hover": "#e04500",
                    "dark-bg": "#09090b",
                    "dark-card": "#141417",
                    "dark-border": "#27272a",
                  },
                  fontFamily: {
                    "display": ["Mona Sans", "Inter", "sans-serif"],
                    "body": ["Inter", "sans-serif"]
                  }
                }
              }
            }
          `
        }} />
        <style>{`
          html, body {
            background-color: #09090b !important;
            color: #f4f4f5 !important;
          }
        `}</style>
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col justify-between items-center p-6">
        {/* Header Branding */}
        <header className="w-full max-w-xl flex items-center justify-center pt-8 pb-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff4f00] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#ff4f00]/30">
              ⚡
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-white">NEURON_FLOW</span>
          </Link>
        </header>

        {/* Main Shared File Card */}
        <main className="w-full max-w-xl my-auto">
          {loading ? (
            <div className="bg-[#141417] border border-[#27272a] rounded-3xl p-12 text-center flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 border-4 border-[#ff4f00] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium">Fetching file details...</p>
            </div>
          ) : error || !file ? (
            <div className="bg-[#141417] border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">File Unavailable</h2>
              <p className="text-gray-400 text-sm mb-6">{error || 'This link is invalid or has expired.'}</p>
              <Link
                href="/files"
                className="bg-[#27272a] hover:bg-[#ff4f00] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Go to File Vault
              </Link>
            </div>
          ) : !file.isPublic ? (
            <div className="bg-[#141417] border border-amber-500/30 rounded-3xl p-10 text-center shadow-2xl">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Private Access</h2>
              <p className="text-gray-400 text-sm mb-6">The owner has set this shared file to private access only.</p>
              <Link
                href="/files"
                className="bg-[#27272a] hover:bg-[#ff4f00] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Go to File Vault
              </Link>
            </div>
          ) : file.isExpired || file.isLimitReached ? (
            <div className="bg-[#141417] border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl">
              <div className="text-5xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-white mb-2">Link Expired</h2>
              <p className="text-gray-400 text-sm mb-6">
                {file.isExpired
                  ? 'This file share link has passed its expiration time.'
                  : 'This file has reached its maximum download limit.'}
              </p>
              <Link
                href="/files"
                className="bg-[#27272a] hover:bg-[#ff4f00] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Go to File Vault
              </Link>
            </div>
          ) : (
            <div className="bg-[#141417] border border-[#27272a] rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
              {/* File Emblem */}
              <div className="flex flex-col items-center text-center gap-3 pt-2">
                <div className="w-20 h-20 rounded-2xl bg-[#ff4f00]/10 border border-[#ff4f00]/20 flex items-center justify-center text-5xl shadow-inner">
                  {getFileIcon(file.mimeType)}
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white truncate max-w-md" title={file.originalName}>
                    {file.originalName}
                  </h1>
                  <p className="text-gray-400 text-sm font-medium mt-1">
                    {formatSize(file.size)} • {file.mimeType}
                  </p>
                </div>
              </div>

              {/* Status & Info Grid */}
              <div className="bg-[#09090b] p-4 rounded-2xl border border-[#27272a] grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold block uppercase">Shared On</span>
                  <span className="text-gray-300 font-medium">{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase">Downloads</span>
                  <span className="text-emerald-400 font-medium">{file.downloads} times</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase">Storage Host</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    {file.storageProvider === 's3' ? '☁️ AWS S3' : '💻 Local Vault'}
                  </span>
                </div>
              </div>

              {/* Download Action */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-[#ff4f00] hover:bg-[#e04500] text-white font-bold py-4 rounded-2xl text-center shadow-xl shadow-[#ff4f00]/25 transition duration-200 hover:scale-[1.01] flex items-center justify-center gap-2 text-lg disabled:opacity-50 cursor-pointer"
                >
                  <span>{downloading ? '⏳' : '⬇️'}</span>
                  <span>{downloading ? 'Starting Download...' : `Download File (${formatSize(file.size)})`}</span>
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="w-full text-center py-6 text-gray-500 text-xs font-medium">
          Powered by <span className="text-gray-300 font-semibold">NEURON_FLOW</span> File Vault System
        </footer>
      </div>
    </>
  );
}
