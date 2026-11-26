import React from "react";

interface StickerProps {
  name: string;
  size?: "sm" | "md";
}

export const BrandSticker: React.FC<StickerProps> = ({ name, size = "sm" }) => {
  const dim = size === "md" ? "w-6 h-6 text-[11px]" : "w-5 h-5 text-[10px]";
  const key = name.toLowerCase();

  if (key.includes("chatgpt") || key.includes("openai")) {
    return (
      <span className={`${dim} rounded-md bg-[#111113] text-white inline-flex items-center justify-center shrink-0 shadow-xs`}>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </span>
    );
  }

  if (key.includes("perplexity")) {
    return (
      <span className={`${dim} rounded-md bg-[#0E7490] text-white inline-flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5M5 8v8M19 8v8" />
        </svg>
      </span>
    );
  }

  if (key.includes("gemini") || key.includes("google") || key.includes("overview")) {
    return (
      <span className={`${dim} rounded-md bg-white border border-[#E5E7EB] inline-flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.2-1 2.3-2 3v2.5h3.2c1.9-1.7 3.1-4.3 3.1-7.3z" />
          <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.6C4.6 19.8 8 22 12 22z" />
          <path fill="#FBBC05" d="M6.2 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.3-2.6z" />
          <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8 2 4.6 4.2 2.9 7.6l3.3 2.6c.8-2.5 3.1-4.3 5.8-4.3z" />
        </svg>
      </span>
    );
  }

  if (key.includes("claude")) {
    return (
      <span className={`${dim} rounded-md bg-[#D97757] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9" />
        </svg>
      </span>
    );
  }

  if (key.includes("llama") || key.includes("meta")) {
    return (
      <span className={`${dim} rounded-md bg-[#2563EB] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        ∞
      </span>
    );
  }

  if (key.includes("reddit")) {
    return (
      <span className={`${dim} rounded-full bg-[#FF4500] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        r/
      </span>
    );
  }

  if (key.includes("wikipedia")) {
    return (
      <span className={`${dim} rounded-md bg-[#F4F4F5] border border-[#E5E7EB] text-[#111113] inline-flex items-center justify-center font-serif font-bold shrink-0`}>
        W
      </span>
    );
  }

  if (key.includes("g2")) {
    return (
      <span className={`${dim} rounded-md bg-[#FF492C] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        G2
      </span>
    );
  }

  if (key.includes("techradar") || key.includes("techcrunch")) {
    return (
      <span className={`${dim} rounded-md bg-[#111113] text-[#16A34A] inline-flex items-center justify-center font-mono font-bold shrink-0`}>
        TR
      </span>
    );
  }

  if (key.includes("monday")) {
    return (
      <span className={`${dim} rounded-md bg-[#FFF1F2] border border-[#FECDD3] inline-flex items-center justify-center gap-0.5 shrink-0`}>
        <span className="w-1 h-2.5 rounded-full bg-[#F43F5E]" />
        <span className="w-1 h-2.5 rounded-full bg-[#F59E0B]" />
        <span className="w-1 h-1.5 rounded-full bg-[#10B981]" />
      </span>
    );
  }

  if (key.includes("pipedrive")) {
    return (
      <span className={`${dim} rounded-md bg-[#16A34A] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        p
      </span>
    );
  }

  if (key.includes("linear")) {
    return (
      <span className={`${dim} rounded-md bg-[#4F46E5] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        L
      </span>
    );
  }

  if (key.includes("attio")) {
    return (
      <span className={`${dim} rounded-md bg-[#111113] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        A
      </span>
    );
  }

  if (key.includes("hubspot")) {
    return (
      <span className={`${dim} rounded-md bg-[#F97316] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        H
      </span>
    );
  }

  if (key.includes("jira")) {
    return (
      <span className={`${dim} rounded-md bg-[#0052CC] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        J
      </span>
    );
  }

  if (key.includes("salesforce")) {
    return (
      <span className={`${dim} rounded-md bg-[#00A1E0] text-white inline-flex items-center justify-center font-bold shrink-0`}>
        S
      </span>
    );
  }

  return (
    <span className={`${dim} rounded-md bg-[#111113] text-white inline-flex items-center justify-center font-semibold uppercase shrink-0`}>
      {name.slice(0, 1)}
    </span>
  );
};
