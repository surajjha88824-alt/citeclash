import React, { useState } from "react";
import { ArrowRight, ArrowLeft, RefreshCw, Eye, EyeOff } from "lucide-react";
import { BrandSticker } from "../landing/BrandStickers";

interface AuthSplitViewProps {
  isOpen: boolean;
  mode: "login" | "signup" | "forgot";
  onModeChange: (mode: "login" | "signup" | "forgot") => void;
  onClose: () => void;
  email: string;
  onEmailChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  loading: boolean;
  error: string;
  successMsg: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthSplitView: React.FC<AuthSplitViewProps> = ({
  isOpen,
  mode,
  onModeChange,
  onClose,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  loading,
  error,
  successMsg,
  onSubmit,
}) => {
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    if (mode === "forgot") {
      e.preventDefault();
      if (!email.trim()) return;
      setForgotSent(true);
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white text-[#111113]">
        {/* Left 5 cols: Clean Centered Form */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#111113] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-white">
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
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] hover:bg-[#FAFAFB] text-xs font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>

          {/* Centered Form Box */}
          <div className="w-full max-w-[400px] mx-auto my-auto py-10">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#111113]">
              {mode === "signup"
                ? "Create your workspace"
                : mode === "forgot"
                ? "Reset your password"
                : "Welcome back"}
            </h1>
            <p className="text-sm text-[#52525B] mt-1.5">
              {mode === "signup"
                ? "Start tracking ChatGPT, Perplexity, and Gemini citations in 60 seconds."
                : mode === "forgot"
                ? "Enter your work email and we will send a password reset link."
                : "Sign in to access your AI search visibility dashboard."}
            </p>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-medium">
                {error}
              </div>
            )}

            {(successMsg || (mode === "forgot" && forgotSent)) && (
              <div className="mt-4 p-3 rounded-xl bg-[#ECFDF5] border border-[#16A34A]/25 text-[#16A34A] text-xs font-medium">
                {mode === "forgot"
                  ? "Password reset link dispatched to your work email."
                  : successMsg}
              </div>
            )}

            {/* Google OAuth Button */}
            {mode !== "forgot" && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => onEmailChange("founder@linear.app")}
                  className="w-full h-11 px-4 rounded-xl bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] hover:bg-[#FAFAFB] text-sm font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path
                      fill="#4285F4"
                      d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-1 2.3-2 3v2.5h3.2c1.9-1.7 3.1-4.3 3.1-7.3z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.6C4.6 19.8 8 22 12 22z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.2 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.3-2.6z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8 2 4.6 4.2 2.9 7.6l3.3 2.6c.8-2.5 3.1-4.3 5.8-4.3z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-5 flex items-center">
                  <div className="flex-1 border-t border-[#E5E7EB]" />
                  <span className="px-3 text-[11px] font-mono uppercase text-[#71717A]">
                    or
                  </span>
                  <div className="flex-1 border-t border-[#E5E7EB]" />
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] focus:ring-2 focus:ring-[#111113]/10 text-sm text-[#111113] placeholder-[#71717A] outline-none transition-all"
                />
              </div>

              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#111113]">
                      Password
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotSent(false);
                          onModeChange("forgot");
                        }}
                        className="text-xs text-[#52525B] hover:text-[#111113] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => onPasswordChange(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] focus:ring-2 focus:ring-[#111113]/10 text-sm text-[#111113] placeholder-[#71717A] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#111113] transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-11 px-4 rounded-xl bg-[#111113] text-white hover:bg-[#27272A] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] active:scale-[0.98] text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === "signup"
                        ? "Create Free Workspace"
                        : mode === "forgot"
                        ? "Send Reset Link"
                        : "Sign In"}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#52525B]">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => onModeChange("login")}
                    className="text-[#111113] font-semibold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              ) : mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => onModeChange("login")}
                  className="text-[#111113] font-semibold hover:underline cursor-pointer"
                >
                  Back to sign in
                </button>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => onModeChange("signup")}
                    className="text-[#111113] font-semibold hover:underline cursor-pointer"
                  >
                    Sign up free
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#71717A]">
            Protected by tenant-isolated PostgreSQL RLS
          </div>
        </div>

        {/* Right 7 cols: Preview Dashboard Card + Founder Quote */}
        <div
          className="hidden lg:flex lg:col-span-7 bg-[#F7F7F8] border-l border-[#E5E7EB] flex-col justify-center p-12 xl:p-16"
          style={{
            backgroundImage: "radial-gradient(#E5E7EB 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="max-w-lg mx-auto w-full space-y-6">
            {/* Static Preview Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div>
                  <div className="text-[11px] font-mono uppercase text-[#71717A]">
                    Industry Ranking
                  </div>
                  <div className="text-base font-semibold text-[#111113] mt-0.5">
                    30-Day AI Search Share
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#ECFDF5] text-[#16A34A] text-xs font-mono font-semibold tabular-nums">
                  +14.8% Lift
                </span>
              </div>

              <div className="divide-y divide-[#E5E7EB] mt-2 tabular-nums">
                {[
                  { rank: "#1", brand: "Linear", score: "74.2%", delta: "+4.1%", win: true },
                  { rank: "#2", brand: "Attio", score: "58.6%", delta: "+2.3%", win: true },
                  { rank: "#3", brand: "HubSpot", score: "41.0%", delta: "-1.2%", win: false },
                  { rank: "#4", brand: "Jira", score: "34.8%", delta: "-3.4%", win: false },
                ].map((r) => (
                  <div key={r.brand} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#71717A] w-5">{r.rank}</span>
                      <BrandSticker name={r.brand} size="sm" />
                      <span className="font-medium text-[#111113]">{r.brand}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-semibold text-[#111113]">{r.score}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          r.win
                            ? "bg-[#ECFDF5] text-[#16A34A]"
                            : "bg-[#FFF1F2] text-[#E11D48]"
                        }`}
                      >
                        {r.delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Founder Quote */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
              <p className="text-sm text-[#111113] leading-relaxed">
                &ldquo;CiteClash showed us the exact Reddit threads Perplexity was citing instead of our docs. Three weeks after deploying llms.txt, we took the #1 spot.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#111113] text-white flex items-center justify-center text-xs font-semibold">
                  DC
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#111113]">David Chen</div>
                  <div className="text-[11px] text-[#71717A]">VP Marketing, Metriq Labs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
