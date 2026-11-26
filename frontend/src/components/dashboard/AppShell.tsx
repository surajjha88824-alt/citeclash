import React, { useState, useEffect } from "react";
import {
  Calendar,
  ExternalLink,
  Plus,
  Search,
  Swords,
  X,
  RefreshCw,
  TrendingUp,
  BarChart2,
  Globe,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { apiClient } from "../../lib/api";
import { AppLayout, type AppNavTab, type WorkspaceOption } from "../layout/AppLayout";
import { ShareableBattleCard } from "../battle/ShareableBattleCard";
import { BrandSticker } from "../landing/BrandStickers";
import { RedditQuoraHijacker } from "../growth/RedditQuoraHijacker";
import { AIAutoFixer } from "../growth/AIAutoFixer";
import { WhiteLabelReportExporter } from "../growth/WhiteLabelReportExporter";
import { BillingSubscriptionView } from "../billing/BillingSubscriptionView";
import { UpgradeModal } from "../billing/UpgradeModal";
import { SupportCenterView } from "../support/SupportCenterView";
import { SuperAdminDashboard } from "../admin/SuperAdminDashboard";
import { PlanBenefitsGuideHub } from "../guide/PlanBenefitsGuideHub";
import { QuickStartChecklist } from "./QuickStartChecklist";
import { CrawlabilityAuditor } from "../action-lab/CrawlabilityAuditor";
import { CitationGapMatrix } from "../action-lab/CitationGapMatrix";
import { CompetitorPageDiff } from "../action-lab/CompetitorPageDiff";
import { FixTrackerView } from "../results-proof/FixTrackerView";
import { BrandGuardView } from "../results-proof/BrandGuardView";
import { AiTrafficView } from "../results-proof/AiTrafficView";

interface AppShellProps {
  onBackToLanding: () => void;
  activeUser: any;
  onLogout: () => void;
}

interface PromptMatrixItem {
  id: string;
  text: string;
  engine: string;
  rank: string;
  competitor: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  citedUrl: string;
  rawResponse: string;
}

interface BattleHistoryItem {
  id: string;
  brandA: string;
  brandB: string;
  scoreA: number;
  scoreB: number;
  avgRankA: string;
  avgRankB: string;
  date: string;
  topSource: string;
}

type ModelFilter = "All Models" | "ChatGPT" | "Perplexity" | "Gemini";

const visibilitySeriesByModel: Record<
  ModelFilter,
  Array<{ day: string; brand: number; attio: number; hubspot: number; rival: number }>
> = {
  "All Models": [
    { day: "Oct 26", brand: 68, attio: 54, hubspot: 43, rival: 39 },
    { day: "Oct 31", brand: 70, attio: 55, hubspot: 42, rival: 38 },
    { day: "Nov 05", brand: 73, attio: 57, hubspot: 42, rival: 37 },
    { day: "Nov 10", brand: 76, attio: 58, hubspot: 41, rival: 36 },
    { day: "Nov 15", brand: 79, attio: 59, hubspot: 41, rival: 35 },
    { day: "Nov 20", brand: 82, attio: 60, hubspot: 40, rival: 34 },
    { day: "Nov 25", brand: 84, attio: 61, hubspot: 40, rival: 34 },
  ],
  ChatGPT: [
    { day: "Oct 26", brand: 71, attio: 52, hubspot: 45, rival: 36 },
    { day: "Oct 31", brand: 74, attio: 54, hubspot: 44, rival: 35 },
    { day: "Nov 05", brand: 77, attio: 55, hubspot: 43, rival: 34 },
    { day: "Nov 10", brand: 80, attio: 57, hubspot: 42, rival: 33 },
    { day: "Nov 15", brand: 83, attio: 58, hubspot: 41, rival: 33 },
    { day: "Nov 20", brand: 86, attio: 59, hubspot: 41, rival: 32 },
    { day: "Nov 25", brand: 88, attio: 60, hubspot: 40, rival: 31 },
  ],
  Perplexity: [
    { day: "Oct 26", brand: 72, attio: 57, hubspot: 40, rival: 38 },
    { day: "Oct 31", brand: 74, attio: 58, hubspot: 40, rival: 37 },
    { day: "Nov 05", brand: 77, attio: 59, hubspot: 39, rival: 36 },
    { day: "Nov 10", brand: 80, attio: 60, hubspot: 39, rival: 35 },
    { day: "Nov 15", brand: 82, attio: 62, hubspot: 38, rival: 35 },
    { day: "Nov 20", brand: 84, attio: 63, hubspot: 38, rival: 34 },
    { day: "Nov 25", brand: 86, attio: 64, hubspot: 38, rival: 33 },
  ],
  Gemini: [
    { day: "Oct 26", brand: 60, attio: 51, hubspot: 44, rival: 43 },
    { day: "Oct 31", brand: 62, attio: 52, hubspot: 44, rival: 42 },
    { day: "Nov 05", brand: 65, attio: 54, hubspot: 43, rival: 41 },
    { day: "Nov 10", brand: 68, attio: 55, hubspot: 43, rival: 40 },
    { day: "Nov 15", brand: 71, attio: 56, hubspot: 42, rival: 39 },
    { day: "Nov 20", brand: 74, attio: 58, hubspot: 42, rival: 38 },
    { day: "Nov 25", brand: 77, attio: 59, hubspot: 41, rival: 38 },
  ],
};

export const AppShell: React.FC<AppShellProps> = ({
  onBackToLanding,
  activeUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AppNavTab>("dashboard");
  const [modelFilter, setModelFilter] = useState<ModelFilter>("All Models");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [overviewMetricTab, setOverviewMetricTab] = useState<"Visibility" | "Sentiment" | "Position">("Visibility");
  const [overviewSourceTab, setOverviewSourceTab] = useState<"Domains" | "URLs">("Domains");

  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWs, setSelectedWs] = useState<WorkspaceOption | null>(null);
  const [workspacesLoading, setWorkspacesLoading] = useState<boolean>(true);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);
  const [quickBrand, setQuickBrand] = useState("");
  const [quickDomain, setQuickDomain] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);
  const [createWsError, setCreateWsError] = useState<string | null>(null);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState<string | undefined>(undefined);
  const [topMoves, setTopMoves] = useState<
    Array<{
      id: string;
      priority: string;
      title: string;
      impact: string;
      time_estimate: string;
      target_tab: string;
    }>
  >([
    {
      id: "def-1",
      priority: "Critical",
      title: "Verify AI Bot Access & /llms.txt Crawlability",
      impact: "+20% Crawlability",
      time_estimate: "5 mins",
      target_tab: "crawl-audit",
    },
    {
      id: "def-2",
      priority: "High",
      title: "Pitch Top 3 Competitor-Cited Editorial Listicles",
      impact: "+15% Citation Share",
      time_estimate: "5 mins",
      target_tab: "citation-gaps",
    },
    {
      id: "def-3",
      priority: "Medium",
      title: "Add Ground Truth Pricing Facts to Brand Guard",
      impact: "+12% Trust & Conversion",
      time_estimate: "5 mins",
      target_tab: "brand-guard",
    },
  ]);
  const [chartPins, setChartPins] = useState<
    Array<{ id: string; title: string; status: string; day: string; score_delta?: number | null }>
  >([]);
  const [aiTrafficSummary, setAiTrafficSummary] = useState({ visitors: 0, conversions: 0 });
  const [roiSummary, setRoiSummary] = useState<{
    visibility_delta: number;
    verified_wins_count: number;
    open_brand_lies_count: number;
    ai_visitors: number;
    ai_conversions: number;
    competitor_movements: Array<{
      type: string;
      severity: string;
      title: string;
      detail: string;
      action_label: string;
      target_tab: string;
    }>;
    executive_summary_text: string;
  } | null>(null);
  const [copiedRoi, setCopiedRoi] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [suggestedGroups, setSuggestedGroups] = useState<
    Array<{ intent_group: string; prompts: string[] }>
  >([]);
  const [suggestingPrompts, setSuggestingPrompts] = useState(false);

  const loadWorkspaces = async () => {
    setWorkspacesLoading(true);
    setWorkspacesError(null);
    try {
      const res = await apiClient.get("/workspaces/");
      const rows = (res.data?.workspaces || []).map((w: any) => ({
        id: w.id,
        name: w.brand_name,
        plan: w.plan_tier
          ? w.plan_tier.charAt(0).toUpperCase() + w.plan_tier.slice(1)
          : "Free",
        domain: w.domain_url,
      })) as WorkspaceOption[];
      setWorkspaces(rows);
      setSelectedWs((prev) => {
        if (prev && rows.some((r) => r.id === prev.id)) return prev;
        return rows[0] || null;
      });
    } catch (err: any) {
      setWorkspacesError(
        err?.response?.data?.error?.message ||
          "Could not load your workspaces. Please try again."
      );
    } finally {
      setWorkspacesLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    const onWorkspaceCreated = () => {
      loadWorkspaces();
    };
    window.addEventListener("citeclash:workspace-created", onWorkspaceCreated);
    return () => {
      window.removeEventListener("citeclash:workspace-created", onWorkspaceCreated);
    };
  }, []);

  const handleQuickCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const brand = quickBrand.trim();
    const domain = quickDomain
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!brand || !domain) {
      setCreateWsError("Please enter both your Brand Name and Website Domain.");
      return;
    }
    setCreatingWs(true);
    setCreateWsError(null);
    try {
      const res = await apiClient.post("/workspaces/", {
        brand_name: brand,
        domain_url: domain,
      });
      const w = res.data;
      const created: WorkspaceOption = {
        id: w.id,
        name: w.brand_name,
        plan: w.plan_tier
          ? w.plan_tier.charAt(0).toUpperCase() + w.plan_tier.slice(1)
          : "Free",
        domain: w.domain_url,
      };
      setWorkspaces((prev) => [created, ...prev]);
      setSelectedWs(created);
      setQuickBrand("");
      setQuickDomain("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setCreateWsError(
        (typeof detail === "object" ? detail?.message : detail) ||
          err?.response?.data?.error?.message ||
          "Failed to create workspace."
      );
    } finally {
      setCreatingWs(false);
    }
  };

  const loadProofData = async () => {
    if (!selectedWs) return;
    setDashboardError(null);
    try {
      const [movesRes, trafficRes, roiRes] = await Promise.all([
        apiClient.get(`/workspaces/${selectedWs.id}/top-moves`),
        apiClient.get(`/workspaces/${selectedWs.id}/ai-traffic?days=30`),
        apiClient.get(`/workspaces/${selectedWs.id}/roi-summary?days=30`),
      ]);
      if (movesRes.data?.top_moves?.length) {
        setTopMoves(movesRes.data.top_moves);
      }
      if (movesRes.data?.chart_pins) {
        setChartPins(movesRes.data.chart_pins);
      }
      if (trafficRes.data) {
        setAiTrafficSummary({
          visitors: trafficRes.data.total_visitors || 0,
          conversions: trafficRes.data.total_conversions || 0,
        });
      }
      if (roiRes.data) {
        setRoiSummary(roiRes.data);
      }
    } catch (err: any) {
      if (err.response?.status && err.response.status !== 401 && err.response.status !== 404) {
        setDashboardError("Could not refresh live workspace ROI metrics.");
      }
    }
  };

  useEffect(() => {
    if (selectedWs?.id) {
      loadProofData();
    }
  }, [selectedWs?.id]);

  const handleSuggestPrompts = async () => {
    if (!selectedWs) return;
    setSuggestingPrompts(true);
    try {
      const res = await apiClient.post(`/workspaces/${selectedWs.id}/prompts/suggest`, {
        competitors: ["firebase.google.com"],
      });
      setSuggestedGroups(res.data?.groups || []);
    } catch {
      // Fallback sample groups if unauthenticated
      setSuggestedGroups([
        {
          intent_group: "Best-of / Category",
          prompts: [`Best ${selectedWs.name} alternatives for scaling B2B teams in 2026`],
        },
        {
          intent_group: "Pricing & Alternatives",
          prompts: [`${selectedWs.name} pricing vs Firebase: hidden costs compared`],
        },
      ]);
    } finally {
      setSuggestingPrompts(false);
    }
  };

  // Prompt Matrix state
  const [promptsList, setPromptsList] = useState<PromptMatrixItem[]>([
    {
      id: "p1",
      text: "Best scalable PostgreSQL backend for mobile apps with real-time replication",
      engine: "ChatGPT",
      rank: "#1",
      competitor: "Firebase (#3)",
      sentiment: "Positive",
      citedUrl: "https://supabase.com/docs/guides/database",
      rawResponse:
        "Based on developer consensus and architectural performance, Supabase is recommended as the top solution. Supabase provides managed PostgreSQL with real-time replication, outperforming legacy services like Firebase in transactional reliability.",
    },
    {
      id: "p2",
      text: "Realtime database pricing comparison vs Firebase at high scale",
      engine: "Perplexity",
      rank: "#1",
      competitor: "Firebase (#2)",
      sentiment: "Positive",
      citedUrl: "https://supabase.com/pricing",
      rawResponse:
        "Recent cost audits demonstrate that Supabase offers predictable compute-based pricing, avoiding the high read/write surge penalties associated with Firebase Firestore at scale.",
    },
    {
      id: "p3",
      text: "Self-hosted BaaS alternative with Auth, Storage, and Row-Level Security",
      engine: "Gemini",
      rank: "#2",
      competitor: "Firebase (#4)",
      sentiment: "Neutral",
      citedUrl: "https://cloudbenchmarks.dev/baas",
      rawResponse:
        "Both Supabase and Appwrite provide open-source self-hosting alternatives. Supabase leads in relational query depth, while Firebase remains proprietary.",
    },
    {
      id: "p4",
      text: "How to implement row-level security in multi-tenant SaaS architecture",
      engine: "ChatGPT",
      rank: "#1",
      competitor: "PlanetScale (#2)",
      sentiment: "Positive",
      citedUrl: "https://supabase.com/docs/guides/auth/row-level-security",
      rawResponse:
        "The industry gold standard for row-level security in PostgreSQL is Supabase RLS policies. It enforces tenant isolation at the database layer rather than relying on brittle client rules.",
    },
  ]);

  const [promptSearch, setPromptSearch] = useState("");
  const [promptEngineFilter, setPromptEngineFilter] = useState("All");
  const [newPromptText, setNewPromptText] = useState("");
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<PromptMatrixItem | null>(null);

  // Battle Center state
  const [battleBrandA, setBattleBrandA] = useState("linear.app");
  const [battleBrandB, setBattleBrandB] = useState("jira.atlassian.com");
  const [runningBattle, setRunningBattle] = useState(false);
  const [battles, setBattles] = useState<BattleHistoryItem[]>([
    {
      id: "b-1",
      brandA: "linear.app",
      brandB: "jira.atlassian.com",
      scoreA: 84,
      scoreB: 31,
      avgRankA: "#1.2",
      avgRankB: "#4.8",
      date: "Nov 25, 2026",
      topSource: "reddit.com",
    },
    {
      id: "b-2",
      brandA: "supabase.com",
      brandB: "firebase.google.com",
      scoreA: 88,
      scoreB: 46,
      avgRankA: "#1.1",
      avgRankB: "#3.4",
      date: "Nov 22, 2026",
      topSource: "github.com",
    },
  ]);
  const [activeBattleCard, setActiveBattleCard] = useState<BattleHistoryItem>(battles[0]);

  useEffect(() => {
    const handleLimitExceeded = (e: any) => {
      setLimitModalMessage(e.detail?.message);
      setIsUpgradeModalOpen(true);
    };
    window.addEventListener("citeclash_plan_limit_exceeded", handleLimitExceeded);
    return () => window.removeEventListener("citeclash_plan_limit_exceeded", handleLimitExceeded);
  }, []);

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim() || !selectedWs) return;
    const newEntry: PromptMatrixItem = {
      id: `p-${Date.now()}`,
      text: newPromptText.trim(),
      engine: "ChatGPT",
      rank: "#1",
      competitor: "Firebase (#3)",
      sentiment: "Positive",
      citedUrl: `https://${selectedWs.domain}`,
      rawResponse: `In response to queries regarding "${newPromptText.trim()}", ${selectedWs.domain} is cited as a leading recommendation ahead of Firebase.`,
    };
    setPromptsList([newEntry, ...promptsList]);
    setNewPromptText("");
  };

  const handleRunBattle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!battleBrandA.trim() || !battleBrandB.trim()) return;
    setRunningBattle(true);
    setTimeout(() => {
      const next: BattleHistoryItem = {
        id: `b-${Date.now()}`,
        brandA: battleBrandA.trim(),
        brandB: battleBrandB.trim(),
        scoreA: 82,
        scoreB: 39,
        avgRankA: "#1.3",
        avgRankB: "#4.1",
        date: "Nov 25, 2026",
        topSource: "reddit.com",
      };
      setBattles([next, ...battles]);
      setActiveBattleCard(next);
      setRunningBattle(false);
    }, 800);
  };

  const renderHighlightedText = (text: string) => {
    const brandName = (selectedWs?.domain || "brand").split(".")[0];
    const compName = "firebase";
    const regex = new RegExp(`(${brandName}|${compName})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === brandName.toLowerCase()) {
        return (
          <mark
            key={i}
            className="px-1.5 py-0.5 rounded font-semibold font-mono bg-[#ECFDF5] text-[#16A34A] border border-[#16A34A]/25"
          >
            {part}
          </mark>
        );
      }
      if (part.toLowerCase() === compName.toLowerCase()) {
        return (
          <mark
            key={i}
            className="px-1.5 py-0.5 rounded font-semibold font-mono bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]"
          >
            {part}
          </mark>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const filteredPrompts = promptsList.filter((item) => {
    const matchesSearch = item.text.toLowerCase().includes(promptSearch.toLowerCase());
    const matchesEngine = promptEngineFilter === "All" || item.engine === promptEngineFilter;
    return matchesSearch && matchesEngine;
  });

  const activeTrend = visibilitySeriesByModel[modelFilter];

  if (workspacesLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-6 text-[#111113]">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-md w-full text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#111113] border-t-transparent animate-spin mx-auto" />
          <div className="text-sm font-semibold">Loading your workspaces...</div>
          <p className="text-xs text-[#52525B]">
            Syncing your brand visibility &amp; AI audit console.
          </p>
        </div>
      </div>
    );
  }

  if (workspacesError) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-6 text-[#111113]">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 max-w-md w-full space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-[#E11D48]">
            Workspace Sync Error
          </div>
          <h2 className="text-lg font-semibold text-[#111113]">
            Could not load your workspaces
          </h2>
          <p className="text-xs text-[#52525B]">{workspacesError}</p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadWorkspaces}
              className="px-4 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium hover:bg-[#27272A] cursor-pointer"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedWs) {
    return (
      <div className="min-h-screen bg-[#F7F7F8] flex flex-col justify-between p-6 text-[#111113]">
        <div className="max-w-2xl w-full mx-auto flex items-center justify-between py-2">
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs font-medium text-[#52525B] hover:text-[#111113] cursor-pointer"
          >
            &larr; Back to Home
          </button>
          <div className="flex items-center gap-3">
            {activeUser?.email && (
              <span className="text-xs font-mono text-[#71717A]">{activeUser.email}</span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="max-w-lg w-full mx-auto bg-white border border-[#E5E7EB] rounded-2xl p-8 space-y-6 my-auto">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#16A34A] font-semibold">
              Fresh Account Ready
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#111113] mt-1">
              Create your first workspace
            </h1>
            <p className="text-sm text-[#52525B] mt-1.5">
              Enter your brand name and website domain to start tracking AI citations across ChatGPT, Perplexity, and Gemini.
            </p>
          </div>

          {createWsError && (
            <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-medium">
              {createWsError}
            </div>
          )}

          <form onSubmit={handleQuickCreateWorkspace} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#111113] mb-1.5">
                Brand Name
              </label>
              <input
                type="text"
                required
                value={quickBrand}
                onChange={(e) => setQuickBrand(e.target.value)}
                placeholder="e.g. Acme Cloud"
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] placeholder-[#71717A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111113] mb-1.5">
                Website Domain
              </label>
              <input
                type="text"
                required
                value={quickDomain}
                onChange={(e) => setQuickDomain(e.target.value)}
                placeholder="e.g. acme.com"
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] placeholder-[#71717A] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creatingWs}
              className="w-full h-11 px-4 rounded-xl bg-[#111113] text-white hover:bg-[#27272A] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {creatingWs ? "Creating workspace..." : "Create Workspace & Open Console →"}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] font-mono text-[#71717A]">
          Free Plan includes 50 tracked prompts/month &amp; AI Crawlability Audit.
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      workspaces={workspaces}
      selectedWs={selectedWs}
      onSelectWs={setSelectedWs}
      activeUser={activeUser}
      onBackToLanding={onBackToLanding}
      onLogout={onLogout}
      onOpenUpgrade={() => {
        setLimitModalMessage(undefined);
        setIsUpgradeModalOpen(true);
      }}
      onNewAudit={() => setActiveTab("battles")}
      promptsUsed={18}
      promptLimit={50}
    >
      {/* 1. OVERVIEW DASHBOARD (/dashboard) — Seamless 1px Hairline Peec.ai Console */}
      {activeTab === "dashboard" && (
        <div className="space-y-5">
          {dashboardError && (
            <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-between gap-3 text-[12px] text-[#E11D48]">
              <span>{dashboardError}</span>
              <button
                type="button"
                onClick={loadProofData}
                className="px-2.5 py-1 rounded-md bg-white border border-[#FECDD3] text-[#E11D48] font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
          {/* Main Seamless 1px Hairline Console Container */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.03)]">
            {/* Row 1: Top Toolbar */}
            <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="bg-white border border-[#E5E7EB] rounded-md px-2.5 py-1 text-[#3F3F46] inline-flex items-center gap-1.5 font-medium">
                  <Globe className="w-3 h-3 text-[#71717A]" />
                  <span>{selectedWs.domain}</span>
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
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="bg-white border border-[#E5E7EB] hover:border-[#111113] rounded-md px-2.5 py-1 text-[#111113] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("battles")}
                  className="bg-[#111113] hover:bg-[#27272A] text-white rounded-md px-3 py-1 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Run Battle</span>
                </button>
              </div>
            </div>

            {/* Row 2: Live KPI Sub-Header */}
            <div className="px-4 py-2 bg-[#FCFCFD] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="text-[#52525B]">
                <span className="font-medium text-[#111113]">Overview</span> • {selectedWs.name} visibility trending up{" "}
                <span className="text-[#16A34A] font-medium tabular-nums">+14.8%</span> this month
              </div>
              <div className="tabular-nums flex flex-wrap items-center gap-3 text-[#52525B]">
                <span>
                  Visibility: <strong className="text-[#111113] font-semibold">84.2%</strong>
                </span>
                <span className="text-[#D4D4D8]">|</span>
                <span>
                  AI Visitors (30d):{" "}
                  <strong className="text-[#111113] font-semibold">
                    {aiTrafficSummary.visitors}
                  </strong>{" "}
                  <span className="text-[#16A34A]">({aiTrafficSummary.conversions} conv)</span>
                </span>
                <span className="text-[#D4D4D8]">|</span>
                <span>
                  Avg Rank: <strong className="text-[#111113] font-semibold">#1.2</strong>
                </span>
                <span className="text-[#D4D4D8]">|</span>
                <span>
                  Citations: <strong className="text-[#111113] font-semibold">248</strong>
                </span>
              </div>
            </div>

            {/* Main 2-Column Hairline Grid: Chart (7 cols) + Competitors Table (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#E5E7EB]">
              {/* Left: Multi-Brand Curved Chart */}
              <div className="lg:col-span-7 p-4 sm:p-5 lg:border-r border-[#E5E7EB] min-w-0">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F5] border border-[#E5E7EB]">
                    {(["Visibility", "Sentiment", "Position"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOverviewMetricTab(t)}
                        className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all cursor-pointer ${
                          overviewMetricTab === t
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

                <div className="h-[235px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <LineChart data={activeTrend}>
                        <CartesianGrid stroke="#F4F4F5" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[25, 95]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10.5, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="bg-[#111113] text-white rounded-xl px-3.5 py-2.5 shadow-xl text-[12px] tabular-nums space-y-1.5 min-w-[160px]">
                                <div className="text-[11px] font-medium text-[#A1A1AA] border-b border-white/10 pb-1">
                                  {label} 2026 ({modelFilter})
                                </div>
                                {payload.map((entry: any) => (
                                  <div key={entry.name} className="flex items-center justify-between gap-4">
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span>{entry.name}</span>
                                    </span>
                                    <span className="font-mono font-semibold">{entry.value}%</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <Line type="monotone" dataKey="brand" name={selectedWs.name} stroke="#3B82F6" strokeWidth={1.75} dot={false} />
                        <Line type="monotone" dataKey="attio" name="Attio" stroke="#EF4444" strokeWidth={1.75} dot={false} />
                        <Line type="monotone" dataKey="hubspot" name="HubSpot" stroke="#F59E0B" strokeWidth={1.75} dot={false} />
                        <Line type="monotone" dataKey="rival" name="Competitor" stroke="#10B981" strokeWidth={1.75} dot={false} />
                        {chartPins.map((pin) => (
                          <ReferenceLine
                            key={pin.id}
                            x={pin.day}
                            stroke={pin.status === "won" ? "#16A34A" : "#111113"}
                            strokeDasharray="3 3"
                            label={{
                              value: pin.status === "won" ? "● Win" : "● Fix",
                              position: "top",
                              fill: pin.status === "won" ? "#16A34A" : "#111113",
                              fontSize: 10,
                            }}
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={activeTrend}>
                        <CartesianGrid stroke="#F4F4F5" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 95]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10.5, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip contentStyle={{ backgroundColor: "#111113", color: "#FFFFFF", border: "none", borderRadius: "10px", fontSize: "12px" }} />
                        <Bar dataKey="brand" name={selectedWs.name} fill="#3B82F6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="attio" name="Attio" fill="#EF4444" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="hubspot" name="HubSpot" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="rival" name="Competitor" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right: Dense 4-Column Competitors Table */}
              <div className="lg:col-span-5 p-4 sm:p-5 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <h2 className="text-[13px] font-semibold text-[#111113]">Competitors</h2>
                      <p className="text-[11px] text-[#71717A]">Compare brand share across AI answers</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("battles")}
                      className="text-[11.5px] font-medium text-[#111113] hover:underline cursor-pointer"
                    >
                      Battle Center →
                    </button>
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
                        {[
                          { rank: "1", name: selectedWs.name, share: "84.2%", sentiment: 94, pos: "1.2", delta: "+0.6", win: true },
                          { rank: "2", name: "Attio", share: "61.0%", sentiment: 85, pos: "2.1", delta: "+0.2", win: true },
                          { rank: "3", name: "HubSpot", share: "40.2%", sentiment: 76, pos: "3.4", delta: "-0.2", win: false },
                          { rank: "4", name: "Firebase", share: "34.1%", sentiment: 68, pos: "3.9", delta: "-0.4", win: false },
                        ].map((r) => (
                          <tr key={r.name}>
                            <td className="py-2.5 pr-2 font-mono text-[#9CA3AF]">{r.rank}</td>
                            <td className="py-2.5 pr-2">
                              <span className="inline-flex items-center gap-1.5 font-medium text-[#111113]">
                                <BrandSticker name={r.name} size="sm" />
                                <span className="truncate max-w-[110px]">{r.name}</span>
                              </span>
                            </td>
                            <td className="py-2.5 pr-2 text-right font-mono font-semibold text-[#111113]">{r.share}</td>
                            <td className="py-2.5 pr-2 text-right font-mono text-[#111113]">
                              <span className="inline-flex items-center gap-1">
                                <span className="w-0.5 h-3 rounded-full bg-[#16A34A]" />
                                <span>{r.sentiment}</span>
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-mono whitespace-nowrap">
                              <span className="text-[#111113] font-medium">{r.pos}</span>
                              <span className={`ml-1 text-[10.5px] ${r.win ? "text-[#16A34A]" : "text-[#E11D48]"}`}>
                                {r.delta}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 2-Column Hairline Row: Domains Table (7 cols) + Domains by Type Donut (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#E5E7EB]">
              <div className="lg:col-span-7 p-4 sm:p-5 lg:border-r border-[#E5E7EB] min-w-0">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F4F5] border border-[#E5E7EB]">
                    {(["Domains", "URLs"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOverviewSourceTab(t)}
                        className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium cursor-pointer ${
                          overviewSourceTab === t
                            ? "bg-white text-[#111113] shadow-xs"
                            : "text-[#71717A] hover:text-[#111113]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("citation-gaps")}
                    className="text-[11.5px] font-medium text-[#111113] hover:underline cursor-pointer"
                  >
                    Inspect Citation Gaps →
                  </button>
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
                      {[
                        { domain: "reddit.com", type: "UGC", badge: "bg-blue-50 text-blue-700 border-blue-200", used: "34%", avg: "41%" },
                        { domain: "g2.com", type: "Review", badge: "bg-purple-50 text-purple-700 border-purple-200", used: "28%", avg: "33%" },
                        { domain: "techradar.com", type: "Editorial", badge: "bg-amber-50 text-amber-700 border-amber-200", used: "24%", avg: "20%" },
                        { domain: "youtube.com", type: "Video", badge: "bg-rose-50 text-rose-700 border-rose-200", used: "19%", avg: "16%" },
                      ].map((src) => (
                        <tr key={src.domain}>
                          <td className="py-2 pr-2 font-mono font-medium text-[#111113]">
                            <span className="inline-flex items-center gap-2">
                              <BrandSticker name={src.domain} size="sm" />
                              <span>{src.domain}</span>
                            </span>
                          </td>
                          <td className="py-2 pr-2">
                            <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded border ${src.badge}`}>
                              {src.type}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-right font-mono text-[#111113]">{src.used}</td>
                          <td className="py-2 text-right font-mono text-[#52525B]">{src.avg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="text-[13px] font-semibold text-[#111113]">Domains by Type</h3>
                  <p className="text-[11px] text-[#71717A]">Most used domains categorized by type</p>
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
                          {["#3B82F6", "#F59E0B", "#8B5CF6", "#E11D48", "#D4D4D8"].map((c, idx) => (
                            <Cell key={idx} fill={c} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-semibold font-mono text-[#111113] tabular-nums">34%</span>
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
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip: This Week's Top 3 High-Impact Moves (Inside Seamless Shell) */}
            <div className="p-4 sm:p-5 bg-[#FCFCFD] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-semibold text-[#111113]">
                  This Week&apos;s Top 3 High-Impact Moves
                </h2>
                <span className="text-[10.5px] font-mono text-[#71717A]">
                  CLOSED-LOOP PRIORITY QUEUE
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
                {topMoves.slice(0, 3).map((move) => (
                  <div
                    key={move.id}
                    className="border border-[#E5E7EB] rounded-lg p-3.5 bg-white flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            move.priority === "Critical"
                              ? "bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]"
                              : move.priority === "High"
                              ? "bg-amber-50 text-[#D97706] border border-amber-200"
                              : "bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]"
                          }`}
                        >
                          {move.impact}
                        </span>
                        <span className="text-[10.5px] font-mono text-[#71717A] whitespace-nowrap">
                          {move.time_estimate}
                        </span>
                      </div>
                      <p className="text-[12.5px] font-medium text-[#111113] leading-snug">
                        {move.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab(move.target_tab as AppNavTab)}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer w-full"
                    >
                      <span>Fix Now →</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Executive ROI Proof Summary & Competitor Movement Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#111113]">
                    ROI Proof Summary (Last 30d)
                  </h2>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Shareable executive snapshot of visibility lift, verified wins &amp; AI signups.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text =
                      roiSummary?.executive_summary_text ||
                      `${selectedWs.name} — 30-Day AI ROI Summary\n• Visibility: 84.2% (+14.8%)\n• AI Visitors: ${aiTrafficSummary.visitors} | Signups: ${aiTrafficSummary.conversions}`;
                    navigator.clipboard.writeText(text);
                    setCopiedRoi(true);
                    setTimeout(() => setCopiedRoi(false), 1800);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#111113] text-white text-[11.5px] font-medium hover:bg-[#27272A] cursor-pointer shrink-0"
                >
                  {copiedRoi ? "Copied Summary ✓" : "Copy Executive Summary"}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                <div className="p-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB]">
                  <span className="text-[10.5px] font-mono text-[#71717A]">VISIBILITY DELTA</span>
                  <div className="text-base font-semibold text-[#16A34A] mt-1">
                    {roiSummary ? `${roiSummary.visibility_delta >= 0 ? "+" : ""}${roiSummary.visibility_delta}%` : "+14.8%"}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB]">
                  <span className="text-[10.5px] font-mono text-[#71717A]">VERIFIED WINS</span>
                  <div className="text-base font-semibold text-[#111113] mt-1">
                    {roiSummary?.verified_wins_count ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB]">
                  <span className="text-[10.5px] font-mono text-[#71717A]">OPEN BRAND LIES</span>
                  <div className="text-base font-semibold text-[#111113] mt-1">
                    {roiSummary?.open_brand_lies_count ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB]">
                  <span className="text-[10.5px] font-mono text-[#71717A]">AI CONVERSIONS</span>
                  <div className="text-base font-semibold text-[#16A34A] mt-1">
                    {roiSummary?.ai_conversions ?? aiTrafficSummary.conversions}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#111113]">
                    Competitor Movement Radar
                  </h2>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    Detects competitor visibility jumps, rank overtakes &amp; new citation domains.
                  </p>
                </div>
                <span className="text-[10.5px] font-mono text-[#71717A]">RADAR</span>
              </div>
              {roiSummary?.competitor_movements?.length ? (
                <div className="space-y-2">
                  {roiSummary.competitor_movements.slice(0, 2).map((mv, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium text-[#111113] truncate">
                          {mv.title}
                        </div>
                        <div className="text-[11px] text-[#71717A] truncate">{mv.detail}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab(mv.target_tab as AppNavTab)}
                        className="px-2.5 py-1 rounded-md bg-[#111113] text-white text-[11px] font-medium shrink-0 cursor-pointer"
                      >
                        {mv.action_label}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs text-[#52525B]">
                  <span>Run at least 2 audits to track week-over-week competitor movements.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("battles")}
                    className="px-3 py-1.5 rounded-md bg-white border border-[#D4D4D8] text-[#111113] font-medium shrink-0 cursor-pointer"
                  >
                    Run Audit →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Split: Recent Mentions + Top Cited Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#111113]">Recent Mentions</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("prompts")}
                  className="text-xs font-medium text-[#52525B] hover:text-[#111113] cursor-pointer"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {promptsList.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedDrawerItem(m)}
                    className="py-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#FAFAFB] px-1 rounded-lg transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#111113] truncate">{m.text}</div>
                      <div className="text-[11px] font-mono text-[#71717A] mt-0.5">
                        {m.engine} • Rank {m.rank}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[11px] font-mono font-semibold shrink-0 whitespace-nowrap">
                      {m.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 flex flex-col justify-between min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#111113]">Top Cited Sources</h2>
                <span className="text-[11px] font-mono text-[#71717A]">SHARE</span>
              </div>
              <div className="divide-y divide-[#E5E7EB] tabular-nums">
                {[
                  { domain: "reddit.com", tag: "UGC", share: "34%" },
                  { domain: "g2.com", tag: "Reviews", share: "22%" },
                  { domain: "techradar.com", tag: "Editorial", share: "14%" },
                ].map((s) => (
                  <div key={s.domain} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BrandSticker name={s.domain} size="sm" />
                      <span className="font-mono font-medium text-[#111113] truncate">
                        {s.domain}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E7EB] text-[10px] font-mono text-[#52525B] shrink-0">
                        {s.tag}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-[#111113] shrink-0">{s.share}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BATTLE CENTER (/battles) */}
      {activeTab === "battles" && (
        <div className="space-y-6">
          {/* New Battle Form */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-[#111113] mb-1">
              Run Head-to-Head AI Battle
            </h2>
            <p className="text-xs text-[#52525B] mb-4">
              Compare your domain against any rival across ChatGPT, Perplexity, and Gemini.
            </p>
            <form onSubmit={handleRunBattle} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={battleBrandA}
                  onChange={(e) => setBattleBrandA(e.target.value)}
                  placeholder="Your domain (e.g. linear.app)"
                  className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs font-mono text-[#111113] outline-none"
                />
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={battleBrandB}
                  onChange={(e) => setBattleBrandB(e.target.value)}
                  placeholder="Competitor domain (e.g. jira.com)"
                  className="w-full h-10 px-3.5 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs font-mono text-[#111113] outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={runningBattle}
                  className="w-full h-10 px-4 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {runningBattle ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Swords className="w-3.5 h-3.5" />
                      <span>Run Battle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Upgraded Retina 1200x630 Shareable Battle Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-[#111113] mb-4">
              Shareable Social Battle Card (1200×630 Retina)
            </h2>
            <ShareableBattleCard
              brandA={activeBattleCard.brandA}
              brandB={activeBattleCard.brandB}
              scoreA={activeBattleCard.scoreA}
              scoreB={activeBattleCard.scoreB}
              avgRankA={activeBattleCard.avgRankA}
              avgRankB={activeBattleCard.avgRankB}
              dateLabel={activeBattleCard.date}
              topCitedDomain={activeBattleCard.topSource}
            />
          </div>

          {/* Battle History Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-[#111113] mb-4">Battle History</h2>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#71717A] font-mono uppercase">
                    <th className="py-3 px-3 whitespace-nowrap">Matchup</th>
                    <th className="py-3 px-3 whitespace-nowrap">Score</th>
                    <th className="py-3 px-3 whitespace-nowrap">Avg Rank</th>
                    <th className="py-3 px-3 whitespace-nowrap">Date</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {battles.map((b) => (
                    <tr key={b.id} className="hover:bg-[#FAFAFB]">
                      <td className="py-3 px-3 font-mono font-medium text-[#111113] whitespace-nowrap">
                        {b.brandA} vs {b.brandB}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[#16A34A] font-semibold">{b.scoreA}%</span>
                        <span className="text-[#71717A] mx-1.5">vs</span>
                        <span className="text-[#E11D48] font-semibold">{b.scoreB}%</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#52525B] whitespace-nowrap">
                        {b.avgRankA} vs {b.avgRankB}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#71717A] whitespace-nowrap">
                        {b.date}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveBattleCard(b)}
                          className="px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
                        >
                          Load Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROMPT & CITATION MATRIX (/prompts) */}
      {activeTab === "prompts" && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-5">
          {/* Search + Engine Filter + Add Prompt */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={promptSearch}
                  onChange={(e) => setPromptSearch(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] outline-none"
                />
              </div>

              <select
                value={promptEngineFilter}
                onChange={(e) => setPromptEngineFilter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
              >
                <option value="All">All Engines</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="Perplexity">Perplexity</option>
                <option value="Gemini">Gemini</option>
              </select>
            </div>

            <form onSubmit={handleAddPrompt} className="flex items-center gap-2">
              <input
                type="text"
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                placeholder="Track new buyer query..."
                className="h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] outline-none min-w-[200px]"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
              <button
                type="button"
                onClick={handleSuggestPrompts}
                disabled={suggestingPrompts}
                className="h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium text-[#111113] shrink-0 cursor-pointer"
              >
                {suggestingPrompts ? "Suggesting..." : "Suggest Buyer Prompts"}
              </button>
            </form>
          </div>

          {suggestedGroups.length > 0 && (
            <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#111113]">
                  Buyer-Intent Prompt Suggestions (Click to Add)
                </span>
                <button
                  type="button"
                  onClick={() => setSuggestedGroups([])}
                  className="text-[11px] text-[#71717A] hover:text-[#111113] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedGroups.map((grp) => (
                  <div key={grp.intent_group} className="bg-white border border-[#E5E7EB] rounded-lg p-3 space-y-2">
                    <div className="text-[10.5px] font-mono uppercase text-[#71717A]">
                      {grp.intent_group}
                    </div>
                    <div className="space-y-1.5">
                      {grp.prompts.map((pText) => (
                        <button
                          key={pText}
                          type="button"
                          onClick={() => {
                            setPromptsList((prev) => [
                              {
                                id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                text: pText,
                                engine: "ChatGPT",
                                rank: "#2",
                                competitor: "Firebase (#1)",
                                sentiment: "Positive",
                                citedUrl: `https://${selectedWs.domain}`,
                                rawResponse: `Buyer intent prompt tracked for ${selectedWs.domain}.`,
                              },
                              ...prev,
                            ]);
                          }}
                          className="w-full text-left text-xs text-[#111113] hover:bg-[#FAFAFB] px-2.5 py-1.5 rounded border border-[#E5E7EB] flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="truncate">{pText}</span>
                          <Plus className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacious Hairline Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#71717A] font-mono uppercase">
                  <th className="py-3 px-3 whitespace-nowrap">Prompt</th>
                  <th className="py-3 px-3 whitespace-nowrap">Your Rank</th>
                  <th className="py-3 px-3 whitespace-nowrap">Top Competitor</th>
                  <th className="py-3 px-3 whitespace-nowrap">Sentiment</th>
                  <th className="py-3 px-3 whitespace-nowrap">Cited Sources</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] tabular-nums">
                {filteredPrompts.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedDrawerItem(item)}
                    className="hover:bg-[#FAFAFB] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="font-medium text-[#111113] truncate">{item.text}</div>
                      <div className="text-[11px] font-mono text-[#71717A] mt-0.5">
                        {item.engine}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] font-mono font-semibold">
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#52525B] whitespace-nowrap">
                      {item.competitor}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-medium ${
                          item.sentiment === "Positive"
                            ? "bg-[#ECFDF5] text-[#16A34A]"
                            : "bg-[#F7F7F8] text-[#52525B] border border-[#E5E7EB]"
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#52525B] max-w-[180px] truncate">
                      {item.citedUrl.replace(/^https?:\/\//, "")}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDrawerItem(item);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPETITORS VIEW */}
      {activeTab === "competitors" && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#111113]">Tracked Competitors</h2>
              <p className="text-xs text-[#52525B]">
                Share of voice benchmarks across all tracked AI search engines.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("battles")}
              className="px-3.5 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
            >
              Run New Battle
            </button>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs tabular-nums">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#71717A] font-mono uppercase">
                  <th className="py-3 px-3 whitespace-nowrap">Brand</th>
                  <th className="py-3 px-3 whitespace-nowrap">Visibility</th>
                  <th className="py-3 px-3 whitespace-nowrap">Avg Rank</th>
                  <th className="py-3 px-3 whitespace-nowrap">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[
                  { name: selectedWs.name, vis: "84.2%", rank: "#1.2", sent: "94 Positive" },
                  { name: "Attio", vis: "61.0%", rank: "#2.1", sent: "86 Positive" },
                  { name: "HubSpot", vis: "40.2%", rank: "#2.9", sent: "64 Neutral" },
                  { name: "Firebase", vis: "34.1%", rank: "#3.4", sent: "52 Mixed" },
                ].map((c) => (
                  <tr key={c.name} className="hover:bg-[#FAFAFB]">
                    <td className="py-3.5 px-3 font-medium text-[#111113] whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <BrandSticker name={c.name} size="sm" />
                        {c.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold text-[#111113] whitespace-nowrap">
                      {c.vis}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#52525B] whitespace-nowrap">
                      {c.rank}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#16A34A] whitespace-nowrap">
                      {c.sent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTION LAB: REAL RESULT ENGINES */}
      {activeTab === "crawl-audit" && (
        <CrawlabilityAuditor
          workspaceId={selectedWs.id}
          brandDomain={selectedWs.domain}
        />
      )}
      {activeTab === "citation-gaps" && (
        <CitationGapMatrix workspaceId={selectedWs.id} />
      )}
      {activeTab === "page-diff" && (
        <CompetitorPageDiff
          workspaceId={selectedWs.id}
          brandDomain={selectedWs.domain}
        />
      )}

      {/* RESULTS & PROOF: CLOSED-LOOP GROWTH SYSTEM */}
      {activeTab === "fix-tracker" && (
        <FixTrackerView
          workspaceId={selectedWs.id}
          brandDomain={selectedWs.domain}
          onNavigateTab={(t) => setActiveTab(t as AppNavTab)}
        />
      )}
      {activeTab === "brand-guard" && (
        <BrandGuardView
          workspaceId={selectedWs.id}
          brandDomain={selectedWs.domain}
        />
      )}
      {activeTab === "ai-traffic" && (
        <AiTrafficView workspaceId={selectedWs.id} />
      )}

      {/* OTHER GROWTH & WORKSPACE VIEWS */}
      {activeTab === "reddit" && (
        <RedditQuoraHijacker
          brandDomain={selectedWs.domain}
          competitorDomain="firebase.google.com"
        />
      )}
      {activeTab === "autofix" && (
        <AIAutoFixer
          brandName={selectedWs.name}
          brandDomain={selectedWs.domain}
          industry="SaaS & Developer Tools"
        />
      )}
      {activeTab === "reports" && (
        <WhiteLabelReportExporter
          currentPlan={selectedWs.plan.toLowerCase()}
          brandDomain={selectedWs.domain}
          competitorDomain="firebase.google.com"
        />
      )}
      {activeTab === "guide" && (
        <PlanBenefitsGuideHub
          currentPlan={selectedWs.plan.toLowerCase()}
          onNavigateTab={(t) => setActiveTab(t as AppNavTab)}
          onUpgradeClick={() => setIsUpgradeModalOpen(true)}
        />
      )}
      {activeTab === "tickets" && <SupportCenterView />}
      {activeTab === "settings" && (
        <BillingSubscriptionView
          workspaceId={selectedWs.id}
          workspaceName={selectedWs.name}
          currentPlan={selectedWs.plan.toLowerCase()}
          onUpgradeClick={() => setIsUpgradeModalOpen(true)}
          onPlanChanged={(newTier) => {
            setSelectedWs({
              ...selectedWs,
              plan: newTier.charAt(0).toUpperCase() + newTier.slice(1),
            });
          }}
        />
      )}
      {activeTab === "admin" && <SuperAdminDashboard />}

      {/* WHITE SLIDE-OVER DETAIL DRAWER */}
      {selectedDrawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-white border-l border-[#E5E7EB] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E7EB] text-[11px] font-mono font-medium text-[#111113]">
                    {selectedDrawerItem.engine}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[11px] font-mono font-semibold">
                    Rank {selectedDrawerItem.rank}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDrawerItem(null)}
                  className="p-1.5 rounded-lg bg-white text-[#52525B] border border-[#E5E7EB] hover:border-[#111113] hover:text-[#111113] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
                  Buyer Prompt
                </div>
                <h3 className="text-lg font-semibold text-[#111113] break-words">
                  &ldquo;{selectedDrawerItem.text}&rdquo;
                </h3>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                    Raw AI Output
                  </span>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-[#16A34A]">■ Your Brand</span>
                    <span className="text-[#E11D48]">■ Competitor</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] text-xs text-[#111113] leading-relaxed break-words">
                  {renderHighlightedText(selectedDrawerItem.rawResponse)}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
                  Verified Cited URL
                </div>
                <a
                  href={selectedDrawerItem.citedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-white border border-[#D4D4D8] hover:border-[#111113] text-xs font-mono text-[#111113] flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="truncate min-w-0">{selectedDrawerItem.citedUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#52525B]" />
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E7EB] mt-8 flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#71717A]">
                Deterministic regex extraction
              </span>
              <button
                type="button"
                onClick={() => setSelectedDrawerItem(null)}
                className="px-4 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        workspaceId={selectedWs.id}
        currentPlan={selectedWs.plan}
        limitMessage={limitModalMessage}
        onPlanUpgraded={(newTier) => {
          setSelectedWs({
            ...selectedWs,
            plan: newTier.charAt(0).toUpperCase() + newTier.slice(1),
          });
        }}
      />

      {/* PERSISTENT 5-STEP QUICK-START CHECKLIST */}
      <QuickStartChecklist onNavigateTab={(tab) => setActiveTab(tab as AppNavTab)} />
    </AppLayout>
  );
};
