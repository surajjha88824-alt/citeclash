import React, { useState } from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Free",
      priceMonthly: 0,
      priceAnnual: 0,
      description: "Ideal for testing your brand's baseline AI search visibility.",
      features: [
        "10 Tracked AI Prompts",
        "1 Competitor Battle-Card",
        "ChatGPT Search Coverage",
        "Basic Visibility Score",
        "Community Support",
      ],
      popular: false,
      cta: "Start Free",
      accent: "border-white/10",
    },
    {
      name: "Starter",
      priceMonthly: 49,
      priceAnnual: 39,
      description: "For fast-growing startups needing competitive clarity.",
      features: [
        "100 Tracked AI Prompts",
        "3 Competitor Battle-Cards",
        "ChatGPT + Perplexity AI",
        "Weekly Radar Rank Change Alerts",
        "Exportable PDF Battle Cards",
        "Standard Email Support",
      ],
      popular: false,
      cta: "Choose Starter",
      accent: "border-white/15",
    },
    {
      name: "Growth",
      priceMonthly: 129,
      priceAnnual: 99,
      description: "The complete GEO intelligence and AI remediation suite.",
      features: [
        "500 Tracked AI Prompts",
        "10 Competitor Battle-Cards",
        "All 6 LLM Engines Tracked",
        "Reddit & Quora Citation Hijacker",
        "AI Auto-Fixer Schema Generator",
        "Daily Slack & Email Alerts",
        "Priority 24/7 Support",
      ],
      popular: true,
      cta: "Get Growth Plan",
      accent: "border-purple-500 shadow-xl shadow-purple-600/20",
    },
    {
      name: "Agency",
      priceMonthly: 299,
      priceAnnual: 239,
      description: "For agencies & enterprises managing multiple brands.",
      features: [
        "Unlimited AI Prompts",
        "Unlimited Workspaces & Brands",
        "White-label Shareable Scorecards",
        "Custom Webhook & API Access",
        "Dedicated GEO Strategist",
        "Custom SLA & Invoicing",
      ],
      popular: false,
      cta: "Contact Enterprise",
      accent: "border-cyan-500/30",
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Predictable Pricing
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-sans tracking-tight">
          Invest in High-Intent AI Search Traffic
        </h2>
        <p className="text-slate-400 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
          Start for free, scale as your competitor clash footprint expands. Cancel anytime.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-[#121216] border border-white/10">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !isAnnual ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isAnnual ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-400 text-[#09090B]">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, idx) => {
          const currentPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          return (
            <div
              key={idx}
              className={`linear-card rounded-3xl p-7 flex flex-col justify-between relative ${plan.accent} ${
                plan.popular ? "bg-[#141224]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 text-[10px] font-extrabold uppercase font-mono tracking-wider text-black shadow-lg">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white font-sans">{plan.name}</h3>
                  {plan.popular && <Sparkles className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-xs text-slate-400 mb-6 min-h-[32px] leading-relaxed">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold font-mono text-white">
                    ${currentPrice}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {plan.priceMonthly === 0 ? "forever" : "/month"}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectPlan(plan.name)}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  plan.popular
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-600/30 active:scale-95"
                    : "linear-card hover:border-white/30 text-white active:scale-95"
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
