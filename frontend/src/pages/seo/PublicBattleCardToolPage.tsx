import React from "react";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { SeoHead } from "../../components/seo/SeoHead";
import { BattleScanner } from "../../components/battle/BattleScanner";

interface PublicBattleCardToolPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export const PublicBattleCardToolPage: React.FC<PublicBattleCardToolPageProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={onOpenAuth}>
      <SeoHead
        title="Free AI Battle Card Generator (1200×630 Viral VS PNG)"
        description="Run a free 15-second head-to-head AI visibility battle across ChatGPT, Perplexity, and Gemini and export a Retina 1200×630 Battle Card PNG."
        canonicalPath="/tools/ai-battle-card"
        pageType="tool"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Free Tools", url: "/compare" },
          { name: "AI Battle Card", url: "/tools/ai-battle-card" },
        ]}
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-14 px-4 sm:px-6">
        <div className="max-w-[1060px] mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Free Public Battle Tool
            </span>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.035em] text-[#111113]">
              AI Search Head-to-Head Battle Card
            </h1>
            <p className="text-[15px] text-[#52525B]">
              Compare your brand against any competitor across ChatGPT, Perplexity, and Gemini and export a Retina 1200×630 PNG.
            </p>
          </div>

          <BattleScanner />
        </div>
      </section>
    </PublicLayout>
  );
};
