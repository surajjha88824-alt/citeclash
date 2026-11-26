import React, { useState } from "react";
import { Check, Minus, ChevronDown, ArrowRight } from "lucide-react";
import { PublicLayout } from "../layout/PublicLayout";
import { SeoSchemaHead } from "./SeoSchemaHead";

interface CompetitorComparePageProps {
  slug: string;
  onNavigateHome: () => void;
  onNavigate: (path: string) => void;
  onOpenPricing: () => void;
}

export const CompetitorComparePage: React.FC<CompetitorComparePageProps> = ({
  slug,
  onNavigate,
  onOpenPricing,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const competitorName = slug.includes("otterly") ? "Otterly AI" : "Peec AI";

  const rows = [
    { feature: "Multi-Engine Tracking (ChatGPT, Perplexity, Gemini, Llama)", cc: true, rival: true },
    { feature: "Deterministic Regex Rank & Citation Verification", cc: true, rival: "Partial" },
    { feature: "Reddit & Quora Thread Discovery + AI Reply Drafter", cc: true, rival: false },
    { feature: "1-Click llms.txt & JSON-LD Schema Generator", cc: true, rival: false },
    { feature: "1200×630 Shareable Battle Card PNG Export", cc: true, rival: false },
    { feature: "White-Label Agency A4 PDF Reports", cc: true, rival: true },
    { feature: "Starting Price", cc: "$49 / month", rival: "$189+ / month" },
  ];

  const faqs = [
    {
      q: `Why do growth teams switch from ${competitorName} to CiteClash?`,
      a: `CiteClash pairs deterministic citation tracking with an execution layer—giving teams the Reddit & Quora Hijacker, 1-click llms.txt generator, and shareable Battle Cards in one workspace.`,
    },
    {
      q: "Can we migrate our tracked prompts in under 5 minutes?",
      a: "Yes. Paste your brand and competitor domains during onboarding to import or auto-generate your prompt suite immediately.",
    },
  ];

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={() => onNavigate("/signup")}>
      <SeoSchemaHead
        title={`CiteClash vs ${competitorName} (2026 Comparison) | CiteClash`}
        description={`Compare CiteClash vs ${competitorName} across deterministic AI citation tracking, Reddit hijacking, llms.txt generation, and pricing.`}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
        <div className="max-w-[1000px] mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#71717A]">
              2026 Platform Comparison
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] text-[#111113]">
              CiteClash vs {competitorName}
            </h1>
            <p className="text-base text-[#52525B] leading-relaxed">
              See why teams choose deterministic citation verification and 1-click remediation over passive monitoring tools.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenPricing}
                className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
              >
                <span>View Pricing</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Hairline Comparison Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-xs font-mono uppercase text-[#71717A]">
                    <th className="py-4 px-5 w-1/2">Capability</th>
                    <th className="py-4 px-5 w-1/4 text-center border-t-2 border-t-[#111113] border-x border-[#E5E7EB] bg-[#FAFAFB] text-[#111113] font-semibold">
                      CiteClash
                    </th>
                    <th className="py-4 px-5 w-1/4 text-center">{competitorName}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-sm">
                  {rows.map((r) => (
                    <tr key={r.feature} className="hover:bg-[#FAFAFB]">
                      <td className="py-3.5 px-5 font-medium text-[#111113]">{r.feature}</td>
                      <td className="py-3.5 px-5 text-center border-x border-[#E5E7EB] bg-[#FAFAFB]">
                        {typeof r.cc === "boolean" ? (
                          <Check className="w-4 h-4 text-[#16A34A] mx-auto" />
                        ) : (
                          <span className="font-mono font-semibold text-[#111113]">{r.cc}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {typeof r.rival === "boolean" ? (
                          r.rival ? (
                            <Check className="w-4 h-4 text-[#16A34A] mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-[#71717A] mx-auto" />
                          )
                        ) : (
                          <span className="font-mono text-[#52525B]">{r.rival}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-2xl mx-auto divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-4 flex items-center justify-between gap-4 text-left text-sm font-medium text-[#111113] cursor-pointer"
                >
                  <span>{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#71717A] transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <p className="pb-4 text-xs text-[#52525B] leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
