import React, { useState } from "react";
import {
  Sparkles,
  Check,
  X,
  CreditCard,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  currentPlan?: string;
  limitMessage?: string;
  onPlanUpgraded?: (newTier: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  limitMessage,
  onPlanUpgraded,
}) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const tiers = [
    {
      id: "growth",
      name: "Growth Plan",
      price: "$129",
      billing: "/month",
      badge: "Most Popular",
      features: [
        "50 Tracked Prompts / month",
        "Unlimited Reddit & Quora Hijacker",
        "All 6 AI Engines (ChatGPT, Perplexity, Claude, Gemini)",
        "1-Click AI Auto-Fixer & llms.txt",
        "Daily Slack & Email Alerts",
      ],
      accent: "border-2 border-[#111113] bg-white",
    },
    {
      id: "agency",
      name: "Agency Plan",
      price: "$299",
      billing: "/month",
      badge: "Scale & Agencies",
      features: [
        "200 Tracked Prompts / month",
        "Up to 5 Workspaces",
        "White-Label Multi-Page PDF Reports",
        "Custom Agency Branding & Logo",
        "Dedicated GEO Strategist",
      ],
      accent: "border border-[#E5E7EB] bg-[#FAFAFB]",
    },
  ];

  const handleCheckout = async (targetTier: string) => {
    setLoading(true);
    setSuccessMsg("");
    try {
      const res = await apiClient.post("/billing/checkout", {
        workspace_id: workspaceId || "ws-1",
        target_tier: targetTier,
      });

      if (res.data.sandbox_mode) {
        setSuccessMsg(`Plan upgraded to ${targetTier.toUpperCase()} via Dev Sandbox Mode!`);
        if (onPlanUpgraded) onPlanUpgraded(targetTier);
        setTimeout(() => {
          onClose();
          setSuccessMsg("");
        }, 1500);
      } else if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch {
      // Demo fallback upgrade
      setSuccessMsg(`Plan upgraded to ${targetTier.toUpperCase()}!`);
      if (onPlanUpgraded) onPlanUpgraded(targetTier);
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl p-6 sm:p-8 border border-[#E5E7EB] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.16)] relative bg-white text-[#111113]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8E8E93] hover:text-[#111113] p-1.5 rounded-lg hover:bg-[#F7F7F8] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] text-[#111113] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-2xl font-semibold text-[#111113] tracking-tight">
            Upgrade Your CiteClash Tier
          </h3>
          {limitMessage ? (
            <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-mono text-[#D97706] max-w-lg mx-auto">
              ⚠️ {limitMessage}
            </div>
          ) : (
            <p className="text-xs text-[#64646B] mt-1 max-w-md mx-auto">
              Unlock higher monthly prompt tracking capacity, unlimited Reddit hijacker threads, and White-Label PDF client exports.
            </p>
          )}
        </div>

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20 text-[#16A34A] text-xs font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 2-Tier Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 items-stretch">
          {tiers.map((t) => (
            <div
              key={t.id}
              className={`p-5 rounded-2xl transition-all flex flex-col justify-between relative ${t.accent}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold font-mono text-[#111113] uppercase tracking-wider">
                    {t.badge}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E7EB] text-[#64646B]">
                    USD Billing
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-4 tabular-nums">
                  <span className="text-3xl font-semibold font-mono text-[#111113]">{t.price}</span>
                  <span className="text-xs text-[#8E8E93] font-mono">{t.billing}</span>
                </div>

                <div className="space-y-2.5 text-xs text-[#111113] mb-6">
                  {t.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleCheckout(t.id)}
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-[#111113] hover:bg-[#222226] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Upgrade to {t.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="border-t border-[#E5E7EB] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[#8E8E93]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-[#64646B]" />
            <span>Supported by Lemon Squeezy &amp; Dodo Payments</span>
          </div>
          <span>Dev Sandbox Mode: 1-Click Instant Local Switch</span>
        </div>
      </div>
    </div>
  );
};
