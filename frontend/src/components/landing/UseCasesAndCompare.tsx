import React, { useState } from "react";
import { Check, Minus } from "lucide-react";

type RoleKey = "saas" | "d2c" | "agency";

export const UseCasesAndCompare: React.FC = () => {
  const [activeRole, setActiveRole] = useState<RoleKey>("saas");

  const roles: Record<
    RoleKey,
    {
      label: string;
      cards: Array<{ metric: string; title: string; desc: string }>;
    }
  > = {
    saas: {
      label: "SaaS Founders",
      cards: [
        {
          metric: "+38% Pipeline",
          title: "Capture bottom-of-funnel prompts",
          desc: "Track category queries like 'best CRM for seed startups' and verify your brand holds the #1 recommendation.",
        },
        {
          metric: "2.4x Faster",
          title: "Displace legacy incumbents",
          desc: "Identify exact third-party review pages and Reddit threads feeding competitor citations in Perplexity.",
        },
        {
          metric: "1-Click Export",
          title: "Board & pitch deck benchmarks",
          desc: "Export deterministic head-to-head Battle Cards proving category leadership across 4 major AI models.",
        },
      ],
    },
    d2c: {
      label: "D2C Brands",
      cards: [
        {
          metric: "92% Match",
          title: "Win product recommendations",
          desc: "Ensure ChatGPT Shopping and Gemini surface your products for high-intent consumer comparison prompts.",
        },
        {
          metric: "Zero JS Loss",
          title: "Deploy clean Product JSON-LD",
          desc: "Publish crawler-ready llms.txt product catalogs and FAQ schemas so AI bots read accurate pricing.",
        },
        {
          metric: "Daily Alerts",
          title: "Protect seasonal category share",
          desc: "Receive automated alerts the moment a rival brand overtakes your top buying keyword.",
        },
      ],
    },
    agency: {
      label: "SEO & Marketing Agencies",
      cards: [
        {
          metric: "$3,000/mo",
          title: "Launch high-margin GEO retainers",
          desc: "Package AI search monitoring, Reddit positioning, and schema deployment into a recurring client deliverable.",
        },
        {
          metric: "5+ Workspaces",
          title: "Isolated client environments",
          desc: "Manage separate domains, tracked prompt suites, and competitor sets from a single unified console.",
        },
        {
          metric: "White-Label",
          title: "Branded executive PDF audits",
          desc: "Generate client-ready reports featuring your agency branding with zero CiteClash watermarks.",
        },
      ],
    },
  };

  const compareRows = [
    {
      feature: "Multi-Engine Tracking (ChatGPT, Perplexity, Gemini, Llama)",
      citeclash: true,
      enterprise: true,
      legacy: false,
    },
    {
      feature: "Deterministic Regex Citation & Rank Parsing",
      citeclash: true,
      enterprise: "Partial",
      legacy: false,
    },
    {
      feature: "Reddit & Quora Thread Discovery + AI Reply Drafter",
      citeclash: true,
      enterprise: false,
      legacy: false,
    },
    {
      feature: "1-Click llms.txt & JSON-LD Schema Auto-Fixer",
      citeclash: true,
      enterprise: false,
      legacy: false,
    },
    {
      feature: "Shareable Head-to-Head Battle Cards (PNG + URL)",
      citeclash: true,
      enterprise: false,
      legacy: false,
    },
    {
      feature: "White-Label Agency PDF Reporting",
      citeclash: true,
      enterprise: true,
      legacy: "Add-on",
    },
    {
      feature: "Transparent Self-Serve Pricing",
      citeclash: "$49 – $299/mo",
      enterprise: "$200 – $500+/mo",
      legacy: "$129 – $499/mo",
    },
  ];

  const renderCell = (val: boolean | string, highlight = false) => {
    if (typeof val === "boolean") {
      return val ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ECFDF5] text-[#16A34A]">
          <Check className="w-3.5 h-3.5" />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F7F7F8] text-[#8E8E93]">
          <Minus className="w-3.5 h-3.5" />
        </span>
      );
    }
    return (
      <span
        className={`text-xs font-mono tabular-nums ${
          highlight ? "font-semibold text-[#111113]" : "text-[#64646B]"
        }`}
      >
        {val}
      </span>
    );
  };

  return (
    <section id="compare" className="w-full bg-[#F7F7F8] border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-16">
        {/* Part 1: Role Use Cases */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
                Built For Growth Teams
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
                Tailored workflows for every team.
              </h2>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-white border border-[#E5E7EB] shrink-0">
              {(Object.keys(roles) as RoleKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveRole(key)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    activeRole === key
                      ? "bg-[#111113] text-white"
                      : "text-[#64646B] hover:text-[#111113]"
                  }`}
                >
                  {roles[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {roles[activeRole].cards.map((c) => (
              <div
                key={c.title}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-semibold text-[#16A34A] bg-[#ECFDF5] inline-block px-2 py-0.5 rounded mb-4 tabular-nums">
                    {c.metric}
                  </div>
                  <h3 className="text-base font-semibold text-[#111113]">
                    {c.title}
                  </h3>
                  <p className="text-sm text-[#64646B] mt-2 leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Architectural Competitor Comparison Table */}
        <div>
          <div className="max-w-2xl mb-8">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
              Platform Comparison
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#111113]">
              CiteClash vs. Enterprise GEO &amp; Legacy SEO Suites.
            </h2>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[12px] font-mono uppercase text-[#8E8E93]">
                  <th className="py-4 px-5 w-2/5">Capability</th>
                  <th className="py-4 px-5 w-1/5 text-center border-t-2 border-t-[#111113] border-x border-[#E5E7EB] bg-[#FAFAFB] text-[#111113] font-semibold">
                    CiteClash
                  </th>
                  <th className="py-4 px-5 w-1/5 text-center">
                    Enterprise GEO
                  </th>
                  <th className="py-4 px-5 w-1/5 text-center">
                    Legacy SEO Suites
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {compareRows.map((row) => (
                  <tr key={row.feature} className="hover:bg-[#FAFAFB] transition-colors">
                    <td className="py-3.5 px-5 font-medium text-[#111113]">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-5 text-center border-x border-[#E5E7EB] bg-[#FAFAFB]">
                      {renderCell(row.citeclash, true)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {renderCell(row.enterprise)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      {renderCell(row.legacy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
