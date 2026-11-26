import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface CompetitorPageDiffProps {
  workspaceId: string;
  brandDomain: string;
}

interface SideBySideRow {
  metric: string;
  user_value: string | number;
  competitor_value: string | number;
  winner: "user" | "competitor" | "tie";
}

interface PageDiffResponse {
  needs_manual_paste?: boolean;
  blocked_url?: string;
  message?: string;
  user_url?: string;
  competitor_url?: string;
  side_by_side_metrics?: SideBySideRow[];
  why_ai_cites_competitor?: string[];
  exact_gaps_on_your_page?: string[];
  surgical_fixes?: {
    ready_faq_json_ld: string;
    ready_comparison_table_html: string;
    recommended_h2_sections: string[];
  };
}

export const CompetitorPageDiff: React.FC<CompetitorPageDiffProps> = ({
  workspaceId,
  brandDomain,
}) => {
  const [userUrl, setUserUrl] = useState(
    brandDomain.startsWith("http") ? brandDomain : `https://${brandDomain}`
  );
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [quickCompetitorUrls, setQuickCompetitorUrls] = useState<string[]>([]);
  const [manualPasteMode, setManualPasteMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const [wafMessage, setWafMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PageDiffResponse | null>(null);
  const [activeFixTab, setActiveFixTab] = useState<"faq" | "table" | "h2">("faq");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setUserUrl(brandDomain.startsWith("http") ? brandDomain : `https://${brandDomain}`);
    const loadGapUrls = async () => {
      try {
        const res = await apiClient.get(`/workspaces/${workspaceId}/citation-gaps`);
        const urls = (res.data?.gaps || []).slice(0, 6).map((g: any) => g.url);
        setQuickCompetitorUrls(urls);
        if (urls.length > 0 && !competitorUrl) {
          setCompetitorUrl(urls[0]);
        }
      } catch {
        // Optional helper dropdown
      }
    };
    loadGapUrls();
  }, [workspaceId, brandDomain]);

  const handleRunDiff = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!competitorUrl.trim()) {
      setError("Please enter a competitor page URL to compare.");
      return;
    }
    setLoading(true);
    setError(null);
    setWafMessage(null);
    try {
      const res = await apiClient.post(`/workspaces/${workspaceId}/page-diff`, {
        user_url: userUrl,
        competitor_url: competitorUrl,
        manual_competitor_text: manualPasteMode ? manualText : undefined,
      });
      const data: PageDiffResponse = res.data;
      if (data.needs_manual_paste) {
        setManualPasteMode(true);
        setWafMessage(
          data.message ||
            "Competitor site blocks automated crawlers (Cloudflare/WAF). Paste the visible text below to run the exact diff."
        );
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error?.message ||
          "Could not run live page diff. Ensure both URLs are valid public pages."
      );
    } finally {
      setLoading(false);
    }
  };

  const activeCodeSnippet =
    activeFixTab === "faq"
      ? result?.surgical_fixes?.ready_faq_json_ld || ""
      : activeFixTab === "table"
      ? result?.surgical_fixes?.ready_comparison_table_html || ""
      : (result?.surgical_fixes?.recommended_h2_sections || []).join("\n\n");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Form */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111113]">
            Live Competitor-vs-User Page Diff Engine
          </h2>
          <p className="text-[13px] text-[#52525B] mt-0.5">
            Fetches both live HTML pages, compares structural AI-readability signals, and generates copy-paste JSON-LD, comparison tables, and missing H2 sections.
          </p>
        </div>

        <form onSubmit={handleRunDiff} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1.5">
                Your Page URL
              </label>
              <input
                type="text"
                value={userUrl}
                onChange={(e) => setUserUrl(e.target.value)}
                placeholder="https://yourdomain.com"
                className="w-full h-10 px-3.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] font-mono text-[#111113] focus:outline-none focus:border-[#111113]"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                  Competitor Page URL
                </label>
                {quickCompetitorUrls.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) setCompetitorUrl(e.target.value);
                    }}
                    defaultValue=""
                    className="text-[11px] font-mono bg-white border border-[#E5E7EB] rounded px-2 py-0.5 text-[#52525B] max-w-[210px] truncate"
                  >
                    <option value="" disabled>
                      Quick-select cited URL...
                    </option>
                    {quickCompetitorUrls.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <input
                type="text"
                value={competitorUrl}
                onChange={(e) => {
                  setCompetitorUrl(e.target.value);
                  setManualPasteMode(false);
                }}
                placeholder="https://competitor.com/features"
                className="w-full h-10 px-3.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] font-mono text-[#111113] focus:outline-none focus:border-[#111113]"
              />
            </div>
          </div>

          {manualPasteMode && (
            <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-2">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#D97706]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{wafMessage}</span>
              </div>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={6}
                placeholder="Paste the visible text from the competitor's page here..."
                className="w-full p-3 rounded-lg bg-white border border-[#D4D4D8] text-[12px] font-mono text-[#111113] focus:outline-none focus:border-[#111113]"
              />
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#111113] text-white text-[13px] font-medium hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Live Page Diff...</span>
                </>
              ) : (
                <>
                  <span>{manualPasteMode ? "Run Diff with Pasted Text" : "Run Live Page Diff"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[12px] text-[#E11D48]">
            {error}
          </div>
        )}
      </div>

      {/* Results View */}
      {result && result.side_by_side_metrics && (
        <>
          {/* Structural Scorecard Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-[#FAFAFB]">
              <h3 className="text-[14px] font-semibold text-[#111113]">
                Structural Scorecard Table
              </h3>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                    <th className="py-3 px-5">Metric</th>
                    <th className="py-3 px-5 whitespace-nowrap">Your Page</th>
                    <th className="py-3 px-5 whitespace-nowrap">Competitor Page</th>
                    <th className="py-3 px-5 whitespace-nowrap text-right">Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
                  {result.side_by_side_metrics.map((row) => (
                    <tr key={row.metric}>
                      <td className="py-3 px-5 font-medium text-[#111113]">
                        {row.metric}
                      </td>
                      <td className="py-3 px-5 font-mono text-[#111113] tabular-nums whitespace-nowrap">
                        {row.user_value}
                      </td>
                      <td className="py-3 px-5 font-mono text-[#52525B] tabular-nums whitespace-nowrap">
                        {row.competitor_value}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        {row.winner === "user" ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]">
                            Your Edge
                          </span>
                        ) : row.winner === "competitor" ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]">
                            Competitor Leads
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F4F4F5] text-[#52525B]">
                            Tie
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2-Column Editorial Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-[#111113] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  Why AI Cites Competitor
                </h3>
                <ul className="space-y-2.5 text-[13px] text-[#52525B]">
                  {(result.why_ai_cites_competitor || []).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono text-[11px] text-[#111113] mt-0.5">
                        0{idx + 1}
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-[#111113] mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#E11D48]" />
                  Exact Gaps on Your Page
                </h3>
                <ul className="space-y-2.5 text-[13px] text-[#52525B]">
                  {(result.exact_gaps_on_your_page || []).map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono text-[11px] text-[#E11D48] mt-0.5">
                        0{idx + 1}
                      </span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Segmented Copy-Paste Surgical Fix Tabs */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-[#FAFAFB] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "faq", label: "FAQ JSON-LD Schema" },
                  { id: "table", label: "Comparison HTML Table" },
                  { id: "h2", label: "Missing Sections Markdown" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFixTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                      activeFixTab === tab.id
                        ? "bg-[#111113] text-white"
                        : "bg-white text-[#52525B] border border-[#E5E7EB] hover:border-[#111113]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedCode ? "Copy Code ✓" : "Copy Code"}</span>
              </button>
            </div>

            <pre className="p-5 bg-[#FAFAFB] text-[12px] font-mono text-[#111113] overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {activeCodeSnippet}
            </pre>
          </div>
        </>
      )}
    </div>
  );
};
