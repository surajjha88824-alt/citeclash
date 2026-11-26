import React, { useState } from "react";
import { Check, Minus, Copy, ArrowRight } from "lucide-react";

interface PlanBenefitsGuideHubProps {
  currentPlan: string;
  onUpgradeClick: (targetTier?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const PlanBenefitsGuideHub: React.FC<PlanBenefitsGuideHubProps> = ({
  currentPlan,
  onUpgradeClick,
  onNavigateTab,
}) => {
  const [platformTab, setPlatformTab] = useState<"nextjs" | "wordpress" | "shopify" | "static">("nextjs");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const platformSnippets: Record<
    "nextjs" | "wordpress" | "shopify" | "static",
    { title: string; path: string; code: string; steps: string[] }
  > = {
    nextjs: {
      title: "Next.js / Vercel",
      path: "public/llms.txt",
      code: `# Place generated llms.txt inside /public/llms.txt\n# Accessible automatically at https://yourdomain.com/llms.txt\n\nUser-agent: OAI-SearchBot\nAllow: /llms.txt`,
      steps: [
        "Download llms.txt from the 1-Click AI Auto-Fixer tab.",
        "Save the file at public/llms.txt in your Next.js repository.",
        "Deploy to Vercel and verify https://yourdomain.com/llms.txt returns 200 OK.",
      ],
    },
    wordpress: {
      title: "WordPress",
      path: "/wp-content/uploads/llms.txt or root",
      code: `# Option 1: Upload llms.txt to your WordPress root via File Manager / SFTP\n# Option 2: Add rewrite rule in .htaccess\nRewriteRule ^llms\\.txt$ /wp-content/uploads/llms.txt [L]`,
      steps: [
        "Download llms.txt from Auto-Fixer.",
        "Upload to your public_html root directory via cPanel or SFTP.",
        "Verify Yoast/RankMath does not block OAI-SearchBot or PerplexityBot.",
      ],
    },
    shopify: {
      title: "Shopify",
      path: "Online Store > Pages / Redirects",
      code: `<!-- Add Organization & Product JSON-LD in theme.liquid <head> -->\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Brand"\n}\n</script>`,
      steps: [
        "Copy the JSON-LD Schema from Auto-Fixer.",
        "Paste into Online Store → Themes → Edit code → theme.liquid before </head>.",
        "Host llms.txt via Shopify URL redirect or Cloudflare Worker.",
      ],
    },
    static: {
      title: "Static HTML / Nginx",
      path: "/var/www/html/llms.txt",
      code: `location = /llms.txt {\n  default_type text/plain;\n  add_header Cache-Control "public, max-age=3600";\n}`,
      steps: [
        "Copy llms.txt directly to your static web root.",
        "Ensure Content-Type is served as text/plain; charset=utf-8.",
      ],
    },
  };

  const matrix = [
    { feature: "Monthly High-Intent Prompts", free: "2", starter: "15", growth: "50", agency: "200" },
    { feature: "AI Search Engines", free: "1 (ChatGPT)", starter: "2", growth: "All 4", agency: "All 4" },
    { feature: "Reddit & Quora Hijacker", free: "3 credits", starter: "10/mo", growth: "Unlimited", agency: "Unlimited" },
    { feature: "1-Click llms.txt & Schema", free: true, starter: true, growth: true, agency: true },
    { feature: "White-Label A4 PDF Reports", free: false, starter: false, growth: false, agency: true },
    { feature: "Workspaces", free: "1", starter: "1", growth: "1", agency: "5" },
  ];

  const activeSnippet = platformSnippets[platformTab];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sticky Left Mini-TOC */}
      <aside className="lg:col-span-3 lg:sticky lg:top-24 bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] px-2">
          Documentation
        </div>
        {[
          { label: "01. Active Plan Matrix", href: "#plan-matrix" },
          { label: "02. Platform Setup", href: "#platform-setup" },
          { label: "03. Quick Actions", href: "#quick-actions" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#52525B] hover:text-[#111113] hover:bg-[#F7F7F8] transition-colors"
          >
            {item.label}
          </a>
        ))}
      </aside>

      {/* Main Content */}
      <div className="lg:col-span-9 space-y-6">
        {/* Header */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Current Subscription: {currentPlan.toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold text-[#111113] mt-0.5">
              User Guide &amp; Plan Playbooks
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onUpgradeClick()}
            className="px-4 py-2 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>

        {/* 1. Active Plan Benefits Matrix */}
        <div id="plan-matrix" className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <h3 className="text-base font-semibold text-[#111113] mb-4">
            Plan Benefits Matrix
          </h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs tabular-nums">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#71717A] font-mono uppercase">
                  <th className="py-3 px-3 whitespace-nowrap">Feature</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Free</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Starter</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Growth</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {matrix.map((row) => (
                  <tr key={row.feature} className="hover:bg-[#FAFAFB]">
                    <td className="py-3 px-3 font-medium text-[#111113]">{row.feature}</td>
                    {[row.free, row.starter, row.growth, row.agency].map((val, idx) => (
                      <td key={idx} className="py-3 px-3 text-center font-mono text-[#52525B] whitespace-nowrap">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-4 h-4 text-[#16A34A] mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-[#D4D4D8] mx-auto" />
                          )
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Platform Setup Cards */}
        <div id="platform-setup" className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#111113]">
              Platform Deployment Guides
            </h3>
            <div className="inline-flex p-1 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] flex-wrap">
              {(["nextjs", "wordpress", "shopify", "static"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformTab(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    platformTab === p
                      ? "bg-white text-[#111113] border border-[#E5E7EB] shadow-xs"
                      : "text-[#52525B] hover:text-[#111113]"
                  }`}
                >
                  {platformSnippets[p].title}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#52525B]">{activeSnippet.path}</span>
              <button
                type="button"
                onClick={() => copyText(activeSnippet.code, platformTab)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
              >
                {copiedKey === platformTab ? (
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
            </div>

            <pre className="p-3.5 rounded-lg bg-white border border-[#E5E7EB] font-mono text-xs text-[#111113] overflow-x-auto leading-relaxed">
              {activeSnippet.code}
            </pre>

            <ol className="space-y-1.5 text-xs text-[#52525B] list-decimal list-inside">
              {activeSnippet.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* 3. Quick Actions */}
        <div id="quick-actions" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab("autofix")}
            className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#111113] text-left flex items-center justify-between transition-colors cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-[#111113]">Open AI Auto-Fixer</div>
              <div className="text-xs text-[#52525B] mt-0.5">Generate llms.txt &amp; JSON-LD</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#111113]" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("reddit")}
            className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#111113] text-left flex items-center justify-between transition-colors cursor-pointer"
          >
            <div>
              <div className="text-sm font-semibold text-[#111113]">Open Reddit Hijacker</div>
              <div className="text-xs text-[#52525B] mt-0.5">Draft natural community replies</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#111113]" />
          </button>
        </div>
      </div>
    </div>
  );
};
