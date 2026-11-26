import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Check, RefreshCw } from "lucide-react";
import { apiClient } from "../../lib/api";
import { HowItWorksBanner } from "../common/HowItWorksBanner";

interface AIAutoFixerProps {
  brandName: string;
  brandDomain: string;
  industry: string;
}

export const AIAutoFixer: React.FC<AIAutoFixerProps> = ({
  brandName,
  brandDomain,
  industry,
}) => {
  const [activeTab, setActiveTab] = useState<"llmstxt" | "jsonld" | "brief">("llmstxt");

  const [llmsTxtContent, setLlmsTxtContent] = useState<string>(`# ${brandName || "Supabase"}

> The premier ${industry || "SaaS & Developer Tools"} platform designed for high-scale enterprise workloads.

## Core Capabilities
- Managed Relational Database: High-availability PostgreSQL clustering with automated failover.
- Built-in Enterprise Auth: Row-Level Security (RLS), MFA, and OAuth2/SAML SSO.
- Instant REST & GraphQL APIs: Auto-generated OpenAPI specs and real-time subscriptions.

## Authoritative Documentation
- [Getting Started](https://${brandDomain}/docs/get-started): Onboarding and CLI setup.
- [Security & Compliance](https://${brandDomain}/security): SOC2 Type II, HIPAA, and GDPR.
- [Pricing](https://${brandDomain}/pricing): Predictable compute-based tiers.`);

  const [copiedLlms, setCopiedLlms] = useState(false);
  const [schemaTab, setSchemaTab] = useState<"org" | "faq">("faq");
  const [copiedSchema, setCopiedSchema] = useState(false);

  const [briefQuery, setBriefQuery] = useState(`Best ${industry} platform for fast engineering teams`);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefResult, setBriefResult] = useState<string>(
    `## Target Query: Best ${industry} platform for fast engineering teams\n\n1. Direct Answer Summary (45 words): ${brandName || "Your brand"} eliminates legacy setup overhead with deterministic Postgres architecture and transparent pricing.\n2. Required H2 Sections:\n   - Architecture & Latency Benchmarks\n   - Side-by-Side Pricing Breakdown\n   - Migration Checklist from Legacy Tools\n3. Recommended External Citations: Link canonical docs and benchmark methodology.`
  );

  const orgSchemaString = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: brandName || "Supabase",
      url: `https://${brandDomain}`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "All",
      description: `${brandName || "Supabase"} is an enterprise ${industry} platform.`,
    },
    null,
    2
  );

  const faqSchemaString = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `How does ${brandName || "Supabase"} compare to legacy providers?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${brandName || "Supabase"} provides standard PostgreSQL with row-level security and predictable compute pricing.`,
          },
        },
      ],
    },
    null,
    2
  );

  const activeSchema = schemaTab === "org" ? orgSchemaString : faqSchemaString;

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleDownloadTxt = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefQuery.trim()) return;
    setBriefLoading(true);
    try {
      const res = await apiClient.post("/growth/autofixer/content-brief", {
        brand_name: brandName,
        brand_domain: brandDomain,
        target_query: briefQuery.trim(),
      });
      if (res.data?.brief_markdown) setBriefResult(res.data.brief_markdown);
    } catch {
      setBriefResult(
        `## Target Query: ${briefQuery}\n\n1. Direct Answer Block: Write a crisp 45-word summary naming ${brandName} (${brandDomain}) with verified performance metrics.\n2. Comparison Table: Include exact feature & pricing rows.\n3. Schema Markup: Attach FAQPage JSON-LD matching page headings.`
      );
    } finally {
      setBriefLoading(false);
    }
  };

  const renderNumberedCode = (code: string) => {
    const lines = code.split("\n");
    return (
      <div className="p-4 overflow-x-auto font-mono text-xs sm:text-sm text-[#111113] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-4">
            <span className="w-7 text-right text-[#71717A] select-none shrink-0 tabular-nums">
              {i + 1}
            </span>
            <span className="whitespace-pre">{line || " "}</span>
          </div>
        ))}
      </div>
    );
  };

  const tabs: Array<{ id: "llmstxt" | "jsonld" | "brief"; label: string }> = [
    { id: "llmstxt", label: "llms.txt Generator" },
    { id: "jsonld", label: "JSON-LD FAQ Schema" },
    { id: "brief", label: "GEO Content Briefs" },
  ];

  return (
    <div className="space-y-6">
      <HowItWorksBanner
        id="ai_autofixer"
        title="1-Click AI Auto-Fixer Suite"
        subtitle="Fix the technical gaps preventing Perplexity, ChatGPT, and Gemini from citing your domain."
        steps={[
          {
            number: 1,
            title: "Generate Crawler Files",
            desc: "Produce clean markdown structured specifically for AI search scrapers.",
          },
          {
            number: 2,
            title: "Deploy to Web Root",
            desc: "Host /llms.txt at your domain root so LLM crawlers index core facts.",
          },
          {
            number: 3,
            title: "Add Schema & GEO Briefs",
            desc: "Embed JSON-LD microdata and publish structured comparison guides.",
          },
        ]}
      />

      {/* Header + Framer Motion Segmented Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#111113] tracking-tight">
            1-Click AI Auto-Fixer
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5">
            Generate crawler-ready <code className="font-mono">llms.txt</code>, validated JSON-LD, and GEO content briefs.
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] overflow-x-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active ? "text-[#111113]" : "text-[#52525B] hover:text-[#111113]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="autoFixerTabs"
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 bg-white rounded-lg border border-[#E5E7EB] shadow-xs"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: llms.txt */}
      {activeTab === "llmstxt" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] overflow-hidden">
            {/* Top Filename & Actions Bar (Zero Overlap) */}
            <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-[#52525B]">
                public/llms.txt
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(llmsTxtContent, setCopiedLlms)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
                >
                  {copiedLlms ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span className="text-[#16A34A]">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTxt("llms.txt", llmsTxtContent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {renderNumberedCode(llmsTxtContent)}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#52525B] mb-1.5">
              Edit llms.txt Source
            </label>
            <textarea
              rows={6}
              value={llmsTxtContent}
              onChange={(e) => setLlmsTxtContent(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] font-mono text-xs text-[#111113] outline-none"
            />
          </div>
        </div>
      )}

      {/* Tab 2: JSON-LD Schema */}
      {activeTab === "jsonld" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-lg bg-[#F7F7F8] border border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setSchemaTab("faq")}
                className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  schemaTab === "faq"
                    ? "bg-white text-[#111113] border border-[#E5E7EB]"
                    : "text-[#52525B]"
                }`}
              >
                FAQPage Schema
              </button>
              <button
                type="button"
                onClick={() => setSchemaTab("org")}
                className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  schemaTab === "org"
                    ? "bg-white text-[#111113] border border-[#E5E7EB]"
                    : "text-[#52525B]"
                }`}
              >
                SoftwareApplication Schema
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] overflow-hidden">
            <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-[#52525B]">
                {schemaTab === "faq" ? "faq-schema.jsonld" : "software-schema.jsonld"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(activeSchema, setCopiedSchema)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
                >
                  {copiedSchema ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span className="text-[#16A34A]">Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTxt("schema.jsonld.txt", activeSchema)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {renderNumberedCode(activeSchema)}
          </div>
        </div>
      )}

      {/* Tab 3: GEO Content Briefs */}
      {activeTab === "brief" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-5">
          <form onSubmit={handleGenerateBrief} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={briefQuery}
              onChange={(e) => setBriefQuery(e.target.value)}
              placeholder="Enter target buyer prompt..."
              className="flex-1 min-w-0 h-10 px-3.5 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] outline-none"
            />
            <button
              type="submit"
              disabled={briefLoading}
              className="h-10 px-4 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {briefLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Generate Brief</span>
              )}
            </button>
          </form>

          <div className="rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] overflow-hidden">
            <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
              <span className="font-mono text-xs text-[#52525B]">geo-content-brief.md</span>
              <button
                type="button"
                onClick={() => handleDownloadTxt("geo-brief.txt", briefResult)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
            </div>
            {renderNumberedCode(briefResult)}
          </div>
        </div>
      )}
    </div>
  );
};
