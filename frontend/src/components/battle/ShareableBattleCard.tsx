import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export interface BattleEvidenceItem {
  prompt: string;
  won: boolean;
  rankLabel: string;
}

export interface ShareableBattleCardProps {
  brandA: string;
  brandB: string;
  scoreA: number;
  scoreB: number;
  avgRankA?: string;
  avgRankB?: string;
  dateLabel?: string;
  topCitedDomain?: string;
  evidence?: BattleEvidenceItem[];
}

export const ShareableBattleCard: React.FC<ShareableBattleCardProps> = ({
  brandA,
  brandB,
  scoreA,
  scoreB,
  avgRankA = "#1.2",
  avgRankB = "#4.8",
  dateLabel = "Nov 25, 2026",
  topCitedDomain = "reddit.com",
  evidence = [
    { prompt: "Best CRM for startups", won: true, rankLabel: "Won #1" },
    { prompt: "Top AI analytics tool", won: true, rankLabel: "Won #2" },
    { prompt: "Enterprise alternative", won: false, rankLabel: "Lost" },
  ],
}) => {
  const [edition, setEdition] = useState<"light" | "dark">("light");
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const aWins = scoreA >= scoreB;
  const total = Math.max(scoreA + scoreB, 1);
  const ratioA = Math.round((scoreA / total) * 100);

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        width: 1200,
        height: 630,
        backgroundColor: edition === "light" ? "#FFFFFF" : "#0B0B0D",
      });
      const link = document.createElement("a");
      link.download = `${brandA}-vs-${brandB}-citeclash-1200x630.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn("Battle card PNG export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const isDark = edition === "dark";

  const CardTemplate = ({ className = "" }: { className?: string }) => (
    <div
      className={`w-[1200px] h-[630px] flex flex-col justify-between p-12 select-none ${
        isDark
          ? "bg-[#0B0B0D] text-white border border-white/10"
          : "bg-white text-[#111113] border border-[#E5E7EB]"
      } ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header Strip */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-current/10">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? "bg-white text-[#111113]" : "bg-[#111113] text-white"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path
                d="M4 14L10 4L16 14"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 11.5H13.5"
                stroke="#16A34A"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold tracking-[-0.025em]">CiteClash</div>
          </div>
          <span
            className={`ml-2 px-3 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider ${
              isDark
                ? "bg-white/10 text-white border border-white/10"
                : "bg-[#F7F7F8] text-[#111113] border border-[#E5E7EB]"
            }`}
          >
            AI SEARCH BATTLE REPORT
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono ${
              isDark ? "text-zinc-400" : "text-[#71717A]"
            }`}
          >
            {dateLabel}
          </span>
          <div className="flex items-center gap-1.5">
            {["ChatGPT", "Perplexity", "Gemini"].map((eng) => (
              <span
                key={eng}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium ${
                  isDark
                    ? "bg-[#16161A] text-zinc-200 border border-white/10"
                    : "bg-[#F7F7F8] text-[#111113] border border-[#E5E7EB]"
                }`}
              >
                {eng}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Center Hero VS Arena */}
      <div className="my-auto py-4">
        <div className="grid grid-cols-11 gap-6 items-center">
          {/* Brand A */}
          <div
            className={`col-span-5 rounded-2xl p-7 border ${
              isDark
                ? "bg-[#121215] border-white/10"
                : "bg-[#FAFAFB] border-[#E5E7EB]"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xl font-semibold tracking-tight truncate font-mono">
                {brandA}
              </span>
              {aWins && (
                <span className="px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] border border-[#16A34A]/25 text-xs font-mono font-bold uppercase shrink-0">
                  WINNER
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-4 tabular-nums">
              <div
                className={`text-6xl font-semibold tracking-tight ${
                  aWins ? "text-[#16A34A]" : "text-[#E11D48]"
                }`}
              >
                {scoreA}%
              </div>
              <div className="text-right">
                <div
                  className={`text-[11px] font-mono uppercase ${
                    isDark ? "text-zinc-400" : "text-[#71717A]"
                  }`}
                >
                  Avg Rank
                </div>
                <div className="text-2xl font-mono font-semibold">{avgRankA}</div>
              </div>
            </div>
          </div>

          {/* Circular VS Divider */}
          <div className="col-span-1 flex justify-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-mono font-bold border ${
                isDark
                  ? "bg-[#18181C] border-white/15 text-white"
                  : "bg-white border-[#D4D4D8] text-[#111113]"
              }`}
            >
              VS
            </div>
          </div>

          {/* Brand B */}
          <div
            className={`col-span-5 rounded-2xl p-7 border ${
              isDark
                ? "bg-[#121215] border-white/10"
                : "bg-[#FAFAFB] border-[#E5E7EB]"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xl font-semibold tracking-tight truncate font-mono">
                {brandB}
              </span>
              {!aWins && (
                <span className="px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] border border-[#16A34A]/25 text-xs font-mono font-bold uppercase shrink-0">
                  WINNER
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-4 tabular-nums">
              <div
                className={`text-6xl font-semibold tracking-tight ${
                  !aWins ? "text-[#16A34A]" : "text-[#E11D48]"
                }`}
              >
                {scoreB}%
              </div>
              <div className="text-right">
                <div
                  className={`text-[11px] font-mono uppercase ${
                    isDark ? "text-zinc-400" : "text-[#71717A]"
                  }`}
                >
                  Avg Rank
                </div>
                <div className="text-2xl font-mono font-semibold">{avgRankB}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Split Head-to-Head Progress Bar */}
        <div className="mt-6">
          <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-[#E5E7EB]">
            <div
              className="h-full bg-[#16A34A]"
              style={{ width: `${ratioA}%` }}
            />
            <div
              className="h-full bg-[#E11D48]"
              style={{ width: `${100 - ratioA}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Evidence Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {evidence.slice(0, 3).map((ev, i) => (
              <div
                key={i}
                className={`flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                  isDark
                    ? "bg-[#121215] border-white/10"
                    : "bg-[#FAFAFB] border-[#E5E7EB]"
                }`}
              >
                <span className="text-xs font-medium truncate">
                  &ldquo;{ev.prompt}&rdquo;
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold shrink-0 whitespace-nowrap ${
                    ev.won
                      ? "bg-[#ECFDF5] text-[#16A34A]"
                      : "bg-[#FFF1F2] text-[#E11D48]"
                  }`}
                >
                  {ev.won ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {ev.rankLabel}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`px-3.5 py-2.5 rounded-xl border shrink-0 text-xs font-mono whitespace-nowrap ${
              isDark
                ? "bg-[#16161A] border-white/10 text-zinc-300"
                : "bg-white border-[#E5E7EB] text-[#111113]"
            }`}
          >
            Top Source: <span className="font-semibold">{topCitedDomain}</span>
          </div>
        </div>

        {/* Footer Watermark Strip */}
        <div
          className={`pt-4 border-t flex items-center justify-between text-xs font-mono ${
            isDark
              ? "border-white/10 text-zinc-400"
              : "border-[#E5E7EB] text-[#71717A]"
          }`}
        >
          <span>Audited live at CiteClash.com — Check your brand free</span>
          <span>100% Deterministic Citation Verification</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Control Bar: Light/Dark Edition Toggle + Download Retina PNG */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setEdition("light")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              edition === "light"
                ? "bg-white text-[#111113] shadow-xs border border-[#E5E7EB]"
                : "text-[#52525B] hover:text-[#111113]"
            }`}
          >
            Light Edition
          </button>
          <button
            type="button"
            onClick={() => setEdition("dark")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              edition === "dark"
                ? "bg-[#111113] text-white shadow-xs"
                : "text-[#52525B] hover:text-[#111113]"
            }`}
          >
            Carbon Dark Edition
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {exporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>
            {exporting ? "Rendering 1200×630 PNG..." : "Download Retina PNG (1200×630)"}
          </span>
        </button>
      </div>

      {/* Responsive Preview Wrapper (Scales cleanly without mobile overflow) */}
      <div className="w-full overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-[#F7F7F8] p-3 sm:p-4">
        <div className="w-full flex justify-center">
          <div className="origin-top-left sm:origin-top scale-[0.52] sm:scale-[0.72] lg:scale-[0.82] xl:scale-100 -mb-[302px] sm:-mb-[176px] lg:-mb-[113px] xl:mb-0">
            <CardTemplate className="rounded-xl shadow-sm" />
          </div>
        </div>
      </div>

      {/* Off-screen Full 1200x630 Retina Export Node */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div ref={exportRef}>
          <CardTemplate />
        </div>
      </div>
    </div>
  );
};
