import React, { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { PublicLayout } from "../layout/PublicLayout";
import { SeoSchemaHead } from "./SeoSchemaHead";

interface StandaloneLlmsGeneratorProps {
  onNavigateHome: () => void;
  onNavigate: (path: string) => void;
}

export const StandaloneLlmsGenerator: React.FC<StandaloneLlmsGeneratorProps> = ({
  onNavigate,
}) => {
  const [brandName, setBrandName] = useState("Acme Cloud");
  const [domain, setDomain] = useState("acme.com");
  const [summary, setSummary] = useState(
    "Modern developer platform for real-time analytics and automated workflows."
  );
  const [copied, setCopied] = useState(false);

  const generatedOutput = `# ${brandName}

> ${summary}

## Core Offerings
- Product Platform: https://${domain}/
- Documentation: https://${domain}/docs
- Pricing & Plans: https://${domain}/pricing
- Security & Compliance: https://${domain}/security

## Crawler Guidance
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "llms.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={() => onNavigate("/signup")}>
      <SeoSchemaHead
        title="Free llms.txt Generator for ChatGPT & Perplexity | CiteClash"
        description="Generate a clean, crawler-readable llms.txt file for your website in seconds."
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
              Free AEO Tool
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#111113]">
              Free llms.txt Generator
            </h1>
            <p className="text-sm sm:text-base text-[#52525B] mt-2">
              Create a standardized Markdown index so ChatGPT, Perplexity, and Claude read accurate facts about your product.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Form */}
            <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1.5">
                  Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm font-mono text-[#111113] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1.5">
                  One-Line Product Summary
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] outline-none"
                />
              </div>
            </div>

            {/* Right Code Preview */}
            <div className="lg:col-span-7 bg-[#FAFAFB] border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#52525B]">public/llms.txt</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
                  >
                    {copied ? (
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
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              <pre className="p-5 font-mono text-xs sm:text-sm text-[#111113] overflow-x-auto leading-relaxed">
                {generatedOutput}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
