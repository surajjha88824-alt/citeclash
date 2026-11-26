import React, { useState } from "react";
import jsPDF from "jspdf";
import { Download, Lock, Upload, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { HowItWorksBanner } from "../common/HowItWorksBanner";

interface WhiteLabelReportExporterProps {
  currentPlan: string;
  brandDomain: string;
  competitorDomain: string;
}

const previewMetrics = [
  { engine: "ChatGPT", score: 88 },
  { engine: "Perplexity", score: 84 },
  { engine: "Gemini", score: 77 },
  { engine: "Llama", score: 81 },
];

export const WhiteLabelReportExporter: React.FC<WhiteLabelReportExporterProps> = ({
  currentPlan,
  brandDomain,
  competitorDomain,
}) => {
  const [isAgencyTier, setIsAgencyTier] = useState<boolean>(
    currentPlan?.toLowerCase() === "agency"
  );
  const [agencyName, setAgencyName] = useState("Apex Horizon Digital");
  const [workspaceSel, setWorkspaceSel] = useState(brandDomain);
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [accentColor, setAccentColor] = useState("#111113");
  const [logoName, setLogoName] = useState("agency-logo.svg");
  const [isExporting, setIsExporting] = useState(false);

  const colors = [
    { name: "Ink Black", hex: "#111113" },
    { name: "Signal Emerald", hex: "#16A34A" },
    { name: "Indigo", hex: "#4F46E5" },
    { name: "Amber", hex: "#D97706" },
  ];

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      doc.setFillColor(17, 17, 19);
      doc.rect(0, 0, 210, 40, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(agencyName.toUpperCase(), 15, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(161, 161, 170);
      doc.text(`EXECUTIVE GEO REPORT • ${dateRange.toUpperCase()}`, 15, 27);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 17, 19);
      doc.text("AI Search Visibility & Citation Audit", 15, 58);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(82, 82, 91);
      doc.text(`Target: ${workspaceSel}  |  Competitor: ${competitorDomain}`, 15, 66);

      doc.setFillColor(247, 247, 248);
      doc.roundedRect(15, 78, 180, 42, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(22, 163, 74);
      doc.text("84.2%", 25, 100);
      doc.setFontSize(9);
      doc.setTextColor(82, 82, 91);
      doc.text(`${workspaceSel} Visibility`, 25, 108);

      doc.setFontSize(22);
      doc.setTextColor(225, 29, 72);
      doc.text("41.8%", 105, 100);
      doc.setFontSize(9);
      doc.setTextColor(82, 82, 91);
      doc.text(`${competitorDomain} Visibility`, 105, 108);

      doc.save(`${workspaceSel}-white-label-geo-report.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <HowItWorksBanner
        id="white_label_reports"
        title="White-Label Agency PDF Studio"
        subtitle="Generate client-ready A4 executive audit decks with your agency logo and zero CiteClash branding."
        steps={[
          {
            number: 1,
            title: "Brand Your Report",
            desc: "Upload your agency logo, set your accent color, and pick the workspace.",
          },
          {
            number: 2,
            title: "Live A4 Preview",
            desc: "Verify scores, engine charts, and competitor benchmarks in real time.",
          },
          {
            number: 3,
            title: "Download Branded PDF",
            desc: "Export crisp A4 PDFs ready to attach to monthly client retainer updates.",
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#111113] tracking-tight">
            White-Label PDF Reports
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5">
            Customize and export branded client deliverables.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAgencyTier(!isAgencyTier)}
          className="px-3.5 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
        >
          {isAgencyTier ? "Preview Locked State" : "Preview Agency Unlocked"}
        </button>
      </div>

      {/* 2-Column Layout with Inline Frosted Lock for Non-Agency */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 cols: Agency Customization Form */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#111113] mb-1.5">
              Agency Name
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111113] mb-1.5">
              Upload Agency Logo
            </label>
            <label className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FAFAFB] border border-dashed border-[#D4D4D8] hover:border-[#111113] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5 text-xs text-[#52525B] min-w-0">
                <Upload className="w-4 h-4 text-[#111113] shrink-0" />
                <span className="truncate font-mono">{logoName}</span>
              </div>
              <span className="text-[11px] font-medium text-[#111113] shrink-0">
                Choose File
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setLogoName(file.name);
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111113] mb-1.5">
                Workspace
              </label>
              <select
                value={workspaceSel}
                onChange={(e) => setWorkspaceSel(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
              >
                <option value={brandDomain}>{brandDomain}</option>
                <option value="linear.app">linear.app</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111113] mb-1.5">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 90 Days">Last 90 Days</option>
                <option value="Q4 2026">Q4 2026</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111113] mb-2">
              Brand Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                    accentColor === c.hex
                      ? "border-[#111113] bg-[#FAFAFB] text-[#111113]"
                      : "border-[#E5E7EB] bg-white text-[#52525B]"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting || !isAgencyTier}
            className="w-full h-11 px-4 rounded-xl bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-xs font-medium inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Generate Branded PDF</span>
          </button>
        </div>

        {/* Right 7 cols: Live A4 White Paper Report Preview */}
        <div className="lg:col-span-7 bg-[#FAFAFB] border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 flex justify-center">
          <div className="w-full max-w-[540px] bg-white border border-[#E5E7EB] rounded-xl shadow-[0_18px_40px_-20px_rgba(0,0,0,0.1)] p-6 sm:p-8 space-y-6">
            {/* A4 Header */}
            <div
              className="pb-4 border-b-2 flex items-center justify-between gap-3"
              style={{ borderColor: accentColor }}
            >
              <div>
                <div className="text-sm font-semibold text-[#111113] tracking-tight">
                  {agencyName}
                </div>
                <div className="text-[10px] font-mono uppercase text-[#71717A] mt-0.5">
                  AI Search Executive Audit • {dateRange}
                </div>
              </div>
              <span
                className="px-2.5 py-1 rounded text-[10px] font-mono font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                CONFIDENTIAL
              </span>
            </div>

            {/* Client Title */}
            <div>
              <h3 className="text-lg font-semibold text-[#111113]">
                {workspaceSel} vs {competitorDomain}
              </h3>
              <p className="text-xs text-[#52525B] mt-1">
                Deterministic citation benchmark across ChatGPT, Perplexity, Gemini, and Llama 3.3.
              </p>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-2 gap-3 tabular-nums">
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20">
                <div className="text-[10px] font-mono uppercase text-[#16A34A]">
                  {workspaceSel}
                </div>
                <div className="text-2xl font-semibold text-[#16A34A] mt-1">84.2%</div>
              </div>
              <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#E11D48]/20">
                <div className="text-[10px] font-mono uppercase text-[#E11D48]">
                  {competitorDomain}
                </div>
                <div className="text-2xl font-semibold text-[#E11D48] mt-1">41.8%</div>
              </div>
            </div>

            {/* Engine Chart */}
            <div className="border border-[#E5E7EB] rounded-xl p-4">
              <div className="text-xs font-semibold text-[#111113] mb-3">
                Visibility by AI Engine
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={previewMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="engine" tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#71717A" }} axisLine={false} tickLine={false} width={28} />
                    <Bar dataKey="score" fill={accentColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Frosted-White Upgrade Lock for Non-Agency */}
        {!isAgencyTier && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E5E7EB] flex items-center justify-center p-6">
            <div className="max-w-md bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center shadow-xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] text-[#111113] flex items-center justify-center mx-auto">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#111113]">
                  Agency White-Label Reports Locked
                </h3>
                <p className="text-xs text-[#52525B] mt-1 leading-relaxed">
                  Upgrade to the Agency Plan ($299/mo) to export custom-branded A4 PDFs for up to 5 client workspaces.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAgencyTier(true)}
                className="px-4 py-2 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium cursor-pointer"
              >
                Preview Agency Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
