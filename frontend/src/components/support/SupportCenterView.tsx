import React, { useState, useEffect } from "react";
import { Plus, Search, Send, ArrowLeft, X } from "lucide-react";
import { apiClient } from "../../lib/api";

interface TicketItem {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

const KB_ARTICLES = [
  {
    title: "How to install llms.txt on Next.js, WordPress, and Shopify",
    category: "Technical AEO",
    summary: "Host /llms.txt at your domain root so OAI-SearchBot and PerplexityBot index your core product facts.",
  },
  {
    title: "How CiteClash calculates your AI Visibility Score",
    category: "Methodology",
    summary: "Deterministic regex list parsing across ChatGPT, Perplexity, Gemini, and Llama 3.3 completions.",
  },
  {
    title: "Best practices for Reddit & Quora thread positioning",
    category: "Growth",
    summary: "Follow the 80/20 value-first rule so community discussions become durable AI citation sources.",
  },
];

export const SupportCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"kb" | "tickets">("tickets");
  const [kbSearch, setKbSearch] = useState("");

  const [tickets, setTickets] = useState<TicketItem[]>([
    {
      id: "t-101",
      subject: "Verify custom agency logo on PDF export",
      category: "Feature Request",
      priority: "Medium",
      status: "In Progress",
      created_at: "Nov 24, 2026",
    },
    {
      id: "t-102",
      subject: "Adding secondary competitor domain to Growth workspace",
      category: "Account",
      priority: "Low",
      status: "Resolved",
      created_at: "Nov 20, 2026",
    },
  ]);

  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([
    {
      id: "m-1",
      sender_role: "user",
      message: "Hi team, can we upload an SVG logo for our agency white-label PDF reports?",
      created_at: "Nov 24, 10:15 AM",
    },
    {
      id: "m-2",
      sender_role: "admin",
      message: "Yes! Go to PDF Reports → Upload Agency Logo and select any SVG or PNG file. Let us know if you need help.",
      created_at: "Nov 24, 10:42 AM",
    },
  ]);
  const [replyText, setReplyText] = useState("");

  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("Billing");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    apiClient
      .get("/support/tickets")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTickets(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDesc.trim()) return;
    const created: TicketItem = {
      id: `t-${Date.now()}`,
      subject: newSubject.trim(),
      category: newCategory,
      priority: newPriority,
      status: "Open",
      created_at: "Just now",
    };
    setTickets([created, ...tickets]);
    setNewSubject("");
    setNewDesc("");
    setShowNewModal(false);
    setActiveTab("tickets");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setMessages([
      ...messages,
      {
        id: `m-${Date.now()}`,
        sender_role: "user",
        message: replyText.trim(),
        created_at: "Just now",
      },
    ]);
    setReplyText("");
  };

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("resolved")) return "bg-[#ECFDF5] text-[#16A34A] border-[#16A34A]/20";
    if (s.includes("progress")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-[#D97706] border-amber-200";
  };

  const filteredKb = KB_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
      a.summary.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header + Tabs + New Ticket CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-xl bg-white border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("kb");
              setSelectedTicket(null);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              activeTab === "kb"
                ? "bg-[#111113] text-white"
                : "text-[#52525B] hover:text-[#111113]"
            }`}
          >
            Knowledge Base
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              activeTab === "tickets"
                ? "bg-[#111113] text-white"
                : "text-[#52525B] hover:text-[#111113]"
            }`}
          >
            My Support Tickets
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Tab 1: Knowledge Base */}
      {activeTab === "kb" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={kbSearch}
              onChange={(e) => setKbSearch(e.target.value)}
              placeholder="Search documentation..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {filteredKb.map((art) => (
              <div
                key={art.title}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-mono text-[#71717A] uppercase">
                    {art.category}
                  </span>
                  <h3 className="text-sm font-semibold text-[#111113] mt-1.5 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Tickets List or Detail Chat */}
      {activeTab === "tickets" && !selectedTicket && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFB] text-[#71717A] font-mono uppercase">
                  <th className="py-3 px-4 whitespace-nowrap">Subject</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Created</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="hover:bg-[#FAFAFB] cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-medium text-[#111113] max-w-xs truncate">
                      {t.subject}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#52525B] whitespace-nowrap">
                      {t.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#52525B] whitespace-nowrap">
                      {t.priority}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded border text-[11px] font-mono font-medium ${statusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#71717A] whitespace-nowrap">
                      {t.created_at}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(t);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] text-xs font-medium cursor-pointer"
                      >
                        Open Thread
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "tickets" && selectedTicket && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] hover:border-[#111113] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#111113] truncate">
                  {selectedTicket.subject}
                </h3>
                <div className="text-xs font-mono text-[#71717A]">
                  {selectedTicket.category} • {selectedTicket.priority}
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded border text-xs font-mono font-medium ${statusBadge(
                selectedTicket.status
              )}`}
            >
              {selectedTicket.status}
            </span>
          </div>

          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  m.sender_role === "admin"
                    ? "bg-white border-[#E5E7EB] border-l-4 border-l-[#111113]"
                    : "bg-[#F7F7F8] border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] mb-1">
                  <span className="font-semibold text-[#111113]">
                    {m.sender_role === "admin" ? "CiteClash Support" : "You"}
                  </span>
                  <span>{m.created_at}</span>
                </div>
                <p className="text-[#111113]">{m.message}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendReply} className="flex gap-2 pt-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 h-10 px-3.5 rounded-lg bg-white border border-[#D4D4D8] focus:border-[#111113] text-xs text-[#111113] outline-none"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-[#111113] text-white hover:bg-[#27272A] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-semibold text-[#111113]">Create Support Ticket</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg bg-white text-[#52525B] border border-[#E5E7EB] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#111113] mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
                  >
                    <option>Billing</option>
                    <option>Bug Report</option>
                    <option>Feature Request</option>
                    <option>Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111113] mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111113] mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe your request in detail..."
                  className="w-full p-3 rounded-lg bg-white border border-[#D4D4D8] text-xs text-[#111113] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg bg-white text-[#111113] border border-[#D4D4D8] text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#111113] text-white text-xs font-medium cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
