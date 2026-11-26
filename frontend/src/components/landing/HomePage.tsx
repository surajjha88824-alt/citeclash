import React from "react";
import { Navbar } from "./Navbar";
import { HeroDashboardShowcase } from "./HeroDashboardShowcase";
import { LogoTrustStrip } from "./LogoTrustStrip";
import { MetricTabsShowcase } from "./MetricTabsShowcase";
import { BentoFragmentGrid } from "./BentoFragmentGrid";
import { HowItWorksTimeline } from "./HowItWorksTimeline";
import { ReportsScatterSection } from "./ReportsScatterSection";
import { PromptStreamSection } from "./PromptStreamSection";
import { BattleCardSpotlight } from "./BattleCardSpotlight";
import { ActionableFixerSpotlight } from "./ActionableFixerSpotlight";
import { UseCasesAndCompare } from "./UseCasesAndCompare";
import { PricingSection } from "./PricingSection";
import { ProofAndFAQ } from "./ProofAndFAQ";
import { DarkCTAAndFooter } from "./DarkCTAAndFooter";

interface HomePageProps {
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenApp: () => void;
  onNavigate?: (path: string) => void;
  user?: any;
  isDark?: boolean;
  toggleTheme?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenAuth,
  onOpenApp,
  onNavigate,
  user,
}) => {
  return (
    <div className="min-h-screen w-full bg-white text-[#111113] selection:bg-[#111113] selection:text-white font-sans antialiased overflow-x-clip">
      {/* 1. Fixed Architectural Topbar */}
      <Navbar
        onOpenAuth={onOpenAuth}
        onOpenApp={onOpenApp}
        onNavigate={onNavigate}
        user={user}
      />

      {/* Main Content Sections */}
      <main>
        {/* 2. Peec.ai-Style Centered Hero + Interactive Dashboard Panel */}
        <HeroDashboardShowcase
          onOpenAuth={onOpenAuth}
          onOpenApp={onOpenApp}
        />

        {/* 3. Two-Row Hairline Engine & Industry Strip */}
        <LogoTrustStrip />

        {/* 4. 4-Tab Interactive Product Deep-Dive */}
        <MetricTabsShowcase />

        {/* 5. Architectural 1px-Divider Bento Grid */}
        <BentoFragmentGrid />

        {/* 6. Scroll-Linked Sticky 4-Step Walkthrough */}
        <HowItWorksTimeline />

        {/* 7. Interactive Visibility vs. Sentiment Scatter Chart */}
        <ReportsScatterSection />

        {/* 8. Dual-Row Live Buyer Prompt Marquee */}
        <PromptStreamSection />

        {/* 9. Viral Head-to-Head Battle Card Spotlight */}
        <BattleCardSpotlight onOpenAuth={onOpenAuth} />

        {/* 10. Reddit Hijacker & 1-Click llms.txt Auto-Fixer */}
        <ActionableFixerSpotlight />

        {/* 11. Team Use Cases + Competitor Comparison Table */}
        <UseCasesAndCompare />

        {/* 12. AI Revenue Leak Calculator + 4 Equal-Height Pricing Cards */}
        <PricingSection onOpenAuth={onOpenAuth} />

        {/* 13. Staggered 3-Column Testimonials + Hairline FAQ Accordion */}
        <ProofAndFAQ />
      </main>

      {/* 14. High-Contrast Deep Carbon Black Final CTA & Mega Footer */}
      <DarkCTAAndFooter
        onOpenAuth={onOpenAuth}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default HomePage;
