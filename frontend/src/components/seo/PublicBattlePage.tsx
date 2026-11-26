import React from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { PublicLayout } from "../layout/PublicLayout";
import { ShareableBattleCard } from "../battle/ShareableBattleCard";
import { SeoSchemaHead } from "./SeoSchemaHead";

interface PublicBattlePageProps {
  slug: string;
  onNavigateHome: () => void;
  onNavigate: (path: string) => void;
}

export const PublicBattlePage: React.FC<PublicBattlePageProps> = ({
  slug,
  onNavigateHome,
  onNavigate,
}) => {
  const parts = slug.split("-vs-");
  const brandA = parts[0] ? `${parts[0]}.com` : "linear.app";
  const brandB = parts[1] ? `${parts[1]}.com` : "jira.atlassian.com";

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={() => onNavigate("/signup")}>
      <SeoSchemaHead
        title={`${brandA} vs ${brandB} — AI Search Battle Report | CiteClash`}
        description={`Head-to-head AI visibility benchmark comparing ${brandA} vs ${brandB} across ChatGPT, Perplexity, and Google Gemini.`}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[12px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
                Public AI Battle Report
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#111113]">
                {brandA} vs {brandB}
              </h1>
              <p className="text-sm text-[#52525B] mt-2 max-w-2xl">
                Deterministic citation analysis across ChatGPT Search, Perplexity AI, and Google Gemini.
              </p>
            </div>

            <button
              type="button"
              onClick={onNavigateHome}
              className="group inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
            >
              <span>Run Your Own Free Battle</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <ShareableBattleCard
            brandA={brandA}
            brandB={brandB}
            scoreA={84}
            scoreB={41}
            avgRankA="#1.2"
            avgRankB="#3.8"
          />

          {/* Comparison Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[#71717A] font-mono uppercase">
                    <th className="py-3 px-4 whitespace-nowrap">Buyer Prompt</th>
                    <th className="py-3 px-4 whitespace-nowrap">{brandA}</th>
                    <th className="py-3 px-4 whitespace-nowrap">{brandB}</th>
                    <th className="py-3 px-4 whitespace-nowrap">Top Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] tabular-nums">
                  {[
                    { prompt: `Best alternative to ${brandB} in 2026`, winA: true, rankA: "#1", rankB: "#3", src: "reddit.com" },
                    { prompt: `${brandA} vs ${brandB} pricing & speed`, winA: true, rankA: "#1", rankB: "#2", src: "g2.com" },
                    { prompt: `Enterprise workflow migration guide`, winA: false, rankA: "#3", rankB: "#1", src: "techradar.com" },
                  ].map((r) => (
                    <tr key={r.prompt} className="hover:bg-[#FAFAFB]">
                      <td className="py-3.5 px-4 font-medium text-[#111113]">{r.prompt}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold">
                          <Check className="w-3.5 h-3.5" /> {r.rankA}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="inline-flex items-center gap-1 text-[#E11D48] font-semibold">
                          <X className="w-3.5 h-3.5" /> {r.rankB}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#52525B]">{r.src}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
