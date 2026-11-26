import React, { useState } from "react";
import { Plus, Check } from "lucide-react";

const row1Prompts = [
  "What is the best CRM for remote sales teams?",
  "Top AI search analytics tools for SaaS",
  "Linear vs Jira for product engineering teams",
  "Best SOC-2 compliant customer data platforms",
  "Fastest Postgres hosting for Next.js apps",
];

const row2Prompts = [
  "Alternatives to HubSpot for seed-stage startups",
  "How to optimize website content for Perplexity",
  "Best white-label SEO reporting tools for agencies",
  "Top B2B attribution software recommended by ChatGPT",
  "How to generate llms.txt for documentation sites",
];

export const PromptStreamSection: React.FC = () => {
  const [tracked, setTracked] = useState<string[]>([]);

  const toggleTrack = (prompt: string) => {
    setTracked((prev) =>
      prev.includes(prompt) ? prev.filter((p) => p !== prompt) : [...prev, prompt]
    );
  };

  return (
    <section className="w-full bg-white border-b border-[#E5E7EB] py-14 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
            Live Prompt Stream
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#111113]">
            Monitor the exact questions buyers ask every day.
          </h2>
        </div>
        <span className="text-xs font-mono text-[#8E8E93]">
          Hover any prompt to pause &amp; track
        </span>
      </div>

      {/* Row 1: Left to Right */}
      <div className="relative w-full overflow-hidden mb-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max gap-3 animate-stream-left hover:[animation-play-state:paused]">
          {[...row1Prompts, ...row1Prompts].map((prompt, idx) => {
            const isTracked = tracked.includes(prompt);
            return (
              <button
                key={`r1-${idx}`}
                onClick={() => toggleTrack(prompt)}
                className="group inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] hover:border-[#111113] transition-colors shrink-0 cursor-pointer"
              >
                <span className="text-[13px] font-medium text-[#111113]">{prompt}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    isTracked
                      ? "bg-[#ECFDF5] text-[#16A34A]"
                      : "bg-white border border-[#E5E7EB] text-[#64646B] group-hover:bg-[#111113] group-hover:text-white group-hover:border-[#111113]"
                  }`}
                >
                  {isTracked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {isTracked ? "Tracked" : "Track Prompt"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Right to Left */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max gap-3 animate-stream-right hover:[animation-play-state:paused]">
          {[...row2Prompts, ...row2Prompts].map((prompt, idx) => {
            const isTracked = tracked.includes(prompt);
            return (
              <button
                key={`r2-${idx}`}
                onClick={() => toggleTrack(prompt)}
                className="group inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] hover:border-[#111113] transition-colors shrink-0 cursor-pointer"
              >
                <span className="text-[13px] font-medium text-[#111113]">{prompt}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    isTracked
                      ? "bg-[#ECFDF5] text-[#16A34A]"
                      : "bg-white border border-[#E5E7EB] text-[#64646B] group-hover:bg-[#111113] group-hover:text-white group-hover:border-[#111113]"
                  }`}
                >
                  {isTracked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {isTracked ? "Tracked" : "Track Prompt"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes streamLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes streamRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-stream-left {
          animation: streamLeft 42s linear infinite;
        }
        .animate-stream-right {
          animation: streamRight 46s linear infinite;
        }
      `}</style>
    </section>
  );
};
