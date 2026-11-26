import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface CitationGapMatrixProps {
  workspaceId: string;
}

interface CitationGapItem {
  id: string;
  url: string;
  domain: string;
  title: string;
  citation_frequency: number;
  engines_citing: string[];
  competitors_present: string[];
  source_category:
    | "Editorial / Listicle"
    | "Community Forum"
    | "Review Directory"
    | "Competitor Owned";
  priority_score: number;
  recommended_action: string;
  status: "open" | "pitched" | "won" | "ignored";
  last_pitch_text?: string | null;
}

const CATEGORIES = [
  "All",
  "Editorial / Listicle",
  "Community Forum",
  "Review Directory",
  "Competitor Owned",
] as const;

export const CitationGapMatrix: React.FC<CitationGapMatrixProps> = ({
  workspaceId,
}) => {
  const [gaps, setGaps] = useState<CitationGapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [activeGap, setActiveGap] = useState<CitationGapItem | null>(null);
  const [pitchText, setPitchText] = useState("");
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/workspaces/${workspaceId}/citation-gaps`);
      setGaps(res.data?.gaps || []);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error?.message ||
          "Could not load citation gaps. Run an audit first or sign in."
      );
      setGaps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, [workspaceId]);

  const handleOpenDrawer = async (gap: CitationGapItem) => {
    setActiveGap(gap);
    if (gap.last_pitch_text) {
      setPitchText(gap.last_pitch_text);
      return;
    }
    await generatePitch(gap);
  };

  const generatePitch = async (gap: CitationGapItem) => {
    setGeneratingPitch(true);
    try {
      const res = await apiClient.post(
        `/workspaces/${workspaceId}/citation-gaps/generate-pitch`,
        {
          gap_id: gap.id,
          source_url: gap.url,
          source_title: gap.title,
          source_category: gap.source_category,
          competitor_name: gap.competitors_present?.[0] || "Competitor",
        }
      );
      const text = res.data?.pitch_text || "";
      setPitchText(text);
      setGaps((prev) =>
        prev.map((g) => (g.id === gap.id ? { ...g, last_pitch_text: text } : g))
      );
    } catch {
      setPitchText("Failed to generate pitch. Please retry.");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleStatusChange = async (
    gap: CitationGapItem,
    nextStatus: "open" | "pitched" | "won" | "ignored"
  ) => {
    setGaps((prev) =>
      prev.map((g) => (g.id === gap.id ? { ...g, status: nextStatus } : g))
    );
    if (activeGap?.id === gap.id) {
      setActiveGap({ ...activeGap, status: nextStatus });
    }
    try {
      await apiClient.patch(
        `/workspaces/${workspaceId}/citation-gaps/${gap.id}/status`,
        {
          status: nextStatus,
          source_url: gap.url,
          source_domain: gap.domain,
        }
      );
    } catch {
      // Revert silently on error
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredGaps = gaps.filter((g) => {
    if (categoryFilter !== "All" && g.source_category !== categoryFilter) return false;
    if (statusFilter !== "All" && g.status !== statusFilter) return false;
    return true;
  });

  const outreachCompleted = gaps.filter(
    (g) => g.status === "pitched" || g.status === "won"
  ).length;

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
            Total Missing High-Impact Sources
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#111113] tabular-nums">
              {gaps.length}
            </span>
            <span className="text-[12px] text-[#52525B]">
              URLs citing competitors where your brand is absent
            </span>
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
            Outreach Completed
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#16A34A] tabular-nums">
              {outreachCompleted}
            </span>
            <span className="text-[12px] text-[#52525B]">
              Sources marked Pitched or Won
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-[#111113] text-white"
                    : "bg-[#FAFAFB] text-[#52525B] border border-[#E5E7EB] hover:border-[#111113]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-white border border-[#D4D4D8] text-[12px] text-[#111113] focus:outline-none focus:border-[#111113]"
            >
              <option value="All">All Statuses</option>
              <option value="open">Open</option>
              <option value="pitched">Pitched</option>
              <option value="won">Won</option>
              <option value="ignored">Ignored</option>
            </select>
            <button
              type="button"
              onClick={fetchGaps}
              disabled={loading}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[12px] font-medium cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        {error && (
          <div className="p-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[12px] text-[#E11D48]">
            {error}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                <th className="py-3 px-4">Source URL / Domain</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap text-right">Freq</th>
                <th className="py-3 px-4 whitespace-nowrap">AI Engines</th>
                <th className="py-3 px-4 whitespace-nowrap">Competitor</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
              {filteredGaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-4 text-center text-[#71717A]">
                    {loading
                      ? "Analyzing stored citation sources..."
                      : "No citation gaps found for the current filter. Run a Battle Audit to populate real third-party citations."}
                  </td>
                </tr>
              ) : (
                filteredGaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-[#FAFAFB] transition-colors">
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <a
                        href={gap.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[12px] font-medium text-[#111113] hover:underline max-w-full"
                      >
                        <span className="truncate">{gap.domain}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-[#71717A]" />
                      </a>
                      <p className="text-[11px] text-[#71717A] truncate mt-0.5">{gap.url}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F4F4F5] text-[#111113] border border-[#E5E7EB]">
                        {gap.source_category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-semibold text-[#111113] tabular-nums">
                      {gap.citation_frequency}x
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-[12px] text-[#52525B]">
                      {gap.engines_citing.join(", ")}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
                        {gap.competitors_present.join(", ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={gap.status}
                        onChange={(e) =>
                          handleStatusChange(gap, e.target.value as any)
                        }
                        className="h-8 px-2 rounded-md bg-white border border-[#D4D4D8] text-[12px] text-[#111113] focus:outline-none focus:border-[#111113]"
                      >
                        <option value="open">Open</option>
                        <option value="pitched">Pitched</option>
                        <option value="won">Won</option>
                        <option value="ignored">Ignored</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(gap)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Draft Pitch / Fix</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Outreach Drawer */}
      {activeGap && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[1px]">
          <div className="w-full max-w-lg bg-white h-full border-l border-[#E5E7EB] p-6 flex flex-col justify-between shadow-xl overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-mono uppercase text-[#71717A]">
                    {activeGap.source_category}
                  </span>
                  <h3 className="text-base font-semibold text-[#111113] truncate mt-0.5">
                    {activeGap.domain}
                  </h3>
                  <a
                    href={activeGap.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-mono text-[#52525B] hover:underline break-all"
                  >
                    {activeGap.url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGap(null)}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#111113] hover:border-[#111113] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#111113] mb-1.5">
                  Tailored Outreach / Action Draft
                </label>
                {generatingPitch ? (
                  <div className="h-56 rounded-lg border border-[#E5E7EB] bg-[#FAFAFB] flex items-center justify-center text-[13px] text-[#52525B] gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Drafting tailored pitch...</span>
                  </div>
                ) : (
                  <textarea
                    value={pitchText}
                    onChange={(e) => setPitchText(e.target.value)}
                    rows={12}
                    className="w-full p-3.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] text-[#111113] leading-relaxed focus:outline-none focus:border-[#111113]"
                  />
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied ✓" : "Copy to Clipboard"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => generatePitch(activeGap)}
                  disabled={generatingPitch}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[12px] font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleStatusChange(activeGap, "pitched")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0] hover:bg-[#D1FAE5] text-[12px] font-medium cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark as Pitched</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
