import React, { useState, useEffect } from "react";
import { HomePage } from "./components/landing/HomePage";
import { AuthSplitView } from "./components/auth/AuthSplitView";
import { AppShell } from "./components/dashboard/AppShell";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ComplianceModal, type ComplianceTab } from "./components/compliance/ComplianceModal";
import { OnboardingWizardModal } from "./components/onboarding/OnboardingWizardModal";
import { SeoSchemaHead } from "./components/seo/SeoSchemaHead";
import { PublicBattlePage } from "./components/seo/PublicBattlePage";
import { StandaloneLlmsGenerator } from "./components/seo/StandaloneLlmsGenerator";
import { AeoGuidesHub } from "./components/seo/AeoGuidesHub";
import { LegalAndContactPage } from "./components/seo/LegalAndContactPage";
import { CompareCompetitorPage } from "./pages/seo/CompareCompetitorPage";
import { AlternativesPillarPage } from "./pages/seo/AlternativesPillarPage";
import { EngineTrackerPage } from "./pages/seo/EngineTrackerPage";
import { CompareHubPage } from "./pages/seo/CompareHubPage";
import { PublicCrawlerCheckerPage } from "./pages/seo/PublicCrawlerCheckerPage";
import { PublicBattleCardToolPage } from "./pages/seo/PublicBattleCardToolPage";
import { apiClient } from "./lib/api";

interface PublicRouteState {
  type:
    | "battle"
    | "compare-hub"
    | "compare"
    | "alternatives"
    | "tracker"
    | "tools"
    | "crawler-checker"
    | "battle-card-tool"
    | "guides"
    | "privacy"
    | "terms"
    | "refund"
    | "contact"
    | null;
  slug?: string;
}

export function App() {
  // Theme state: dark default (#09090B)
  const [isDark, setIsDark] = useState(true);

  // View state: landing page vs authenticated app shell
  const [activeView, setActiveView] = useState<"landing" | "app">("landing");

  // Auth Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("signup");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");
  const [activeUser, setActiveUser] = useState<any>(null);

  // Compliance & Payment Trust Disclosures
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [complianceTab] = useState<ComplianceTab>("privacy");

  // 3-Step First-Time User Onboarding Wizard
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Phase 9: Programmatic Route State
  const [publicRoute, setPublicRoute] = useState<PublicRouteState>({ type: null });

  const resolveRoute = (pathname: string) => {
    const clean = pathname.toLowerCase().trim();

    if (clean.startsWith("/battle/")) {
      const slug = clean.replace("/battle/", "").split("/")[0].split("?")[0];
      setPublicRoute({ type: "battle", slug });
    } else if (clean === "/compare" || clean === "/compare/") {
      setPublicRoute({ type: "compare-hub" });
    } else if (clean.startsWith("/compare/")) {
      const slug = clean.replace("/compare/", "").split("/")[0].split("?")[0];
      setPublicRoute({ type: "compare", slug });
    } else if (clean.startsWith("/alternatives/")) {
      const slug = clean.replace("/alternatives/", "").split("/")[0].split("?")[0];
      setPublicRoute({ type: "alternatives", slug });
    } else if (clean === "/best-geo-tools" || clean === "/best-geo-tools/") {
      setPublicRoute({ type: "alternatives", slug: "best-geo-tools" });
    } else if (clean.startsWith("/trackers/")) {
      const slug = clean.replace("/trackers/", "").split("/")[0].split("?")[0];
      setPublicRoute({ type: "tracker", slug });
    } else if (
      clean === "/tools/ai-crawler-checker" ||
      clean === "/tools/geo-readiness-checker"
    ) {
      setPublicRoute({ type: "crawler-checker" });
    } else if (clean === "/tools/ai-battle-card") {
      setPublicRoute({ type: "battle-card-tool" });
    } else if (clean.startsWith("/tools/llms-txt-generator") || clean === "/tools") {
      setPublicRoute({ type: "tools", slug: "llms-txt-generator" });
    } else if (clean.startsWith("/guides/")) {
      const slug = clean.replace("/guides/", "").split("/")[0].split("?")[0];
      setPublicRoute({ type: "guides", slug });
    } else if (clean === "/guides" || clean === "/guides/") {
      setPublicRoute({ type: "guides", slug: undefined });
    } else if (clean === "/login") {
      setAuthMode("login");
      setShowAuthModal(true);
      setPublicRoute({ type: null });
    } else if (clean === "/signup") {
      setAuthMode("signup");
      setShowAuthModal(true);
      setPublicRoute({ type: null });
    } else if (clean === "/forgot-password") {
      setAuthMode("forgot");
      setShowAuthModal(true);
      setPublicRoute({ type: null });
    } else if (clean === "/onboarding") {
      setShowOnboardingWizard(true);
      setPublicRoute({ type: null });
    } else if (
      clean === "/dashboard" ||
      clean === "/battles" ||
      clean === "/prompts" ||
      clean === "/crawl-audit" ||
      clean === "/citation-gaps" ||
      clean === "/page-diff" ||
      clean === "/fix-tracker" ||
      clean === "/brand-guard" ||
      clean === "/ai-traffic"
    ) {
      if (!localStorage.getItem("citeclash_token")) {
        setAuthMode("login");
        setShowAuthModal(true);
        setActiveView("landing");
      } else {
        setActiveView("app");
      }
      setPublicRoute({ type: null });
    } else if (clean === "/battle-cards") {
      setPublicRoute({ type: "battle", slug: "linear-vs-jira" });
    } else if (clean.includes("privacy")) {
      setPublicRoute({ type: "privacy" });
    } else if (clean.includes("terms")) {
      setPublicRoute({ type: "terms" });
    } else if (clean.includes("refund")) {
      setPublicRoute({ type: "refund" });
    } else if (clean.includes("contact")) {
      setPublicRoute({ type: "contact" });
    } else {
      setPublicRoute({ type: null });
    }
  };

  const handleNavigate = (path: string) => {
    window.history.pushState({}, "", path);
    resolveRoute(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Theme switcher handler
  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
      return next;
    });
  };

  useEffect(() => {
    // Default ensure dark mode
    document.documentElement.classList.add("dark");

    // Check existing token
    const token = localStorage.getItem("citeclash_token");
    if (token) {
      apiClient
        .get("/auth/me")
        .then((res) => setActiveUser(res.data))
        .catch(() => localStorage.removeItem("citeclash_token"));
    }

    // Resolve initial route from URL path
    resolveRoute(window.location.pathname);

    // Listen to browser forward/backward navigation
    const handlePopState = () => {
      resolveRoute(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccessMsg("");

    try {
      const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const payload: any = {
        email: authEmail,
        password: authPassword,
      };
      if (authMode === "signup") {
        payload.full_name = authEmail.split("@")[0] || "Founding Member";
      }

      const isNewUser = authMode === "signup";
      const res = await apiClient.post(endpoint, payload);
      localStorage.setItem("citeclash_token", res.data.access_token);
      setActiveUser(res.data.user);
      setAuthSuccessMsg(`Welcome, ${res.data.user.email}!`);
      setTimeout(() => {
        setShowAuthModal(false);
        if (isNewUser || localStorage.getItem("rankpulse_onboarded") !== "true") {
          setShowOnboardingWizard(true);
        } else {
          setActiveView("app");
        }
      }, 700);
    } catch (err: any) {
      setAuthError(err.response?.data?.error?.message || "Authentication failed. Check credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("citeclash_token");
    setActiveUser(null);
    setActiveView("landing");
  };

  // If App Shell view is active, render dashboard shell
  if (activeView === "app") {
    return (
      <ErrorBoundary>
        <AppShell
          activeUser={activeUser}
          onBackToLanding={() => setActiveView("landing")}
          onLogout={handleLogout}
        />
        <OnboardingWizardModal
          isOpen={showOnboardingWizard}
          onClose={() => setShowOnboardingWizard(false)}
          onComplete={() => {
            setShowOnboardingWizard(false);
            setActiveView("app");
          }}
          initialBrand={activeUser?.full_name?.split(" ")[0] || ""}
        />
        <ComplianceModal
          isOpen={showComplianceModal}
          onClose={() => setShowComplianceModal(false)}
          initialTab={complianceTab}
        />
      </ErrorBoundary>
    );
  }

  // Phase 9: Programmatic Public Pages
  if (publicRoute.type === "battle" && publicRoute.slug) {
    return (
      <PublicBattlePage
        slug={publicRoute.slug}
        onNavigateHome={() => handleNavigate("/")}
        onNavigate={handleNavigate}
      />
    );
  }

  if (publicRoute.type === "compare-hub") {
    return (
      <CompareHubPage
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          if (mode) setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
    );
  }

  if (publicRoute.type === "compare" && publicRoute.slug) {
    return (
      <CompareCompetitorPage
        slug={publicRoute.slug}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          if (mode) setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
    );
  }

  if (publicRoute.type === "alternatives" && publicRoute.slug) {
    return (
      <AlternativesPillarPage
        slug={publicRoute.slug}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          if (mode) setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
    );
  }

  if (publicRoute.type === "tracker" && publicRoute.slug) {
    return (
      <EngineTrackerPage
        slug={publicRoute.slug}
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          if (mode) setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
    );
  }

  if (publicRoute.type === "crawler-checker") {
    return (
      <PublicCrawlerCheckerPage
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          if (mode) setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
    );
  }

  if (publicRoute.type === "battle-card-tool") {
    return (
      <PublicBattleCardToolPage
        onNavigate={handleNavigate}
        onOpenAuth={(mode) => {
          if (mode) setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
    );
  }

  if (publicRoute.type === "tools") {
    return (
      <StandaloneLlmsGenerator
        onNavigateHome={() => handleNavigate("/")}
        onNavigate={handleNavigate}
      />
    );
  }

  if (publicRoute.type === "guides") {
    return (
      <AeoGuidesHub
        slug={publicRoute.slug}
        onNavigateHome={() => handleNavigate("/")}
        onNavigate={handleNavigate}
      />
    );
  }

  if (
    publicRoute.type === "privacy" ||
    publicRoute.type === "terms" ||
    publicRoute.type === "refund" ||
    publicRoute.type === "contact"
  ) {
    return (
      <LegalAndContactPage
        pageType={publicRoute.type}
        onNavigate={handleNavigate}
      />
    );
  }

  // Otherwise render the Ultra-Premium 14-Section Master Landing Page
  return (
    <div className="min-h-screen bg-white text-[#111113] font-sans antialiased selection:bg-[#111113] selection:text-white">
      <SeoSchemaHead
        title="CiteClash — AI Search Visibility & GEO Competitor Battle-Card Platform"
        description="Monitor and dominate AI search citations across ChatGPT, Perplexity, Google Gemini, and Groq. 100% deterministic ranking, Reddit thread hijacker, and llms.txt auto-fixer."
        schemaType="SoftwareApplication"
      />

      <HomePage
        onOpenAuth={(mode) => {
          if (mode) setAuthMode(mode);
          setShowAuthModal(true);
        }}
        onOpenApp={() => {
          if (!activeUser && !localStorage.getItem("citeclash_token")) {
            setAuthMode("signup");
            setShowAuthModal(true);
            return;
          }
          setActiveView("app");
        }}
        onNavigate={handleNavigate}
        user={activeUser}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* COMPLIANCE & TRUST DISCLOSURES MODAL */}
      <ComplianceModal
        isOpen={showComplianceModal}
        onClose={() => setShowComplianceModal(false)}
        initialTab={complianceTab}
      />

      {/* 3-STEP FIRST-TIME USER ONBOARDING WIZARD */}
      <OnboardingWizardModal
        isOpen={showOnboardingWizard}
        onClose={() => setShowOnboardingWizard(false)}
        onComplete={() => {
          setShowOnboardingWizard(false);
          setActiveView("app");
        }}
        initialBrand={activeUser?.full_name?.split(" ")[0] || ""}
      />

      {/* SPLIT-SCREEN SWISS AUTHENTICATION VIEW */}
      <AuthSplitView
        isOpen={showAuthModal}
        mode={authMode}
        onModeChange={(m) => setAuthMode(m)}
        onClose={() => setShowAuthModal(false)}
        email={authEmail}
        onEmailChange={setAuthEmail}
        password={authPassword}
        onPasswordChange={setAuthPassword}
        loading={authLoading}
        error={authError}
        successMsg={authSuccessMsg}
        onSubmit={handleAuthSubmit}
      />
    </div>
  );
}

export default App;
