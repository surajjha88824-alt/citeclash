import React, { useState } from "react";
import { ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { SeoHead } from "../../components/seo/SeoHead";
import {
  COMPARE_COMPETITORS,
  LEGAL_TRADEMARK_DISCLAIMER,
} from "../../data/seoRegistry";

interface CompareCompetitorPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export const CompareCompetitorPage: React.FC<CompareCompetitorPageProps> = ({
  slug,
  onNavigate,
  onOpenAuth,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const normalizedSlug = slug.replace(/^citeclash-vs-/, "");
  const entry =
    COMPARE_COMPETITORS[normalizedSlug] || COMPARE_COMPETITORS["peec-ai"];

  const otherComparisons = Object.values(COMPARE_COMPETITORS)
    .filter((c) => c.slug !== entry.slug)
    .slice(0, 6);

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={onOpenAuth}>
      <SeoHead
        title={entry.title}
        description={entry.metaDescription}
        canonicalPath={`/compare/${entry.slug}`}
        pageType="compare"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Compare", url: "/compare" },
          { name: `CiteClash vs ${entry.competitorName}`, url: `/compare/${entry.slug}` },
        ]}
        faqs={entry.faqs}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
        <div className="max-w-[1060px] mx-auto space-y-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[12px] font-mono text-[#71717A]">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="hover:text-[#111113] cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onNavigate("/compare")}
              className="hover:text-[#111113] cursor-pointer"
            >
              Compare
            </button>
            <span>/</span>
            <span className="text-[#111113]">CiteClash vs {entry.competitorName}</span>
          </nav>

          {/* H1 + AEO Direct Answer Box */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.08] text-[#111113]">
              {entry.h1}
            </h1>

            <div className="bg-[#F7F7F8] border-l-2 border-[#111113] p-5 rounded-r-xl">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
                Direct Verdict (AEO Summary)
              </span>
              <p className="text-[15px] text-[#111113] leading-relaxed">
                {entry.directAnswer}
              </p>
            </div>

            {/* Inline Mini VS Battle CTA Bar */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-[#111113]">
                  See how your domain ranks right now
                </p>
                <p className="text-[12px] text-[#52525B]">
                  Run a live 15-second AI Battle across ChatGPT, Perplexity &amp; Gemini — zero credit card required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("/tools/ai-battle-card")}
                className="group inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#111113] text-white text-[13px] font-medium hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <span>Run a live 15-second AI Battle</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* 12-Row Hairline Comparison Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-xs font-mono uppercase text-[#71717A]">
                    <th className="py-4 px-5 w-1/2">Capability</th>
                    <th className="py-4 px-5 w-1/4 text-center border-t-2 border-t-[#111113] border-x border-[#E5E7EB] bg-[#FAFAFB] text-[#111113] font-semibold">
                      CiteClash
                    </th>
                    <th className="py-4 px-5 w-1/4 text-center">{entry.competitorName}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
                  {entry.rows.map((r) => (
                    <tr key={r.feature} className="hover:bg-[#FAFAFB]">
                      <td className="py-3.5 px-5 font-medium text-[#111113]">{r.feature}</td>
                      <td className="py-3.5 px-5 text-center border-x border-[#E5E7EB] bg-[#FAFAFB] tabular-nums">
                        {typeof r.citeclash === "boolean" ? (
                          r.citeclash ? (
                            <Check className="w-4 h-4 text-[#16A34A] mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-[#71717A] mx-auto" />
                          )
                        ) : (
                          <span className="font-mono font-semibold text-[#111113]">
                            {r.citeclash}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center tabular-nums text-[#52525B]">
                        {typeof r.competitor === "boolean" ? (
                          r.competitor ? (
                            <Check className="w-4 h-4 text-[#16A34A] mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-[#A1A1AA] mx-auto" />
                          )
                        ) : (
                          <span className="font-mono text-[12px]">{r.competitor}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2-Column Balanced Choose Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            <div className="bg-[#FAFAFB] border border-[#E5E7EB] rounded-xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#111113]">
                  Choose {entry.competitorName} if...
                </h2>
                <ul className="space-y-2.5 text-[13px] text-[#52525B]">
                  {entry.whereCompetitorShines.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#52525B] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[12px] font-mono text-[#71717A] pt-3 border-t border-[#E5E7EB]">
                Entry: {entry.competitorPrice}
              </p>
            </div>

            <div className="bg-white border-2 border-[#111113] rounded-xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#111113]">
                  Choose CiteClash if...
                </h2>
                <ul className="space-y-2.5 text-[13px] text-[#52525B]">
                  {entry.whereCiteClashWins.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => onOpenAuth("signup")}
                className="w-full py-2.5 rounded-lg bg-[#111113] text-white text-[13px] font-medium hover:bg-[#27272A] cursor-pointer"
              >
                Start with CiteClash ($49/mo) →
              </button>
            </div>
          </div>

          {/* Switching Triggers */}
          <div className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-[#111113]">
              Top Reasons Teams Switch from {entry.competitorName}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px] text-[#52525B]">
              {entry.switchingTriggers.map((t, i) => (
                <li key={i} className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-[#111113]">
              Frequently Asked Questions
            </h2>
            <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-xl bg-white">
              {entry.faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={faq.q} className="p-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                    >
                      <span className="text-[14px] font-medium text-[#111113]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-[13px] text-[#52525B] leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Internal Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[#71717A]">
              Compare Other AI Visibility Tools
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherComparisons.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => onNavigate(`/compare/${c.slug}`)}
                  className="p-3.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] hover:border-[#111113] text-left text-[13px] font-medium text-[#111113] cursor-pointer"
                >
                  CiteClash vs {c.competitorName} →
                </button>
              ))}
            </div>
          </div>

          {/* Legal Trademark Disclaimer */}
          <p className="text-[11px] text-[#71717A] leading-relaxed border-t border-[#E5E7EB] pt-5">
            {LEGAL_TRADEMARK_DISCLAIMER}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
};
