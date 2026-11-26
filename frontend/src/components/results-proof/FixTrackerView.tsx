import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface FixTrackerViewProps {
  workspaceId: string;
  brandDomain: string;
  onNavigateTab: (tab: string) => void;
}

interface AppliedFixItem {
  id: string;
  fix_type: string;
  title: string;
  target_url: string;
  baseline_visibility_score: number;
  status: "pending_verify" | "verify_failed" | "verified_live" | "indexed" | "won" | "stalled_pivoted";
  instant_check_result?: { passed?: boolean; message?: string };
  is_indexed: boolean;
  recheck_due_at: string;
  current_visibility_score?: number | null;
  score_delta?: number | null;
  diagnosis_code?: string | null;
  plan_b?: {
    root_cause_summary: string;
    pivot_action_title: string;
    pivot_steps: string[];
    target_route: string;
  } | null;
}

export const FixTrackerView: React.FC<FixTrackerViewProps> = ({
  workspaceId,
  brandDomain,
  onNavigateTab,
}) => {
  const [fixes, setFixes] = useState<AppliedFixItem[]>([]);
  const [kpis, setKpis] = useState({
    active_fixes: 0,
    verified_wins: 0,
    needs_attention: 0,
    avg_visibility_lift: 0,
  });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [newType, setNewType] = useState("llms_txt");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState(`https://${brandDomain}/llms.txt`);
  const [creating, setCreating] = useState(false);

  const fetchFixes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/workspaces/${workspaceId}/fixes`);
      setFixes(res.data?.fixes || []);
      if (res.data?.kpis) setKpis(res.data.kpis);
    } catch {
      setFixes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixes();
  }, [workspaceId]);

  const handleLogFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    setCreating(true);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/fixes`, {
        fix_type: newType,
        title: newTitle.trim(),
        target_url: newUrl.trim(),
      });
      setShowModal(false);
      setNewTitle("");
      await fetchFixes();
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyNow = async (fixId: string) => {
    setBusyId(fixId);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/fixes/${fixId}/verify-now`);
      await fetchFixes();
    } finally {
      setBusyId(null);
    }
  };

  const handleRecheck = async (fixId: string) => {
    setBusyId(fixId);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/fixes/${fixId}/recheck`);
      await fetchFixes();
    } finally {
      setBusyId(null);
    }
  };

  const getStepIndex = (status: AppliedFixItem["status"]) => {
    if (status === "won" || status === "stalled_pivoted") return 4;
    if (status === "indexed") return 3;
    if (status === "verified_live") return 2;
    return 1;
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {[
          { label: "Active Fixes", value: kpis.active_fixes, accent: "text-[#111113]" },
          { label: "Verified Wins (+Score)", value: kpis.verified_wins, accent: "text-[#16A34A]" },
          { label: "Needs Attention / Plan B", value: kpis.needs_attention, accent: "text-[#E11D48]" },
          {
            label: "Avg Visibility Lift",
            value: `${kpis.avg_visibility_lift >= 0 ? "+" : ""}${kpis.avg_visibility_lift}%`,
            accent: kpis.avg_visibility_lift >= 0 ? "text-[#16A34A]" : "text-[#E11D48]",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between"
          >
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              {card.label}
            </span>
            <span className={`mt-2 text-3xl font-semibold tabular-nums ${card.accent}`}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Header Action Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[#111113]">
            Closed-Loop Fix Verification &amp; Plan-B Tracker
          </h2>
          <p className="text-[12px] text-[#52525B]">
            Every applied fix is verified live via HTTP, checked for Google indexing, and re-benchmarked on Day 7/14.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchFixes}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[12px] font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log New Fix</span>
          </button>
        </div>
      </div>

      {/* Fix Cards List */}
      <div className="space-y-4">
        {fixes.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center text-[13px] text-[#71717A]">
            No fixes logged yet. Click &ldquo;Log New Fix +&rdquo; after publishing <code className="font-mono">/llms.txt</code>, FAQ JSON-LD, or outreach.
          </div>
        ) : (
          fixes.map((fix) => {
            const stepIdx = getStepIndex(fix.status);
            return (
              <div
                key={fix.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F4F4F5] text-[#111113] border border-[#E5E7EB]">
                        {fix.fix_type}
                      </span>
                      <span className="text-[14px] font-semibold text-[#111113] truncate">
                        {fix.title}
                      </span>
                      {fix.status === "won" && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]">
                          Verified Win ({fix.score_delta && fix.score_delta >= 0 ? `+${fix.score_delta}` : fix.score_delta}%)
                        </span>
                      )}
                      {fix.status === "verify_failed" && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
                          Verify Failed
                        </span>
                      )}
                      {fix.status === "stalled_pivoted" && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-[#D97706] border border-amber-200">
                          Stalled • Plan B Active
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] font-mono text-[#71717A] truncate">
                      {fix.target_url} • Baseline:{" "}
                      <span className="text-[#111113] tabular-nums">{fix.baseline_visibility_score}%</span>
                      {fix.current_visibility_score != null && (
                        <>
                          {" "}
                          → Current:{" "}
                          <span className="text-[#111113] tabular-nums">{fix.current_visibility_score}%</span>
                        </>
                      )}
                    </p>
                    {fix.instant_check_result?.message && (
                      <p
                        className={`text-[12px] flex items-center gap-1.5 ${
                          fix.status === "verify_failed" ? "text-[#E11D48]" : "text-[#52525B]"
                        }`}
                      >
                        {fix.status === "verify_failed" ? (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        )}
                        <span>{fix.instant_check_result.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleVerifyNow(fix.id)}
                      disabled={busyId === fix.id}
                      className="px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[12px] font-medium cursor-pointer"
                    >
                      Verify Live Now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecheck(fix.id)}
                      disabled={busyId === fix.id}
                      className="px-3 py-1.5 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-[12px] font-medium cursor-pointer"
                    >
                      {busyId === fix.id ? "Checking..." : "Recheck Impact"}
                    </button>
                  </div>
                </div>

                {/* 4-Step Mini Stepper */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E5E7EB]">
                  {["Applied", "Live Verified", "Indexed", "Outcome"].map((step, i) => {
                    const active = i + 1 <= stepIdx;
                    return (
                      <div key={step} className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            active
                              ? fix.status === "verify_failed" && i === 1
                                ? "bg-[#E11D48]"
                                : fix.status === "stalled_pivoted" && i === 3
                                ? "bg-[#D97706]"
                                : "bg-[#16A34A]"
                              : "bg-[#E5E7EB]"
                          }`}
                        />
                        <span className="block text-[11px] font-mono text-[#71717A]">{step}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Root-Cause Diagnosis & Plan-B Card */}
                {fix.status === "stalled_pivoted" && fix.plan_b && (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[13px] font-semibold text-[#111113]">
                            Root-Cause Diagnosis: {fix.plan_b.pivot_action_title}
                          </p>
                          <p className="text-[12px] text-[#52525B] mt-0.5">
                            {fix.plan_b.root_cause_summary}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateTab(fix.plan_b?.target_route || "citation-gaps")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] shrink-0 cursor-pointer"
                      >
                        <span>Execute Plan B</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <ul className="pl-6 list-disc text-[12px] text-[#52525B] space-y-1">
                      {fix.plan_b.pivot_steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log New Fix Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111113]">Log Applied Fix</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg border border-[#E5E7EB] text-[#111113] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleLogFix} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#111113] mb-1">Fix Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] text-[#111113]"
                >
                  <option value="llms_txt">llms.txt Published</option>
                  <option value="faq_schema">FAQPage JSON-LD Schema</option>
                  <option value="robots_txt">robots.txt AI Bot Allow</option>
                  <option value="page_diff">Page Diff / Comparison Table</option>
                  <option value="reddit_reply">Reddit / Quora Reply</option>
                  <option value="outreach_pitch">Listicle Outreach Pitch</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#111113] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Published llms.txt & FAQPage schema"
                  className="w-full h-9 px-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] text-[#111113]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#111113] mb-1">Target URL</label>
                <input
                  type="text"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] font-mono text-[#111113]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] text-[12px] font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer"
                >
                  {creating ? "Verifying Live..." : "Log & Verify Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
