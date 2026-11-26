import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ArrowUpDown, Smile, Link2, ExternalLink } from "lucide-react";
import { BrandSticker } from "./BrandStickers";

type MetricTab = "visibility" | "position" | "sentiment" | "citations";

const TAB_ORDER: MetricTab[] = ["visibility", "position", "sentiment", "citations"];

export const MetricTabsShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MetricTab>("visibility");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        const nextIdx = (TAB_ORDER.indexOf(prev) + 1) % TAB_ORDER.length;
        return TAB_ORDER[nextIdx];
      });
    }, 3600);
    return () => clearInterval(timer);
  }, [isPaused]);

  const tabs: {
    id: MetricTab;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    desc: string;
  }[] = [
    {
      id: "visibility",
      icon: Eye,
      label: "Visibility",
      desc: "See the share of chats where your brand is mentioned and understand how often you show up in conversations.",
    },
    {
      id: "position",
      icon: ArrowUpDown,
      label: "Position",
      desc: "Understand your brand's position within AI search results and uncover opportunities to improve your ranking.",
    },
    {
      id: "sentiment",
      icon: Smile,
      label: "Sentiment",
      desc: "Find out how your brand is perceived by AI, what's going well, and what requires improvements.",
    },
    {
      id: "citations",
      icon: Link2,
      label: "Citations",
      desc: "Inspect every URL and third-party community thread models rely on to justify their recommendations.",
    },
  ];

  const promptByTab: Record<MetricTab, string> = {
    visibility: "What are the best CRMs for Startups?",
    position: "Top B2B CRM alternatives to Salesforce in 2026",
    sentiment: "Is Attio or HubSpot better for product-led teams?",
    citations: "Which CRM do founders recommend on Reddit?",
  };

  return (
    <section id="product" className="w-full bg-[#FAFAFB] border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
      <div className="max-w-[1160px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[12px] font-medium text-[#64646B] mb-3">
            <span>AI Search Metrics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
            Understand how AI sees your brand
          </h2>
          <p className="mt-2.5 text-[15px] text-[#64646B] leading-relaxed">
            We&apos;ve set up tracking for the most important metrics within AI search.
          </p>
        </div>

        {/* Seamless 1px Hairline Shell: Auto-Cycling Left Tabs + Distinct Right Previews */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="grid grid-cols-1 lg:grid-cols-12 border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.03)]"
        >
          {/* Left 4 cols: Seamless 1px Divided Metric Selector */}
          <div className="lg:col-span-4 divide-y divide-[#E5E7EB] lg:border-r border-b lg:border-b-0 border-[#E5E7EB] bg-[#FAFAFB]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-full text-left p-5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white border-l-2 border-l-[#111113]"
                      : "bg-[#FAFAFB] opacity-75 hover:opacity-100 hover:bg-white/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-[#111113]">
                      <Icon className="w-4 h-4 text-[#64646B]" />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-mono text-[#16A34A] uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#64646B] mt-1.5 leading-relaxed">
                    {tab.desc}
                  </p>
                  {isActive && !isPaused && (
                    <motion.div
                      key={`progress-${activeTab}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 3.6, ease: "linear" }}
                      style={{ transformOrigin: "left" }}
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111113]/25"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right 8 cols: Distinct Per-Tab Visual Result */}
          <div
            className="lg:col-span-8 bg-[#FAFAFB] p-6 sm:p-8 min-h-[420px] flex flex-col justify-between"
            style={{
              backgroundImage: "radial-gradient(#E5E7EB 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            {/* Prompt Bubble */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`prompt-${activeTab}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="flex justify-end mb-4"
              >
                <div className="px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] shadow-xs text-[13px] font-medium text-[#111113]">
                  {promptByTab[activeTab]}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Distinct AI Response Card per Tab */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3"
              >
                <BrandSticker name="ChatGPT" size="md" />
                <div className="flex-1 bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.08)] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <span className="text-[12px] text-[#64646B]">
                      {activeTab === "visibility" && "Share of AI answers mentioning each brand:"}
                      {activeTab === "position" && "Exact numbered ranking across 3x quorum prompts:"}
                      {activeTab === "sentiment" && "Tone & buyer perception extracted from AI text:"}
                      {activeTab === "citations" && "Verified web & community URLs shaping this answer:"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[11px] font-mono font-semibold uppercase">
                      {activeTab} view
                    </span>
                  </div>

                  {/* TAB 1: VISIBILITY */}
                  {activeTab === "visibility" && (
                    <div className="space-y-3.5 tabular-nums">
                      {[
                        { name: "Monday", share: 74, engines: "ChatGPT 78% • Perplexity 74%" },
                        { name: "Attio", share: 66, engines: "ChatGPT 68% • Perplexity 70%" },
                        { name: "Linear", share: 58, engines: "ChatGPT 62% • Gemini 54%" },
                        { name: "HubSpot", share: 41, engines: "ChatGPT 43% • Gemini 39%" },
                      ].map((row) => (
                        <div key={row.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-2">
                              <BrandSticker name={row.name} size="sm" />
                              <span className="font-semibold text-[#111113]">{row.name}</span>
                              <span className="text-[11px] font-mono text-[#71717A] hidden sm:inline">
                                {row.engines}
                              </span>
                            </div>
                            <span className="font-mono font-semibold text-[#111113]">
                              {row.share}% Share
                            </span>
                          </div>
                          <div className="h-2 w-full bg-[#F4F4F5] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${row.share}%` }}
                              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full bg-[#111113] rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: POSITION */}
                  {activeTab === "position" && (
                    <div className="divide-y divide-[#E5E7EB] tabular-nums">
                      {[
                        { rank: "#1", name: "Monday", delta: "+1", up: true, quorum: "3/3 Locked In" },
                        { rank: "#2", name: "Attio", delta: "=", up: true, quorum: "3/3 Locked In" },
                        { rank: "#3", name: "Linear", delta: "+2", up: true, quorum: "2/3 Moderate" },
                        { rank: "#4", name: "HubSpot", delta: "-1", up: false, quorum: "2/3 Moderate" },
                      ].map((item) => (
                        <div key={item.name} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-[#111113] text-white font-mono text-[12px] font-semibold inline-flex items-center justify-center">
                              {item.rank}
                            </span>
                            <BrandSticker name={item.name} size="sm" />
                            <span className="text-[13px] font-semibold text-[#111113]">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-mono text-[#71717A] hidden sm:inline">
                              {item.quorum}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                item.up
                                  ? "bg-[#ECFDF5] text-[#16A34A]"
                                  : "bg-[#FFF1F2] text-[#E11D48]"
                              }`}
                            >
                              {item.delta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 3: SENTIMENT */}
                  {activeTab === "sentiment" && (
                    <div className="space-y-3 tabular-nums">
                      {[
                        {
                          name: "Attio",
                          score: "94/100 Positive",
                          cls: "bg-[#ECFDF5] text-[#16A34A] border-[#BBF7D0]",
                          quote: '"Flexible relational data model, fast setup for product-led startups."',
                        },
                        {
                          name: "Monday",
                          score: "86/100 Positive",
                          cls: "bg-[#ECFDF5] text-[#16A34A] border-[#BBF7D0]",
                          quote: '"Clean workflow automations and approachable team onboarding."',
                        },
                        {
                          name: "HubSpot",
                          score: "62/100 Mixed",
                          cls: "bg-amber-50 text-[#D97706] border-amber-200",
                          quote: '"Rich ecosystem, though teams cite steep enterprise tier pricing jumps."',
                        },
                      ].map((s) => (
                        <div key={s.name} className="p-3 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <BrandSticker name={s.name} size="sm" />
                              <span className="text-[13px] font-semibold text-[#111113]">{s.name}</span>
                            </div>
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${s.cls}`}>
                              {s.score}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#52525B] italic">{s.quote}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 4: CITATIONS */}
                  {activeTab === "citations" && (
                    <div className="divide-y divide-[#E5E7EB] tabular-nums">
                      {[
                        {
                          domain: "reddit.com",
                          url: "reddit.com/r/SaaS/comments/best_crm_2026",
                          tag: "Verified Grounding",
                          share: "34%",
                        },
                        {
                          domain: "g2.com",
                          url: "g2.com/categories/crm-software",
                          tag: "Review Authority",
                          share: "28%",
                        },
                        {
                          domain: "techcrunch.com",
                          url: "techcrunch.com/2026/modern-crm-stack",
                          tag: "Editorial",
                          share: "19%",
                        },
                      ].map((cit) => (
                        <div key={cit.domain} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <BrandSticker name={cit.domain} size="sm" />
                            <div className="min-w-0">
                              <div className="text-[12.5px] font-mono font-medium text-[#111113] truncate flex items-center gap-1">
                                <span>{cit.url}</span>
                                <ExternalLink className="w-3 h-3 text-[#71717A] shrink-0" />
                              </div>
                              <span className="text-[10.5px] font-mono text-[#16A34A]">{cit.tag}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#F4F4F5] border border-[#E5E7EB] text-[11px] font-mono font-semibold text-[#111113] shrink-0">
                            {cit.share}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
