import React from "react";
import { Swords, Moon, Sun, ArrowRight, LayoutDashboard, Sparkles } from "lucide-react";

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
  onOpenAuth: () => void;
  activeView: "landing" | "app";
  setActiveView: (view: "landing" | "app") => void;
  activeUser: any;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  toggleTheme,
  onOpenAuth,
  activeView,
  setActiveView,
  activeUser,
  onNavigate,
}) => {
  const handleNav = (e: React.MouseEvent, path: string) => {
    if (path.startsWith("#")) {
      setActiveView("landing");
      return;
    }
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] backdrop-blur-xl bg-[#09090B]/85 dark:bg-[#09090B]/85 light:bg-white/85 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setActiveView("landing")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#09090B] rounded-[11px] flex items-center justify-center">
              <Swords className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white dark:text-white light:text-slate-900 font-sans">
                CiteClash
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider uppercase rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                GEO BATTLE-CARD
              </span>
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">
          <a
            href="#scanner"
            onClick={(e) => handleNav(e, "#scanner")}
            className="hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Live Battle Scanner
          </a>
          <a
            href="/guides"
            onClick={(e) => handleNav(e, "/guides")}
            className="hover:text-blue-400 transition-colors"
          >
            GEO Guides
          </a>
          <a
            href="/tools/llms-txt-generator"
            onClick={(e) => handleNav(e, "/tools/llms-txt-generator")}
            className="hover:text-emerald-400 transition-colors"
          >
            Free llms.txt Tool
          </a>
          <a
            href="#features"
            onClick={(e) => handleNav(e, "#features")}
            className="hover:text-purple-400 transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={(e) => handleNav(e, "#pricing")}
            className="hover:text-pink-400 transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            onClick={(e) => handleNav(e, "#faq")}
            className="hover:text-slate-100 transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl linear-card text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* View Switcher: App Shell vs Landing */}
          <button
            onClick={() => setActiveView(activeView === "landing" ? "app" : "landing")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl linear-card text-slate-300 hover:text-white transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
            <span>{activeView === "landing" ? "Open App Shell" : "Landing View"}</span>
          </button>

          {/* Auth Button */}
          {activeUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{activeUser.email?.split("@")[0]}</span>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors hidden sm:block"
            >
              Log in
            </button>
          )}

          <a
            href="#scanner"
            onClick={() => {
              setActiveView("landing");
              if (!activeUser) onOpenAuth();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-600/25 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Start Free Audit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
