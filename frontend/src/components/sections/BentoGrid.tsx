import React from "react";
import {
  MessageSquare,
  Sparkles,
  Bot,
  Radar,
  Wrench,
  ShieldCheck,
  Flame,
} from "lucide-react";

export const BentoGrid: React.FC = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Deep GEO Intelligence
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-sans tracking-tight">
          Everything You Need to Dominate AI Search
        </h2>
        <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
          Reverse-engineer the exact datasets and knowledge graphs that ChatGPT, Perplexity, and Google AI rely upon to formulate recommendations.
        </p>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Large Tile 1: Reddit & Quora Hijacker (7 cols) */}
        <div className="md:col-span-7 linear-card rounded-3xl p-7 sm:p-9 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-orange-400">
              High-Converting Forum Extraction
            </span>
          </div>

          <h3 className="text-2xl font-bold text-white font-sans mb-3">
            Reddit & Quora Citation Hijacker
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl mb-6">
            LLMs prioritize Reddit and Quora discussions above traditional blogs. CiteClash automatically detects high-impact threads that AI engines feed from and provides pre-approved, non-promotional responses to anchor your brand.
          </p>

          {/* Interactive Mock Mini Feed */}
          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#09090B] border border-white/5 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold">r/SaaS</span>
                <span className="text-slate-400 truncate max-w-[280px]">"What is the best alternative to AWS DynamoDB for multi-region?"</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Source: 89% Weight
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#09090B] border border-white/5 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold">Quora</span>
                <span className="text-slate-400 truncate max-w-[280px]">"Which AI search optimization platform provides true ROI in 2026?"</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI Source: 94% Weight
              </span>
            </div>
          </div>
        </div>

        {/* Medium Tile 2: AI Auto-Fixer (5 cols) */}
        <div className="md:col-span-5 linear-card rounded-3xl p-7 sm:p-9 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
              Automated Remediation
            </span>
          </div>

          <h3 className="text-2xl font-bold text-white font-sans mb-3">
            AI Auto-Fixer Engine
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Generate Schema.org microdata, high-intent comparison matrix markdown, and authoritative fact sheets calibrated specifically for LLM token ingestion.
          </p>

          <div className="p-4 rounded-xl bg-[#09090B] border border-cyan-500/30 font-mono text-[11px] text-cyan-300">
            <code>
              {`> Generating schema.org/ComparisonPage\n✓ Injected LLM-readable entity keys\n✓ Indexed by Perplexity & Claude`}
            </code>
          </div>
        </div>

        {/* Tile 3: Realtime Competitor Radar (4 cols) */}
        <div className="md:col-span-4 linear-card rounded-3xl p-7 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
            <Radar className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white font-sans mb-2">
            Competitor Battle Radar
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
            Get instant Slack & email alerts the moment a competitor domain overtakes your brand's ranking position on top buying prompts.
          </p>
          <div className="font-mono text-xs text-pink-400 bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20 inline-flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>24/7 Continuous LLM Crawling</span>
          </div>
        </div>

        {/* Tile 4: Multi-Model Parity (4 cols) */}
        <div className="md:col-span-4 linear-card rounded-3xl p-7 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white font-sans mb-2">
            Multi-LLM Citation Graph
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
            Simultaneous real-time querying across ChatGPT Search, Perplexity Pro, Google AI Overviews, Anthropic Claude, and Meta Llama.
          </p>
          <div className="font-mono text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>6 Major Models Benchmarked</span>
          </div>
        </div>

        {/* Tile 5: Tenant Data Isolation (4 cols) */}
        <div className="md:col-span-4 linear-card rounded-3xl p-7 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white font-sans mb-2">
            Enterprise Security
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
            PostgreSQL / Supabase compatible with strict session-level workspace isolation and SOC2-ready cryptographic token security.
          </p>
          <div className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Cross-Tenant Leakage</span>
          </div>
        </div>
      </div>
    </section>
  );
};
