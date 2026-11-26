import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is Generative Engine Optimization (GEO) and how does it differ from traditional SEO?",
      a: "Traditional SEO focuses on keyword placement and backlinks to rank blue links in Google SERPs. GEO focuses on how Large Language Models (ChatGPT, Perplexity, Claude, Gemini) formulate synthesized answers. LLMs cite authoritative sources, comparison tables, forum consensus (Reddit/Quora), and structured entity data. CiteClash monitors and optimizes for this new AI-first paradigm.",
    },
    {
      q: "How frequently does CiteClash crawl and query the AI search engines?",
      a: "On the Free tier, audits run on-demand. On the Starter tier, prompts are benchmarked weekly. On Growth and Agency tiers, our crawler engine executes continuous daily multi-agent synthetic prompts across ChatGPT, Perplexity, and Google AI Overviews with instant change alerts.",
    },
    {
      q: "How does the Reddit & Quora Citation Hijacker work?",
      a: "LLMs consistently cite top Reddit discussions and Quora threads when users ask for product recommendations or competitor comparisons. CiteClash identifies the exact live threads currently indexed in LLM knowledge graphs and alerts you when your competitors are mentioned so your team can participate constructively.",
    },
    {
      q: "Can I export Battle Cards and share them on social media?",
      a: "Yes! Every battle card includes a 1-click 'Download Shareable PNG Battle Card' feature powered by html-to-image. It formats a high-resolution, watermark-branded scorecard sized perfectly for LinkedIn, Twitter, or investor updates.",
    },
    {
      q: "Is my workspace and competitor tracking data isolated?",
      a: "Yes, completely. Our backend uses SQLAlchemy 2.0 with strict session-level ownership verification. No user or competitor data can ever be accessed or queried across workspaces.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Got Questions?
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-slate-400 mt-2 text-sm sm:text-base">
          Everything you need to know about AI search citations, competitor battle-cards, and GEO.
        </p>
      </div>

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="linear-card rounded-2xl border border-white/10 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-semibold text-sm sm:text-base text-white font-sans">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-purple-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
