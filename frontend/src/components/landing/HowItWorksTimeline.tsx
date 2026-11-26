import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { BrandSticker } from "./BrandStickers";

export const HowItWorksTimeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(1);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const progressWidth = useTransform(scrollYProgress, [0, 1], ["25%", "100%"]);

  const steps = [
    {
      num: "01",
      title: "Enter your domain & rivals",
      desc: "Add your primary website and up to two competitors. CiteClash maps your category and auto-generates high-intent buyer queries.",
      preview: (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB]">
              <div className="text-[10px] font-mono uppercase text-[#8E8E93]">Your Brand</div>
              <div className="mt-1.5 flex items-center gap-2 text-sm font-mono font-semibold text-[#111113]">
                <BrandSticker name="Linear" size="sm" />
                <span>linear.app</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB]">
              <div className="text-[10px] font-mono uppercase text-[#8E8E93]">Competitor</div>
              <div className="mt-1.5 flex items-center gap-2 text-sm font-mono font-semibold text-[#111113]">
                <BrandSticker name="Jira" size="sm" />
                <span>jira.atlassian.com</span>
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#8E8E93]">
              Auto-Generated Prompts
            </div>
            {[
              "Best issue tracker for fast engineering teams",
              "Linear vs Jira latency & GitHub sync",
            ].map((q) => (
              <div key={q} className="text-xs text-[#111113] flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      num: "02",
      title: "Query all 4 live AI engines in parallel",
      desc: "Every buyer prompt is executed directly against ChatGPT Search, Perplexity, Google Gemini, and Meta Llama 3.3—never cached guesses.",
      preview: (
        <div className="mt-5 space-y-2.5">
          {[
            { name: "ChatGPT Search", latency: "1.1s", status: "Rank #1 Cited" },
            { name: "Perplexity Sonar", latency: "0.8s", status: "Rank #1 Cited" },
            { name: "Google Gemini", latency: "1.3s", status: "Rank #2 Cited" },
            { name: "Meta Llama 3.3", latency: "0.4s", status: "Rank #1 Cited" },
          ].map((m) => (
            <div
              key={m.name}
              className="p-3 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between text-xs tabular-nums"
            >
              <div className="flex items-center gap-2.5">
                <BrandSticker name={m.name} size="sm" />
                <span className="font-medium text-[#111113]">{m.name}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[#8E8E93]">{m.latency}</span>
                <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] font-semibold">
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      num: "03",
      title: "Deterministic regex citation parsing",
      desc: "Pure regex extractors parse markdown ordered lists, brand mentions, and exact cited URLs with 0.0% LLM estimation error.",
      preview: (
        <div className="mt-5 p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] font-mono text-xs text-[#111113] space-y-1.5 leading-relaxed">
          <div className="text-[#8E8E93]">// Exact ordered list &amp; domain matcher</div>
          <div>pattern: /(?i)\b(linear\.app|linear)\b/</div>
          <div>
            position_extracted: <span className="text-[#16A34A] font-semibold">#1</span>
          </div>
          <div>
            cited_sources: [&quot;linear.app/docs&quot;, &quot;reddit.com/r/SaaS&quot;]
          </div>
          <div>
            hallucination_rate: <span className="text-[#16A34A] font-semibold">0.0%</span>
          </div>
        </div>
      ),
    },
    {
      num: "04",
      title: "Deploy 1-click fixes & capture Reddit threads",
      desc: "Publish your generated llms.txt & JSON-LD schema and reply to cited Reddit discussions to flip competitor recommendations into yours.",
      preview: (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB]">
              <div className="text-xs font-semibold text-[#111113]">/llms.txt Published</div>
              <p className="text-[11px] text-[#64646B] mt-1">
                Indexed by OAI-SearchBot &amp; PerplexityBot in 24h.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB]">
              <div className="text-xs font-semibold text-[#111113]">r/SaaS Thread Captured</div>
              <p className="text-[11px] text-[#64646B] mt-1">
                Value-first answer cited across 6 AI prompts.
              </p>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20 flex items-center justify-between text-xs tabular-nums">
            <span className="font-medium text-[#111113]">Measured 30-Day Lift</span>
            <span className="font-mono font-semibold text-[#16A34A]">+32.4% Share</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="w-full bg-white border-b border-[#E5E7EB] py-16 px-4 sm:px-6"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* LEFT COLUMN (5 cols): Sticky pinned while right-hand cards scroll smoothly */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
          <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93]">
            Methodology
          </div>

          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
            From raw LLM outputs to verified citation growth.
          </h2>

          <p className="text-[15px] text-[#64646B] leading-relaxed">
            Scroll through the four-stage pipeline that turns passive AI monitoring into measurable category ownership.
          </p>

          {/* Active Step Indicator + Smooth Scroll Progress Bar */}
          <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-[#8E8E93]">ACTIVE STAGE</span>
              <span className="font-semibold text-[#111113]">
                0{activeStep} / 04 — {steps[activeStep - 1].title.split(" ").slice(0, 3).join(" ")}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <motion.div
                style={{ width: progressWidth }}
                className="h-full bg-[#111113] rounded-full"
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => {
                const el = document.querySelector("#hero-scanner");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                window.dispatchEvent(new CustomEvent("citeclash-run-battle"));
              }}
              className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#111113] text-white text-[13px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#222226] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Run Live Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Scroll-Revealing Step Cards */}
        <div className="lg:col-span-7 space-y-8">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCurrent = activeStep === stepNum;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                onViewportEnter={() => setActiveStep(stepNum)}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-2xl border bg-white p-6 sm:p-8 transition-colors ${
                  isCurrent
                    ? "border-[#111113] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.08)]"
                    : "border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E7EB] font-mono text-xs font-semibold text-[#111113] tabular-nums">
                    {step.num}
                  </span>
                  <h3 className="text-lg font-semibold text-[#111113] tracking-tight">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm text-[#64646B] leading-relaxed">{step.desc}</p>
                {step.preview}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
