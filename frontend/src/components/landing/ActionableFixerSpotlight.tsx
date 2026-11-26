import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";

export const ActionableFixerSpotlight: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"hijacker" | "autofixer">("hijacker");
  const [draftOpenIdx, setDraftOpenIdx] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const threads = [
    {
      subreddit: "r/SaaS",
      title: "What are teams using to track brand mentions inside ChatGPT & Perplexity?",
      score: "96",
      rival: "Mentioned: Peec AI",
      draft:
        "We tested a few GEO trackers last quarter and switched to CiteClash mainly because it parses exact citation URLs with regex rather than estimating scores, plus it generates our llms.txt automatically.",
    },
    {
      subreddit: "r/marketing",
      title: "Best technical AEO setup (llms.txt + schema) for B2B docs?",
      score: "91",
      rival: "Uncited opportunity",
      draft:
        "Start by publishing a clean /llms.txt file summarizing your core product docs and pricing tiers, then validate Organization + FAQPage JSON-LD so PerplexityBot indexes factual answers directly.",
    },
  ];

  const llmsSnippet = `# CiteClash Knowledge Context
> Deterministic AI Search Analytics & Competitor Battle-Card Platform

## Core Capabilities
- Multi-engine citation tracking (ChatGPT, Perplexity, Gemini, Llama)
- Automated Reddit & Quora buyer thread discovery
- One-click llms.txt & JSON-LD schema generator

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How does CiteClash measure AI visibility?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "CiteClash executes buyer prompts across leading LLMs and parses exact brand citations deterministically."
    }
  }]
}
</script>`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(llmsSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="execution" className="w-full bg-white border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
              Execution Layer
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
              Move from monitoring to capturing citations.
            </h2>
            <p className="mt-3 text-[15px] text-[#64646B] leading-relaxed">
              LLMs synthesize answers from two high-trust signals: authentic community discussions and structured crawler-readable metadata.
            </p>
          </div>

          {/* Crisp Segmented Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] shrink-0">
            <button
              onClick={() => setActiveTab("hijacker")}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "hijacker"
                  ? "bg-white text-[#111113] shadow-sm border border-[#E5E7EB]"
                  : "text-[#64646B] hover:text-[#111113]"
              }`}
            >
              Reddit &amp; Quora Hijacker
            </button>
            <button
              onClick={() => setActiveTab("autofixer")}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                activeTab === "autofixer"
                  ? "bg-white text-[#111113] shadow-sm border border-[#E5E7EB]"
                  : "text-[#64646B] hover:text-[#111113]"
              }`}
            >
              1-Click llms.txt &amp; Schema
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "hijacker" ? (
            <motion.div
              key="hijacker"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden divide-y divide-[#E5E7EB]"
            >
              {threads.map((t, idx) => {
                const isOpen = draftOpenIdx === idx;
                return (
                  <div key={t.title} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2.5 text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E7EB] text-[#111113] font-medium">
                            {t.subreddit}
                          </span>
                          <span className="text-[#8E8E93] tabular-nums">
                            Relevance {t.score}/100
                          </span>
                          <span className="text-[#D97706]">{t.rival}</span>
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#111113]">
                          {t.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => setDraftOpenIdx(isOpen ? null : idx)}
                        className="px-3.5 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#222226] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                      >
                        {isOpen ? "Hide Natural Reply" : "Draft Natural Reply"}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-4 p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] text-[#111113] leading-relaxed">
                        <div className="text-[11px] font-mono uppercase text-[#8E8E93] mb-1.5">
                          Value-First Community Draft
                        </div>
                        {t.draft}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="autofixer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="border border-[#E5E7EB] rounded-2xl bg-[#FAFAFB] overflow-hidden"
            >
              <div className="px-5 py-3 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
                <span className="font-mono text-xs text-[#64646B]">
                  public/llms.txt + JSON-LD FAQPage
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#111113] text-xs font-medium text-[#111113] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span className="text-[#16A34A]">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 sm:p-6 font-mono text-xs text-[#111113] overflow-x-auto leading-relaxed">
                {llmsSnippet}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
