import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BrandSticker } from "./BrandStickers";

interface DarkCTAAndFooterProps {
  onOpenAuth: (mode?: "login" | "signup") => void;
  onNavigate?: (path: string) => void;
}

export const DarkCTAAndFooter: React.FC<DarkCTAAndFooterProps> = ({
  onOpenAuth,
  onNavigate,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNav = (path: string) => {
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail("");
  };

  return (
    <footer className="w-full bg-white pt-14">
      {/* Peec.ai Screenshot 8: Rounded Dark Carbon Card inside Paper Frame */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-[#0B0B0D] text-white border border-black/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left 6 cols: Executive Copy + Tactile White CTA */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 space-y-5">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-[-0.035em] leading-[1.08] text-white">
              Find out what AI says{" "}
              <span className="text-[#8E8E93] block">about your brand</span>
            </h2>
            <p className="text-sm text-[#8E8E93] max-w-md leading-relaxed">
              Audit your domain against top competitors across ChatGPT, Perplexity, and Gemini in under 30 seconds.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenAuth("signup")}
                className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-white text-[#111113] text-[13px] font-medium hover:bg-[#F4F4F5] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Start free trial</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector("#hero-scanner");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#16161A] border border-white/15 text-white text-[13px] font-medium hover:border-white/30 transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-xs bg-[#8E8E93]" />
                <span>Run Battle Scan</span>
              </button>
            </div>
          </div>

          {/* Right 6 cols: Perspective-Angled Dark Dashboard Table Preview */}
          <div className="lg:col-span-6 p-6 sm:p-8 lg:pr-0 overflow-hidden">
            <div className="rounded-xl border border-white/10 bg-[#121215] p-5 shadow-2xl transform lg:rotate-[-2deg] lg:translate-x-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8E8E93] pb-3 border-b border-white/10">
                <span>Rankings • Comparison with Competitors</span>
                <span>Visibility 4/14</span>
              </div>
              <div className="divide-y divide-white/[0.06] text-xs tabular-nums mt-1">
                {[
                  { rank: 1, brand: "Monday", vis: "95%", sent: "95", pos: "#1.2" },
                  { rank: 2, brand: "Attio", vis: "80%", sent: "91", pos: "#1.8" },
                  { rank: 3, brand: "Linear", vis: "74%", sent: "89", pos: "#2.1" },
                  { rank: 4, brand: "Pipedrive", vis: "52%", sent: "76", pos: "#2.9" },
                  { rank: 5, brand: "Salesforce", vis: "39%", sent: "64", pos: "#3.4" },
                ].map((r) => (
                  <div key={r.brand} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[#8E8E93] w-4">{r.rank}</span>
                      <BrandSticker name={r.brand} size="sm" />
                      <span className="font-medium text-white">{r.brand}</span>
                    </div>
                    <div className="flex items-center gap-5 font-mono">
                      <span className="text-white font-semibold">{r.vis}</span>
                      <span className="text-[#16A34A]">{r.sent}</span>
                      <span className="text-[#8E8E93] hidden sm:inline">{r.pos}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Bleed Deep Carbon Black Enterprise Mega Footer */}
      <div className="w-full bg-[#0B0B0D] text-white pt-14 pb-8 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-[1200px] mx-auto">
          <div className="pb-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 border-b border-white/10">
            {/* Col 1: Brand + Status */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0B0B0D]" />
                </div>
                <span className="text-[15px] font-semibold tracking-tight text-white">
                  CiteClash
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Deterministic AI search analytics and competitor intelligence for modern growth teams.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-mono text-[#16A34A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                <span>All AI Engines Operational</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-white">
                Product
              </div>
              <ul className="space-y-2 text-xs text-[#8E8E93]">
                <li><a href="#product" className="hover:text-white transition-colors">Visibility Analytics</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Methodology</a></li>
                <li><a href="#reports" className="hover:text-white transition-colors">Executive Reports</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Col 3: Compare & Alternatives */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-white">
                Compare &amp; Alternatives
              </div>
              <ul className="space-y-2 text-xs text-[#8E8E93]">
                <li>
                  <button onClick={() => handleNav("/compare/peec-ai")} className="hover:text-white transition-colors text-left cursor-pointer">
                    CiteClash vs Peec AI
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/compare/otterly-ai")} className="hover:text-white transition-colors text-left cursor-pointer">
                    CiteClash vs Otterly.AI
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/compare/profound")} className="hover:text-white transition-colors text-left cursor-pointer">
                    CiteClash vs Profound
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/alternatives/peec-ai-alternatives")} className="hover:text-white transition-colors text-left cursor-pointer">
                    Best Peec AI Alternatives
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/best-geo-tools")} className="hover:text-white transition-colors text-left cursor-pointer">
                    Best GEO Tools (2026)
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/compare")} className="text-white hover:underline transition-colors text-left cursor-pointer">
                    All Comparisons →
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: AI Trackers & Free Tools */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-white">
                AI Trackers &amp; Tools
              </div>
              <ul className="space-y-2 text-xs text-[#8E8E93]">
                <li>
                  <button onClick={() => handleNav("/trackers/chatgpt-rank-tracker")} className="hover:text-white transition-colors text-left cursor-pointer">
                    ChatGPT Rank Tracker
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/trackers/perplexity-citation-tracker")} className="hover:text-white transition-colors text-left cursor-pointer">
                    Perplexity Citation Tracker
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/trackers/gemini-visibility-tracker")} className="hover:text-white transition-colors text-left cursor-pointer">
                    Gemini Visibility Tracker
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/tools/ai-battle-card")} className="hover:text-white transition-colors text-left cursor-pointer">
                    Free AI Battle Card
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/tools/llms-txt-generator")} className="hover:text-white transition-colors text-left cursor-pointer">
                    Free llms.txt Generator
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNav("/tools/ai-crawler-checker")} className="hover:text-white transition-colors text-left cursor-pointer">
                    Live AI Crawler Checker
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Legal & Newsletter */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-white">
                Legal &amp; Updates
              </div>
              <ul className="space-y-2 text-xs text-[#8E8E93]">
                <li><button onClick={() => handleNav("/privacy")} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button></li>
                <li><button onClick={() => handleNav("/terms")} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button></li>
                <li><button onClick={() => handleNav("/refund")} className="hover:text-white transition-colors cursor-pointer">Refund Policy</button></li>
              </ul>

              <form onSubmit={handleNewsletter} className="pt-2 space-y-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#141417] border border-white/15 text-xs text-white placeholder-[#8E8E93] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-md bg-white text-[#111113] text-xs font-medium hover:bg-[#E5E7EB] transition-colors shrink-0 cursor-pointer"
                  >
                    Join
                  </button>
                </div>
                {subscribed && (
                  <div className="text-[11px] font-mono text-[#16A34A]">
                    Subscribed to GEO briefings.
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[#64646B]">
            <span>&copy; {new Date().getFullYear()} CiteClash Inc. All rights reserved.</span>
            <span>Deterministic AI Search Analytics</span>
          </div>

          <div className="pt-8 select-none pointer-events-none text-center overflow-hidden">
            <span className="text-[13vw] leading-[0.82] font-semibold tracking-[-0.04em] text-white/[0.03] block">
              CITECLASH
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
