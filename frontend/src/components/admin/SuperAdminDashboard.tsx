import React, { useState } from "react";
import { Search } from "lucide-react";

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"users" | "support" | "seo">("users");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const [users, setUsers] = useState([
    { id: "u1", email: "founder@linear.app", workspace: "Linear App", plan: "Growth", audits: 142 },
    { id: "u2", email: "growth@attio.com", workspace: "Attio CRM", plan: "Agency", audits: 388 },
    { id: "u3", email: "team@vercel.com", workspace: "Vercel Cloud", plan: "Starter", audits: 46 },
  ]);

  const [articles, setArticles] = useState([
    { slug: "citeclash-vs-peec-ai", title: "CiteClash vs Peec AI: 2026 Comparison", status: "Published" },
    { slug: "how-to-install-llms-txt", title: "How to Install llms.txt for AI Crawlers", status: "Published" },
    { slug: "geo-playbook-b2b-saas", title: "GEO Strategy Playbook for B2B SaaS", status: "Draft" },
  ]);

  const handlePlanChange = (id: string, nextPlan: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, plan: nextPlan } : u)));
    setNotice(`Updated workspace plan to ${nextPlan}`);
    setTimeout(() => setNotice(""), 2500);
  };

  const handlePublishArticle = (slug: string) => {
    setArticles(articles.map((a) => (a.slug === slug ? { ...a, status: "Published" } : a)));
    setNotice(`Published /guides/${slug}`);
    setTimeout(() => setNotice(""), 2500);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.workspace.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#111113] tracking-tight">
            Super-Admin Control Panel
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5">
            Platform telemetry, workspace overrides, support queue, and SEO publisher.
          </p>
        </div>
        {notice && (
          <span className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] text-[#16A34A] text-xs font-mono font-medium">
            {notice}
          </span>
        )}
      </div>

      {/* 4 Aligned KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch tabular-nums">
        {[
          { label: "Total Users", value: "1,284", delta: "+12%" },
          { label: "Paid Subscribers", value: "312", delta: "+8%" },
          { label: "Est. MRR", value: "$38,420", delta: "+14%" },
          { label: "Audits Today", value: "4,910", delta: "99.8% OK" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between"
          >
            <div className="text-xs font-medium text-[#52525B]">{kpi.label}</div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold text-[#111113]">{kpi.value}</span>
              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#16A34A] text-[11px] font-mono font-semibold">
                {kpi.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-white border border-[#E5E7EB]">
          {[
            { id: "users", label: "Users & Workspaces" },
            { id: "support", label: "Support Queue" },
            { id: "seo", label: "SEO/GEO Publisher" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                activeTab === t.id
                  ? "bg-[#111113] text-white"
                  : "text-[#52525B] hover:text-[#111113]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users or workspaces..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
          />
        </div>
      </div>

      {/* Tab Tables */}
      {activeTab === "users" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs tabular-nums">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[#71717A] font-mono uppercase">
                  <th className="py-3 px-4 whitespace-nowrap">User Email</th>
                  <th className="py-3 px-4 whitespace-nowrap">Workspace</th>
                  <th className="py-3 px-4 whitespace-nowrap">Current Plan</th>
                  <th className="py-3 px-4 whitespace-nowrap">Audits</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Change Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAFAFB]">
                    <td className="py-3.5 px-4 font-mono text-[#111113] whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#111113] whitespace-nowrap">
                      {u.workspace}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#F7F7F8] border border-[#E5E7EB] font-mono text-[#111113]">
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#52525B] whitespace-nowrap">
                      {u.audits}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <select
                        value={u.plan}
                        onChange={(e) => handlePlanChange(u.id, e.target.value)}
                        className="h-8 px-2.5 rounded-lg bg-white border border-[#D4D4D8] text-xs font-medium text-[#111113] cursor-pointer"
                      >
                        <option value="Free">Free</option>
                        <option value="Starter">Starter</option>
                        <option value="Growth">Growth</option>
                        <option value="Agency">Agency</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "support" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[#71717A] font-mono uppercase">
                  <th className="py-3 px-4 whitespace-nowrap">Ticket</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr className="hover:bg-[#FAFAFB]">
                  <td className="py-3.5 px-4 font-medium text-[#111113]">
                    Verify custom agency logo on PDF export
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#52525B]">growth@attio.com</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200 font-mono">
                      Open
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setNotice("Opened reply composer for ticket.")}
                      className="px-3 py-1.5 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
                    >
                      Reply
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "seo" && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[#71717A] font-mono uppercase">
                  <th className="py-3 px-4 whitespace-nowrap">Article Title</th>
                  <th className="py-3 px-4 whitespace-nowrap">Slug</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {articles.map((a) => (
                  <tr key={a.slug} className="hover:bg-[#FAFAFB]">
                    <td className="py-3.5 px-4 font-medium text-[#111113]">{a.title}</td>
                    <td className="py-3.5 px-4 font-mono text-[#52525B]">/{a.slug}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono ${
                          a.status === "Published"
                            ? "bg-[#ECFDF5] text-[#16A34A]"
                            : "bg-[#F7F7F8] text-[#52525B] border border-[#E5E7EB]"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handlePublishArticle(a.slug)}
                        className="px-3 py-1.5 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
                      >
                        Publish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
