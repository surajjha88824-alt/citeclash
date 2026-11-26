import React, { useState, useEffect } from "react";
import {
  Rocket,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  X,
  Swords,
  MessageSquare,
  Wrench,
  Mail,
  Building2,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface ChecklistProgress {
  step_1_brand: boolean;
  step_2_audit: boolean;
  step_3_reddit: boolean;
  step_4_autofix: boolean;
  step_5_email: boolean;
  completed_count: number;
  total_steps: number;
  percentage_complete: number;
}

interface QuickStartChecklistProps {
  onNavigateTab: (tab: string) => void;
  onOpenOnboardingWizard?: () => void;
}

export const QuickStartChecklist: React.FC<QuickStartChecklistProps> = ({
  onNavigateTab,
  onOpenOnboardingWizard,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [closed, setClosed] = useState(false);
  const [progress, setProgress] = useState<ChecklistProgress>({
    step_1_brand: true,
    step_2_audit: true,
    step_3_reddit: false,
    step_4_autofix: false,
    step_5_email: false,
    completed_count: 2,
    total_steps: 5,
    percentage_complete: 40,
  });

  const fetchProgress = async () => {
    try {
      const res = await apiClient.get<ChecklistProgress>("/onboarding/progress");
      setProgress(res.data);
    } catch (err: any) {
      // Use optimistic state if backend is offline
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const toggleStep = async (stepKey: keyof ChecklistProgress, currentValue: boolean) => {
    const updatedVal = !currentValue;
    // Optimistic update
    const updated = { ...progress, [stepKey]: updatedVal };
    const completed = [
      updated.step_1_brand,
      updated.step_2_audit,
      updated.step_3_reddit,
      updated.step_4_autofix,
      updated.step_5_email,
    ].filter(Boolean).length;
    setProgress({
      ...updated,
      completed_count: completed,
      percentage_complete: Math.round((completed / 5) * 100),
    });

    try {
      await apiClient.patch("/onboarding/progress", {
        [stepKey]: updatedVal,
      });
    } catch (err: any) {
      console.warn("Failed to update step:", err);
    }
  };

  if (closed) return null;

  const steps = [
    {
      key: "step_1_brand" as keyof ChecklistProgress,
      title: "1. Add Brand & Competitors",
      desc: "Register your domain URL & top competing SaaS websites.",
      isComplete: progress.step_1_brand,
      icon: Building2,
      action: () => {
        if (onOpenOnboardingWizard) onOpenOnboardingWizard();
        else onNavigateTab("dashboard");
      },
      actionLabel: "Configure Brand",
    },
    {
      key: "step_2_audit" as keyof ChecklistProgress,
      title: "2. Run First Multi-Engine Audit",
      desc: "Benchmark brand citations across ChatGPT, Perplexity & Gemini.",
      isComplete: progress.step_2_audit,
      icon: Swords,
      action: () => onNavigateTab("dashboard"),
      actionLabel: "View Battle Card",
    },
    {
      key: "step_3_reddit" as keyof ChecklistProgress,
      title: "3. Generate Reddit / Quora Reply",
      desc: "Draft a high-ranking community answer positioning your product.",
      isComplete: progress.step_3_reddit,
      icon: MessageSquare,
      action: () => {
        toggleStep("step_3_reddit", false);
        onNavigateTab("reddit");
      },
      actionLabel: "Open Hijacker",
    },
    {
      key: "step_4_autofix" as keyof ChecklistProgress,
      title: "4. Generate llms.txt / Schema Fix",
      desc: "Create and publish /llms.txt to boost AI engine scrapers.",
      isComplete: progress.step_4_autofix,
      icon: Wrench,
      action: () => {
        toggleStep("step_4_autofix", false);
        onNavigateTab("autofix");
      },
      actionLabel: "Generate llms.txt",
    },
    {
      key: "step_5_email" as keyof ChecklistProgress,
      title: "5. Enable Weekly Visibility Email",
      desc: "Automate weekly executive digest emails for your domain.",
      isComplete: progress.step_5_email,
      icon: Mail,
      action: () => {
        toggleStep("step_5_email", false);
        onNavigateTab("settings");
      },
      actionLabel: "Enable Reports",
    },
  ];

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-[#E5E7EB] hover:border-[#111113] shadow-lg text-xs font-medium text-[#111113] cursor-pointer transition-all"
        >
          <Rocket className="w-3.5 h-3.5 text-[#111113]" />
          <span>Quick-Start</span>
          <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A34A] font-mono text-[11px] font-semibold tabular-nums">
            {progress.completed_count}/{progress.total_steps}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)]">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.16)] overflow-hidden">
        {/* Header Bar */}
        <div className="p-3.5 bg-[#FAFAFB] border-b border-[#E5E7EB] flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setCollapsed(!collapsed)}
          >
            <div className="p-1.5 rounded-lg bg-[#111113] text-white">
              <Rocket className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#111113] flex items-center gap-1.5">
                <span>Quick-Start Checklist</span>
                <span className="font-mono text-[10px] text-[#64646B] tabular-nums">
                  ({progress.completed_count}/{progress.total_steps})
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#16A34A] font-medium tabular-nums">
                {progress.percentage_complete}% Completed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg text-[#8E8E93] hover:text-[#111113] cursor-pointer"
              title={collapsed ? "Expand checklist" : "Collapse"}
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setClosed(true)}
              className="p-1 rounded-lg text-[#8E8E93] hover:text-[#111113] cursor-pointer"
              title="Close widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#F4F4F5] h-1.5 overflow-hidden">
          <div
            className="h-full bg-[#111113] transition-all duration-500"
            style={{ width: `${progress.percentage_complete}%` }}
          />
        </div>

        {/* Collapsible Steps Body */}
        {!collapsed && (
          <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto bg-white">
            {steps.map((st) => (
              <div
                key={st.key}
                className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 ${
                  st.isComplete
                    ? "bg-[#FAFAFB] border-[#E5E7EB] text-[#64646B]"
                    : "bg-white border-[#E5E7EB] hover:border-[#111113] text-[#111113]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    onClick={() => toggleStep(st.key, st.isComplete)}
                    className="mt-0.5 cursor-pointer text-[#8E8E93] hover:text-[#111113]"
                  >
                    {st.isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#D4D4D8] shrink-0" />
                    )}
                  </button>
                  <div>
                    <div
                      className={`text-xs font-semibold leading-tight ${
                        st.isComplete ? "line-through text-[#8E8E93]" : "text-[#111113]"
                      }`}
                    >
                      {st.title}
                    </div>
                    <p className="text-[11px] text-[#64646B] mt-0.5 leading-snug">
                      {st.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={st.action}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-medium bg-[#111113] hover:bg-[#222226] text-white shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Go</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            {progress.completed_count === 5 && (
              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20 text-center text-xs text-[#16A34A] font-semibold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>All 5 Activation Milestones Completed!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
