import React, { useState } from "react";
import { Check, ArrowRight, Download, Sparkles } from "lucide-react";
import { apiClient } from "../../lib/api";
import { UnlockedBenefitsModal } from "./UnlockedBenefitsModal";

interface BillingSubscriptionViewProps {
  workspaceId: string;
  workspaceName: string;
  currentPlan: string;
  onUpgradeClick: () => void;
  onPlanChanged: (newPlan: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const BillingSubscriptionView: React.FC<BillingSubscriptionViewProps> = ({
  workspaceId,
  workspaceName,
  currentPlan,
  onUpgradeClick,
  onPlanChanged,
  onNavigateTab,
}) => {
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxNotice, setSandboxNotice] = useState("");
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  const normalizedPlan = (currentPlan || "growth").toLowerCase();

  const planPricing: Record<string, { price: number; prompts: number; workspaces: number; credits: string }> = {
    free: { price: 0, prompts: 2, workspaces: 1, credits: "3/mo" },
    starter: { price: 49, prompts: 15, workspaces: 1, credits: "10/mo" },
    growth: { price: 129, prompts: 50, workspaces: 1, credits: "Unlimited" },
    agency: { price: 299, prompts: 200, workspaces: 5, credits: "Unlimited" },
  };

  const activeDetails = planPricing[normalizedPlan] || planPricing.growth;

  const handleSandboxSwitch = async (targetTier: string) => {
    setSandboxLoading(true);
    setSandboxNotice("");
    try {
      await apiClient.post("/billing/checkout", {
        workspace_id: workspaceId,
        target_tier: targetTier,
      });
    } catch {
      // Fallback local switch
    } finally {
      onPlanChanged(targetTier);
      setSandboxNotice(`Switched workspace to ${targetTier.toUpperCase()} Plan.`);
      if (targetTier !== "free") setShowBenefitsModal(true);
      setSandboxLoading(false);
    }
  };

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      desc: "Public domain scans and basic scorecards.",
      features: ["1 public scan / day", "2 prompts visible", "Public Battle Card PNG"],
    },
    {
      id: "starter",
      name: "Starter",
      price: "$49",
      desc: "Founders building initial AI search visibility.",
      features: ["1 workspace", "15 prompts / month", "10 Reddit hijacker credits"],
    },
    {
      id: "growth",
      name: "Growth",
      price: "$129",
      popular: true,
      desc: "Full multi-engine intelligence for scaling teams.",
      features: ["1 workspace", "50 prompts / month", "All 4 AI engines", "Unlimited Hijacker & Fixer"],
    },
    {
      id: "agency",
      name: "Agency",
      price: "$299",
      desc: "Multi-workspace & white-label client reporting.",
      features: ["5 workspaces", "200 prompts / month", "White-Label PDF reports"],
    },
  ];

  const invoices = [
    { id: "INV-2026-11", date: "Nov 01, 2026", plan: "Growth Plan", amount: "$129.00", status: "Paid" },
    { id: "INV-2026-10", date: "Oct 01, 2026", plan: "Growth Plan", amount: "$129.00", status: "Paid" },
    { id: "INV-2026-09", date: "Sep 01, 2026", plan: "Starter Plan", amount: "$49.00", status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#111113] tracking-tight">
            Billing &amp; Subscription
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5">
            Manage plan tier, usage quotas, and invoices for <span className="font-mono text-[#111113]">{workspaceName}</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBenefitsModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Preview Unlocked Benefits</span>
        </button>
      </div>

      {sandboxNotice && (
        <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20 text-[#16A34A] text-xs font-medium">
          {sandboxNotice}
        </div>
      )}

      {/* Current Plan Summary Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 space-y-2">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
            <span>Current Plan</span>
            <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] font-semibold">
              Active
            </span>
          </div>
          <div className="flex items-baseline gap-2 tabular-nums">
            <h3 className="text-2xl font-semibold text-[#111113] capitalize">
              {normalizedPlan} Plan
            </h3>
            <span className="text-sm font-mono text-[#52525B]">
              ${activeDetails.price}/mo
            </span>
          </div>
          <p className="text-xs text-[#52525B]">
            Next billing date: <span className="font-mono text-[#111113]">Dec 24, 2026</span> • Lemon Squeezy (Visa •••• 4242)
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onUpgradeClick}
              className="px-4 py-2 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium cursor-pointer"
            >
              Change / Upgrade Plan
            </button>
          </div>
        </div>

        {/* Usage Progress Bars */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 tabular-nums">
          <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#111113]">Monthly Prompts</span>
              <span className="font-mono text-[#52525B]">18 / {activeDetails.prompts}</span>
            </div>
            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#111113] rounded-full"
                style={{ width: `${Math.min(100, Math.round((18 / activeDetails.prompts) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#111113]">Hijacker Credits</span>
              <span className="font-mono text-[#16A34A] font-semibold">{activeDetails.credits}</span>
            </div>
            <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full bg-[#16A34A] rounded-full w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Equal-Height 4-Tier Upgrade Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {tiers.map((t) => {
          const isCurrent = normalizedPlan === t.id;
          return (
            <div
              key={t.id}
              className={`rounded-2xl bg-white p-5 flex flex-col justify-between ${
                t.popular ? "border-2 border-[#111113]" : "border border-[#E5E7EB]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-[#111113]">{t.name}</h4>
                  {t.popular && (
                    <span className="px-2 py-0.5 rounded bg-[#111113] text-white text-[10px] font-mono">
                      Popular
                    </span>
                  )}
                </div>
                <div className="text-2xl font-semibold text-[#111113] mt-2 tabular-nums">
                  {t.price}
                  <span className="text-xs font-normal text-[#71717A]">/mo</span>
                </div>
                <p className="text-xs text-[#52525B] mt-1.5 min-h-[32px]">{t.desc}</p>

                <ul className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#111113]">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  disabled={isCurrent || sandboxLoading}
                  onClick={() => handleSandboxSwitch(t.id)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${
                    isCurrent
                      ? "bg-[#F7F7F8] text-[#52525B] border border-[#E5E7EB]"
                      : "bg-[#111113] text-white hover:bg-[#27272A]"
                  }`}
                >
                  <span>{isCurrent ? "Current Plan" : `Switch to ${t.name}`}</span>
                  {!isCurrent && <ArrowRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hairline Invoice History Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-[#111113] mb-4">Invoice History</h3>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs tabular-nums">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#71717A] font-mono uppercase">
                <th className="py-2.5 px-3 whitespace-nowrap">Invoice</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Plan</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Amount</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAFAFB]">
                  <td className="py-3 px-3 font-mono font-medium text-[#111113] whitespace-nowrap">
                    {inv.id}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#52525B] whitespace-nowrap">
                    {inv.date}
                  </td>
                  <td className="py-3 px-3 text-[#111113] whitespace-nowrap">{inv.plan}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-[#111113] whitespace-nowrap">
                    {inv.amount}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] font-mono font-medium">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSandboxNotice(`Downloaded receipt ${inv.id}.pdf`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[11px] font-medium cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UnlockedBenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        planTier={normalizedPlan}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
