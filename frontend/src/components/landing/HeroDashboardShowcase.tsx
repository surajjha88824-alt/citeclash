import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Download,
  Lock,
  Calendar,
  ExternalLink,
  RefreshCw,
  LayoutDashboard,
  Swords,
  Terminal,
  Target,
  MessageSquare,
  GitCompare,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Settings,
  Search,
  TrendingUp,
  BarChart2,
  Globe,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toPng } from "html-to-image";
import { BrandSticker } from "./BrandStickers";

interface HeroDashboardShowcaseProps {
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenApp?: () => void;
}

type SidebarTab =
  | "Overview"
  | "Battle Card"
  | "Prompts"
  | "Citation Gaps"
  | "Reddit Hijacker"
  | "Page Diff"
  | "Fix Tracker"
  | "Brand Guard"
  | "AI Traffic"
  | "Settings";

type ModelFilter = "All Models" | "ChatGPT" | "Perplexity" | "Gemini";

const chartDataByModel: Record<
  ModelFilter,
  Array<{ date: string; linear: number; attio: number; hubspot: number; jira: number }>
> = {
  "All Models": [
    { date: "Nov 01", linear: 62.4, attio: 51.0, hubspot: 43.2, jira: 39.4 },
    { date: "Nov 06", linear: 64.8, attio: 52.8, hubspot: 42.5, jira: 38.1 },
    { date: "Nov 11", linear: 67.5, attio: 54.4, hubspot: 42.0, jira: 37.2 },
    { date: "Nov 16", linear: 69.9, attio: 56.1, hubspot: 41.6, jira: 36.0 },
    { date: "Nov 21", linear: 72.1, attio: 57.5, hubspot: 41.2, jira: 35.4 },
    { date: "Nov 25", linear: 74.2, attio: 58.6, hubspot: 41.0, jira: 34.8 },
  ],
  ChatGPT: [
    { date: "Nov 01", linear: 66.0, attio: 49.2, hubspot: 44.0, jira: 36.0 },
    { date: "Nov 06", linear: 68.5, attio: 50.8, hubspot: 43.2, jira: 35.1 },
    { date: "Nov 11", linear: 71.2, attio: 53.0, hubspot: 42.6, jira: 34.2 },
    { date: "Nov 16", linear: 73.4, attio: 54.5, hubspot: 42.1, jira: 33.4 },
    { date: "Nov 21", linear: 76.0, attio: 56.0, hubspot: 41.4, jira: 32.9 },
    { date: "Nov 25", linear: 78.4, attio: 57.2, hubspot: 40.8, jira: 32.1 },
  ],
  Perplexity: [
    { date: "Nov 01", linear: 68.2, attio: 55.4, hubspot: 39.8, jira: 37.0 },
    { date: "Nov 06", linear: 70.1, attio: 56.9, hubspot: 39.2, jira: 36.4 },
    { date: "Nov 11", linear: 72.8, attio: 58.1, hubspot: 38.7, jira: 35.2 },
    { date: "Nov 16", linear: 75.0, attio: 59.8, hubspot: 38.4, jira: 34.6 },
    { date: "Nov 21", linear: 77.2, attio: 61.2, hubspot: 38.0, jira: 33.9 },
    { date: "Nov 25", linear: 79.6, attio: 62.4, hubspot: 37.6, jira: 33.1 },
  ],
  Gemini: [
    { date: "Nov 01", linear: 53.0, attio: 48.4, hubspot: 45.8, jira: 45.2 },
    { date: "Nov 06", linear: 55.8, attio: 50.7, hubspot: 45.1, jira: 42.8 },
    { date: "Nov 11", linear: 58.5, attio: 52.1, hubspot: 44.7, jira: 42.2 },
    { date: "Nov 16", linear: 61.3, attio: 54.0, hubspot: 44.3, jira: 40.0 },
    { date: "Nov 21", linear: 63.1, attio: 55.3, hubspot: 44.2, jira: 39.4 },
    { date: "Nov 25", linear: 64.6, attio: 56.2, hubspot: 44.6, jira: 39.2 },
  ],
};

const rankingRows = [
  { rank: "1", brand: "Linear", color: "#3B82F6", share: "74.2%", sentiment: 89, pos: "1.4", delta: "+0.3", positive: true },
  { rank: "2", brand: "Attio", color: "#EF4444", share: "58.6%", sentiment: 82, pos: "2.1", delta: "+0.2", positive: true },
  { rank: "3", brand: "HubSpot", color: "#F59E0B", share: "41.0%", sentiment: 76, pos: "3.4", delta: "-0.2", positive: false },
  { rank: "4", brand: "Jira", color: "#10B981", share: "34.8%", sentiment: 68, pos: "3.9", delta: "-0.4", positive: false },
];

const domainSourceRows = [
  { domain: "reddit.com", type: "UGC", badgeCls: "bg-blue-50 text-blue-700 border-blue-200", used: "34%", avg: "41%" },
  { domain: "g2.com", type: "Review", badgeCls: "bg-purple-50 text-purple-700 border-purple-200", used: "28%", avg: "33%" },
  { domain: "techradar.com", type: "Editorial", badgeCls: "bg-amber-50 text-amber-700 border-amber-200", used: "24%", avg: "20%" },
  { domain: "youtube.com", type: "Video", badgeCls: "bg-rose-50 text-rose-700 border-rose-200", used: "19%", avg: "16%" },
];

export const HeroDashboardShowcase: React.FC<HeroDashboardShowcaseProps> = ({
  onOpenAuth,
  onOpenApp,
}) => {
  const [yourDomain, setYourDomain] = useState("linear.app");
  const [compDomain, setCompDomain] = useState("jira.atlassian.com");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("Overview");
  const [modelFilter, setModelFilter] = useState<ModelFilter>("All Models");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [metricTab, setMetricTab] = useState<"Visibility" | "Sentiment" | "Position">("Visibility");
  const [sourceTab, setSourceTab] = useState<"Domains" | "URLs">("Domains");
  const [isChartHovered, setIsChartHovered] = useState(false);

  // Battle Mode States
  const [battleState, setBattleState] = useState<"idle" | "scanning" | "completed">("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLabel, setScanLabel] = useState("Generating high-intent buyer prompts...");
  const [isExporting, setIsExporting] = useState(false);

  const scorecardRef = useRef<HTMLDivElement>(null);

  const runLiveBattle = (brand = yourDomain, rival = compDomain) => {
    if (!brand.trim() || !rival.trim()) return;
    setSidebarTab("Battle Card");
    setBattleState("scanning");
    setScanProgress(18);
    setScanLabel(`Querying ChatGPT, Perplexity & Gemini for ${brand}...`);

    setTimeout(() => {
      setScanProgress(56);
      setScanLabel(`Cross-checking citation URLs against ${rival}...`);
    }, 850);

    setTimeout(() => {
      setScanProgress(92);
      setScanLabel("Computing deterministic regex rankings...");
    }, 1700);

    setTimeout(() => {
      setScanProgress(100);
      setBattleState("completed");
    }, 2400);
  };

  useEffect(() => {
    const onTrigger = () => {
      runLiveBattle();
    };
    window.addEventListener("citeclash-run-battle", onTrigger);
    return () => window.removeEventListener("citeclash-run-battle", onTrigger);
  });

  const handleDownloadPng = async () => {
    if (!scorecardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(scorecardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
      });
      const link = document.createElement("a");
      link.download = `${yourDomain}-vs-${compDomain}-battle-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn("PNG export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const activeData = chartDataByModel[modelFilter];

  return (
    <section
      id="hero-scanner"
      className="w-full pt-16 bg-[linear-gradient(180deg,#EAEFF5_0%,#F6F8FB_28%,#FFFFFF_62%)] border-b border-[#E5E7EB] relative"
    >
      {/* Top Centered Hero Block */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-[13px] font-medium text-[#6B7280] tracking-[0.02em] mb-3"
        >
          AI Search Intelligence
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="text-[36px] sm:text-[44px] lg:text-[50px] xl:text-[54px] font-bold text-[#111113] tracking-[-0.035em] leading-[1.08] max-w-none mx-auto lg:whitespace-nowrap"
        >
          Outrank your competitors inside AI search.
        </motion.h1>

        {/* Engine Pill Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="bg-white border border-[#D4D4D8] rounded-full px-5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] inline-flex items-center gap-2.5 text-[16px] sm:text-[18px] font-medium text-[#111113]">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#111113]" aria-hidden="true">
              <path
                d="M12 2.5a4.5 4.5 0 0 1 3.9 2.25 4.5 4.5 0 0 1 3.35 6.45 4.5 4.5 0 0 1-1.6 6.2 4.5 4.5 0 0 1-6.55 2.1A4.5 4.5 0 0 1 5.1 17.4a4.5 4.5 0 0 1-1.35-6.2A4.5 4.5 0 0 1 8.1 4.75 4.5 4.5 0 0 1 12 2.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <span>ChatGPT</span>
          </span>

          <span className="bg-white border border-[#D4D4D8] rounded-full px-5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] inline-flex items-center gap-2.5 text-[16px] sm:text-[18px] font-medium text-[#111113]">
            <span className="bg-[#111113] text-white p-1 rounded-md inline-flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
                <path
                  d="M12 3v18M4.5 7.5 12 12l7.5-4.5M4.5 16.5 12 12l7.5 4.5M6 4.5h12v15H6z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Perplexity</span>
          </span>

          <span className="bg-white border border-[#D4D4D8] rounded-full px-5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] inline-flex items-center gap-2.5 text-[16px] sm:text-[18px] font-medium text-[#111113]">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#4F7CFF]" aria-hidden="true">
              <path
                d="M12 2.5C12.9 7.8 16.2 11.1 21.5 12c-5.3.9-8.6 4.2-9.5 9.5-.9-5.3-4.2-8.6-9.5-9.5 5.3-.9 8.6-4.2 9.5-9.5Z"
                fill="currentColor"
              />
            </svg>
            <span>Gemini</span>
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[680px] mx-auto mt-5 text-[16px] sm:text-[17px] text-[#52525B] leading-[1.55]"
        >
          Track exact brand citations across ChatGPT, Perplexity, and Gemini, uncover the sources shaping answers, and fix visibility gaps before buyers choose your rivals.
        </motion.p>

        {/* Sharper Double-Bordered VS Input Bar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-[700px] mx-auto p-1.5 rounded-[18px] bg-white/80 border border-[#CBD5E1] shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
        >
          <div className="bg-white border border-[#E2E8F0] rounded-[13px] p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={yourDomain}
              onChange={(e) => setYourDomain(e.target.value)}
              placeholder="linear.app"
              aria-label="Your domain"
              className="font-mono text-[14px] text-[#111113] placeholder:text-[#9CA3AF] px-3 py-2.5 flex-1 bg-transparent focus:outline-none min-w-0"
            />

            <span className="text-[11px] font-mono font-semibold text-[#6B7280] bg-[#F4F4F5] border border-[#E4E4E7] px-2 py-0.5 rounded-md self-center shrink-0 select-none">
              VS
            </span>

            <input
              type="text"
              value={compDomain}
              onChange={(e) => setCompDomain(e.target.value)}
              placeholder="jira.atlassian.com"
              aria-label="Competitor domain"
              className="font-mono text-[14px] text-[#111113] placeholder:text-[#9CA3AF] px-3 py-2.5 flex-1 bg-transparent focus:outline-none min-w-0"
            />

            <button
              onClick={() => runLiveBattle()}
              className="group w-full sm:w-auto bg-[#111113] hover:bg-[#27272A] text-white text-[14px] font-medium px-5 py-2.5 rounded-[10px] transition-all active:scale-[0.98] whitespace-nowrap inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Run Free Battle</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Quick-Try Sample Links */}
        <div className="mt-2.5 text-[12px] text-[#71717A] flex flex-wrap items-center justify-center gap-3">
          <span>Try</span>
          {[
            { label: "Linear vs Jira", a: "linear.app", b: "jira.atlassian.com" },
            { label: "Notion vs ClickUp", a: "notion.so", b: "clickup.com" },
          ].map((pair) => (
            <button
              key={pair.label}
              onClick={() => {
                setYourDomain(pair.a);
                setCompDomain(pair.b);
                runLiveBattle(pair.a, pair.b);
              }}
              className="text-[#52525B] hover:text-[#111113] underline underline-offset-4 decoration-[#D4D4D8] hover:decoration-[#111113] transition-colors cursor-pointer"
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full-Width Interactive Product Dashboard Panel (Seamless 1px Hairline Shell) */}
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 sm:mt-8 rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)] overflow-hidden relative flex flex-col lg:flex-row"
        >
          {/* Compact Iconized Sidebar */}
          <aside className="w-[195px] hidden lg:flex flex-col justify-between shrink-0 bg-[#FAFAFA] border-r border-[#E5E7EB] py-3">
            <div>
              {/* Top Workspace Switcher + Quick Actions */}
              <div className="px-3 space-y-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#EFEFF1] transition-colors">
                  <span className="w-5 h-5 rounded-md bg-[#111113] text-white text-[10px] font-mono font-bold inline-flex items-center justify-center shrink-0">
                    C
                  </span>
                  <span className="text-[13px] font-semibold text-[#111113] truncate">
                    CiteClash Console
                  </span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white border border-[#E5E7EB] text-[11.5px] text-[#9CA3AF]">
                  <span className="inline-flex items-center gap-1.5">
                    <Search className="w-3 h-3" />
                    <span>Quick Actions</span>
                  </span>
                  <kbd className="font-mono text-[10px] text-[#9CA3AF]">⌘K</kbd>
                </div>
              </div>

              {/* Categorized Sidebar Groups */}
              {[
                {
                  title: "General",
                  items: [
                    { id: "Overview" as SidebarTab, icon: LayoutDashboard },
                    { id: "Battle Card" as SidebarTab, icon: Swords },
                    { id: "Prompts" as SidebarTab, icon: Terminal },
                  ],
                },
                {
                  title: "Growth",
                  items: [
                    { id: "Citation Gaps" as SidebarTab, icon: Target },
                    { id: "Reddit Hijacker" as SidebarTab, icon: MessageSquare },
                    { id: "Page Diff" as SidebarTab, icon: GitCompare },
                  ],
                },
                {
                  title: "Proof",
                  items: [
                    { id: "Fix Tracker" as SidebarTab, icon: CheckCircle2 },
                    { id: "Brand Guard" as SidebarTab, icon: ShieldAlert },
                    { id: "AI Traffic" as SidebarTab, icon: Activity },
                  ],
                },
              ].map((grp) => (
                <div key={grp.title}>
                  <div className="text-[10px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium px-3 mt-4 mb-1">
                    {grp.title}
                  </div>
                  <nav className="px-2 space-y-0.5">
                    {grp.items.map((item) => {
                      const Icon = item.icon;
                      const active = sidebarTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSidebarTab(item.id);
                            if (item.id === "Battle Card" && battleState === "idle") {
                              setBattleState("completed");
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors cursor-pointer ${
                            active
                              ? "bg-[#EFEFF1] text-[#111113] font-medium"
                              : "text-[#52525B] hover:text-[#111113] hover:bg-[#F3F4F6]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.id}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {/* Bottom Pinned Settings */}
            <div className="px-2 pt-3 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => (onOpenApp ? onOpenApp() : onOpenAuth("signup"))}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] text-[#52525B] hover:text-[#111113] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>Settings</span>
              </button>
            </div>
          </aside>

          {/* Main Dashboard Content Area */}
          <div className="flex-1 min-w-0 bg-white flex flex-col relative">
            {/* Row 1: Top Toolbar */}
            <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="bg-white border border-[#E5E7EB] rounded-md px-2.5 py-1 text-[#3F3F46] inline-flex items-center gap-1.5 font-medium">
                  <Globe className="w-3 h-3 text-[#71717A]" />
                  <span>Linear.app</span>
                </span>
                <span className="bg-white border border-[#E5E7EB] rounded-md px-2.5 py-1 text-[#3F3F46] inline-flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#71717A]" />
                  <span>Last 30 days</span>
                </span>
                <div className="inline-flex flex-wrap items-center gap-1">
                  {(["All Models", "ChatGPT", "Perplexity", "Gemini"] as ModelFilter[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModelFilter(m)}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer ${
                        modelFilter === m
                          ? "bg-[#111113] text-white"
                          : "bg-white border border-[#E5E7EB] text-[#3F3F46] hover:border-[#111113]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="bg-white border border-[#E5E7EB] hover:border-[#111113] rounded-md px-2.5 py-1 text-[#111113] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>

            {/* Row 2: Live KPI Sub-Header */}
            <div className="px-4 py-2 bg-[#FCFCFD] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="text-[#52525B]">
                <span className="font-medium text-[#111113]">Overview</span> • Linear visibility trending up{" "}
                <span className="text-[#16A34A] font-medium tabular-nums">+4.1%</span> this month
              </div>
              <div className="tabular-nums flex flex-wrap items-center gap-3 text-[#52525B]">
                <span>
                  Visibility: <strong className="text-[#111113] font-semibold">74.2%</strong>
                </span>
                <span className="text-[#D4D4D8]">|</span>
                <span>
                  AI Visitors: <strong className="text-[#111113] font-semibold">318</strong>
                </span>
                <span className="text-[#D4D4D8]">|</span>
                <span>
                  Brand Lies: <strong className="text-[#111113] font-semibold">0</strong>
                </span>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {sidebarTab === "Battle Card" && battleState === "scanning" ? (
                  <motion.div
                    key="battle-scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-16 max-w-lg mx-auto text-center space-y-4"
                  >
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[#111113]">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#111113]" />
                      <span>{scanLabel}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden border border-[#E5E7EB]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-[#111113]"
                      />
                    </div>
                    <div className="text-xs font-mono text-[#8E8E93] tabular-nums">
                      {scanProgress}% complete
                    </div>
                  </motion.div>
                ) : sidebarTab === "Battle Card" && battleState === "completed" ? (
                  <motion.div
                    key="battle-completed"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div
                      ref={scorecardRef}
                      className="border border-[#E5E7EB] rounded-xl bg-white p-5 space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                        <div>
                          <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E93]">
                            Head-to-Head AI Battle Scorecard
                          </div>
                          <h3 className="text-lg font-semibold text-[#111113] mt-0.5">
                            {yourDomain} vs {compDomain}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 tabular-nums">
                          <div className="px-3.5 py-2 rounded-lg bg-[#ECFDF5] border border-[#16A34A]/20 text-right">
                            <div className="text-[10px] font-mono uppercase text-[#16A34A]">
                              {yourDomain}
                            </div>
                            <div className="text-xl font-semibold text-[#16A34A]">84.2%</div>
                          </div>
                          <div className="px-3.5 py-2 rounded-lg bg-[#FFF1F2] border border-[#E11D48]/20 text-right">
                            <div className="text-[10px] font-mono uppercase text-[#E11D48]">
                              {compDomain}
                            </div>
                            <div className="text-xl font-semibold text-[#E11D48]">41.8%</div>
                          </div>
                        </div>
                      </div>

                      {/* 2 Unlocked Prompt Rows */}
                      <div className="space-y-2.5">
                        {[
                          {
                            prompt: `Best software alternative to ${compDomain.split(".")[0]} in 2026`,
                            rank: "#1",
                            cited: `${yourDomain}/docs`,
                            model: "ChatGPT & Perplexity",
                          },
                          {
                            prompt: `${yourDomain.split(".")[0]} vs ${compDomain.split(".")[0]} speed & workflow comparison`,
                            rank: "#1",
                            cited: "reddit.com/r/SaaS",
                            model: "Gemini & Perplexity",
                          },
                        ].map((row, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFB] flex flex-wrap items-center justify-between gap-3"
                          >
                            <div>
                              <div className="text-sm font-medium text-[#111113]">
                                {row.prompt}
                              </div>
                              <div className="text-xs text-[#64646B] mt-0.5 flex items-center gap-2 font-mono">
                                <span>{row.model}</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-[#111113]">
                                  {row.cited}
                                  <ExternalLink className="w-3 h-3 text-[#8E8E93]" />
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 tabular-nums">
                              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-xs font-mono font-semibold">
                                Rank {row.rank}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Rows 3-8 Behind Frosted-White Upgrade Paywall */}
                      <div className="relative rounded-xl border border-[#E5E7EB] overflow-hidden">
                        <div className="p-4 space-y-2.5 blur-[4px] select-none pointer-events-none opacity-60">
                          <div className="p-3 rounded-lg border border-[#E5E7EB] text-xs text-[#64646B]">
                            Prompt #3: Enterprise pricing & migration benchmarks between {yourDomain} and {compDomain}
                          </div>
                          <div className="p-3 rounded-lg border border-[#E5E7EB] text-xs text-[#64646B]">
                            Prompt #4: Developer API reliability and SOC-2 compliance score
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#F7F7F8] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                              <Lock className="w-4 h-4 text-[#111113]" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#111113]">
                                6 additional buyer prompts locked
                              </div>
                              <div className="text-xs text-[#64646B]">
                                Unlock full citation URLs, Reddit threads, and 1-click llms.txt fixes.
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => onOpenAuth("signup")}
                            className="group px-4 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#222226] active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span>Unlock full report</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar below Battle Scorecard */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={handleDownloadPng}
                        disabled={isExporting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#111113] text-xs font-medium text-[#111113] transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isExporting ? "Exporting PNG..." : "Download Shareable PNG"}</span>
                      </button>

                      <button
                        onClick={() => setSidebarTab("Overview")}
                        className="text-xs font-medium text-[#64646B] hover:text-[#111113] transition-colors cursor-pointer"
                      >
                        Back to Analytics Overview →
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`dashboard-${sidebarTab}-${modelFilter}-${chartType}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* MAIN 2-COLUMN HAIRLINE GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#E5E7EB]">
                      {/* Left Panel: Multi-Brand Curved Chart + Dark Floating Tooltip */}
                      <div className="lg:col-span-7 p-4 lg:border-r border-[#E5E7EB] relative">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F5] border border-[#E5E7EB]">
                            {(["Visibility", "Sentiment", "Position"] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setMetricTab(t)}
                                className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all cursor-pointer ${
                                  metricTab === t
                                    ? "bg-white text-[#111113] shadow-xs"
                                    : "text-[#71717A] hover:text-[#111113]"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          <div className="inline-flex items-center p-0.5 rounded-md bg-[#F4F4F5] border border-[#E5E7EB]">
                            <button
                              type="button"
                              aria-label="Line chart"
                              onClick={() => setChartType("line")}
                              className={`p-1 rounded cursor-pointer ${
                                chartType === "line" ? "bg-white text-[#111113] shadow-xs" : "text-[#71717A]"
                              }`}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Bar chart"
                              onClick={() => setChartType("bar")}
                              className={`p-1 rounded cursor-pointer ${
                                chartType === "bar" ? "bg-white text-[#111113] shadow-xs" : "text-[#71717A]"
                              }`}
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div
                          className="h-[205px] w-full relative"
                          onMouseEnter={() => setIsChartHovered(true)}
                          onMouseLeave={() => setIsChartHovered(false)}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            {chartType === "line" ? (
                              <LineChart data={activeData}>
                                <CartesianGrid stroke="#F4F4F5" vertical={false} />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 10.5, fill: "#9CA3AF" }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[25, 85]}
                                  tickFormatter={(v) => `${v}%`}
                                  tick={{ fontSize: 10.5, fill: "#9CA3AF" }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={34}
                                />
                                <Tooltip
                                  content={({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                      <div className="bg-[#111113] text-white rounded-xl px-3.5 py-2.5 shadow-xl text-[12px] tabular-nums space-y-1.5 min-w-[160px]">
                                        <div className="text-[11px] font-medium text-[#A1A1AA] border-b border-white/10 pb-1">
                                          {label} 2026
                                        </div>
                                        {payload.map((entry: any) => (
                                          <div
                                            key={entry.name}
                                            className="flex items-center justify-between gap-4"
                                          >
                                            <span className="inline-flex items-center gap-1.5">
                                              <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: entry.color }}
                                              />
                                              <span>{entry.name}</span>
                                            </span>
                                            <span className="font-mono font-semibold">
                                              {entry.value}%
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }}
                                />
                                <Line type="monotone" dataKey="linear" name="Linear" stroke="#3B82F6" strokeWidth={1.75} dot={false} />
                                <Line type="monotone" dataKey="attio" name="Attio" stroke="#EF4444" strokeWidth={1.75} dot={false} />
                                <Line type="monotone" dataKey="hubspot" name="HubSpot" stroke="#F59E0B" strokeWidth={1.75} dot={false} />
                                <Line type="monotone" dataKey="jira" name="Jira" stroke="#10B981" strokeWidth={1.75} dot={false} />
                              </LineChart>
                            ) : (
                              <BarChart data={activeData}>
                                <CartesianGrid stroke="#F4F4F5" vertical={false} />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 10.5, fill: "#9CA3AF" }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[0, 85]}
                                  tickFormatter={(v) => `${v}%`}
                                  tick={{ fontSize: 10.5, fill: "#9CA3AF" }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={34}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#111113",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "12px",
                                  }}
                                />
                                <Bar dataKey="linear" name="Linear" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="attio" name="Attio" fill="#EF4444" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="hubspot" name="HubSpot" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="jira" name="Jira" fill="#10B981" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>

                          {/* Default Pinned Sleek Dark Floating Tooltip */}
                          {!isChartHovered && chartType === "line" && (
                            <div className="pointer-events-none hidden sm:block absolute top-3 right-6 bg-[#111113] text-white rounded-xl px-3.5 py-2.5 shadow-xl text-[12px] tabular-nums space-y-1 min-w-[165px]">
                              <div className="text-[11px] font-medium text-[#A1A1AA] border-b border-white/10 pb-1">
                                November 2026
                              </div>
                              {[
                                { name: "Linear", val: `${activeData[activeData.length - 1].linear}%`, color: "#3B82F6" },
                                { name: "Attio", val: `${activeData[activeData.length - 1].attio}%`, color: "#EF4444" },
                                { name: "HubSpot", val: `${activeData[activeData.length - 1].hubspot}%`, color: "#F59E0B" },
                                { name: "Jira", val: `${activeData[activeData.length - 1].jira}%`, color: "#10B981" },
                              ].map((item) => (
                                <div key={item.name} className="flex items-center justify-between gap-4">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span>{item.name}</span>
                                  </span>
                                  <span className="font-mono font-semibold">{item.val}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Panel: Dense 4-Column Competitors Table */}
                      <div className="lg:col-span-5 p-4">
                        <div className="mb-2.5">
                          <h3 className="text-[13px] font-semibold text-[#111113]">
                            Competitors
                          </h3>
                          <p className="text-[11px] text-[#71717A]">
                            Compare brand share across AI answers
                          </p>
                        </div>

                        <div className="w-full overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[12px] tabular-nums">
                            <thead>
                              <tr className="border-b border-[#E5E7EB] text-[10.5px] font-mono uppercase text-[#9CA3AF]">
                                <th className="py-2 pr-2">#</th>
                                <th className="py-2 pr-2">Brand</th>
                                <th className="py-2 pr-2 text-right">Visibility</th>
                                <th className="py-2 pr-2 text-right">Sentiment</th>
                                <th className="py-2 text-right">Position</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                              {rankingRows.map((row) => (
                                <tr key={row.brand}>
                                  <td className="py-2.5 pr-2 font-mono text-[#9CA3AF]">
                                    {row.rank}
                                  </td>
                                  <td className="py-2.5 pr-2">
                                    <span className="inline-flex items-center gap-1.5 font-medium text-[#111113]">
                                      <BrandSticker name={row.brand} size="sm" />
                                      <span>{row.brand}</span>
                                    </span>
                                  </td>
                                  <td className="py-2.5 pr-2 text-right font-mono font-semibold text-[#111113]">
                                    {row.share}
                                  </td>
                                  <td className="py-2.5 pr-2 text-right font-mono text-[#111113]">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="w-0.5 h-3 rounded-full bg-[#16A34A]" />
                                      <span>{row.sentiment}</span>
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono whitespace-nowrap">
                                    <span className="text-[#111113] font-medium">{row.pos}</span>
                                    <span
                                      className={`ml-1 text-[10.5px] ${
                                        row.positive ? "text-[#16A34A]" : "text-[#E11D48]"
                                      }`}
                                    >
                                      {row.delta}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* BOTTOM 2-COLUMN HAIRLINE ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                      {/* Left: Domains | URLs Table */}
                      <div className="lg:col-span-7 p-4 lg:border-r border-[#E5E7EB]">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F5] border border-[#E5E7EB]">
                            {(["Domains", "URLs"] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSourceTab(t)}
                                className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium cursor-pointer ${
                                  sourceTab === t
                                    ? "bg-white text-[#111113] shadow-xs"
                                    : "text-[#71717A] hover:text-[#111113]"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[12px] tabular-nums">
                            <thead>
                              <tr className="border-b border-[#E5E7EB] text-[10.5px] font-mono uppercase text-[#9CA3AF]">
                                <th className="py-2 pr-2">Domain</th>
                                <th className="py-2 pr-2">Type</th>
                                <th className="py-2 pr-2 text-right">Used</th>
                                <th className="py-2 text-right">Avg. Citations</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                              {domainSourceRows.map((src) => (
                                <tr key={src.domain}>
                                  <td className="py-2 pr-2 font-mono font-medium text-[#111113]">
                                    <span className="inline-flex items-center gap-2">
                                      <BrandSticker name={src.domain} size="sm" />
                                      <span>{src.domain}</span>
                                    </span>
                                  </td>
                                  <td className="py-2 pr-2">
                                    <span
                                      className={`text-[10.5px] font-medium px-2 py-0.5 rounded border ${src.badgeCls}`}
                                    >
                                      {src.type}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-2 text-right font-mono text-[#111113]">
                                    {src.used}
                                  </td>
                                  <td className="py-2 text-right font-mono text-[#52525B]">
                                    {src.avg}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right: Domains by Type Donut */}
                      <div className="lg:col-span-5 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-[13px] font-semibold text-[#111113]">
                            Domains by Type
                          </h3>
                          <p className="text-[11px] text-[#71717A]">
                            Most used domains categorized by type
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 my-auto pt-2">
                          <div className="relative w-28 h-28 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: "UGC", value: 34 },
                                    { name: "Editorial", value: 24 },
                                    { name: "Review", value: 28 },
                                    { name: "Competitor", value: 8 },
                                    { name: "Others", value: 6 },
                                  ]}
                                  dataKey="value"
                                  innerRadius={38}
                                  outerRadius={52}
                                  paddingAngle={2}
                                  stroke="none"
                                >
                                  {["#3B82F6", "#F59E0B", "#8B5CF6", "#E11D48", "#D4D4D8"].map(
                                    (c, idx) => (
                                      <Cell key={idx} fill={c} />
                                    )
                                  )}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-xs font-semibold font-mono text-[#111113] tabular-nums">
                                34%
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] flex-1">
                            {[
                              { label: "UGC", color: "#3B82F6" },
                              { label: "Editorial", color: "#F59E0B" },
                              { label: "Review", color: "#8B5CF6" },
                              { label: "Competitor", color: "#E11D48" },
                              { label: "Others", color: "#D4D4D8" },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center gap-1.5 text-[#52525B]">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
