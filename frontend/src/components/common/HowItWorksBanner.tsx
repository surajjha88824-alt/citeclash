import React, { useState, useEffect } from "react";
import { Sparkles, X, ChevronRight, HelpCircle } from "lucide-react";

interface StepItem {
  number: number;
  title: string;
  desc: string;
}

interface HowItWorksBannerProps {
  id: string;
  title: string;
  subtitle: string;
  steps: StepItem[];
  actionLabel?: string;
  onAction?: () => void;
}

export const HowItWorksBanner: React.FC<HowItWorksBannerProps> = ({
  id,
  title,
  subtitle,
  steps,
  actionLabel,
  onAction,
}) => {
  const storageKey = `citeclash_banner_dismissed_${id}`;
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  const handleReset = () => {
    setIsDismissed(false);
    localStorage.removeItem(storageKey);
  };

  if (isDismissed) {
    return (
      <div className="flex justify-end mb-3">
        <button
          onClick={handleReset}
          className="text-[11px] font-mono text-[#64646B] hover:text-[#111113] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Show "{title}" Guide</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-5 rounded-2xl bg-[#FAFAFB] border border-[#E5E7EB] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white text-[#111113] border border-[#E5E7EB]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#111113] flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white text-[#64646B] border border-[#E5E7EB]">
                How It Works
              </span>
            </h4>
            <p className="text-xs text-[#64646B] mt-0.5">{subtitle}</p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-[#8E8E93] hover:text-[#111113] transition-colors cursor-pointer"
          title="Dismiss tip"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3-Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((st) => (
          <div
            key={st.number}
            className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-[#111113] text-white font-mono text-xs font-semibold flex items-center justify-center shrink-0">
              {st.number}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#111113] mb-0.5">{st.title}</div>
              <div className="text-[11px] text-[#64646B] leading-relaxed">{st.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Optional action button */}
      {actionLabel && onAction && (
        <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onAction}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#111113] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
