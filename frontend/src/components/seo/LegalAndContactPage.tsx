import React, { useState } from "react";
import { PublicLayout } from "../layout/PublicLayout";
import { SeoSchemaHead } from "./SeoSchemaHead";

export type LegalPageType = "privacy" | "terms" | "refund" | "contact";

interface LegalAndContactPageProps {
  pageType: LegalPageType;
  onNavigate: (path: string) => void;
}

export const LegalAndContactPage: React.FC<LegalAndContactPageProps> = ({
  pageType,
  onNavigate,
}) => {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [sent, setSent] = useState(false);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMsg.trim()) return;
    setSent(true);
    setContactName("");
    setContactEmail("");
    setContactMsg("");
  };

  const contentMap: Record<
    Exclude<LegalPageType, "contact">,
    { title: string; updated: string; sections: Array<{ heading: string; body: string }> }
  > = {
    privacy: {
      title: "Privacy Policy",
      updated: "Effective November 2026",
      sections: [
        {
          heading: "1. Data We Collect",
          body: "CiteClash collects account registration details (name, work email), workspace domain configurations, and tracked prompt audit logs strictly required to deliver AI search analytics.",
        },
        {
          heading: "2. Tenant Isolation & Security",
          body: "All workspace data is isolated per tenant in PostgreSQL with Row-Level Security (RLS). We never sell customer prompt data or share private audit histories with third parties.",
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      updated: "Effective November 2026",
      sections: [
        {
          heading: "1. Acceptable Use",
          body: "You may use CiteClash to monitor brand citations, benchmark competitors, and generate technical AEO files (llms.txt and JSON-LD). Automated abuse or scraping outside permitted quotas is prohibited.",
        },
        {
          heading: "2. Subscription & Billing",
          body: "Paid plans (Starter, Growth, Agency) renew monthly or annually via Lemon Squeezy / Dodo Payments and may be canceled anytime from your Billing dashboard.",
        },
      ],
    },
    refund: {
      title: "Refund Policy",
      updated: "Effective November 2026",
      sections: [
        {
          heading: "14-Day Money-Back Guarantee",
          body: "If CiteClash does not meet your expectations within 14 days of your initial paid subscription charge, contact support@citeclash.com for a full refund with no questions asked.",
        },
      ],
    },
  };

  return (
    <PublicLayout onNavigate={onNavigate} onOpenAuth={() => onNavigate("/signup")}>
      <SeoSchemaHead
        title={`${pageType === "contact" ? "Contact Support" : contentMap[pageType].title} | CiteClash`}
        description="CiteClash legal disclosures and enterprise contact."
      />

      <section className="w-full bg-white border-b border-[#E5E7EB] py-20 px-4 sm:px-6">
        {pageType === "contact" ? (
          <div className="max-w-[640px] mx-auto space-y-6">
            <div>
              <div className="text-[12px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
                Contact
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#111113]">
                Get in touch with CiteClash
              </h1>
              <p className="text-sm text-[#52525B] mt-2">
                Questions about Agency plans, custom prompt quotas, or enterprise onboarding? Send us a note.
              </p>
            </div>

            {sent && (
              <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/20 text-[#16A34A] text-xs font-medium">
                Message received. Our team responds within 1 business day.
              </div>
            )}

            <form
              onSubmit={handleContact}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1.5">Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1.5">Work Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1.5">Message</label>
                <textarea
                  rows={4}
                  required
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full p-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#111113] text-white hover:bg-[#27272A] text-sm font-medium cursor-pointer"
              >
                Send Message
              </button>
            </form>
          </div>
        ) : (
          <div className="max-w-[780px] mx-auto space-y-8">
            <div className="pb-6 border-b border-[#E5E7EB]">
              <div className="text-[12px] font-mono uppercase tracking-wider text-[#71717A] mb-2">
                {contentMap[pageType].updated}
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#111113]">
                {contentMap[pageType].title}
              </h1>
            </div>

            {contentMap[pageType].sections.map((sec) => (
              <div key={sec.heading} className="space-y-2">
                <h2 className="text-lg font-semibold text-[#111113]">{sec.heading}</h2>
                <p className="text-[15px] text-[#52525B] leading-relaxed">{sec.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};
