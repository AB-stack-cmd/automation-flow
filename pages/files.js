import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';

export default function FileVault() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ totalFiles: 0, totalBytes: 0, totalDownloads: 0, publicCount: 0, privateCount: 0, s3Count: 0, localCount: 0 });
  const [storageConfig, setStorageConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Modals state
  const [shareModalFile, setShareModalFile] = useState(null);
  const [settingsFile, setSettingsFile] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [notification, setNotification] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    fetchFiles();
  }, [categoryFilter]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const query = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/files?category=${categoryFilter}${query}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        setStats(data.stats);
        if (data.storageConfig) setStorageConfig(data.storageConfig);
      }
    } catch (e) {
      console.error('Failed to fetch files:', e);
      showNotification('Error loading files');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (e) {
      console.error('Fallback copy failed:', e);
    }
  };

  const copyShareLink = (url, key) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
    setCopiedKey(key);
    showNotification('Share link copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const triggerDirectDownload = (downloadUrl, originalName) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = originalName || 'file';
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Downloading ${originalName}...`);
    setTimeout(() => fetchFiles(), 1500);
  };

  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(60);
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      const data = await res.json();

      if (data.success) {
        setUploadProgress(100);
        showNotification(`Uploaded ${file.name} successfully!`);
        await fetchFiles();
        
        // Auto open share modal for the newly uploaded file
        const protocol = window.location.protocol;
        const host = window.location.host;
        const shareUrl = `${protocol}//${host}/share/${data.file.accessKey}`;
        setShareModalFile({
          ...data.file,
          shareUrl,
        });
      } else {
        showNotification(`Upload failed: ${data.error}`);
      }
    } catch (e) {
      console.error('Upload Error:', e);
      showNotification('Failed to upload file');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('File deleted successfully');
        fetchFiles();
        if (shareModalFile?.id === id) setShareModalFile(null);
        if (settingsFile?.id === id) setSettingsFile(null);
      }
    } catch (e) {
      showNotification('Failed to delete file');
    }
  };

  const handleSaveSettings = async (fileId, updatePayload) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Settings updated successfully');
        if (settingsFile) setSettingsFile(null);
        if (shareModalFile) {
          setShareModalFile({ ...shareModalFile, ...data.file });
        }
        fetchFiles();
      }
    } catch (e) {
      showNotification('Failed to update settings');
    }
  };

  const handleSendEmailShare = async (e) => {
    e.preventDefault();
    if (!shareModalFile) return;

    const formData = new FormData(e.target);
    const recipientEmail = formData.get('recipientEmail');
    const message = formData.get('message');

    setEmailSending(true);
    setEmailSuccess('');

    try {
      const res = await fetch('/api/files/share-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          shareUrl: shareModalFile.shareUrl,
          fileName: shareModalFile.originalName,
          message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailSuccess(`Share link emailed to ${recipientEmail}!`);
        showNotification(`Link sent to ${recipientEmail}`);
        e.target.reset();
      } else {
        showNotification(`Email failed: ${data.error}`);
      }
    } catch (err) {
      showNotification('Failed to send share email');
    } finally {
      setEmailSending(false);
    }
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
    if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('javascript')) return '📝';
    return '📁';
  };

  return (
    <>
      <Head>
        <title>Neuron Vault | File Sharing System</title>
      </Head>

      <div className="bg-[#09090b] text-[#f4f4f5] font-body min-h-screen flex flex-col">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#ff4f00] text-white px-5 py-3 rounded-xl shadow-2xl font-semibold flex items-center gap-2 animate-bounce">
            <span>⚡</span> {notification}
          </div>
        )}

        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff4f00] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#ff4f00]/20">
                  ⚡
                </div>
                <span className="font-display text-xl font-bold tracking-tight text-white">NEURON_FLOW</span>
              </Link>
              <span className="text-[#27272a] text-xl font-light">/</span>
              <span className="text-gray-300 font-semibold tracking-wide flex items-center gap-2">
                📂 Neuron Vault
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
              <Link href="/" className="text-gray-400 hover:text-white transition">Dashboard</Link>
              <a href="http://localhost:5173" className="text-gray-400 hover:text-white transition">Visual Flow Designer</a>
              <Link href="/excel" className="text-gray-400 hover:text-white transition">Excel AI</Link>
              <Link href="/files" className="text-[#ff4f00] border-b-2 border-[#ff4f00] pb-1">File Vault</Link>
            </nav>

            <div className="flex items-center gap-4">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                File Sharing Vault
                <span className="bg-[#ff4f00]/10 text-[#ff4f00] text-xs font-semibold px-3 py-1 rounded-full border border-[#ff4f00]/30">
                  Secure Storage
                </span>
                {storageConfig?.isS3Configured ? (
                  <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                    ☁️ AWS S3 Active ({storageConfig.bucket})
                  </span>
                ) : (
                  <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-1">
                    💻 Local Vault (AWS S3 Configurable)
                  </span>
                )}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Upload, manage, protect, and share files via AWS S3 Cloud, custom URLs, email notifications, and access controls.
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#ff4f00] hover:bg-[#e04500] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-[#ff4f00]/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              <span className="text-lg">📤</span> Upload File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Stats Analytics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#141417] border border-[#27272a] p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-2xl font-bold">
                📁
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Total Files</p>
                <p className="text-2xl font-bold text-white mt-0.5">{stats.totalFiles}</p>
              </div>
            </div>

            <div className="bg-[#141417] border border-[#27272a] p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl font-bold">
                💾
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Storage Used</p>
                <p className="text-2xl font-bold text-white mt-0.5">{formatSize(stats.totalBytes)}</p>
              </div>
            </div>

            <div className="bg-[#141417] border border-[#27272a] p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl font-bold">
                ⬇️
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Total Downloads</p>
                <p className="text-2xl font-bold text-white mt-0.5">{stats.totalDownloads}</p>
              </div>
            </div>

            <div className="bg-[#141417] border border-[#27272a] p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl font-bold">
                🔗
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Public Shares</p>
                <p className="text-2xl font-bold text-white mt-0.5">{stats.publicCount}</p>
              </div>
            </div>

            <div className="bg-[#141417] border border-[#27272a] p-5 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl font-bold">
                ☁️
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">AWS S3 Files</p>
                <p className="text-2xl font-bold text-white mt-0.5">{stats.s3Count || 0}</p>
              </div>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[#27272a] hover:border-[#ff4f00]/60 bg-[#141417]/50 hover:bg-[#141417] p-8 rounded-2xl text-center transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="max-w-md mx-auto py-4">
                <div className="w-12 h-12 mx-auto mb-3 text-[#ff4f00] animate-spin text-3xl">⏳</div>
                <p className="text-white font-semibold">Uploading File...</p>
                <div className="w-full bg-[#27272a] h-2.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-[#ff4f00] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#ff4f00]/10 text-[#ff4f00] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  ☁️
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    Drag and drop your file here, or <span className="text-[#ff4f00] underline">browse</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Supports Images, PDFs, Documents, Spreadsheets, Archives up to 50MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Search, Category Filter & View Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#141417] p-4 rounded-2xl border border-[#27272a]">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <span className="absolute left-3.5 top-2.5 text-gray-500">🔍</span>
                <input
                  type="text"
                  placeholder="Search files by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFiles()}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#09090b] border border-[#27272a] text-white text-sm focus:outline-none focus:border-[#ff4f00]"
                />
              </div>

              {/* Category Pills */}
              <div className="hidden lg:flex items-center gap-1 bg-[#09090b] p-1 rounded-xl border border-[#27272a] text-xs font-semibold text-gray-400">
                {['all', 'images', 'documents', 'spreadsheets', 'archives'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition ${
                      categoryFilter === cat ? 'bg-[#ff4f00] text-white font-bold' : 'hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* View Toggle */}
              <div className="flex items-center bg-[#09090b] p-1 rounded-xl border border-[#27272a]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg text-sm transition ${viewMode === 'grid' ? 'bg-[#27272a] text-white' : 'text-gray-400'}`}
                  title="Grid View"
                >
                  🔳
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg text-sm transition ${viewMode === 'list' ? 'bg-[#27272a] text-white' : 'text-gray-400'}`}
                  title="List View"
                >
                  📄
                </button>
              </div>
            </div>
          </div>

          {/* Files Presentation */}
          {loading ? (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#ff4f00] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading Vault Files...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="py-20 text-center bg-[#141417]/40 border border-[#27272a] rounded-2xl">
              <div className="text-5xl mb-3">📂</div>
              <p className="text-white text-lg font-semibold">No files found in Vault</p>
              <p className="text-gray-400 text-sm mt-1">Upload a file above to get started sharing!</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-[#141417] border border-[#27272a] hover:border-[#ff4f00]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-[#ff4f00]/5 group"
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{getFileIcon(file.mimeType)}</span>
                      <div className="flex items-center gap-2">
                        {file.storageProvider === 's3' ? (
                          <span className="bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-500/20" title={`AWS S3 Bucket: ${file.s3Bucket || 'Default'}`}>
                            ☁️ S3
                          </span>
                        ) : (
                          <span className="bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-500/20" title="Local Disk Storage">
                            💻 Local
                          </span>
                        )}
                        {file.isPublic ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Public
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                            Private
                          </span>
                        )}
                        <button
                          onClick={() => setSettingsFile(file)}
                          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#27272a]"
                          title="Share Settings"
                        >
                          ⚙️
                        </button>
                      </div>
                    </div>

                    {/* File Name & Info */}
                    <h3 className="font-semibold text-white truncate text-base mb-1" title={file.originalName}>
                      {file.originalName}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                    </p>

                    {/* Download Badges */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        📥 {file.downloads} downloads
                      </span>
                      {file.maxDownloads && (
                        <span className="text-amber-400">
                          (Max {file.maxDownloads})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-[#27272a] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShareModalFile(file)}
                      className="bg-[#27272a] hover:bg-[#ff4f00] text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors flex-1 justify-center cursor-pointer"
                    >
                      🔗 Share File
                    </button>

                    <button
                      onClick={() => triggerDirectDownload(file.downloadUrl, file.originalName)}
                      className="bg-[#ff4f00]/10 hover:bg-[#ff4f00] text-[#ff4f00] hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Download File"
                    >
                      ⬇️
                    </button>

                    <button
                      onClick={() => handleDelete(file.id, file.originalName)}
                      className="text-gray-500 hover:text-red-400 p-1.5 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete File"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List Table View */
            <div className="bg-[#141417] border border-[#27272a] rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#09090b] text-xs uppercase text-gray-400 font-semibold border-b border-[#27272a]">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Storage</th>
                    <th className="px-6 py-3.5">Size</th>
                    <th className="px-6 py-3.5">Uploaded</th>
                    <th className="px-6 py-3.5">Visibility</th>
                    <th className="px-6 py-3.5">Downloads</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-[#27272a]/40 transition">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3 max-w-xs truncate">
                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                        <span className="truncate">{file.originalName}</span>
                      </td>
                      <td className="px-6 py-4">
                        {file.storageProvider === 's3' ? (
                          <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
                            ☁️ AWS S3
                          </span>
                        ) : (
                          <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/20">
                            💻 Local
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{formatSize(file.size)}</td>
                      <td className="px-6 py-4 text-gray-400">{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {file.isPublic ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
                            Public
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-500/20">
                            Private
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{file.downloads}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setShareModalFile(file)}
                            className="bg-[#27272a] hover:bg-[#ff4f00] text-gray-300 hover:text-white px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            🔗 Share
                          </button>
                          <button
                            onClick={() => triggerDirectDownload(file.downloadUrl, file.originalName)}
                            className="bg-[#ff4f00]/10 hover:bg-[#ff4f00] text-[#ff4f00] hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            ⬇️
                          </button>
                          <button
                            onClick={() => setSettingsFile(file)}
                            className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
                          >
                            ⚙️
                          </button>
                          <button
                            onClick={() => handleDelete(file.id, file.originalName)}
                            className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Dedicated Interactive Share Modal */}
          {shareModalFile && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#141417] border border-[#27272a] max-w-xl w-full rounded-3xl p-6 shadow-2xl relative animate-fade-in space-y-6">
                <button
                  onClick={() => {
                    setShareModalFile(null);
                    setEmailSuccess('');
                  }}
                  className="absolute top-5 right-5 text-gray-400 hover:text-white text-lg cursor-pointer"
                >
                  ✕
                </button>

                <div className="flex items-center gap-3 border-b border-[#27272a] pb-4">
                  <span className="text-3xl">{getFileIcon(shareModalFile.mimeType)}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      🔗 Share File
                    </h2>
                    <p className="text-xs text-gray-400 truncate max-w-sm">{shareModalFile.originalName} ({formatSize(shareModalFile.size)})</p>
                  </div>
                </div>

                {/* Direct Share Link Box */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Direct Public Share URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareModalFile.shareUrl}
                      className="w-full bg-[#09090b] border border-[#27272a] text-emerald-400 font-mono text-xs rounded-xl px-4 py-3 focus:outline-none select-all"
                    />
                    <button
                      onClick={() => copyShareLink(shareModalFile.shareUrl, shareModalFile.accessKey)}
                      className="bg-[#ff4f00] hover:bg-[#e04500] text-white px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap shadow-md transition cursor-pointer"
                    >
                      {copiedKey === shareModalFile.accessKey ? '✅ Copied' : '📋 Copy Link'}
                    </button>
                    <a
                      href={shareModalFile.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#27272a] hover:bg-gray-700 text-white px-3 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition"
                      title="Test/Open in new tab"
                    >
                      ↗️ Open
                    </a>
                  </div>
                </div>

                {/* Permission & Storage Status */}
                <div className="bg-[#09090b] p-4 rounded-2xl border border-[#27272a] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white block flex items-center gap-2">
                      Storage Engine: {shareModalFile.storageProvider === 's3' ? '☁️ AWS S3 Cloud' : '💻 Local Vault'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {shareModalFile.isPublic ? 'Public - Anyone with link can download' : 'Private - Access disabled'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSaveSettings(shareModalFile.id, { isPublic: !shareModalFile.isPublic })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      shareModalFile.isPublic
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {shareModalFile.isPublic ? '🌐 Public' : '🔒 Private'}
                  </button>
                </div>

                {shareModalFile.storageProvider === 's3' && (
                  <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-xs flex items-center justify-between">
                    <span className="text-amber-300 font-medium">⚡ AWS S3 Presigned Direct Link available</span>
                    <a
                      href={shareModalFile.presignedUrl || `${shareModalFile.downloadUrl}?presigned=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded-xl font-bold transition"
                    >
                      ☁️ AWS S3 Direct Presigned Link
                    </a>
                  </div>
                )}

                {/* Send via Email Section */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    ✉️ Share via Email
                  </h3>

                  {emailSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-2 rounded-xl mb-3">
                      {emailSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSendEmailShare} className="space-y-3">
                    <input
                      type="email"
                      name="recipientEmail"
                      required
                      placeholder="Recipient email address (e.g. colleague@company.com)..."
                      className="w-full bg-[#09090b] border border-[#27272a] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#ff4f00]"
                    />
                    <input
                      type="text"
                      name="message"
                      placeholder="Optional note message..."
                      className="w-full bg-[#09090b] border border-[#27272a] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#ff4f00]"
                    />
                    <button
                      type="submit"
                      disabled={emailSending}
                      className="w-full bg-[#27272a] hover:bg-[#ff4f00] text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {emailSending ? 'Sending Email...' : '📩 Send Share Email'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Settings Modal */}
          {settingsFile && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#141417] border border-[#27272a] max-w-md w-full rounded-2xl p-6 shadow-2xl relative animate-fade-in">
                <button
                  onClick={() => setSettingsFile(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg cursor-pointer"
                >
                  ✕
                </button>

                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  ⚙️ Share Settings
                </h2>
                <p className="text-xs text-gray-400 truncate mb-6">{settingsFile.originalName}</p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleSaveSettings(settingsFile.id, {
                      isPublic: formData.get('isPublic') === 'true',
                      maxDownloads: formData.get('maxDownloads') || null,
                      expiresAt: formData.get('expiresAt') || null,
                    });
                  }}
                  className="space-y-4"
                >
                  {/* Public / Private */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Access Permission
                    </label>
                    <select
                      name="isPublic"
                      defaultValue={settingsFile.isPublic ? 'true' : 'false'}
                      className="w-full bg-[#09090b] border border-[#27272a] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#ff4f00]"
                    >
                      <option value="true">🌐 Public (Anyone with link can download)</option>
                      <option value="false">🔒 Private (Restricted / Disabled)</option>
                    </select>
                  </div>

                  {/* Max Downloads Limit */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Download Limit (Optional)
                    </label>
                    <input
                      type="number"
                      name="maxDownloads"
                      placeholder="e.g. 5 (Leave blank for unlimited)"
                      defaultValue={settingsFile.maxDownloads || ''}
                      className="w-full bg-[#09090b] border border-[#27272a] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#ff4f00]"
                    />
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="expiresAt"
                      defaultValue={settingsFile.expiresAt ? new Date(settingsFile.expiresAt).toISOString().slice(0, 16) : ''}
                      className="w-full bg-[#09090b] border border-[#27272a] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#ff4f00]"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSettingsFile(null)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#ff4f00] hover:bg-[#e04500] text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-[#ff4f00]/25 transition cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
