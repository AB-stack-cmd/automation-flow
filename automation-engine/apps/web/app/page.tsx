export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-[#fafafa] font-sans p-8">
      {/* CDN imports for styling */}
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        body { font-family: 'Inter', sans-serif; background-color: #09090b; }
      `}</style>

      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold">
            ✨ Platform Live
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Neuron Automation Flow
          </h1>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            A production-ready webhook and visual form builder automation engine. Create interactive forms, expose API endpoints, and orchestrate custom workflow outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto pt-4">
          <a
            href="/forms"
            className="flex flex-col items-start p-6 bg-zinc-900/50 border border-white/5 hover:border-amber-500/30 rounded-2xl text-left transition-all group"
          >
            <span className="text-xs font-bold text-amber-500 mb-1 group-hover:underline">Form submission Builder &rarr;</span>
            <p className="text-xs text-zinc-400 leading-normal">
              Build drag-and-drop form schemas, generate API hooks, and evaluate validation rules.
            </p>
          </a>

          <div
            className="flex flex-col items-start p-6 bg-zinc-900/30 border border-white/5 rounded-2xl text-left opacity-60"
          >
            <span className="text-xs font-bold text-zinc-500 mb-1">Visual Workflow Canvas &rarr;</span>
            <p className="text-xs text-zinc-500 leading-normal">
              Map and connect trigger nodes, condition logic gateways, and AI enrichment actions.
            </p>
          </div>
        </div>

        <footer className="text-[10px] text-zinc-600 pt-16">
          tRPC • Inngest • Prisma • BullMQ • SQLite Persistence
        </footer>
      </div>
    </div>
  );
}
