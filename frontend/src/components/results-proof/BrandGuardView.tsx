import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Sparkles,
  Trash2,
  Plus,
  ExternalLink,
  Copy,
  Check,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface BrandGuardViewProps {
  workspaceId: string;
  brandDomain: string;
}

interface LieAlert {
  id: string;
  engine_name: string;
  prompt_text: string;
  ai_false_claim: string;
  actual_truth: string;
  severity: "critical" | "moderate";
  suspected_source_url?: string | null;
  corrective_kit?: {
    corrective_faq_json_ld: string;
    website_clarity_snippet: string;
    third_party_update_email: string;
  } | null;
  status: "open" | "fixing" | "resolved";
}

interface GroundTruthItem {
  id: string;
  category: string;
  fact_statement: string;
  is_active: boolean;
}

export const BrandGuardView: React.FC<BrandGuardViewProps> = ({
  workspaceId,
  brandDomain,
}) => {
  const [subTab, setSubTab] = useState<"lies" | "truths">("lies");
  const [alerts, setAlerts] = useState<LieAlert[]>([]);
  const [truths, setTruths] = useState<GroundTruthItem[]>([]);
  const [proposedFacts, setProposedFacts] = useState<Array<{ category: string; fact_statement: string }>>([]);
  const [extracting, setExtracting] = useState(false);

  const [newCategory, setNewCategory] = useState("pricing");
  const [newFact, setNewFact] = useState("");
  const [addingFact, setAddingFact] = useState(false);

  const [activeAlert, setActiveAlert] = useState<LieAlert | null>(null);
  const [generatingKit, setGeneratingKit] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [liesRes, truthsRes] = await Promise.all([
        apiClient.get(`/workspaces/${workspaceId}/brand-lies`),
        apiClient.get(`/workspaces/${workspaceId}/ground-truths`),
      ]);
      setAlerts(liesRes.data?.alerts || []);
      setTruths(truthsRes.data?.ground_truths || []);
    } catch {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    fetchAll();
  }, [workspaceId]);

  const handleAddTruth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setAddingFact(true);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/ground-truths`, {
        category: newCategory,
        fact_statement: newFact.trim(),
      });
      setNewFact("");
      await fetchAll();
    } finally {
      setAddingFact(false);
    }
  };

  const handleDeleteTruth = async (id: string) => {
    await apiClient.delete(`/workspaces/${workspaceId}/ground-truths/${id}`);
    setTruths((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAutoExtract = async () => {
    setExtracting(true);
    try {
      const res = await apiClient.post(
        `/workspaces/${workspaceId}/ground-truths/auto-extract`
      );
      setProposedFacts(res.data?.proposed_facts || []);
    } finally {
      setExtracting(false);
    }
  };

  const handleApproveProposed = async (fact: { category: string; fact_statement: string }) => {
    await apiClient.post(`/workspaces/${workspaceId}/ground-truths`, fact);
    setProposedFacts((prev) => prev.filter((p) => p.fact_statement !== fact.fact_statement));
    await fetchAll();
  };

  const handleOpenKit = async (alert: LieAlert) => {
    setActiveAlert(alert);
    if (alert.corrective_kit) return;
    setGeneratingKit(true);
    try {
      const res = await apiClient.post(
        `/workspaces/${workspaceId}/brand-lies/${alert.id}/generate-fix`
      );
      const kit = res.data?.corrective_kit;
      setActiveAlert({ ...alert, corrective_kit: kit, status: res.data?.status || "fixing" });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, corrective_kit: kit, status: "fixing" } : a))
      );
    } finally {
      setGeneratingKit(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    await apiClient.patch(`/workspaces/${workspaceId}/brand-lies/${alertId}/status`, {
      status: "resolved",
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a))
    );
  };

  const handleLogAppliedFix = async (alert: LieAlert) => {
    await apiClient.post(`/workspaces/${workspaceId}/fixes`, {
      fix_type: "faq_schema",
      title: `Fix Brand Lie: ${alert.ai_false_claim.slice(0, 60)}`,
      target_url: `https://${brandDomain}`,
    });
    await apiClient.patch(`/workspaces/${workspaceId}/brand-lies/${alert.id}/status`, {
      status: "fixing",
    });
    setActiveAlert(null);
    await fetchAll();
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[#111113]">
            AI Hallucination &amp; Brand Lie Guard
          </h2>
          <p className="text-[12px] text-[#52525B]">
            Automatically flags when ChatGPT, Perplexity, or Gemini contradicts your verified pricing, features, or integrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("lies")}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-medium cursor-pointer ${
              subTab === "lies"
                ? "bg-[#111113] text-white"
                : "bg-[#FAFAFB] text-[#52525B] border border-[#E5E7EB]"
            }`}
          >
            Active Brand Lies ({alerts.filter((a) => a.status !== "resolved").length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("truths")}
            className={`px-3.5 py-2 rounded-lg text-[12px] font-medium cursor-pointer ${
              subTab === "truths"
                ? "bg-[#111113] text-white"
                : "bg-[#FAFAFB] text-[#52525B] border border-[#E5E7EB]"
            }`}
          >
            Ground Truth Facts ({truths.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Active Brand Lies Feed */}
      {subTab === "lies" && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-10 text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-[#16A34A] mx-auto" />
              <p className="text-[14px] font-medium text-[#111113]">
                No AI brand lies detected yet.
              </p>
              <p className="text-[12px] text-[#71717A]">
                Add your Ground Truth pricing &amp; product facts in the next tab — every audit automatically checks for contradictions.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                          alert.severity === "critical"
                            ? "bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]"
                            : "bg-amber-50 text-[#D97706] border border-amber-200"
                        }`}
                      >
                        {alert.severity === "critical" ? "Critical Lie" : "Moderate"}
                      </span>
                      <span className="text-[11px] font-mono text-[#52525B]">
                        {alert.engine_name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F4F4F5] text-[#111113]">
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-[#111113]">
                      Prompt: &ldquo;{alert.prompt_text}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenKit(alert)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Correction Kit</span>
                    </button>
                    {alert.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[12px] font-medium cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[#FFF1F2] border border-[#FECDD3] p-3.5">
                    <span className="text-[10px] font-mono uppercase text-[#E11D48]">
                      What {alert.engine_name} Claimed
                    </span>
                    <p className="text-[13px] text-[#111113] mt-1">{alert.ai_false_claim}</p>
                  </div>
                  <div className="rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] p-3.5">
                    <span className="text-[10px] font-mono uppercase text-[#16A34A]">
                      Your Ground Truth
                    </span>
                    <p className="text-[13px] text-[#111113] mt-1">{alert.actual_truth}</p>
                  </div>
                </div>

                {alert.suspected_source_url && (
                  <a
                    href={alert.suspected_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#52525B] hover:underline"
                  >
                    <span>Suspected source: {alert.suspected_source_url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Ground Truth Fact Manager */}
      {subTab === "truths" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[14px] font-semibold text-[#111113]">
                Add Verified Ground Truth Fact
              </h3>
              <button
                type="button"
                onClick={handleAutoExtract}
                disabled={extracting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${extracting ? "animate-spin" : ""}`} />
                <span>
                  {extracting ? "Crawling Website..." : "Auto-Extract Facts from Website"}
                </span>
              </button>
            </div>

            <form onSubmit={handleAddTruth} className="flex flex-col sm:flex-row gap-3">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[13px] text-[#111113]"
              >
                <option value="pricing">Pricing</option>
                <option value="features">Features</option>
                <option value="integrations">Integrations</option>
                <option value="target_audience">Target Audience</option>
                <option value="positioning">Positioning</option>
              </select>
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="e.g., Starter plan costs $49/month, not $99"
                className="flex-1 h-10 px-3.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] text-[#111113]"
              />
              <button
                type="submit"
                disabled={addingFact}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-[#111113] text-white text-[13px] font-medium hover:bg-[#27272A] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Fact</span>
              </button>
            </form>

            {proposedFacts.length > 0 && (
              <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-2.5">
                <p className="text-[12px] font-semibold text-[#111113]">
                  Proposed Facts Extracted from {brandDomain} (Click Approve to Activate)
                </p>
                {proposedFacts.map((pf, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-[#E5E7EB]"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] mr-2">
                        {pf.category}
                      </span>
                      <span className="text-[13px] text-[#111113]">{pf.fact_statement}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApproveProposed(pf)}
                      className="px-3 py-1 rounded-md bg-[#16A34A] text-white text-[11px] font-medium shrink-0 cursor-pointer"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl divide-y divide-[#E5E7EB]">
            {truths.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F4F4F5] text-[#111113] mr-2">
                    {t.category}
                  </span>
                  <span className="text-[13px] text-[#111113]">{t.fact_statement}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTruth(t.id)}
                  className="p-1.5 rounded-lg text-[#E11D48] hover:bg-[#FFF1F2] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corrective Kit Drawer */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="w-full max-w-lg bg-white h-full border-l border-[#E5E7EB] p-6 flex flex-col justify-between overflow-y-auto shadow-xl">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-[#E11D48]">
                    Corrective Fact Kit
                  </span>
                  <h3 className="text-base font-semibold text-[#111113] mt-0.5">
                    {activeAlert.engine_name} Contradiction
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAlert(null)}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#111113] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {generatingKit || !activeAlert.corrective_kit ? (
                <div className="py-12 text-center text-[13px] text-[#52525B]">
                  Generating Corrective FAQ JSON-LD &amp; Outreach Kit...
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    {
                      key: "faq",
                      label: "1. Corrective FAQPage JSON-LD",
                      val: activeAlert.corrective_kit.corrective_faq_json_ld,
                    },
                    {
                      key: "snippet",
                      label: "2. Website Clarity Snippet",
                      val: activeAlert.corrective_kit.website_clarity_snippet,
                    },
                    {
                      key: "email",
                      label: "3. Third-Party Update Email",
                      val: activeAlert.corrective_kit.third_party_update_email,
                    },
                  ].map((sec) => (
                    <div key={sec.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-[#111113]">
                          {sec.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(sec.key, sec.val)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#111113] hover:underline cursor-pointer"
                        >
                          {copiedKey === sec.key ? (
                            <Check className="w-3 h-3 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === sec.key ? "Copied ✓" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[11px] font-mono text-[#111113] whitespace-pre-wrap overflow-x-auto">
                        {sec.val}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleLogAppliedFix(activeAlert)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Mark as Applied Fix</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
