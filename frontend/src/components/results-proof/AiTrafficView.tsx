import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Radio,
  Plus,
  X,
  Send,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { apiClient, API_BASE_URL } from "../../lib/api";

interface AiTrafficViewProps {
  workspaceId: string;
}

interface TrafficData {
  pixel_key: string;
  conversion_paths: string[];
  pixel_verified: boolean;
  last_event_at?: string | null;
  total_visitors: number;
  total_conversions: number;
  conversion_rate: number;
  top_engine: string;
  by_engine: Array<{ engine: string; visitors: number; conversions: number }>;
  daily_series: Array<{ day: string; visitors: number; conversions: number }>;
  top_landing_pages: Array<{ path: string; visitors: number; conversions: number }>;
}

export const AiTrafficView: React.FC<AiTrafficViewProps> = ({ workspaceId }) => {
  const [data, setData] = useState<TrafficData | null>(null);
  const [platformTab, setPlatformTab] = useState<"html" | "nextjs" | "wp" | "shopify">("html");
  const [copiedScript, setCopiedScript] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [pinging, setPinging] = useState(false);

  const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

  const fetchTraffic = async () => {
    try {
      const res = await apiClient.get(`/workspaces/${workspaceId}/ai-traffic?days=30`);
      setData(res.data);
    } catch {
      // Ignore if unauthenticated
    }
  };

  useEffect(() => {
    fetchTraffic();
  }, [workspaceId]);

  const pixelKey = data?.pixel_key || "cc_px_demo";
  const baseScript = `<script defer src="${backendOrigin}/pixel.js" data-key="${pixelKey}"></script>`;

  const platformSnippet =
    platformTab === "html"
      ? baseScript
      : platformTab === "nextjs"
      ? `// app/layout.tsx\nimport Script from "next/script";\n\n<Script src="${backendOrigin}/pixel.js" data-key="${pixelKey}" strategy="afterInteractive" />`
      : platformTab === "wp"
      ? `<!-- Paste into Appearance → Theme File Editor → header.php before </head> -->\n${baseScript}`
      : `<!-- Paste into Online Store → Themes → Edit Code → theme.liquid before </head> -->\n${baseScript}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(platformSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleAddConversionPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath.trim() || !data) return;
    const next = Array.from(new Set([...data.conversion_paths, newPath.trim()]));
    setData({ ...data, conversion_paths: next });
    setNewPath("");
    await apiClient.patch(`/workspaces/${workspaceId}/ai-traffic/config`, {
      conversion_paths: next,
    });
  };

  const handleRemoveConversionPath = async (path: string) => {
    if (!data) return;
    const next = data.conversion_paths.filter((p) => p !== path);
    setData({ ...data, conversion_paths: next });
    await apiClient.patch(`/workspaces/${workspaceId}/ai-traffic/config`, {
      conversion_paths: next,
    });
  };

  const handleTestPing = async () => {
    setPinging(true);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/ai-traffic/send-test-ping`);
      await fetchTraffic();
    } finally {
      setPinging(false);
    }
  };

  const totalEngVisitors = Math.max(
    1,
    (data?.by_engine || []).reduce((acc, e) => acc + e.visitors, 0)
  );

  return (
    <div className="space-y-6">
      {/* 1-Line Setup Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#111113]">
              Privacy-Safe 1-Line AI Referral &amp; Conversion Pixel
            </h2>
            <p className="text-[12px] text-[#52525B] mt-0.5">
              Zero cookies, zero PII/IP storage. Attributes real ChatGPT, Perplexity, Gemini, Claude &amp; Copilot visits and signups.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium ${
                data?.pixel_verified
                  ? "bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]"
                  : "bg-amber-50 text-[#D97706] border border-amber-200"
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>
                {data?.pixel_verified
                  ? `Connected • Last ping ${
                      data.last_event_at
                        ? new Date(data.last_event_at).toLocaleTimeString()
                        : "just now"
                    }`
                  : "Waiting for first visit"}
              </span>
            </span>
            <button
              type="button"
              onClick={handleTestPing}
              disabled={pinging}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-[12px] font-medium cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>{pinging ? "Sending..." : "Send Test Ping"}</span>
            </button>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "html", label: "HTML / React" },
              { id: "nextjs", label: "Next.js" },
              { id: "wp", label: "WordPress" },
              { id: "shopify", label: "Shopify" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPlatformTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer ${
                  platformTab === t.id
                    ? "bg-[#111113] text-white"
                    : "bg-[#FAFAFB] text-[#52525B] border border-[#E5E7EB]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyScript}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#111113] text-white text-[12px] font-medium hover:bg-[#27272A] cursor-pointer"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? "Copied 1-Line Script ✓" : "Copy 1-Line Script"}</span>
          </button>
        </div>

        <pre className="p-4 rounded-lg bg-[#FAFAFB] border border-[#E5E7EB] text-[12px] font-mono text-[#111113] overflow-x-auto">
          {platformSnippet}
        </pre>

        {/* Conversion Paths */}
        <div className="pt-2 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-[#71717A]">
              Conversion Paths:
            </span>
            {(data?.conversion_paths || ["/signup", "/checkout"]).map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F4F4F5] text-[#111113] font-mono text-[11px] border border-[#E5E7EB]"
              >
                {p}
                <button
                  type="button"
                  onClick={() => handleRemoveConversionPath(p)}
                  className="text-[#71717A] hover:text-[#E11D48] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddConversionPath} className="flex items-center gap-2">
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="/thank-you"
              className="h-8 w-36 px-2.5 rounded-md bg-[#FAFAFB] border border-[#E5E7EB] text-[12px] font-mono text-[#111113]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-white text-[#111113] border border-[#D4D4D8] text-[11px] font-medium cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </form>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {[
          { label: "AI Visitors (30d)", value: data?.total_visitors ?? 0 },
          { label: "AI Signups / Conversions", value: data?.total_conversions ?? 0 },
          { label: "AI Conversion Rate", value: `${data?.conversion_rate ?? 0}%` },
          { label: "Top AI Engine", value: data?.top_engine || "None yet" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between"
          >
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              {kpi.label}
            </span>
            <span className="mt-2 text-2xl font-semibold text-[#111113] tabular-nums capitalize truncate">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Charts + Engine Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between">
          <h3 className="text-[14px] font-semibold text-[#111113] mb-4">
            AI Visitors &amp; Conversions Over Time
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.daily_series || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#71717A" }} />
                <YAxis tick={{ fontSize: 11, fill: "#71717A" }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#111113"
                  fill="#E5E7EB"
                  name="AI Visitors"
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stroke="#16A34A"
                  fill="#ECFDF5"
                  name="Conversions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
          <h3 className="text-[14px] font-semibold text-[#111113]">
            Traffic by AI Engine
          </h3>
          {(data?.by_engine || []).length === 0 ? (
            <p className="text-[12px] text-[#71717A]">
              No AI referral visits recorded yet. Use &ldquo;Send Test Ping&rdquo; or install the pixel.
            </p>
          ) : (
            <div className="space-y-3">
              {(data?.by_engine || []).map((eng) => {
                const pct = Math.round((eng.visitors / totalEngVisitors) * 100);
                return (
                  <div key={eng.engine} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-medium capitalize text-[#111113]">{eng.engine}</span>
                      <span className="font-mono text-[#52525B] tabular-nums">
                        {eng.visitors} visits • {eng.conversions} conv
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#111113] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Landing Pages */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] bg-[#FAFAFB]">
          <h3 className="text-[14px] font-semibold text-[#111113]">
            Top AI-Driven Landing Pages
          </h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[11px] font-mono uppercase text-[#71717A]">
                <th className="py-3 px-5">Landing Path</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">AI Visitors</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Conversions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[13px]">
              {(data?.top_landing_pages || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 px-5 text-center text-[#71717A]">
                    No landing page data yet.
                  </td>
                </tr>
              ) : (
                (data?.top_landing_pages || []).map((lp) => (
                  <tr key={lp.path}>
                    <td className="py-3 px-5 font-mono text-[#111113]">{lp.path}</td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums text-[#111113]">
                      {lp.visitors}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums text-[#16A34A]">
                      {lp.conversions}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
