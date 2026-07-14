import React, { useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          float time = u_time * 0.2;
          
          float noise = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 - time);
          noise += sin(uv.y * 5.0 + time * 1.5) * 0.5;
          
          vec3 color_bg = vec3(0.04, 0.04, 0.04);
          vec3 color_accent = vec3(0.98, 0.8, 0.08); // Yellow (#facc15)
          vec3 color_subtle = vec3(0.94, 0.27, 0.27); // Red (#ef4444)
          
          float mask = smoothstep(0.4, 0.6, noise);
          vec3 final_color = mix(color_bg, color_accent * 0.1, mask);
          
          float red_mask = smoothstep(0.7, 0.9, noise);
          final_color = mix(final_color, color_subtle * 0.15, red_mask);
          
          gl_FragColor = vec4(final_color, 1.0);
      }
    `;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animFrameId;
    function render(t) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animFrameId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <Head>
        <title>NEURON_FLOW | Orchestrated Complexity</title>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: "class",
              theme: {
                extend: {
                  "colors": {
                    "secondary-container": "#a40217",
                    "surface-container-low": "#1c1b1b",
                    "on-tertiary": "#00363e",
                    "outline-variant": "#4d4632",
                    "inverse-primary": "#735c00",
                    "on-surface-variant": "#d1c6ab",
                    "surface-container": "#201f1f",
                    "on-error": "#690005",
                    "secondary-fixed-dim": "#ffb3ad",
                    "tertiary-container": "#33e4ff",
                    "on-secondary-container": "#ffaea8",
                    "error-container": "#93000a",
                    "secondary-fixed": "#ffdad7",
                    "on-tertiary-fixed": "#001f25",
                    "tertiary-fixed-dim": "#15daf4",
                    "primary-fixed": "#ffe083",
                    "inverse-on-surface": "#313030",
                    "primary-fixed-dim": "#eec200",
                    "tertiary-fixed": "#a0efff",
                    "on-tertiary-container": "#006270",
                    "on-primary": "#3c2f00",
                    "on-background": "#e5e2e1",
                    "on-primary-container": "#6c5700",
                    "secondary": "#ffb3ad",
                    "on-secondary-fixed-variant": "#930013",
                    "error": "#ffb4ab",
                    "on-secondary-fixed": "#410004",
                    "primary-container": "#facc15",
                    "on-secondary": "#68000a",
                    "surface-tint": "#eec200",
                    "surface-container-high": "#2a2a2a",
                    "outline": "#9a9078",
                    "on-primary-fixed": "#231b00",
                    "on-error-container": "#ffdad6",
                    "surface-bright": "#3a3939",
                    "on-primary-fixed-variant": "#574500",
                    "background": "#131313",
                    "surface": "#131313",
                    "inverse-surface": "#e5e2e1",
                    "tertiary": "#c7f5ff",
                    "surface-container-lowest": "#0e0e0e",
                    "on-surface": "#e5e2e1",
                    "surface-dim": "#131313",
                    "on-tertiary-fixed-variant": "#004e59",
                    "primary": "#ffecb9",
                    "surface-container-highest": "#353534",
                    "surface-variant": "#353534"
                  },
                  "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
                  },
                  "spacing": {
                    "margin-sm": "16px",
                    "container-max": "1440px",
                    "margin-md": "32px",
                    "unit": "4px",
                    "gutter": "16px",
                    "margin-lg": "48px"
                  },
                  "fontFamily": {
                    "headline-md": ["Inter"],
                    "body-lg": ["Inter"],
                    "headline-lg": ["Inter"],
                    "headline-lg-mobile": ["Inter"],
                    "body-md": ["Inter"],
                    "label-md": ["JetBrains Mono"],
                    "headline-xl": ["Inter"],
                    "label-sm": ["JetBrains Mono"]
                  },
                  "fontSize": {
                    "headline-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "headline-lg": ["30px", {"lineHeight": "38px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "label-md": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                    "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "label-sm": ["10px", {"lineHeight": "14px", "letterSpacing": "0.05em", "fontWeight": "500"}]
                  }
                }
              }
            }
          `
        }} />
        <style>{`
          .material-symbols-outlined {
              display: none !important;
          }
          .glass-panel {
              background: rgba(23, 23, 23, 0.8);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(38, 38, 38, 0.5);
          }
          .node-port {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #262626;
              border: 1px solid #4d4632;
          }
          .node-port-active {
              background: #facc15;
              box-shadow: 0 0 8px rgba(250, 204, 21, 0.4);
          }
          .orchestration-line {
              background: linear-gradient(90deg, transparent, #facc15, transparent);
              height: 1px;
              width: 100%;
              position: absolute;
          }
          @keyframes pulse-line {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
          }
          .animate-flow {
              animation: pulse-line 3s linear infinite;
          }
        `}</style>
      </Head>

      <div className="bg-background text-on-background selection:bg-primary-container selection:text-on-primary-container font-body-md overflow-x-hidden min-h-screen">
        {/* WebGL Background */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
          <canvas ref={canvasRef} id="shader-canvas-ANIMATION_2" style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
        </div>

        {/* Navigation (TopAppBar) */}
        <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
          <div className="flex justify-between items-center h-16 px-margin-md max-w-container-max mx-auto">
            <div className="flex items-center gap-2 cursor-pointer active:scale-95 transition-all duration-300">
              <span className="material-symbols-outlined text-primary font-headline-md text-headline-md" data-icon="hub">hub</span>
              <span className="font-headline-md text-headline-md font-bold tracking-tighter text-primary dark:text-primary-fixed">NEURON_FLOW</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md transition-colors" href="#">Platform</a>
              <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors" href="#">Solutions</a>
              <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors" href="#">Documentation</a>
              <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary transition-colors" href="#">Pricing</a>
            </nav>
            <div className="flex items-center gap-4">
              <a href="http://localhost:5173/" className="px-6 py-2 bg-primary-container text-on-primary-container font-label-md text-label-md rounded hover:opacity-90 active:scale-95 transition-all flex items-center justify-center">
                Get Started
              </a>
            </div>
          </div>
        </header>

        <main className="relative z-10 pt-32 lg:pt-48">
          {/* Hero Section */}
          <section className="max-w-container-max mx-auto px-margin-md flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant/50 mb-8 bg-surface-container-lowest/50 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Version 2.0 Now Live</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl lg:text-[72px] lg:leading-[80px] max-w-4xl mb-6 tracking-tight">
              ORCHESTRATE YOUR <span class="text-primary-container">WORKFLOW</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-12">
              Build complex automations in minutes with our visual node-based engine. 
              Experience unparalleled precision in logic deployment and data flow management.
            </p>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch w-full max-w-4xl mt-6">
              {/* Launcher Card 1: SQLite UI */}
              <div className="flex-1 glass-panel p-8 rounded-2xl flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-[#facc15]/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#facc15]/5 rounded-full blur-2xl"></div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-[#facc15]/10 flex items-center justify-center mb-6 mx-auto">
                    <span className="material-symbols-outlined text-[#facc15] text-2xl">bubble_chart</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Visual Neuron Flow</h3>
                  <p className="text-xs text-neutral-400 max-w-xs mb-6">
                    A visual, drag-and-drop workflow designer utilizing React Flow canvas with embedded SQLite DB storage.
                  </p>
                </div>
                <a href="http://localhost:5173/" className="w-full py-3 bg-[#facc15] hover:opacity-90 active:scale-95 text-black font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base font-bold">open_in_new</span>
                  Launch Visual Editor
                </a>
              </div>

              {/* Launcher Card 2: Monorepo */}
              <div className="flex-1 glass-panel p-8 rounded-2xl flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 mx-auto">
                    <span className="material-symbols-outlined text-emerald-400 text-2xl">token</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">n8n Production Monorepo</h3>
                  <p className="text-xs text-neutral-400 max-w-xs mb-6">
                    Production-grade distributed automation engine backed by PostgreSQL, Redis queue workers, and sandboxed runtimes.
                  </p>
                </div>
                <a href="http://localhost:5174/" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                  <span className="material-symbols-outlined text-base">lan</span>
                  Launch Production Engine
                </a>
              </div>
            </div>

            {/* Orchestration Visualization */}
            <div className="mt-24 w-full max-w-5xl relative aspect-[21/9] md:aspect-[21/7]">
              {/* Connection Lines Layer */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant"></div>
                <div className="absolute top-1/4 left-1/4 right-1/4 h-[1px] bg-outline-variant"></div>
                <div className="absolute bottom-1/4 left-1/3 right-1/3 h-[1px] bg-outline-variant"></div>
                {/* Animated flow */}
                <div className="orchestration-line top-1/2 left-0 overflow-hidden">
                  <div className="w-1/2 h-full bg-primary-container/50 animate-flow"></div>
                </div>
              </div>

              {/* Bento-style Node Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter h-full">
                {/* Node 1: Trigger */}
                <div className="glass-panel p-gutter flex flex-col justify-between relative group hover:border-primary-container/40 transition-colors">
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 node-port node-port-active group-hover:scale-150 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-primary-container" data-icon="bolt">bolt</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant">TRIGGER</span>
                  </div>
                  <div className="text-left">
                    <p className="font-label-md text-label-md text-on-surface mb-1">Webhook Input</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Listening on port 8080</p>
                  </div>
                </div>

                {/* Node 2: Logic */}
                <div className="glass-panel p-gutter flex flex-col justify-between relative group hover:border-primary-container/40 transition-colors">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 node-port node-port-active group-hover:scale-150 transition-transform duration-300"></div>
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 node-port node-port-active group-hover:scale-150 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-on-tertiary-container" data-icon="alt_route">alt_route</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant">LOGIC</span>
                  </div>
                  <div className="text-left">
                    <p className="font-label-md text-label-md text-on-surface mb-1">JSON Filter</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Schema validation</p>
                  </div>
                </div>

                {/* Node 3: AI Transformer */}
                <div className="glass-panel p-gutter flex flex-col justify-between relative group hover:border-primary-container/40 transition-colors bg-gradient-to-br from-surface-container to-surface-container-lowest">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 node-port node-port-active group-hover:scale-150 transition-transform duration-300"></div>
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 node-port node-port-active group-hover:scale-150 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-primary" data-icon="psychology">psychology</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-primary-container text-black">AI CORE</span>
                  </div>
                  <div className="text-left">
                    <p className="font-label-md text-label-md text-on-surface mb-1">Neuron Classify</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Sentiment analysis</p>
                  </div>
                </div>

                {/* Node 4: Output */}
                <div className="glass-panel p-gutter flex flex-col justify-between relative group hover:border-primary-container/40 transition-colors">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 node-port node-port-active group-hover:scale-150 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="material-symbols-outlined text-secondary-container" data-icon="cloud_sync">cloud_sync</span>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant">DESTINATION</span>
                  </div>
                  <div className="text-left">
                    <p className="font-label-md text-label-md text-on-surface mb-1">Vector DB</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Syncing... 99.8%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-margin-md mt-24 w-full border-t border-outline-variant/20 pt-12">
              <div className="text-left">
                <h3 className="font-headline-md text-headline-md text-primary mb-2">10ms</h3>
                <p className="font-label-md text-label-md text-on-surface-variant">Node-to-node latency</p>
              </div>
              <div className="text-left">
                <h3 className="font-headline-md text-headline-md text-primary mb-2">1M+</h3>
                <p className="font-label-md text-label-md text-on-surface-variant">Requests per second</p>
              </div>
              <div className="text-left">
                <h3 className="font-headline-md text-headline-md text-primary mb-2">99.99%</h3>
                <p className="font-label-md text-label-md text-on-surface-variant">Uptime SLA guarantee</p>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full py-margin-lg bg-background border-t border-outline-variant/20 mt-32">
          <div className="flex flex-col md:flex-row justify-between items-center px-margin-md max-w-container-max mx-auto gap-gutter">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">NEURON_FLOW</div>
              <p className="font-label-md text-label-md text-on-surface-variant">© 2024 NEURON_FLOW. Orchestrated Complexity.</p>
            </div>
            <div className="flex gap-8 items-center">
              <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4" href="#">Documentation</a>
              <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4" href="#">Changelog</a>
              <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4" href="#">Security</a>
              <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4" href="#">Status</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
