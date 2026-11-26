import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { SeoHead } from "../../components/seo/SeoHead";
import { ENGINE_TRACKERS } from "../../data/seoRegistry";

interface EngineTrackerPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export const EngineTrackerPage: React.FC<EngineTrackerPageProps> = ({
  slug,
  onNavigate,
  onOpenAuth,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const entry = ENGINE_TRACKERS[slug] || ENGINE_TRACKERS["chatgpt-rank-tracker"];

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={onOpenAuth}>
      <SeoHead
        title={entry.title}
        description={entry.metaDescription}
        canonicalPath={`/trackers/${entry.slug}`}
        pageType="tracker"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Compare", url: "/compare" },
          { name: entry.engineName, url: `/trackers/${entry.slug}` },
        ]}
        faqs={entry.faqs}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
        <div className="max-w-[1060px] mx-auto space-y-10">
          <div className="space-y-5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F7F7F8] border border-[#E5E7EB] text-[11px] font-mono text-[#52525B]">
              {entry.engineName} • {entry.botName} • {entry.referrerDomain}
            </span>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.08] text-[#111113]">
              {entry.h1}
            </h1>
            <div className="bg-[#F7F7F8] border-l-2 border-[#111113] p-5 rounded-r-xl">
              <p className="text-[15px] text-[#111113] leading-relaxed">
                {entry.directAnswer}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate("/tools/ai-battle-card")}
                className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#111113] text-white text-[13px] font-medium hover:bg-[#27272A] cursor-pointer"
              >
                <span>Run Free {entry.engineName} Battle</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate("/tools/ai-crawler-checker")}
                className="px-4 py-2.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[13px] font-medium cursor-pointer"
              >
                Check {entry.botName} Access
              </button>
            </div>
          </div>

          {/* Interactive Metric Preview Panel */}
          <div className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-[#71717A]">
              <span>Live Closed-Loop Telemetry Preview</span>
              <span className="text-[#16A34A]">{entry.sampleMetrics.crawlerStatus}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                <span className="text-[11px] font-mono text-[#71717A]">Visibility Score</span>
                <div className="text-2xl font-semibold text-[#111113] tabular-nums mt-1">
                  {entry.sampleMetrics.visibility}
                </div>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                <span className="text-[11px] font-mono text-[#71717A]">Brand Lie Guard</span>
                <div className="text-2xl font-semibold text-[#16A34A] tabular-nums mt-1">
                  {entry.sampleMetrics.liesCaught}
                </div>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                <span className="text-[11px] font-mono text-[#71717A]">{entry.referrerDomain} Pixel</span>
                <div className="text-2xl font-semibold text-[#111113] tabular-nums mt-1">
                  {entry.sampleMetrics.referralConversions}
                </div>
              </div>
            </div>
          </div>

          {/* How It Selects Sources */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-3">
            <h2 className="text-xl font-semibold text-[#111113]">
              How {entry.engineName} Selects &amp; Cites Sources
            </h2>
            <ul className="space-y-2.5 text-[14px] text-[#52525B]">
              {entry.howItSelectsSources.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3-Step Closed-Loop Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {entry.workflowSteps.map((s) => (
              <div key={s.title} className="bg-[#FAFAFB] border border-[#E5E7EB] rounded-xl p-5 space-y-2">
                <h3 className="text-[14px] font-semibold text-[#111113]">{s.title}</h3>
                <p className="text-[13px] text-[#52525B]">{s.detail}</p>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl">
            {entry.faqs.map((faq, idx) => (
              <div key={faq.q} className="p-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <span className="text-[14px] font-medium text-[#111113]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#71717A] transition-transform ${
                      openFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <p className="mt-2.5 text-[13px] text-[#52525B]">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
