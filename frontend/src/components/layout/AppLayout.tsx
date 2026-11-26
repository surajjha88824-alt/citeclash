import React, { useState } from "react";
import {
  LayoutDashboard,
  Swords,
  Terminal,
  Users,
  MessageSquare,
  Wrench,
  FileText,
  BookOpen,
  LifeBuoy,
  Settings,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  LogOut,
  Plus,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Target,
  GitCompare,
  Activity,
} from "lucide-react";

export type AppNavTab =
  | "dashboard"
  | "battles"
  | "prompts"
  | "competitors"
  | "crawl-audit"
  | "citation-gaps"
  | "page-diff"
  | "fix-tracker"
  | "brand-guard"
  | "ai-traffic"
  | "reddit"
  | "autofix"
  | "reports"
  | "guide"
  | "tickets"
  | "settings"
  | "admin";

export interface WorkspaceOption {
  id: string;
  name: string;
  plan: string;
  domain: string;
}

interface AppLayoutProps {
  activeTab: AppNavTab;
  onTabChange: (tab: AppNavTab) => void;
  workspaces: WorkspaceOption[];
  selectedWs: WorkspaceOption;
  onSelectWs: (ws: WorkspaceOption) => void;
  activeUser: any;
  onBackToLanding: () => void;
  onLogout: () => void;
  onOpenUpgrade: () => void;
  onNewAudit: () => void;
  promptsUsed?: number;
  promptLimit?: number;
  children: React.ReactNode;
}

const tabTitles: Record<AppNavTab, string> = {
  dashboard: "Overview",
  battles: "Battle Center",
  prompts: "Prompt Matrix",
  competitors: "Competitors",
  "crawl-audit": "AI Crawlability",
  "citation-gaps": "Citation Gaps",
  "page-diff": "Page Diff",
  "fix-tracker": "Fix Loop",
  "brand-guard": "Brand Lie Guard",
  "ai-traffic": "AI Traffic",
  reddit: "Reddit Hijacker",
  autofix: "AI Auto-Fixer",
  reports: "PDF Reports",
  guide: "User Guide",
  tickets: "Support Tickets",
  settings: "Billing & Settings",
  admin: "Admin Panel",
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  workspaces,
  selectedWs,
  onSelectWs,
  activeUser,
  onBackToLanding,
  onLogout,
  onOpenUpgrade,
  onNewAudit,
  promptsUsed = 18,
  promptLimit = 50,
  children,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);

  const usagePct = Math.min(100, Math.round((promptsUsed / Math.max(promptLimit, 1)) * 100));

  const groups: Array<{
    title: string;
    items: Array<{
      id: AppNavTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: string;
    }>;
  }> = [
    {
      title: "CORE",
      items: [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "battles", label: "Battle Center", icon: Swords },
        { id: "prompts", label: "Prompt Matrix", icon: Terminal },
        { id: "competitors", label: "Competitors", icon: Users },
      ],
    },
    {
      title: "ACTION LAB",
      items: [
        { id: "crawl-audit", label: "AI Crawlability", icon: ShieldCheck, badge: "Live" },
        { id: "citation-gaps", label: "Citation Gaps", icon: Target },
        { id: "page-diff", label: "Page Diff", icon: GitCompare },
      ],
    },
    {
      title: "RESULTS & PROOF",
      items: [
        { id: "fix-tracker", label: "Fix Loop", icon: CheckCircle2 },
        { id: "brand-guard", label: "Brand Lie Guard", icon: ShieldAlert },
        { id: "ai-traffic", label: "AI Traffic", icon: Activity },
      ],
    },
    {
      title: "GROWTH",
      items: [
        { id: "reddit", label: "Reddit Hijacker", icon: MessageSquare, badge: "Hot" },
        { id: "autofix", label: "AI Auto-Fixer", icon: Wrench },
        { id: "reports", label: "PDF Reports", icon: FileText },
      ],
    },
    {
      title: "WORKSPACE",
      items: [
        { id: "guide", label: "User Guide", icon: BookOpen },
        { id: "tickets", label: "Support Tickets", icon: LifeBuoy },
        { id: "settings", label: "Billing & Settings", icon: Settings },
      ],
    },
  ];

  if (activeUser?.role === "super_admin") {
    groups.push({
      title: "ADMIN",
      items: [{ id: "admin", label: "Admin Panel", icon: ShieldAlert }],
    });
  }

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full bg-[#FAFAFB] text-[#111113]">
      {/* Top: Brand + Workspace Switcher + Grouped Nav */}
      <div className="p-4 space-y-5 overflow-y-auto">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#111113] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-white">
                <path
                  d="M4 14L10 4L16 14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 11.5H13.5"
                  stroke="#16A34A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.025em] text-[#111113]">
              CiteClash
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-white text-[#52525B] border border-[#E5E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#111113] flex items-center justify-between gap-2 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-md bg-[#111113] text-white text-[11px] font-mono font-semibold flex items-center justify-center shrink-0">
                {selectedWs.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-[#111113] truncate">
                  {selectedWs.name}
                </div>
                <div className="text-[10px] font-mono text-[#71717A] truncate">
                  {selectedWs.plan} Plan
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
          </button>

          {wsDropdownOpen && (
            <div className="absolute left-0 right-0 top-13 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-1.5 z-40">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    onSelectWs(ws);
                    setWsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F7F7F8] flex items-center justify-between gap-2 text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#111113] truncate">{ws.name}</div>
                    <div className="text-[10px] font-mono text-[#71717A] truncate">
                      {ws.domain}
                    </div>
                  </div>
                  {selectedWs.id === ws.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav className="space-y-5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#71717A]">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                      isActive
                        ? "bg-white border border-[#E5E7EB] text-[#111113] shadow-xs font-medium"
                        : "text-[#52525B] hover:text-[#111113] hover:bg-[#F1F1F3] border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#111113]" : "text-[#71717A]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[10px] font-mono font-semibold shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom: Compact Usage Meter + Back / Sign Out */}
      <div className="p-4 border-t border-[#E5E7EB] space-y-3 bg-[#FAFAFB]">
        <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] space-y-2 tabular-nums">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#52525B] font-medium">
              {promptsUsed} / {promptLimit} prompts used
            </span>
            <button
              type="button"
              onClick={onOpenUpgrade}
              className="text-xs font-semibold text-[#111113] hover:underline cursor-pointer"
            >
              Upgrade
            </button>
          </div>
          <div className="w-full h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#111113] rounded-full"
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 text-[#52525B] hover:text-[#111113] font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Website</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1 text-[#E11D48] hover:underline font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7F7F8] text-[#111113] font-sans">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E5E7EB] bg-[#FAFAFB] sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full border-r border-[#E5E7EB] bg-[#FAFAFB] shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#71717A] hidden sm:inline">CiteClash</span>
              <span className="text-[#D4D4D8] hidden sm:inline">/</span>
              <h1 className="font-semibold text-[#111113] tracking-[-0.025em] truncate">
                {tabTitles[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNewAudit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-xs font-medium transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Audit</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
              <div className="w-7 h-7 rounded-full bg-[#111113] text-white text-xs font-mono font-semibold flex items-center justify-center">
                {activeUser?.email?.[0]?.toUpperCase() || "F"}
              </div>
              <span className="text-xs font-medium text-[#52525B] max-w-[140px] truncate">
                {activeUser?.email || "founder@linear.app"}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1320px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
