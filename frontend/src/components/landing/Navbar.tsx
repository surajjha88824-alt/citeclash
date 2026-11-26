import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Eye,
  MessageSquare,
  Swords,
  Wrench,
  Sparkles,
  FileCode2,
  BookOpen,
  Scale,
} from "lucide-react";

interface NavbarProps {
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenApp: () => void;
  onNavigate?: (path: string) => void;
  user?: any;
}

type DropdownKey = "product" | "resources" | null;

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenApp,
  onNavigate,
  user,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<DropdownKey>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (selector: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    const target = document.querySelector(selector);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  const navigateTo = (path: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    if (onNavigate) onNavigate(path);
    else window.location.href = path;
  };

  return (
    <header
      onMouseLeave={() => setOpenMenu(null)}
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-200 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]"
          : "bg-transparent border-b border-black/[0.05]"
      }`}
    >
      <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between relative">
        {/* Left: Minimalist Geometric Emblem + Wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-[#111113] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
            >
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
        </a>

        {/* Center: Navigation with Hover Mega-Menu Triggers */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onMouseEnter={() => setOpenMenu("product")}
            onClick={() => setOpenMenu(openMenu === "product" ? null : "product")}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              openMenu === "product"
                ? "bg-[#F7F7F8] text-[#111113]"
                : "text-[#64646B] hover:text-[#111113]"
            }`}
          >
            <span>Product</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                openMenu === "product" ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            onMouseEnter={() => setOpenMenu("resources")}
            onClick={() => setOpenMenu(openMenu === "resources" ? null : "resources")}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
              openMenu === "resources"
                ? "bg-[#F7F7F8] text-[#111113]"
                : "text-[#64646B] hover:text-[#111113]"
            }`}
          >
            <span>Resources</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                openMenu === "resources" ? "rotate-180" : ""
              }`}
            />
          </button>

          <a
            href="#reports"
            onMouseEnter={() => setOpenMenu(null)}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#reports");
            }}
            className="text-[13px] font-medium text-[#64646B] hover:text-[#111113] transition-colors"
          >
            Reports
          </a>

          <a
            href="#compare"
            onMouseEnter={() => setOpenMenu(null)}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#compare");
            }}
            className="text-[13px] font-medium text-[#64646B] hover:text-[#111113] transition-colors"
          >
            Compare
          </a>

          <a
            href="#pricing"
            onMouseEnter={() => setOpenMenu(null)}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#pricing");
            }}
            className="text-[13px] font-medium text-[#64646B] hover:text-[#111113] transition-colors"
          >
            Pricing
          </a>

          <a
            href="#faq"
            onMouseEnter={() => setOpenMenu(null)}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("#faq");
            }}
            className="text-[13px] font-medium text-[#64646B] hover:text-[#111113] transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Right: Auth + Primary Jet Black CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={onOpenApp}
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-[#111113] px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:border-[#111113] bg-white transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <span>Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth("login")}
              className="hidden sm:inline-flex border border-[#D1D5DB] bg-white/70 hover:bg-white text-[#111113] rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors cursor-pointer"
            >
              Log in
            </button>
          )}

          <button
            onClick={() => {
              scrollToSection("#hero-scanner");
              window.dispatchEvent(new CustomEvent("citeclash-run-battle"));
            }}
            className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111113] text-white text-[13px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-[#222226] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Start free battle</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            className="md:hidden p-2 rounded-lg border border-[#E5E7EB] text-[#111113] hover:border-[#111113] transition-colors"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Mega-Menu Hover Popups (Peec AI Style) */}
        <AnimatePresence>
          {openMenu === "product" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:block absolute top-[62px] left-1/2 -translate-x-1/2 w-[660px] bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <div className="grid grid-cols-12 p-5 gap-6">
                <div className="col-span-6 space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E93] px-2.5 pb-1.5">
                    Product
                  </div>
                  {[
                    {
                      icon: Eye,
                      title: "AI Visibility",
                      desc: "Track how you show up in AI",
                      onClick: () => scrollToSection("#product"),
                    },
                    {
                      icon: Sparkles,
                      title: "Brand Perception",
                      desc: "Learn how AI talks about you",
                      onClick: () => scrollToSection("#reports"),
                    },
                    {
                      icon: Swords,
                      title: "Battle Cards",
                      desc: "Head-to-head competitor scorecards",
                      onClick: () => scrollToSection("#hero-scanner"),
                    },
                    {
                      icon: MessageSquare,
                      title: "Reddit & Quora Hijacker",
                      desc: "Capture high-ranking community threads",
                      onClick: () => scrollToSection("#execution"),
                    },
                    {
                      icon: Wrench,
                      title: "1-Click Auto-Fixer",
                      badge: "New",
                      desc: "Generate llms.txt & JSON-LD schemas",
                      onClick: () => scrollToSection("#execution"),
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.title}
                        onClick={item.onClick}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F7F7F8] transition-colors flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[#111113] group-hover:bg-white">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[#111113] flex items-center gap-1.5">
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[10px] font-mono font-semibold">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-[#64646B]">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="col-span-6 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E93] px-2.5 pb-1.5">
                      Featured
                    </div>
                    <button
                      onClick={() => scrollToSection("#how-it-works")}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F7F7F8] transition-colors cursor-pointer"
                    >
                      <div className="text-[13px] font-semibold text-[#111113]">
                        Deterministic Regex Engine
                      </div>
                      <div className="text-[12px] text-[#64646B]">
                        Zero hallucinated ranks, 100% URL verified
                      </div>
                    </button>
                    <button
                      onClick={onOpenApp}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F7F7F8] transition-colors cursor-pointer"
                    >
                      <div className="text-[13px] font-semibold text-[#111113] flex items-center gap-1.5">
                        <span>Live Console</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[10px] font-mono font-semibold">
                          New
                        </span>
                      </div>
                      <div className="text-[12px] text-[#64646B]">
                        Inspect live brand data, then act on it
                      </div>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAFAFB] border border-[#E5E7EB] space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-mono font-medium">
                      @ Visibility
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[12px] text-[#64646B] flex items-center justify-between">
                      <span>Work with linear.app...</span>
                      <span className="text-[11px] font-mono text-[#16A34A]">+4.1%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-2.5 bg-[#FAFAFB] border-t border-[#E5E7EB] flex items-center justify-between text-[12px]">
                <span className="text-[#64646B]">What&apos;s new in CiteClash</span>
                <button
                  onClick={() => scrollToSection("#how-it-works")}
                  className="font-semibold text-[#111113] hover:underline cursor-pointer"
                >
                  Methodology →
                </button>
              </div>
            </motion.div>
          )}

          {openMenu === "resources" && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="hidden md:block absolute top-[62px] left-1/2 -translate-x-1/2 w-[520px] bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.12)] p-4"
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    icon: BookOpen,
                    title: "GEO Strategy Guides",
                    desc: "Playbooks for ChatGPT & Perplexity",
                    onClick: () => navigateTo("/guides"),
                  },
                  {
                    icon: FileCode2,
                    title: "Free llms.txt Generator",
                    desc: "Generate crawler markdown in 5s",
                    onClick: () => navigateTo("/tools/llms-txt-generator"),
                  },
                  {
                    icon: Scale,
                    title: "CiteClash vs Peec AI",
                    desc: "Feature & pricing comparison",
                    onClick: () => navigateTo("/compare/citeclash-vs-peec-ai"),
                  },
                  {
                    icon: Scale,
                    title: "CiteClash vs Otterly",
                    desc: "Execution vs passive tracking",
                    onClick: () => navigateTo("/compare/citeclash-vs-otterly-ai"),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      onClick={item.onClick}
                      className="text-left p-3 rounded-xl hover:bg-[#F7F7F8] transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-[#111113] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[13px] font-semibold text-[#111113]">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-[#64646B] mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E7EB] px-4 py-4 space-y-3">
          <div className="flex flex-col space-y-2.5">
            {[
              { label: "Product", href: "#product" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Reports", href: "#reports" },
              { label: "Compare", href: "#compare" },
              { label: "Pricing", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href);
                }}
                className="text-sm font-medium text-[#64646B] hover:text-[#111113]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth("login");
              }}
              className="text-sm font-medium text-[#111113]"
            >
              Log in
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenApp();
              }}
              className="text-sm font-medium text-[#64646B] hover:text-[#111113]"
            >
              Open Console →
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
