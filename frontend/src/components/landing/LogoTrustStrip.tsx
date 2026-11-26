import React from "react";
import { BrandSticker } from "./BrandStickers";

export const LogoTrustStrip: React.FC = () => {
  const engines = [
    { name: "ChatGPT", sub: "OpenAI Search" },
    { name: "Perplexity", sub: "Sonar Citations" },
    { name: "Google Gemini", sub: "1.5 & 2.0 Pro" },
    { name: "Claude", sub: "Anthropic" },
    { name: "AI Overviews", sub: "Google Search" },
    { name: "Meta Llama", sub: "Groq LPU" },
  ];

  const brandLogos = [
    { name: "Zalando", color: "#F97316" },
    { name: "Attio", color: "#111113" },
    { name: "Squarespace", color: "#111113" },
    { name: "Brevo", color: "#16A34A" },
    { name: "Hugo Boss", color: "#111113" },
    { name: "Wix", color: "#111113" },
  ];

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB]">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6">
        {/* Row 1: Tracked AI Engines Hairline Grid */}
        <div className="py-5 border-b border-[#E5E7EB]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E93] mb-3 text-center sm:text-left">
            Tracked Generative Search Engines
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#E5E7EB] border border-[#E5E7EB] rounded-xl overflow-hidden">
            {engines.map((engine) => (
              <div
                key={engine.name}
                className="bg-[#FAFAFB] hover:bg-white hover:shadow-[inset_0_0_0_1px_rgba(17,17,19,0.12)] transition-all duration-200 px-4 py-3 flex flex-col justify-between cursor-default"
              >
                <div className="flex items-center gap-2">
                  <BrandSticker name={engine.name} size="sm" />
                  <span className="text-[13px] font-semibold text-[#111113] tracking-tight">
                    {engine.name}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#8E8E93] mt-1">
                  {engine.sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Brand Wordmarks */}
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[12px] font-medium text-[#64646B]">
            Trusted by marketing teams &amp; agencies worldwide
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {brandLogos.map((b) => (
              <span
                key={b.name}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold tracking-[-0.02em] select-none"
                style={{ color: b.color }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
