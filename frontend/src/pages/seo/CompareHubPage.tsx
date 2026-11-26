import React from "react";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { SeoHead } from "../../components/seo/SeoHead";
import {
  ALTERNATIVES_PILLARS,
  COMPARE_COMPETITORS,
  ENGINE_TRACKERS,
} from "../../data/seoRegistry";

interface CompareHubPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export const CompareHubPage: React.FC<CompareHubPageProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  const freeTools = [
    {
      path: "/tools/ai-battle-card",
      title: "Free AI Battle Card Generator",
      desc: "Run a 15-second head-to-head visibility battle & export 1200×630 PNG.",
    },
    {
      path: "/tools/llms-txt-generator",
      title: "Free llms.txt & FAQ JSON-LD Generator",
      desc: "Generate standardized /llms.txt and FAQ schema for AI crawlers.",
    },
    {
      path: "/tools/ai-crawler-checker",
      title: "Live AI Bot & Crawlability Checker",
      desc: "Test OAI-SearchBot, GPTBot, PerplexityBot & JS blank-page traps live.",
    },
  ];

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={onOpenAuth}>
      <SeoHead
        title="Compare AI Visibility & GEO Platforms (2026 Directory)"
        description="Explore all 18 CiteClash comparisons, alternatives guides, AI engine trackers, and free live GEO tools."
        canonicalPath="/compare"
        pageType="hub"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Compare Directory", url: "/compare" },
        ]}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
        <div className="max-w-[1120px] mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              2026 GEO Intelligence Directory
            </span>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] text-[#111113]">
              Compare AI Visibility &amp; GEO Platforms
            </h1>
            <p className="text-base text-[#52525B]">
              Transparent head-to-head breakdowns, pricing benchmarks, engine trackers, and free live diagnostic tools.
            </p>
          </div>

          {/* 1. Direct Competitor VS Comparisons */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#111113]">
              1. Direct Competitor Comparisons (8)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
              {Object.values(COMPARE_COMPETITORS).map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => onNavigate(`/compare/${c.slug}`)}
                  className="p-4 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#111113] text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-[#111113]">
                      CiteClash vs {c.competitorName}
                    </div>
                    <div className="text-[12px] font-mono text-[#71717A] mt-0.5">
                      {c.competitorPrice}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#111113]">
                    Read comparison <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Alternatives & Buyer Guides */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#111113]">
              2. Best Alternatives &amp; 2026 Buyer Guides (4)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
              {Object.values(ALTERNATIVES_PILLARS).map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => onNavigate(p.path)}
                  className="p-5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] hover:border-[#111113] text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div className="text-[14px] font-semibold text-[#111113]">{p.h1}</div>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#111113]">
                    Open 2026 guide <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Engine Trackers */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#111113]">
              3. AI Search Engine Trackers (3)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
              {Object.values(ENGINE_TRACKERS).map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => onNavigate(`/trackers/${t.slug}`)}
                  className="p-5 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#111113] text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-[11px] font-mono text-[#71717A]">{t.botName}</div>
                    <div className="text-[14px] font-semibold text-[#111113] mt-1">
                      {t.engineName} Tracker
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#111113]">
                    Explore tracker <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Free Interactive Tools */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#111113]">
              4. Free Live GEO Tools (3)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
              {freeTools.map((tool) => (
                <button
                  key={tool.path}
                  type="button"
                  onClick={() => onNavigate(tool.path)}
                  className="p-5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] hover:border-[#111113] text-left flex flex-col justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-[#111113]">{tool.title}</div>
                    <p className="text-[12px] text-[#52525B] mt-1">{tool.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#111113]">
                    Launch free tool <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
