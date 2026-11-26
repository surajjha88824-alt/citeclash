import React, { useState } from "react";
import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { SeoHead } from "../../components/seo/SeoHead";
import {
  ALTERNATIVES_PILLARS,
  LEGAL_TRADEMARK_DISCLAIMER,
} from "../../data/seoRegistry";

interface AlternativesPillarPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export const AlternativesPillarPage: React.FC<AlternativesPillarPageProps> = ({
  slug,
  onNavigate,
  onOpenAuth,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const entry =
    ALTERNATIVES_PILLARS[slug] || ALTERNATIVES_PILLARS["peec-ai-alternatives"];

  const renderBoolOrStr = (val: boolean | string) => {
    if (typeof val === "boolean") {
      return val ? (
        <Check className="w-4 h-4 text-[#16A34A] mx-auto" />
      ) : (
        <Minus className="w-4 h-4 text-[#A1A1AA] mx-auto" />
      );
    }
    return <span className="font-mono text-[11px] text-[#52525B]">{val}</span>;
  };

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={onOpenAuth}>
      <SeoHead
        title={entry.title}
        description={entry.metaDescription}
        canonicalPath={entry.path}
        pageType="alternatives"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Compare", url: "/compare" },
          { name: entry.h1, url: entry.path },
        ]}
        faqs={entry.faqs}
        itemListNames={entry.tools.map((t) => t.name)}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (9 cols) */}
          <div className="lg:col-span-9 space-y-10 min-w-0">
            <div className="space-y-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F7F7F8] border border-[#E5E7EB] text-[11px] font-mono text-[#52525B]">
                Last Updated: November 2026
              </span>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
                {entry.h1}
              </h1>
              <div className="bg-[#F7F7F8] border-l-2 border-[#111113] p-5 rounded-r-xl">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
                  TL;DR Summary
                </span>
                <p className="text-[14px] text-[#111113] leading-relaxed">
                  {entry.tldrSummary}
                </p>
              </div>
            </div>

            {/* Full Multi-Tool Comparison Table */}
            <div id="comparison-table" className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[680px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[11px] font-mono uppercase text-[#71717A]">
                      <th className="py-3.5 px-4">Tool</th>
                      <th className="py-3.5 px-4">Starting Price</th>
                      <th className="py-3.5 px-4 text-center">Fix Loop</th>
                      <th className="py-3.5 px-4 text-center">Lie Guard</th>
                      <th className="py-3.5 px-4 text-center">Traffic Pixel</th>
                      <th className="py-3.5 px-4 text-center">Battle Cards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
                    {entry.tools.map((t) => (
                      <tr key={t.name} className={t.name === "CiteClash" ? "bg-[#FAFAFB]" : ""}>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#111113]">{t.name}</div>
                          <div className="text-[11px] text-[#71717A]">{t.bestFor}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[12px] text-[#111113] whitespace-nowrap tabular-nums">
                          {t.startingPrice}
                        </td>
                        <td className="py-3.5 px-4 text-center">{renderBoolOrStr(t.fixLoop)}</td>
                        <td className="py-3.5 px-4 text-center">{renderBoolOrStr(t.brandLieGuard)}</td>
                        <td className="py-3.5 px-4 text-center">{renderBoolOrStr(t.aiTrafficPixel)}</td>
                        <td className="py-3.5 px-4 text-center">{renderBoolOrStr(t.battleCards)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual Review Cards */}
            <div id="tool-reviews" className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#111113]">
                Detailed Platform Breakdown
              </h2>
              {entry.tools.map((t, idx) => (
                <div
                  key={t.name}
                  className={`rounded-xl p-6 border ${
                    t.name === "CiteClash"
                      ? "bg-white border-2 border-[#111113]"
                      : "bg-white border-[#E5E7EB]"
                  } space-y-4`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono text-[#71717A]">
                        #{idx + 1} • {t.startingPrice}
                      </span>
                      <h3 className="text-lg font-semibold text-[#111113]">{t.name}</h3>
                    </div>
                    {t.name === "CiteClash" && (
                      <button
                        type="button"
                        onClick={() => onNavigate("/tools/ai-battle-card")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111113] text-white text-[12px] font-medium cursor-pointer"
                      >
                        <span>Run Free Battle</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <p className="font-semibold text-[#111113] mb-1.5">Key Strengths</p>
                      <ul className="space-y-1 text-[#52525B] list-disc pl-4">
                        {t.strengths.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-[#111113] mb-1.5">Main Limitations</p>
                      <ul className="space-y-1 text-[#52525B] list-disc pl-4">
                        {t.limitations.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#111113] bg-[#F7F7F8] px-3.5 py-2 rounded-lg">
                    <strong>Verdict:</strong> {t.verdict}
                  </p>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div id="faq" className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#111113]">
                Frequently Asked Questions
              </h2>
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
                      <p className="mt-2.5 text-[13px] text-[#52525B] leading-relaxed">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-[#71717A] border-t border-[#E5E7EB] pt-5">
              {LEGAL_TRADEMARK_DISCLAIMER}
            </p>
          </div>

          {/* Sticky Right-Side Table of Contents (3 cols) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 bg-[#FAFAFB] border border-[#E5E7EB] rounded-xl p-5 space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              On This Page
            </div>
            <ul className="space-y-2 text-[13px] text-[#52525B]">
              <li><a href="#comparison-table" className="hover:text-[#111113]">Comparison Matrix</a></li>
              <li><a href="#tool-reviews" className="hover:text-[#111113]">Platform Reviews</a></li>
              <li><a href="#faq" className="hover:text-[#111113]">FAQs</a></li>
            </ul>
            <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
              <p className="text-[12px] font-semibold text-[#111113]">Related Guides</p>
              <button
                type="button"
                onClick={() => onNavigate("/compare/peec-ai")}
                className="block text-[12px] text-[#52525B] hover:text-[#111113] cursor-pointer"
              >
                CiteClash vs Peec AI →
              </button>
              <button
                type="button"
                onClick={() => onNavigate("/compare/otterly-ai")}
                className="block text-[12px] text-[#52525B] hover:text-[#111113] cursor-pointer"
              >
                CiteClash vs Otterly.AI →
              </button>
              <button
                type="button"
                onClick={() => onNavigate("/compare/profound")}
                className="block text-[12px] text-[#52525B] hover:text-[#111113] cursor-pointer"
              >
                CiteClash vs Profound →
              </button>
            </div>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
};
