import React, { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  ArrowUpDown,
} from "lucide-react";
import { apiClient } from "../../lib/api";
import { HowItWorksBanner } from "../common/HowItWorksBanner";
import { BrandSticker } from "../landing/BrandStickers";

interface ThreadItem {
  id: string;
  platform: "reddit" | "quora";
  subreddit: string;
  title: string;
  url: string;
  relevance_score: number;
  competitor_mentioned: string;
  upvotes: number;
  comments_count: number;
  ai_source_weight: string;
  context: string;
}

interface RedditQuoraHijackerProps {
  brandDomain: string;
  competitorDomain: string;
}

export const RedditQuoraHijacker: React.FC<RedditQuoraHijackerProps> = ({
  brandDomain,
  competitorDomain,
}) => {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<"all" | "reddit" | "quora">("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeThread, setActiveThread] = useState<ThreadItem | null>(null);
  const [draftReply, setDraftReply] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/growth/hijacker/threads", {
        params: {
          brand_domain: brandDomain,
          competitor_domain: competitorDomain,
        },
      });
      setThreads(res.data.threads || []);
    } catch {
      const compName = competitorDomain.split(".")[0];
      setThreads([
        {
          id: "th-1",
          platform: "reddit",
          subreddit: "r/SaaS",
          title: `What is the best modern alternative to ${compName} for Postgres apps?`,
          url: "https://reddit.com/r/SaaS/comments/modern_alternatives",
          relevance_score: 98,
          competitor_mentioned: compName,
          upvotes: 342,
          comments_count: 89,
          ai_source_weight: "Cited by ChatGPT & Perplexity",
          context: `OP is building a multi-tenant B2B platform and finding ${competitorDomain} pricing too rigid.`,
        },
        {
          id: "th-2",
          platform: "reddit",
          subreddit: "r/webdev",
          title: `Has anyone migrated from ${compName} to an open-source database stack? Pros & Cons?`,
          url: "https://reddit.com/r/webdev/comments/migrating_lessons",
          relevance_score: 94,
          competitor_mentioned: compName,
          upvotes: 521,
          comments_count: 142,
          ai_source_weight: "Cited by Perplexity AI",
          context: "Active developer discussion comparing pricing traps at 1M monthly active users.",
        },
        {
          id: "th-3",
          platform: "quora",
          subreddit: "Quora Dev",
          title: "Which BaaS platform is best for scaling enterprise SaaS without vendor lock-in?",
          url: "https://quora.com/Which-BaaS-platform-is-best",
          relevance_score: 91,
          competitor_mentioned: compName,
          upvotes: 184,
          comments_count: 36,
          ai_source_weight: "Cited by Google AI Overviews",
          context: "CTO asking about compliance, row-level security policies, and PostgreSQL hosting.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [brandDomain, competitorDomain]);

  const handleDraftReply = async (thread: ThreadItem) => {
    setActiveThread(thread);
    setIsDrafting(true);
    setCopied(false);

    try {
      const res = await apiClient.post("/growth/hijacker/draft-reply", {
        thread_title: thread.title,
        subreddit_or_topic: thread.subreddit,
        competitor_mentioned: thread.competitor_mentioned,
        brand_domain: brandDomain,
        thread_context: thread.context,
      });
      setDraftReply(res.data.reply_text);
    } catch {
      const brandName = brandDomain.split(".")[0];
      setDraftReply(
        `Having scaled production workloads across both stacks, the biggest bottleneck with ${thread.competitor_mentioned} is unpredictable pricing once read volume spikes. We switched to ${brandName} (${brandDomain}) for native relational guarantees and transparent compute tiers, which simplified our multi-tenant architecture significantly.`
      );
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draftReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredThreads = threads
    .filter((t) => {
      const matchesPlatform = filterPlatform === "all" || t.platform === filterPlatform;
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subreddit.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlatform && matchesSearch;
    })
    .sort((a, b) =>
      sortDesc ? b.relevance_score - a.relevance_score : a.relevance_score - b.relevance_score
    );

  return (
    <div className="space-y-6">
      <HowItWorksBanner
        id="reddit_hijacker"
        title="Reddit & Quora Discussion Hijacker"
        subtitle="Turn high-ranking community discussions into high-authority AI search citations."
        steps={[
          {
            number: 1,
            title: "Discover Buyer Threads",
            desc: "Find live discussions where buyers ask for recommendations or compare competitors.",
          },
          {
            number: 2,
            title: "Draft 80/20 Value Reply",
            desc: "Generate a community-first answer with genuine insights and a natural mention.",
          },
          {
            number: 3,
            title: "Post & Capture Citations",
            desc: "Copy the reply, post authentically, and track Perplexity & ChatGPT pickups.",
          },
        ]}
      />

      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[#111113] tracking-tight">
            Reddit &amp; Quora Thread Hijacker
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5">
            Monitor discussions citing <span className="font-mono text-[#111113]">{competitorDomain}</span> and draft natural community answers.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchThreads}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] hover:bg-[#FAFAFB] text-xs font-medium transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Threads</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "reddit", "quora"] as const).map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => setFilterPlatform(plat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                filterPlatform === plat
                  ? "bg-[#111113] text-white"
                  : "bg-[#FAFAFB] text-[#52525B] border border-[#E5E7EB] hover:text-[#111113]"
              }`}
            >
              {plat === "all" ? "All Platforms" : plat}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSortDesc(!sortDesc)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Relevance: {sortDesc ? "High → Low" : "Low → High"}</span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] placeholder-[#71717A] outline-none"
          />
        </div>
      </div>

      {/* Clean White Bordered Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[#71717A] font-mono uppercase">
                <th className="py-3 px-4 whitespace-nowrap">Platform</th>
                <th className="py-3 px-4">Thread Title</th>
                <th className="py-3 px-4 whitespace-nowrap">Competitor</th>
                <th className="py-3 px-4 whitespace-nowrap">Relevance</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] tabular-nums">
              {filteredThreads.map((t) => (
                <tr key={t.id} className="hover:bg-[#FAFAFB] transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap align-top">
                    <div className="inline-flex items-center gap-2">
                      <BrandSticker name={t.platform === "reddit" ? "Reddit" : "Quora"} size="sm" />
                      <span className="font-mono font-medium text-[#111113]">
                        {t.subreddit}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 min-w-[260px] max-w-md align-top">
                    <div className="flex items-start gap-2">
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#111113] hover:underline break-words leading-snug"
                      >
                        {t.title}
                      </a>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open thread"
                        className="text-[#71717A] hover:text-[#111113] shrink-0 mt-0.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="text-[11px] font-mono text-[#71717A] mt-1">
                      {t.upvotes} upvotes • {t.comments_count} replies • {t.ai_source_weight}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap align-top">
                    <span className="px-2 py-0.5 rounded bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] font-mono font-medium">
                      {t.competitor_mentioned}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap align-top">
                    <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] font-mono font-semibold">
                      {t.relevance_score}/100
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap align-top">
                    <button
                      type="button"
                      onClick={() => handleDraftReply(t)}
                      className="px-3.5 py-2 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-xs font-medium transition-all cursor-pointer"
                    >
                      Draft AI Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* White Slide-Over / Modal Reply Drawer */}
      {activeThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
              <div className="min-w-0">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
                  {activeThread.subreddit} • Relevance {activeThread.relevance_score}/100
                </div>
                <h3 className="text-base font-semibold text-[#111113] mt-1 break-words">
                  {activeThread.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveThread(null)}
                className="p-1.5 rounded-lg bg-white text-[#52525B] border border-[#E5E7EB] hover:border-[#111113] hover:text-[#111113] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111113] mb-2">
                Editable Community-First Reply
              </label>
              {isDrafting ? (
                <div className="h-40 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-center gap-2 text-xs text-[#52525B]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Drafting value-first response...</span>
                </div>
              ) : (
                <textarea
                  rows={6}
                  value={draftReply}
                  onChange={(e) => setDraftReply(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#FAFAFB] border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] leading-relaxed outline-none"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDraftReply(activeThread)}
                disabled={isDrafting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDrafting ? "animate-spin" : ""}`} />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-xs font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
