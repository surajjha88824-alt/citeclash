import React from "react";

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-10 bg-[#F7F7F8] rounded-xl border border-[#E5E7EB]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 bg-[#F7F7F8] rounded-xl border border-[#E5E7EB] flex items-center px-4 gap-4"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F7F7F8] shrink-0" />
          <div className="h-4 bg-[#F7F7F8] rounded w-1/4" />
          <div className="h-4 bg-[#F7F7F8] rounded w-1/3" />
          <div className="h-4 bg-[#F7F7F8] rounded w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl linear-card border border-[#E5E7EB] space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[#F7F7F8] rounded w-1/3" />
        <div className="w-8 h-8 rounded-lg bg-[#F7F7F8]" />
      </div>
      <div className="h-8 bg-[#F7F7F8] rounded w-1/2" />
      <div className="h-3 bg-[#F7F7F8] rounded w-3/4" />
    </div>
  );
};
