import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Globe, RefreshCw, XCircle } from "lucide-react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { SeoHead } from "../../components/seo/SeoHead";
import { API_BASE_URL } from "../../lib/api";

interface PublicCrawlerCheckerPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
}

const BOTS = ["OAI-SearchBot", "GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended"];

export const PublicCrawlerCheckerPage: React.FC<PublicCrawlerCheckerPageProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendOrigin}/api/public/crawl-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain_or_url: domain.trim() }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Request failed (${res.status})`);
      }
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message || "Could not inspect domain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={onOpenAuth}>
      <SeoHead
        title="Free Live AI Bot & Crawlability Checker (robots.txt + JS Trap)"
        description="Check live whether OAI-SearchBot, GPTBot, PerplexityBot, ClaudeBot, and Google-Extended can crawl your website without JS blank-page traps."
        canonicalPath="/tools/ai-crawler-checker"
        pageType="tool"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Free Tools", url: "/compare" },
          { name: "AI Crawler Checker", url: "/tools/ai-crawler-checker" },
        ]}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
        <div className="max-w-[920px] mx-auto space-y-8">
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Free Live Diagnostic Tool
            </span>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] text-[#111113]">
              Live AI Bot &amp; Crawlability Checker
            </h1>
            <p className="text-[15px] text-[#52525B]">
              Test your live <code className="font-mono">robots.txt</code>, raw HTML word count (JS-only SPA traps), <code className="font-mono">/llms.txt</code>, and JSON-LD schema in seconds.
            </p>
          </div>

          <form
            onSubmit={handleCheck}
            className="bg-[#FAFAFB] border border-[#E5E7EB] rounded-2xl p-5 flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="https://yourdomain.com"
                className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-white border border-[#E5E7EB] text-[13px] font-mono text-[#111113] focus:outline-none focus:border-[#111113]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-[#111113] text-white text-[13px] font-medium hover:bg-[#27272A] cursor-pointer disabled:opacity-60 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Live...</span>
                </>
              ) : (
                <>
                  <span>Check AI Crawlability</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[13px] text-[#E11D48]">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <span className="text-[11px] font-mono text-[#71717A]">AI Readiness Score</span>
                  <div className="text-3xl font-semibold text-[#111113] tabular-nums mt-1">
                    {result.readiness_score}/100
                  </div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <span className="text-[11px] font-mono text-[#71717A]">JS Blank-Page Trap</span>
                  <div className="mt-2 flex items-center gap-2 text-[14px] font-semibold">
                    {result.checks.html_analysis.is_js_blank_trap ? (
                      <>
                        <XCircle className="w-4 h-4 text-[#E11D48]" />
                        <span className="text-[#E11D48]">Critical Trap Detected</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                        <span className="text-[#16A34A]">
                          Passed ({result.checks.html_analysis.visible_words} words)
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <span className="text-[11px] font-mono text-[#71717A]">/llms.txt Status</span>
                  <div className="mt-2 text-[14px] font-semibold">
                    {result.checks.llms_txt.found ? (
                      <span className="text-[#16A34A]">
                        Valid ({result.checks.llms_txt.length_chars} chars)
                      </span>
                    ) : (
                      <span className="text-[#E11D48]">Missing / Invalid</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-3">
                <h2 className="text-[15px] font-semibold text-[#111113]">
                  robots.txt AI Bot Access
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BOTS.map((bot) => {
                    const st = result.checks.robots_txt.bots[bot] || "not_specified";
                    const blocked = st === "blocked";
                    return (
                      <div
                        key={bot}
                        className="p-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between"
                      >
                        <span className="font-mono text-[12px] text-[#111113]">{bot}</span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            blocked
                              ? "bg-[#FFF1F2] text-[#E11D48]"
                              : "bg-[#ECFDF5] text-[#16A34A]"
                          }`}
                        >
                          {blocked ? "Blocked" : "Allowed"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#111113] text-white rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">
                    Unlock Closed-Loop Fix Verification &amp; AI Referral Pixel
                  </h3>
                  <p className="text-[13px] text-[#A1A1AA] mt-0.5">
                    Verify fixes live, catch Brand Lies, and measure real ChatGPT &amp; Perplexity signups.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAuth("signup")}
                  className="px-4 py-2.5 rounded-lg bg-white text-[#111113] text-[13px] font-medium hover:bg-[#F4F4F5] shrink-0 cursor-pointer"
                >
                  Start Free Workspace →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
};
