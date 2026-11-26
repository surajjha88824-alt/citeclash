import React from "react";
import { ArrowRight, BookOpen, Scale, Sparkles, Wrench } from "lucide-react";

interface RelatedInternalLinksProps {
  currentSlug?: string;
  onNavigate?: (path: string) => void;
}

export const RelatedInternalLinks: React.FC<RelatedInternalLinksProps> = ({ currentSlug, onNavigate }) => {
  const links = [
    {
      category: "AEO & GEO Guides",
      icon: BookOpen,
      iconColor: "text-blue-400",
      items: [
        {
          slug: "complete-guide-to-generative-engine-optimization-geo",
          title: "The Complete Guide to Generative Engine Optimization (GEO)",
          desc: "How AI search engines select citations and rank brands in 2026.",
          path: "/guides/complete-guide-to-generative-engine-optimization-geo",
        },
        {
          slug: "how-to-install-llms-txt-guide",
          title: "How to Install llms.txt on Your Website (Full Spec)",
          desc: "Step-by-step implementation guide for LLM crawlers.",
          path: "/guides/how-to-install-llms-txt-guide",
        },
      ],
    },
    {
      category: "Platform Comparisons",
      icon: Scale,
      iconColor: "text-amber-400",
      items: [
        {
          slug: "citeclash-vs-peec-ai",
          title: "CiteClash vs Peec AI",
          desc: "Deterministic Python regex scoring vs probabilistic LLM checks.",
          path: "/compare/citeclash-vs-peec-ai",
        },
        {
          slug: "citeclash-vs-otterly-ai",
          title: "CiteClash vs Otterly.AI",
          desc: "Compare AI engine coverage, Reddit thread monitoring, and pricing.",
          path: "/compare/citeclash-vs-otterly-ai",
        },
        {
          slug: "citeclash-vs-profound",
          title: "CiteClash vs Profound",
          desc: "Enterprise GEO intelligence with prompt battle-cards starting at $49.",
          path: "/compare/citeclash-vs-profound",
        },
      ],
    },
    {
      category: "Public Battle Permalinks & Tools",
      icon: Wrench,
      iconColor: "text-emerald-400",
      items: [
        {
          slug: "llms-txt-generator",
          title: "Free llms.txt Generator Tool",
          desc: "Generate compliant llms.txt and llms-full.txt files in 10s.",
          path: "/tools/llms-txt-generator",
        },
        {
          slug: "hubspot-vs-salesforce-ai-visibility",
          title: "HubSpot vs Salesforce AI Visibility",
          desc: "CRM Battle Card audit across ChatGPT, Perplexity, and Gemini.",
          path: "/battle/hubspot-vs-salesforce-ai-visibility",
        },
        {
          slug: "supabase-vs-firebase-ai-visibility",
          title: "Supabase vs Firebase AI Visibility",
          desc: "Database Battle Card benchmark in Generative Overviews.",
          path: "/battle/supabase-vs-firebase-ai-visibility",
        },
      ],
    },
  ];

  const handleClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="mt-20 pt-12 border-t border-[#E5E7EB]">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h3 className="text-xl font-bold text-white font-heading">
          Explore Related AI Comparisons, Guides & Tools
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {links.map((section, idx) => {
          const SectionIcon = section.icon;
          const filteredItems = section.items.filter((item) => item.slug !== currentSlug);

          return (
            <div
              key={idx}
              className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-[#E5E7EB] transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <SectionIcon className={`w-4 h-4 ${section.iconColor}`} />
                <span className="text-xs uppercase font-semibold tracking-wider text-zinc-400">
                  {section.category}
                </span>
              </div>

              <div className="space-y-4">
                {filteredItems.slice(0, 3).map((item) => (
                  <a
                    key={item.slug}
                    href={item.path}
                    onClick={(e) => handleClick(e, item.path)}
                    className="group block p-2.5 rounded-lg hover:bg-[#F7F7F8] transition-all"
                  >
                    <div className="flex items-center justify-between text-sm font-medium text-zinc-200 group-hover:text-blue-400">
                      <span>{item.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all text-blue-400 shrink-0 ml-2" />
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
