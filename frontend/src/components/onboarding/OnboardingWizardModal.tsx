import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  X,
  Trash2,
  Plus,
} from "lucide-react";
import { apiClient } from "../../lib/api";

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (auditData: any) => void;
  initialBrand?: string;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialBrand = "",
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [brandName, setBrandName] = useState(initialBrand || "");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("SaaS & Developer Tools");

  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");

  const [prompts, setPrompts] = useState<string[]>([]);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [newPromptInput, setNewPromptInput] = useState("");

  const [submittingAudit, setSubmittingAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleGeneratePrompts = async () => {
    setGeneratingPrompts(true);
    const cleanBrand = brandName.trim() || "Your Brand";
    const cleanComp = competitor1.trim() || "Top Competitors";
    const cleanInd = industry.split("&")[0].trim();

    try {
      const res = await apiClient.post<{ prompts: string[] }>("/audits/generate-prompts", {
        brand_name: cleanBrand,
        website_url: websiteUrl.trim() || undefined,
        industry: industry,
        competitor_domain: competitor1.trim() || undefined,
      });

      if (res.data && res.data.prompts && res.data.prompts.length > 0) {
        setPrompts(res.data.prompts);
      } else {
        throw new Error("No prompts returned");
      }
    } catch {
      const generated = [
        `Best ${cleanInd} tools for fast-growing startups and enterprises`,
        `Top ${cleanComp} alternatives for modern ${cleanInd} with high reliability`,
        `Is ${cleanBrand} or ${cleanComp} better for enterprise production deployments?`,
        `Which ${cleanInd} software is most frequently recommended by developers on Reddit?`,
        `Feature and pricing comparison between ${cleanBrand} and ${cleanComp}`,
      ];
      setPrompts(generated);
    } finally {
      setGeneratingPrompts(false);
      setStep(3);
    }
  };

  const handleRemovePrompt = (idx: number) => {
    setPrompts(prompts.filter((_, i) => i !== idx));
  };

  const handleAddCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptInput.trim()) return;
    setPrompts([...prompts, newPromptInput.trim()]);
    setNewPromptInput("");
  };

  const handleLaunchFirstAudit = async () => {
    setSubmittingAudit(true);
    setErrorMsg("");

    try {
      const cleanDomain = websiteUrl
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .trim();
      const cleanComp = competitor1
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .trim();

      const res = await apiClient.post("/audits/run", {
        brand_domain: cleanDomain || brandName.toLowerCase().replace(/\s+/g, "") + ".com",
        competitor_domain: cleanComp || "competitor.com",
        industry: industry,
        custom_prompts: prompts.length > 0 ? prompts : undefined,
      });

      localStorage.setItem("rankpulse_onboarded", "true");
      onComplete(res.data);
    } catch {
      localStorage.setItem("rankpulse_onboarded", "true");
      onComplete({ status: "completed", fallback: true });
    } finally {
      setSubmittingAudit(false);
    }
  };

  const stepsMeta = [
    { num: 1, label: "01 Brand" },
    { num: 2, label: "02 Competitors" },
    { num: 3, label: "03 Buyer Prompts" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F7F7F8]/95 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-[640px] bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 sm:p-8 text-[#111113] my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB]">
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Workspace Setup
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#111113] mt-0.5">
              Configure your brand intelligence
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close onboarding"
            className="p-2 rounded-lg bg-white text-[#52525B] border border-[#E5E7EB] hover:border-[#111113] hover:text-[#111113] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crisp 3-Step Horizontal Progress Bar */}
        <div className="grid grid-cols-3 gap-2 py-5 border-b border-[#E5E7EB]">
          {stepsMeta.map((s) => {
            const active = step >= s.num;
            const current = step === s.num;
            return (
              <div key={s.num} className="space-y-2">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    active ? "bg-[#111113]" : "bg-[#E5E7EB]"
                  }`}
                />
                <div
                  className={`text-xs font-mono ${
                    current
                      ? "font-semibold text-[#111113]"
                      : active
                      ? "text-[#52525B]"
                      : "text-[#71717A]"
                  }`}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Step Content with Smooth Framer Motion Transitions */}
        <div className="pt-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-[#111113] mb-1.5">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Linear"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] focus:ring-2 focus:ring-[#111113]/10 text-sm text-[#111113] placeholder-[#71717A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#111113] mb-1.5">
                    Website Domain
                  </label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="e.g. linear.app"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] focus:ring-2 focus:ring-[#111113]/10 text-sm font-mono text-[#111113] placeholder-[#71717A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#111113] mb-1.5">
                    Industry Category
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-sm text-[#111113] outline-none"
                  >
                    <option value="SaaS & Developer Tools">SaaS &amp; Developer Tools</option>
                    <option value="B2B Marketing & CRM">B2B Marketing &amp; CRM</option>
                    <option value="E-Commerce & D2C">E-Commerce &amp; D2C</option>
                    <option value="Fintech & Payments">Fintech &amp; Payments</option>
                    <option value="AI & Data Infrastructure">AI &amp; Data Infrastructure</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!brandName.trim()) {
                        setErrorMsg("Please enter your brand name to continue.");
                        return;
                      }
                      setErrorMsg("");
                      setStep(2);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-sm font-medium transition-all cursor-pointer"
                  >
                    <span>Next: Competitors</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-[#111113] mb-1.5">
                    Primary Competitor Domain
                  </label>
                  <input
                    type="text"
                    value={competitor1}
                    onChange={(e) => setCompetitor1(e.target.value)}
                    placeholder="e.g. jira.atlassian.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] focus:ring-2 focus:ring-[#111113]/10 text-sm font-mono text-[#111113] placeholder-[#71717A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#111113] mb-1.5">
                    Secondary Competitor Domain (Optional)
                  </label>
                  <input
                    type="text"
                    value={competitor2}
                    onChange={(e) => setCompetitor2(e.target.value)}
                    placeholder="e.g. clickup.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] focus:ring-2 focus:ring-[#111113]/10 text-sm font-mono text-[#111113] placeholder-[#71717A] outline-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] hover:bg-[#FAFAFB] text-sm font-medium transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGeneratePrompts}
                    disabled={generatingPrompts}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
                  >
                    {generatingPrompts ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Prompts...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Buyer Prompts</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {prompts.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-medium text-[#111113] min-w-0 break-words">
                        {p}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePrompt(idx)}
                        aria-label="Remove prompt"
                        className="p-1.5 rounded-lg bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] hover:bg-[#FFE4E6] shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCustomPrompt} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPromptInput}
                    onChange={(e) => setNewPromptInput(e.target.value)}
                    placeholder="Add a custom buyer prompt..."
                    className="flex-1 min-w-0 h-10 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] placeholder-[#71717A] outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 px-3.5 rounded-xl bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] hover:bg-[#FAFAFB] text-xs font-medium inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="pt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] hover:bg-[#FAFAFB] text-sm font-medium transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLaunchFirstAudit}
                    disabled={submittingAudit}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submittingAudit ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Launching Audit...</span>
                      </>
                    ) : (
                      <>
                        <span>Launch First Audit</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
