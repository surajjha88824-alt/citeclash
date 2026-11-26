import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

interface BattleCardSpotlightProps {
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export const BattleCardSpotlight: React.FC<BattleCardSpotlightProps> = ({
  onOpenAuth,
}) => {
  const [showWatermark, setShowWatermark] = useState(true);

  const prompts = [
    { query: "Best issue tracker for engineering speed", winner: "linear.app", rank: "#1" },
    { query: "Linear vs Jira enterprise workflow", winner: "linear.app", rank: "#1" },
    { query: "Modern GitHub-integrated sprint tool", winner: "linear.app", rank: "#1" },
  ];

  return (
    <section className="w-full bg-[#F7F7F8] border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left 7 cols: Interactive Battle Scorecard */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E93]">
                  Benchmark #CC-4092
                </div>
                <div className="text-base font-semibold text-[#111113] mt-0.5">
                  linear.app vs jira.com
                </div>
              </div>
              <button
                onClick={() => setShowWatermark(!showWatermark)}
                className="px-3 py-1.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] hover:border-[#111113] text-[12px] font-medium text-[#111113] transition-colors cursor-pointer"
              >
                {showWatermark ? "Hide Social Watermark" : "Toggle Social Watermark"}
              </button>
            </div>

            {/* Score Comparison Grid */}
            <div className="grid grid-cols-2 gap-4 my-5 tabular-nums">
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20">
                <div className="text-[11px] font-mono uppercase text-[#16A34A]">
                  linear.app
                </div>
                <div className="text-3xl font-semibold text-[#16A34A] mt-1">84%</div>
                <div className="text-xs text-[#111113] mt-1 font-medium">
                  Category Leader
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#E11D48]/20">
                <div className="text-[11px] font-mono uppercase text-[#E11D48]">
                  jira.com
                </div>
                <div className="text-3xl font-semibold text-[#E11D48] mt-1">41%</div>
                <div className="text-xs text-[#64646B] mt-1 font-medium">
                  Trailing Rival
                </div>
              </div>
            </div>

            {/* Prompt-by-Prompt Winner Tags */}
            <div className="divide-y divide-[#E5E7EB] border-t border-[#E5E7EB]">
              {prompts.map((p) => (
                <div
                  key={p.query}
                  className="py-3 flex items-center justify-between gap-3 text-[13px]"
                >
                  <span className="text-[#111113] font-medium truncate">{p.query}</span>
                  <div className="flex items-center gap-2 shrink-0 tabular-nums">
                    <span className="font-mono text-[11px] text-[#64646B]">
                      {p.winner}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] font-mono text-[11px] font-semibold">
                      {p.rank}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {showWatermark && (
              <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] font-mono text-[#8E8E93]">
                <span>VERIFIED BY CITECLASH.COM</span>
                <span>CHATGPT • PERPLEXITY • GEMINI</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 cols: Editorial Copy */}
        <div className="lg:col-span-5 space-y-5">
          <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">
            Sales &amp; Social Proof
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
            Turn AI rankings into shareable Battle Cards.
          </h2>
          <p className="text-[15px] text-[#64646B] leading-relaxed">
            Arm your sales team and social channels with deterministic proof that ChatGPT and Perplexity recommend your product over legacy incumbents.
          </p>

          <ul className="space-y-2.5 pt-1">
            {[
              "One-click high-resolution PNG export for X, LinkedIn, and pitch decks",
              "Prompt-by-prompt verification with exact cited source domains",
              "Live public Battle Card URLs for your comparison landing pages",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[#111113]">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <button
              onClick={() => onOpenAuth("signup")}
              className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#111113] text-white text-[13px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#222226] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Create a Battle Card</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
