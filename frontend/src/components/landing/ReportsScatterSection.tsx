import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const scatterBrands = [
  { name: "Linear", visibility: 74.2, sentiment: 89, z: 420, color: "#16A34A", pos: "1.2" },
  { name: "Attio", visibility: 58.6, sentiment: 82, z: 340, color: "#4F46E5", pos: "2.1" },
  { name: "HubSpot", visibility: 41.0, sentiment: 64, z: 260, color: "#D97706", pos: "2.9" },
  { name: "Jira", visibility: 34.8, sentiment: 48, z: 220, color: "#E11D48", pos: "3.6" },
];

export const ReportsScatterSection: React.FC = () => {
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = (type: string) => {
    setExportNotice(`${type} prepared for download`);
    setTimeout(() => setExportNotice(null), 2500);
  };

  return (
    <section id="reports" className="w-full bg-[#F7F7F8] border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
              Executive Reporting
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
              Create powerful reports.
            </h2>
            <p className="mt-3 text-[15px] text-[#64646B] leading-relaxed">
              Plot brand visibility against AI sentiment to brief leadership or export white-label client audits in one click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {exportNotice && (
              <span className="text-xs font-mono text-[#16A34A] mr-2">
                {exportNotice}
              </span>
            )}
            <button
              onClick={() => handleExport("CSV Data")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#111113] text-[13px] font-medium text-[#111113] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport("White-Label PDF")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111113] text-white text-[13px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#222226] active:scale-[0.98] transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>White-Label PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 8 cols: Visibility vs Sentiment Scatter Plot */}
          <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[#111113]">
                  Visibility vs. Sentiment Matrix
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Top-right quadrant indicates category citation leadership
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#8E8E93]">ALL ENGINES</span>
            </div>

            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 15, right: 20, bottom: 15, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    dataKey="visibility"
                    name="Visibility"
                    domain={[25, 85]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "#8E8E93" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="sentiment"
                    name="Sentiment"
                    domain={[40, 100]}
                    tickFormatter={(v) => `${v}`}
                    tick={{ fontSize: 11, fill: "#8E8E93" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <ZAxis type="number" dataKey="z" range={[180, 500]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3", stroke: "#D4D4D8" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 shadow-lg text-xs tabular-nums">
                          <div className="font-semibold text-[#111113] flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </div>
                          <div className="text-[#64646B]">Visibility: <span className="text-[#111113] font-medium">{d.visibility}%</span></div>
                          <div className="text-[#64646B]">Sentiment: <span className="text-[#111113] font-medium">{d.sentiment}/100</span></div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterBrands}>
                    {scatterBrands.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} fillOpacity={0.88} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right 4 cols: Hairline Brand Summary Cards */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3">
            {scatterBrands.map((b) => (
              <div
                key={b.name}
                className="bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between tabular-nums"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#111113]">{b.name}</div>
                    <div className="text-[11px] font-mono text-[#8E8E93]">
                      Avg Pos #{b.pos}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[#111113]">{b.visibility}%</div>
                  <div className="text-[11px] text-[#64646B]">Sentiment {b.sentiment}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
