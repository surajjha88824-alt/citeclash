import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Plus, ArrowRight } from "lucide-react";
import { BrandSticker } from "./BrandStickers";

export const BentoFragmentGrid: React.FC = () => {
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "ChatGPT",
    "AI Overviews",
    "Claude",
    "Perplexity",
  ]);
  const [trackedBrands, setTrackedBrands] = useState<string[]>(["Pipedrive"]);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const toggleBrand = (brand: string) => {
    setTrackedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
      <div className="max-w-[1160px] mx-auto">
        <div className="max-w-2xl mb-8">
          <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
            Granular Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
            Understand how AI sees your brand.
          </h2>
          <p className="mt-2.5 text-[15px] text-[#64646B] leading-relaxed">
            Configure your tracked prompts, benchmark rival brands, inspect cited sources, and act on high-impact recommendations.
          </p>
        </div>

        {/* Peec.ai-Style 6-Card Architectural Paper Grid */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch"
        >
          {/* Card 1 (7 cols): Set up Prompts */}
          <div className="md:col-span-7 bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(15,23,42,0.12)] transition-all duration-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[360px]">
            <div className="max-w-sm">
              <h3 className="text-[17px] font-semibold text-[#111113] tracking-tight">
                Set up Prompts
              </h3>
              <p className="text-[13px] text-[#64646B] mt-1.5 leading-relaxed">
                Prompts are the foundation of your AI search strategy. Uncover and organize the queries that matter most.
              </p>
            </div>

            <div className="relative mt-6 pt-2">
              <div className="border border-[#E5E7EB] rounded-xl bg-[#FAFAFB] p-3.5 space-y-2 opacity-75">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8E93] pb-1.5 border-b border-[#E5E7EB]">
                  <span>Tracked Prompts</span>
                  <span>Visibility</span>
                </div>
                {[
                  { q: "Best AI native CRM 2026", vis: "84%" },
                  { q: "CRM software with workflow automation", vis: "79%" },
                  { q: "Top-rated B2B analytics platforms", vis: "71%" },
                ].map((row) => (
                  <div key={row.q} className="flex items-center justify-between text-xs text-[#64646B]">
                    <span className="truncate">{row.q}</span>
                    <span className="font-mono tabular-nums">{row.vis}</span>
                  </div>
                ))}
              </div>

              <div className="mt-[-36px] relative z-10 mx-2 sm:mx-4 bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[0_18px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="text-[13px] font-semibold text-[#111113]">
                  What are the best CRMs for fast growing companies?
                </div>
                <div className="text-[11px] text-[#8E8E93] font-mono mt-0.5">
                  2 Unique Tags • US IP address • Rising Position
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB]">
                    <div className="text-[10px] font-mono text-[#8E8E93]">Tags</div>
                    <div className="mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[#D97706] text-[10px] font-medium">
                        Problem-aware
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB]">
                    <div className="text-[10px] font-mono text-[#8E8E93]">Location</div>
                    <div className="mt-1 text-[11px] font-medium text-[#111113]">US · Global</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB]">
                    <div className="text-[10px] font-mono text-[#8E8E93]">Est. Volume</div>
                    <div className="mt-1 text-[11px] font-medium text-[#16A34A]">Rising 7d ↑</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 (5 cols): Use Data to Pick Winners */}
          <div className="md:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[360px]">
            <div>
              <h3 className="text-[17px] font-semibold text-[#111113] tracking-tight">
                Use Data to Pick Winners
              </h3>
              <p className="text-[13px] text-[#64646B] mt-1.5 leading-relaxed">
                Leverage AI-suggested prompts and citation volumes to focus on the highest-ROI opportunities.
              </p>
            </div>

            <div className="relative mt-6 space-y-3 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
              <div className="text-[11px] font-mono text-[#8E8E93] uppercase">
                Suggested Prompts (14)
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
                <div className="text-[13px] font-semibold text-[#111113] leading-snug">
                  Best CRM software with intuitive user interfaces and customizable workflows
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[10px] font-mono font-semibold">
                    High Volume
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-[#4F46E5] text-[10px] font-mono font-medium">
                    Solution Aware
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-2">
                <div className="text-[13px] font-medium text-[#64646B] leading-snug">
                  What are the top CRM systems that provide AI-driven insights?
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 (5 cols): Add Brands with Sticker Logos */}
          <div className="md:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[340px]">
            <div>
              <h3 className="text-[17px] font-semibold text-[#111113] tracking-tight">
                Add Brands
              </h3>
              <p className="text-[13px] text-[#64646B] mt-1.5 leading-relaxed">
                See how you rank against the players that matter in your market.
              </p>
            </div>

            <div className="mt-6 space-y-3 [mask-image:linear-gradient(to_bottom,black_82%,transparent_100%)]">
              <div className="text-[11px] font-mono text-[#8E8E93]">Brands (5)</div>
              {[
                { name: "Monday", domain: "monday.com" },
                { name: "Pipedrive", domain: "pipedrive.com" },
              ].map((b) => {
                const isTracking = trackedBrands.includes(b.name);
                return (
                  <div
                    key={b.name}
                    className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandSticker name={b.name} size="md" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#111113] truncate">
                          {b.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#8E8E93] truncate">
                          {b.domain}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleBrand(b.name)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors shrink-0 inline-flex items-center gap-1 cursor-pointer ${
                        isTracking
                          ? "bg-[#ECFDF5] text-[#16A34A] border border-[#16A34A]/20"
                          : "bg-[#111113] text-white hover:bg-[#222226]"
                      }`}
                    >
                      {isTracking ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Actively Tracking</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Start Tracking</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4 (7 cols): Choose AI Models with Sticker Logos */}
          <div className="md:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[340px]">
            <div className="max-w-md">
              <h3 className="text-[17px] font-semibold text-[#111113] tracking-tight">
                Choose AI Models
              </h3>
              <p className="text-[13px] text-[#64646B] mt-1.5 leading-relaxed">
                Track rankings across the models that drive the most traffic and visibility.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]">
              <div className="sm:col-span-5 border border-[#E5E7EB] rounded-xl bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8E93] pb-1 border-b border-[#E5E7EB]">
                  <span>Models</span>
                  <span>Daily</span>
                </div>
                {["ChatGPT", "AI Overviews", "Claude", "Perplexity", "Gemini", "Llama"].map(
                  (m) => {
                    const checked = selectedModels.includes(m);
                    return (
                      <button
                        key={m}
                        onClick={() => toggleModel(m)}
                        className="w-full flex items-center justify-between py-1 text-left text-[12px] cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              checked
                                ? "bg-[#111113] border-[#111113] text-white"
                                : "bg-white border-[#D4D4D8]"
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </span>
                          <span className={checked ? "font-medium text-[#111113]" : "text-[#64646B]"}>
                            {m}
                          </span>
                        </span>
                        <BrandSticker name={m} size="sm" />
                      </button>
                    );
                  }
                )}
              </div>

              <div className="sm:col-span-7 border border-[#E5E7EB] rounded-xl bg-[#FAFAFB] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8E93]">
                  <span>Recent Chats</span>
                  <span>Live Sync</span>
                </div>
                {[
                  {
                    q: "What's the best way to structure a CRM for a fast-growing startup?",
                    meta: "#1 • Score 88 • 1d ago",
                  },
                  {
                    q: "Which CRM platforms offer the best customer support?",
                    meta: "#2 • Score 81 • 2d ago",
                  },
                ].map((chat) => (
                  <div
                    key={chat.q}
                    className="p-3 rounded-lg bg-white border border-[#E5E7EB] space-y-1"
                  >
                    <div className="text-[12px] font-medium text-[#111113] line-clamp-2">
                      {chat.q}
                    </div>
                    <div className="text-[11px] font-mono text-[#16A34A]">{chat.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5 (7 cols): Find Key Sources (Peec AI Screenshot 9) */}
          <div className="md:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[340px]">
            <div className="max-w-sm">
              <h3 className="text-[17px] font-semibold text-[#111113] tracking-tight">
                Find Key Sources
              </h3>
              <p className="text-[13px] text-[#64646B] mt-1.5 leading-relaxed">
                Spot the citations shaping your visibility and refine your GEO strategy.
              </p>
            </div>

            <div className="relative mt-6 border border-[#E5E7EB] rounded-xl bg-white p-4">
              <div className="divide-y divide-[#E5E7EB] text-[12px] tabular-nums">
                {[
                  { domain: "reddit.com", type: "UGC", used: "32%", avg: "3.2" },
                  { domain: "attio.com", type: "You", used: "43%", avg: "5.2" },
                  { domain: "wikipedia.org", type: "Reference", used: "31%", avg: "1.4" },
                  { domain: "hubspot.com", type: "Competitor", used: "39%", avg: "1.1" },
                ].map((s) => (
                  <div key={s.domain} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandSticker name={s.domain} size="sm" />
                      <span className="font-mono font-medium text-[#111113] truncate">
                        {s.domain}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E7EB] text-[10px] font-mono text-[#64646B]">
                        {s.type}
                      </span>
                      <span className="font-mono font-semibold text-[#111113] w-9 text-right">
                        {s.used}
                      </span>
                      <span className="font-mono text-[#8E8E93] w-7 text-right hidden sm:inline">
                        {s.avg}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111113] text-white text-[11px] font-medium shadow-md">
                  <Check className="w-3 h-3 text-[#16A34A]" />
                  <span>You have 5 strategy recommendations</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 6 (5 cols): Act on Insights (Peec AI Screenshot 9) */}
          <div className="md:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden min-h-[340px]">
            <div>
              <h3 className="text-[17px] font-semibold text-[#111113] tracking-tight">
                Act on Insights
              </h3>
              <p className="text-[13px] text-[#64646B] mt-1.5 leading-relaxed">
                Use recommendations to capture high-impact opportunities and boost your ranking.
              </p>
            </div>

            <div className="mt-6 space-y-2.5 [mask-image:linear-gradient(to_bottom,black_82%,transparent_100%)]">
              <div className="p-3 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#64646B]">
                <div>
                  <div className="font-medium text-[#111113]">LinkedIn is a common source</div>
                  <div className="text-[11px]">Consider joining the conversation</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E8E93]" />
              </div>

              <div className="p-3.5 rounded-xl bg-[#111113] text-white shadow-lg flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold">
                    Join r/CRM subreddit discussions
                  </div>
                  <div className="text-[11px] text-[#8E8E93] mt-0.5">
                    Discussions show up frequently in sources.
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white shrink-0" />
              </div>

              <div className="p-3 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#64646B]">
                <div>
                  <div className="font-medium text-[#111113]">Articles from NYT show up in...</div>
                  <div className="text-[11px]">Consider placing a story via digital PR</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#8E8E93]" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
