import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

interface PricingSectionProps {
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenAuth }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [monthlyBuyers, setMonthlyBuyers] = useState(3000);
  const [dealValue, setDealValue] = useState(240);

  const estimatedLostRevenue = Math.round(monthlyBuyers * 0.64 * 0.35 * dealValue * 0.03);

  const plans = [
    {
      name: "Free",
      desc: "Public domain scans and quick competitor checks.",
      monthly: 0,
      annual: 0,
      popular: false,
      cta: "Run Free Scan",
      features: [
        "1 public battle scan per day",
        "2 buyer prompts visible",
        "Public Battle Card PNG export",
        "Deterministic 0–100 score",
      ],
    },
    {
      name: "Starter",
      desc: "For founders building initial AI search visibility.",
      monthly: 49,
      annual: 39,
      popular: false,
      cta: "Start Starter Plan",
      features: [
        "1 brand workspace",
        "15 tracked prompts / month",
        "ChatGPT & Perplexity tracking",
        "AI Brand Lie Guard & Traffic Pixel",
        "Live AI-Bot Crawlability Audit",
      ],
    },
    {
      name: "Growth",
      desc: "Full closed-loop intelligence for scaling teams.",
      monthly: 129,
      annual: 103,
      popular: true,
      cta: "Start Growth Plan",
      features: [
        "1 brand workspace",
        "50 tracked prompts / month",
        "All 4 AI engines + 3x Quorum Stability",
        "Closed-Loop Fix Verification & Plan-B",
        "Citation Gap Outreach + Page Diff",
        "Unlimited Reddit & Quora Hijacker",
      ],
    },
    {
      name: "Agency",
      desc: "Multi-workspace monitoring & white-label reports.",
      monthly: 299,
      annual: 239,
      popular: false,
      cta: "Start Agency Plan",
      features: [
        "5 client workspaces",
        "200 tracked prompts / month",
        "White-label PDF executive reports",
        "Shareable client Battle Card URLs",
        "Raw CSV / JSON exports",
      ],
    },
  ];

  return (
    <section id="pricing" className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
      <div className="max-w-[1160px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
              Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
              Predictable pricing built for ROI.
            </h2>
          </div>

          {/* Monthly / Annual Segmented Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] shrink-0">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                !isAnnual
                  ? "bg-white text-[#111113] shadow-sm border border-[#E5E7EB]"
                  : "text-[#64646B] hover:text-[#111113]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer ${
                isAnnual
                  ? "bg-white text-[#111113] shadow-sm border border-[#E5E7EB]"
                  : "text-[#64646B] hover:text-[#111113]"
              }`}
            >
              <span>Annual</span>
              <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[11px] font-mono font-semibold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Compact Bordered Top AI Revenue Leak Calculator */}
        <div className="mb-10 border border-[#E5E7EB] rounded-2xl bg-[#FAFAFB] p-6 sm:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between text-xs mb-2 tabular-nums">
                  <span className="font-medium text-[#111113]">Monthly Category Buyers</span>
                  <span className="font-mono font-semibold text-[#111113]">
                    {monthlyBuyers.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={25000}
                  step={500}
                  value={monthlyBuyers}
                  onChange={(e) => setMonthlyBuyers(Number(e.target.value))}
                  className="w-full accent-[#111113] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-2 tabular-nums">
                  <span className="font-medium text-[#111113]">Average Deal Value ($)</span>
                  <span className="font-mono font-semibold text-[#111113]">
                    ${dealValue.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={2500}
                  step={50}
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="w-full accent-[#111113] cursor-pointer"
                />
              </div>
            </div>

            <div className="lg:col-span-4 lg:border-l border-[#E5E7EB] lg:pl-6 flex items-center justify-between lg:block tabular-nums">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E93]">
                Est. Monthly Revenue Lost
              </div>
              <div className="text-2xl sm:text-3xl font-semibold text-[#E11D48] mt-1">
                ${estimatedLostRevenue.toLocaleString()}
                <span className="text-xs font-normal text-[#64646B]"> / mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Strictly Equal-Height Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plans.map((plan) => {
            const price = isAnnual ? plan.annual : plan.monthly;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl bg-white p-6 flex flex-col justify-between ${
                  plan.popular
                    ? "border-2 border-[#111113] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.12)]"
                    : "border border-[#E5E7EB]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-md bg-[#111113] text-white text-[11px] font-medium">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-base font-semibold text-[#111113]">{plan.name}</h3>
                  <p className="text-xs text-[#64646B] mt-1.5 min-h-[32px] leading-relaxed">
                    {plan.desc}
                  </p>

                  <div className="mt-5 pb-5 border-b border-[#E5E7EB] flex items-baseline gap-1 tabular-nums">
                    <span className="text-3xl font-semibold text-[#111113]">${price}</span>
                    <span className="text-xs text-[#8E8E93]">/ month</span>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2 text-[13px] text-[#111113]"
                      >
                        <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-2">
                  <button
                    onClick={() => onOpenAuth("signup")}
                    className={`group w-full py-2.5 px-4 rounded-lg text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                      plan.popular
                        ? "bg-[#111113] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#222226]"
                        : "bg-white text-[#111113] border border-[#E5E7EB] hover:border-[#111113]"
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
