import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  FileCode2,
  Globe,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface CrawlabilityAuditorProps {
  workspaceId: string;
  brandDomain: string;
}

interface CrawlCheckAction {
  severity: "Critical" | "Warning" | "Passed";
  title: string;
  detail: string;
  fix_snippet?: string | null;
}

interface CrawlAuditResult {
  id?: string;
  target_url: string;
  readiness_score: number;
  critical_blockers_count: number;
  created_at?: string;
  checks: {
    robots_txt: {
      found: boolean;
      bots: Record<string, "allowed" | "blocked" | "not_specified">;
      blocked_bots: string[];
      robots_txt_fix?: string | null;
    };
    html_analysis: {
      visible_words: number;
      has_empty_spa_mount: boolean;
      is_js_blank_trap: boolean;
      detected_schemas: string[];
      missing_schemas: string[];
      title: string;
      h1: string;
      meta_description: string;
      canonical_url: string;
      table_count: number;
      has_pricing_markers: boolean;
    };
    llms_txt: {
      url: string;
      found: boolean;
      status_code?: number | null;
      length_chars: number;
      is_soft_404: boolean;
    };
    actions: CrawlCheckAction[];
  };
}

const BOT_LIST = [
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Google-Extended",
];

export const CrawlabilityAuditor: React.FC<CrawlabilityAuditorProps> = ({
  workspaceId,
  brandDomain,
}) => {
  const [targetUrl, setTargetUrl] = useState(
    brandDomain.startsWith("http") ? brandDomain : `https://${brandDomain}`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<CrawlAuditResult | null>(null);
  const [copiedRobots, setCopiedRobots] = useState(false);
  const [openDiagnostic, setOpenDiagnostic] = useState<string | null>("actions");

  useEffect(() => {
    setTargetUrl(brandDomain.startsWith("http") ? brandDomain : `https://${brandDomain}`);
    const loadLatest = async () => {
      try {
        const res = await apiClient.get(`/workspaces/${workspaceId}/crawl-audit/latest`);
        if (res.data?.audit) {
          setAudit(res.data.audit);
        }
      } catch {
        // Ignore if unauthenticated or no prior audit
      }
    };
    loadLatest();
  }, [workspaceId, brandDomain]);

  const handleRunAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post(`/workspaces/${workspaceId}/crawl-audit`, {
        target_url: targetUrl,
      });
      setAudit(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error?.message ||
          "Could not run live crawlability audit. Ensure you are signed in and the domain is reachable."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRobotsFix = () => {
    if (!audit?.checks.robots_txt.robots_txt_fix) return;
    navigator.clipboard.writeText(audit.checks.robots_txt.robots_txt_fix);
    setCopiedRobots(true);
    setTimeout(() => setCopiedRobots(false), 2000);
  };

  const passedCount =
    audit?.checks.actions.filter((a) => a.severity === "Passed").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header & Live URL Trigger */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.025em] text-[#111113]">
              Live AI-Crawlability &amp; Technical Blocker Auditor
            </h2>
            <p className="text-[13px] text-[#52525B] mt-0.5">
              Runs 6 deterministic HTTP checks on your live domain: AI crawler permissions, SSR vs JS-only blank traps, /llms.txt, JSON-LD, and entity clarity.
            </p>
          </div>
          {audit?.created_at && (
            <span className="text-[11px] font-mono text-[#71717A] whitespace-nowrap shrink-0">
              Last audited: {new Date(audit.created_at).toLocaleString()}
            </span>
          )}
        </div>

        <form onSubmit={handleRunAudit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Globe className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              className="w-full h-10 pl-10 pr-3.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[13px] font-mono text-[#111113] focus:outline-none focus:border-[#111113]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#111113] text-white text-[13px] font-medium hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Live Site...</span>
              </>
            ) : (
              <>
                <span>Run Live Technical Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[12px] text-[#E11D48]">
            {error}
          </div>
        )}
      </div>

      {audit ? (
        <>
          {/* Top Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                AI Readiness Score
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-[-0.03em] text-[#111113] tabular-nums">
                  {audit.readiness_score}
                </span>
                <span className="text-sm font-mono text-[#71717A] tabular-nums">/100</span>
              </div>
              <div className="mt-3 h-1.5 w-full bg-[#F4F4F5] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    audit.readiness_score >= 75
                      ? "bg-[#16A34A]"
                      : audit.readiness_score >= 50
                      ? "bg-[#D97706]"
                      : "bg-[#E11D48]"
                  }`}
                  style={{ width: `${audit.readiness_score}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                Critical Blockers
              </span>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-4xl font-semibold tracking-[-0.03em] text-[#111113] tabular-nums">
                  {audit.critical_blockers_count}
                </span>
                <span
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                    audit.critical_blockers_count > 0
                      ? "bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]"
                      : "bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]"
                  }`}
                >
                  {audit.critical_blockers_count > 0 ? "Action Required" : "Zero Blockers"}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-[#52525B]">
                Blocks in robots.txt or empty JS-only HTML prevent citations.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                Passed Checks
              </span>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-4xl font-semibold tracking-[-0.03em] text-[#111113] tabular-nums">
                  {passedCount}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0] whitespace-nowrap">
                  Verified Live
                </span>
              </div>
              <p className="mt-2 text-[12px] text-[#52525B]">
                Server-rendered words:{" "}
                <span className="font-mono font-medium text-[#111113] tabular-nums">
                  {audit.checks.html_analysis.visible_words}
                </span>
              </p>
            </div>
          </div>

          {/* AI Bot Access Grid */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[#111113]">
                  AI Bot <code className="font-mono text-[13px]">robots.txt</code> Access Matrix
                </h3>
                <p className="text-[12px] text-[#52525B]">
                  Live crawler directives parsed from <span className="font-mono">{audit.target_url}/robots.txt</span>
                </p>
              </div>
              {audit.checks.robots_txt.robots_txt_fix && (
                <button
                  type="button"
                  onClick={handleCopyRobotsFix}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer whitespace-nowrap"
                >
                  {copiedRobots ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRobots ? "Copied Fixed robots.txt ✓" : "Copy Fixed robots.txt"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BOT_LIST.map((bot) => {
                const status = audit.checks.robots_txt.bots[bot] || "not_specified";
                const isBlocked = status === "blocked";
                return (
                  <div
                    key={bot}
                    className="border border-[#E5E7EB] rounded-lg p-3.5 bg-[#FAFAFB] flex items-center justify-between gap-3"
                  >
                    <span className="font-mono text-[12px] font-medium text-[#111113] truncate">
                      {bot}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                        isBlocked
                          ? "bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]"
                          : status === "allowed"
                          ? "bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]"
                          : "bg-white text-[#52525B] border border-[#E5E7EB]"
                      }`}
                    >
                      {isBlocked ? "Blocked" : status === "allowed" ? "Allowed" : "Default Allow"}
                    </span>
                  </div>
                );
              })}
            </div>

            {audit.checks.robots_txt.robots_txt_fix && (
              <pre className="mt-4 p-4 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[12px] font-mono text-[#111113] overflow-x-auto">
                {audit.checks.robots_txt.robots_txt_fix}
              </pre>
            )}
          </div>

          {/* Technical Diagnostics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {/* Prioritized Actions */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setOpenDiagnostic(openDiagnostic === "actions" ? null : "actions")}
                  className="w-full flex items-center justify-between text-left mb-3 cursor-pointer"
                >
                  <span className="text-[15px] font-semibold text-[#111113] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#111113]" />
                    Prioritized Technical Findings
                  </span>
                  <span className="text-[11px] font-mono text-[#71717A] tabular-nums">
                    {audit.checks.actions.length} checks
                  </span>
                </button>
                <div className="divide-y divide-[#E5E7EB]">
                  {audit.checks.actions.map((act, i) => (
                    <div key={i} className="py-3 flex items-start gap-3">
                      {act.severity === "Critical" ? (
                        <XCircle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
                      ) : act.severity === "Warning" ? (
                        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium text-[#111113]">
                            {act.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              act.severity === "Critical"
                                ? "bg-[#FFF1F2] text-[#E11D48]"
                                : act.severity === "Warning"
                                ? "bg-amber-50 text-[#D97706]"
                                : "bg-[#ECFDF5] text-[#16A34A]"
                            }`}
                          >
                            {act.severity}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#52525B] mt-1">{act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Schema & Entity Clarity */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#111113] flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#111113]" />
                  JSON-LD &amp; Entity Clarity
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    audit.checks.llms_txt.found
                      ? "bg-[#ECFDF5] text-[#16A34A]"
                      : "bg-[#FFF1F2] text-[#E11D48]"
                  }`}
                >
                  /llms.txt: {audit.checks.llms_txt.found ? "Valid" : "Missing"}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-mono uppercase text-[#71717A] mb-2">
                  Detected JSON-LD Schemas
                </p>
                <div className="flex flex-wrap gap-2">
                  {audit.checks.html_analysis.detected_schemas.length > 0 ? (
                    audit.checks.html_analysis.detected_schemas.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#71717A]">No JSON-LD schemas found</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-mono uppercase text-[#71717A] mb-2">
                  HTML Entity Signals
                </p>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between gap-3 py-1.5 border-b border-[#E5E7EB]">
                    <span className="text-[#52525B]">&lt;title&gt;</span>
                    <span className="font-mono text-[#111113] truncate max-w-[260px]">
                      {audit.checks.html_analysis.title || "Missing"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 py-1.5 border-b border-[#E5E7EB]">
                    <span className="text-[#52525B]">&lt;h1&gt;</span>
                    <span className="font-mono text-[#111113] truncate max-w-[260px]">
                      {audit.checks.html_analysis.h1 || "Missing"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 py-1.5 border-b border-[#E5E7EB]">
                    <span className="text-[#52525B]">HTML &lt;table&gt; count</span>
                    <span className="font-mono text-[#111113] tabular-nums">
                      {audit.checks.html_analysis.table_count}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 py-1.5">
                    <span className="text-[#52525B]">Pricing markers</span>
                    <span className="font-mono text-[#111113]">
                      {audit.checks.html_analysis.has_pricing_markers ? "Detected" : "Not detected"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center">
          <p className="text-[14px] font-medium text-[#111113]">
            Click &ldquo;Run Live Technical Audit&rdquo; to inspect your domain&apos;s real AI crawlability.
          </p>
          <p className="text-[12px] text-[#71717A] mt-1">
            We fetch live <code className="font-mono">/robots.txt</code>, <code className="font-mono">/llms.txt</code>, and raw HTML without JavaScript execution.
          </p>
        </div>
      )}
    </div>
  );
};
