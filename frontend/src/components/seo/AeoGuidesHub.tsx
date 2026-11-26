import React from "react";
import { ArrowRight } from "lucide-react";
import { PublicLayout } from "../layout/PublicLayout";
import { SeoSchemaHead } from "./SeoSchemaHead";

interface AeoGuidesHubProps {
  slug?: string;
  onNavigateHome: () => void;
  onNavigate: (path: string) => void;
}

const GUIDES = [
  {
    slug: "how-to-install-llms-txt",
    title: "How to Install llms.txt for ChatGPT, Perplexity & Claude",
    directAnswer:
      "Place a clean Markdown file at your domain root (/llms.txt) summarizing your product capabilities, pricing, and canonical documentation links so AI search crawlers index accurate brand facts without executing heavy client-side JavaScript.",
    sections: [
      {
        id: "what-is-llms-txt",
        heading: "1. What is llms.txt?",
        body: "AI crawlers such as OAI-SearchBot and PerplexityBot operate under strict token budgets. Providing a concise Markdown index eliminates parsing ambiguity and prevents pricing or feature hallucinations.",
      },
      {
        id: "verification",
        heading: "2. Verification Checklist",
        body: "Confirm your robots.txt allows OAI-SearchBot and PerplexityBot, return HTTP 200 text/plain on /llms.txt, and pair it with Organization and FAQPage JSON-LD schemas.",
      },
    ],
  },
  {
    slug: "understanding-ai-visibility-score",
    title: "Understanding Deterministic AI Visibility Scoring",
    directAnswer:
      "AI Visibility Score measures the exact percentage of high-intent buyer prompts where your brand is named and cited across ChatGPT Search, Perplexity, Gemini, and Llama—parsed deterministically via regex rather than LLM guesswork.",
    sections: [
      {
        id: "formula",
        heading: "1. How Visibility & Position Interact",
        body: "Being mentioned #1 in a synthesized answer captures significantly more buyer clicks than appearing #4. Tracking both share-of-voice and ordered list rank gives a complete revenue picture.",
      },
    ],
  },
];

export const AeoGuidesHub: React.FC<AeoGuidesHubProps> = ({
  slug,
  onNavigate,
}) => {
  const activeGuide = slug
    ? GUIDES.find((g) => g.slug === slug) || GUIDES[0]
    : null;

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={() => onNavigate("/signup")}>
      <SeoSchemaHead
        title={activeGuide ? `${activeGuide.title} | CiteClash Guides` : "GEO & AEO Strategy Guides | CiteClash"}
        description="Practical guides for ranking #1 inside ChatGPT, Perplexity, and Google AI Overviews."
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
        {!activeGuide ? (
          <div className="max-w-[1000px] mx-auto space-y-10">
            <div className="max-w-2xl">
              <div className="text-[12px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
                Knowledge Hub
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#111113]">
                GEO &amp; AEO Strategy Guides
              </h1>
              <p className="text-sm sm:text-base text-[#52525B] mt-2">
                Tactical engineering and content playbooks for generative search dominance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {GUIDES.map((g) => (
                <div
                  key={g.slug}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-[#111113]">{g.title}</h2>
                    <p className="text-xs text-[#52525B] mt-2 leading-relaxed">
                      {g.directAnswer}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => onNavigate(`/guides/${g.slug}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111113] hover:underline cursor-pointer"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Sticky Left TOC on Desktop */}
            <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 bg-[#FAFAFB] border border-[#E5E7EB] rounded-2xl p-4 space-y-2">
              <div className="text-[11px] font-mono uppercase text-[#71717A] px-2">
                Contents
              </div>
              {activeGuide.sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block px-2 py-1.5 rounded-lg text-xs font-medium text-[#52525B] hover:text-[#111113] hover:bg-white transition-colors"
                >
                  {s.heading}
                </a>
              ))}
            </aside>

            {/* Editorial Article Body */}
            <article className="lg:col-span-9 max-w-[760px] space-y-8">
              <button
                type="button"
                onClick={() => onNavigate("/guides")}
                className="text-xs font-medium text-[#52525B] hover:text-[#111113] cursor-pointer"
              >
                ← All GEO Guides
              </button>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#111113] leading-tight">
                {activeGuide.title}
              </h1>

              {/* Highlighted 45-word Direct Answer Summary Callout */}
              <div className="p-5 rounded-2xl bg-[#FAFAFB] border border-[#E5E7EB] border-l-4 border-l-[#111113]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1.5">
                  Direct Answer Summary
                </div>
                <p className="text-sm font-medium text-[#111113] leading-relaxed">
                  {activeGuide.directAnswer}
                </p>
              </div>

              {activeGuide.sections.map((s) => (
                <section key={s.id} id={s.id} className="space-y-2.5">
                  <h2 className="text-xl font-semibold text-[#111113]">{s.heading}</h2>
                  <p className="text-[15px] text-[#52525B] leading-relaxed">{s.body}</p>
                </section>
              ))}
            </article>
          </div>
        )}
      </section>
    </PublicLayout>
  );
};
