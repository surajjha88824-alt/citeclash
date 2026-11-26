import React from "react";
import { ArrowRight, X, Sparkles, Terminal, MessageSquare, Wrench, FileText } from "lucide-react";

interface UnlockedBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  planTier: string;
  onNavigateTab?: (tab: string) => void;
}

const BENEFITS_BY_TIER: Record<
  string,
  { name: string; price: string; items: Array<{ title: string; desc: string; tab: string; icon: any }> }
> = {
  starter: {
    name: "Starter Plan",
    price: "$49 / month",
    items: [
      { title: "15 High-Intent Prompts", desc: "Daily tracking across ChatGPT & Perplexity.", tab: "prompts", icon: Terminal },
      { title: "10 Reddit Hijacker Credits", desc: "Draft natural community replies.", tab: "reddit", icon: MessageSquare },
      { title: "llms.txt Auto-Fixer", desc: "Generate crawler markdown in one click.", tab: "autofix", icon: Wrench },
    ],
  },
  growth: {
    name: "Growth Plan",
    price: "$129 / month",
    items: [
      { title: "50 Tracked Buyer Prompts", desc: "All 4 AI engines tracked every 24 hours.", tab: "prompts", icon: Terminal },
      { title: "Unlimited Reddit & Quora Hijacker", desc: "Uncapped community thread discovery & AI drafts.", tab: "reddit", icon: MessageSquare },
      { title: "Full 1-Click Auto-Fixer Suite", desc: "llms.txt, JSON-LD FAQ schemas, and GEO briefs.", tab: "autofix", icon: Wrench },
    ],
  },
  agency: {
    name: "Agency Plan",
    price: "$299 / month",
    items: [
      { title: "200 Prompts & 5 Workspaces", desc: "Manage separate client brands effortlessly.", tab: "dashboard", icon: Terminal },
      { title: "White-Label A4 PDF Reports", desc: "Export branded client deliverables.", tab: "reports", icon: FileText },
      { title: "Unlimited Growth Tools", desc: "Full access to Hijacker & Auto-Fixer.", tab: "autofix", icon: Wrench },
    ],
  },
};

export const UnlockedBenefitsModal: React.FC<UnlockedBenefitsModalProps> = ({
  isOpen,
  onClose,
  planTier,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const tier = BENEFITS_BY_TIER[planTier.toLowerCase()] || BENEFITS_BY_TIER.growth;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20 text-[#16A34A] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase text-[#16A34A] font-semibold">
                Plan Active • {tier.price}
              </div>
              <h3 className="text-lg font-semibold text-[#111113]">
                Welcome to {tier.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white text-[#52525B] border border-[#E5E7EB] hover:border-[#111113] hover:text-[#111113] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {tier.items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white border border-[#E5E7EB] text-[#111113] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#111113] truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#52525B] mt-0.5">{item.desc}</div>
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateTab(item.tab);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
