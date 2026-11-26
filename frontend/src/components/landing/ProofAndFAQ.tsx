import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const testimonials = [
  {
    company: "WIX",
    quote:
      "CiteClash offers key insights on AI visibility, helping brands stay at the forefront of discovery in the age of generative search. As ChatGPT, Perplexity, and Gemini drive traffic, CiteClash measures the growth.",
    author: "Crystal Carter",
    role: "Head of SEO Comms",
  },
  {
    company: "GRAPHITE",
    quote:
      "CiteClash avoids the issues we see with other AEO platforms, where there's often an overload of features. It keeps things simple — set up your prompts, see your visibility, and act on top citations.",
    author: "Ethan Smith",
    role: "CEO",
  },
  {
    company: "SQUARESPACE",
    quote:
      "CiteClash helps us identify what's being cited, adjust our strategy in real-time, and stay ahead of a rapidly evolving search landscape. The clarity of the platform is invaluable.",
    author: "Thomas Smeaton",
    role: "SEO Manager",
  },
  {
    company: "MERGE",
    quote:
      "CiteClash allows us to pinpoint the exact types of content surfaced in LLMs. With that visibility, we prioritized our content strategy and drove a 5x increase in demo requests.",
    author: "Jon Gitlin",
    role: "SEO Strategist",
  },
  {
    company: "Glide",
    quote:
      "CiteClash gave us a data-informed view of our GEO strategy virtually overnight. Our technical guides started ranking for targeted ChatGPT and Perplexity prompts within 24 hours.",
    author: "Sepy Bazzazi",
    role: "Head of Marketing",
  },
  {
    company: "KCP",
    quote:
      "As search marketers, our decisions should always be driven by data. CiteClash provides the exact deterministic citation metrics we need to stay competitive.",
    author: "Artur Kosch",
    role: "General Manager",
  },
];

const faqs = [
  {
    q: "How do I get started with CiteClash?",
    a: "Enter your brand domain and a competitor in the hero battle bar, or sign up for a free workspace. You can import or auto-generate buyer prompts in under 60 seconds.",
  },
  {
    q: "Can I segment visibility by model, region, or audience?",
    a: "Yes. Every dashboard view lets you filter results across ChatGPT Search, Perplexity, Google Gemini, and Llama 3.3, as well as prompt tags and target geographies.",
  },
  {
    q: "How often is the data refreshed?",
    a: "Paid workspaces run automated daily prompt audits across all selected AI engines, while manual Battle Card scans execute in real time.",
  },
  {
    q: "What are brand visibility vs. source visibility metrics?",
    a: "Brand visibility measures how often an AI model recommends your company in its answer. Source visibility shows which third-party domains (such as Reddit, G2, or TechRadar) the model cites to justify that answer.",
  },
  {
    q: "How do source citations work behind the scenes?",
    a: "CiteClash executes real prompts against each LLM endpoint and parses exact URLs, markdown lists, and brand mentions deterministically using regex extractors.",
  },
  {
    q: "How do I deploy llms.txt and schema fixes?",
    a: "Use the 1-Click Auto-Fixer inside your workspace to crawl your metadata and download a ready-to-paste llms.txt file and validated Organization/FAQ JSON-LD markup.",
  },
];

export const ProofAndFAQ: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section id="faq" className="w-full bg-[#F7F7F8] border-b border-[#E5E7EB] py-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-20">
        {/* Part 1: Staggered 3-Column Testimonials (Peec AI Screenshot 6) */}
        <div>
          <div className="max-w-2xl mb-10">
            <div className="text-[12px] font-mono uppercase tracking-wider text-[#8E8E93] mb-2">
              Customer Proof
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#111113]">
              Trusted by teams winning AI search.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {testimonials.map((t, idx) => (
              <div
                key={t.author}
                className={`bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col justify-between shadow-[0_6px_20px_-12px_rgba(0,0,0,0.06)] ${
                  idx % 3 === 1 ? "md:translate-y-2" : ""
                }`}
              >
                <p className="text-[14px] text-[#111113] leading-relaxed">
                  {t.quote}
                </p>

                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center text-[11px] font-semibold text-[#111113] shrink-0">
                      {t.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#111113] truncate">
                        {t.author}
                      </div>
                      <div className="text-[11px] text-[#8E8E93] truncate">{t.role}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold tracking-wider text-[#111113] shrink-0">
                    {t.company}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Ultra-Clean Centered Hairline FAQ Accordion (Peec AI Screenshot 2) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl py-14 px-5 sm:px-10">
          <div className="max-w-[740px] mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] text-[#111113]">
                FAQs
              </h2>
              <p className="text-[15px] text-[#64646B] mt-2">
                Get answers to the most common questions about AI search and CiteClash.
              </p>
            </div>

            <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left py-4 flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <span className="text-[14px] font-medium text-[#111113] group-hover:text-[#64646B] transition-colors">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#8E8E93] shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#111113]" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 text-[13px] text-[#64646B] leading-relaxed">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
