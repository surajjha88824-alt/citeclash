import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  FileText,
  RotateCcw,
  Mail,
  X,
  CheckCircle2,
  Lock,
  Building,
} from "lucide-react";

export type ComplianceTab = "privacy" | "terms" | "refund" | "contact";

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ComplianceTab;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  isOpen,
  onClose,
  initialTab = "privacy",
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>(initialTab);

  // Sync tab when prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Dynamic document title update for compliance and payment reviews
  useEffect(() => {
    if (!isOpen) return;
    const titles: Record<ComplianceTab, string> = {
      privacy: "Privacy Policy | CiteClash",
      terms: "Terms of Service | CiteClash",
      refund: "Refund Policy (14-Day Money Back Guarantee) | CiteClash",
      contact: "Contact & Official Support | CiteClash",
    };
    document.title = titles[activeTab] || "Trust & Compliance | CiteClash";
  }, [isOpen, activeTab]);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  if (!isOpen) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="max-w-3xl w-full max-h-[88vh] bg-white border border-[#E5E7EB] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Trust & Compliance Center
              </h2>
              <p className="text-[11px] text-[#52525B] font-mono">
                Merchant of Record & Regulatory Disclosures • CiteClash Inc.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg linear-card text-[#52525B] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-2 bg-[#F7F7F8] border-b border-[#E5E7EB] overflow-x-auto">
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "privacy"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[#52525B] hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "terms"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[#52525B] hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => setActiveTab("refund")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "refund"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[#52525B] hover:text-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund Policy (14-Day)</span>
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "contact"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[#52525B] hover:text-white"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact & Support</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-xs text-[#52525B] leading-relaxed font-sans">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] text-[11px] text-[#52525B] font-mono">
                <span>Last Updated: November 24, 2026</span>
                <span>GDPR & CCPA Compliant</span>
              </div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                1. Data Collection & Privacy Commitment
              </h3>
              <p>
                RankPulse AI ("CiteClash", "we", "us", or "our") respects your privacy. We collect only information required to provide generative engine optimization (GEO) analytics: account credentials (email, hashed passwords via bcrypt), workspace brand domains, and public search queries used to benchmark AI engine visibility.
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                2. Zero AI Model Training on User Prompts
              </h3>
              <p>
                We maintain strict tenant isolation. Your tracked proprietary keywords, competitor lists, and custom audit results are never sold, disclosed to third parties, or used to train third-party foundation models (such as OpenAI, Gemini, or Claude).
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                3. Data Security & Encryption
              </h3>
              <p>
                All network transmissions utilize TLS 1.3 encryption. At-rest database storage is encrypted using AES-256 with automated daily backups on SOC-2 Type II compliant PostgreSQL cloud infrastructure.
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                4. Your Rights (GDPR & CCPA)
              </h3>
              <p>
                You retain complete ownership of your data. You may request account deletion, data export (JSON/CSV), or revocation of third-party token authorizations at any time by contacting{" "}
                <span className="text-cyan-400 font-mono">privacy@rankpulse.ai</span>.
              </p>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] text-[11px] text-[#52525B] font-mono">
                <span>Effective Date: November 24, 2026</span>
                <span>B2B SaaS Subscription Terms</span>
              </div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                1. Acceptance of Terms
              </h3>
              <p>
                By creating a workspace or running an AI battle-card audit on RankPulse AI, you agree to these Terms of Service. If you are entering into this agreement on behalf of a company, you represent that you have authority to bind that entity.
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                2. Service Availability & Limits
              </h3>
              <p>
                We provide automated visibility monitoring across major AI search engines (ChatGPT Search, Perplexity AI, Google AI Overview). Usage is governed by your workspace plan tier: Starter (15 prompts/mo), Growth (50 prompts/mo), Agency (200 prompts/mo). API rate limiting is enforced to ensure 99.9% platform availability.
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                3. Responsible Community Usage
              </h3>
              <p>
                The Reddit & Quora Hijacker and 1-Click AI Auto-Fixer are intended for organic, value-first content optimization. You agree not to use RankPulse AI to conduct automated mass spam, scraping in violation of third-party terms, or harassment.
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                4. Subscription Renewal & Cancellation
              </h3>
              <p>
                Paid subscriptions renew automatically each month or year unless cancelled prior to the billing cycle date directly through the Billing & Settings dashboard.
              </p>
            </div>
          )}

          {/* TAB 3: REFUND POLICY */}
          {activeTab === "refund" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    14-Day 100% No-Risk Money-Back Guarantee
                  </h4>
                  <p className="text-[11px] text-emerald-300">
                    If you don't discover actionable AI search visibility insights within 14 days of upgrading, we'll refund 100% of your payment — no questions asked.
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                1. Eligibility for Full Refund
              </h3>
              <p>
                All first-time subscription upgrades (Starter $49, Growth $129, Agency $299) are eligible for a complete refund within 14 calendar days of your initial transaction.
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                2. How to Request a Refund
              </h3>
              <p>
                To request a refund, either open a ticket under the{" "}
                <span className="text-purple-300 font-mono">Billing</span> category in your Support Desk or email{" "}
                <span className="text-cyan-400 font-mono">billing@rankpulse.ai</span> with your account email and workspace name. Refunds are processed through Lemon Squeezy / Dodo Payments back to your original payment method in 3–5 business days.
              </p>

              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-purple-400">
                3. Cancellation Process
              </h3>
              <p>
                You can cancel your subscription at any time with 1 click in your Billing settings. Upon cancellation, you retain full access to all paid features until the end of your current billing period.
              </p>
            </div>
          )}

          {/* TAB 4: CONTACT & SUPPORT */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl linear-card border border-[#E5E7EB] space-y-1">
                  <div className="text-[10px] font-mono text-[#52525B] flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-purple-400" /> Official Support
                  </div>
                  <div className="text-xs font-bold text-white font-mono">support@rankpulse.ai</div>
                  <div className="text-[10px] text-[#71717A]">2-hour engineering SLA</div>
                </div>

                <div className="p-3.5 rounded-xl linear-card border border-[#E5E7EB] space-y-1">
                  <div className="text-[10px] font-mono text-[#52525B] flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-cyan-400" /> Global Headquarters
                  </div>
                  <div className="text-xs font-bold text-white">RankPulse AI Inc.</div>
                  <div className="text-[10px] text-[#71717A]">San Francisco, CA & Global Remote</div>
                </div>
              </div>

              {contactSuccess ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Message Dispatched Successfully!</h4>
                  <p className="text-xs text-emerald-300">
                    Our lead architect has received your inquiry. We typically reply in under 2 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#52525B] font-semibold mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] text-white focus:outline-none focus:border-purple-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#52525B] font-semibold mb-1">Work Email</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] text-white focus:outline-none focus:border-purple-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#52525B] font-semibold mb-1">Inquiry / Message</label>
                    <textarea
                      required
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Ask about enterprise custom prompt matrix volume, API access, or billing questions..."
                      className="w-full px-3 py-2 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] text-white focus:outline-none focus:border-purple-500 text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:opacity-95 cursor-pointer shadow-lg shadow-purple-600/20 text-xs"
                  >
                    Send Direct Message to Support Team
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#FAFAFB] flex items-center justify-between text-[11px] text-[#52525B]">
          <span>Protected by 256-Bit SSL Encryption</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg linear-card text-[#52525B] hover:text-white cursor-pointer font-semibold"
          >
            Close Disclosures
          </button>
        </div>
      </div>
    </div>
  );
};
