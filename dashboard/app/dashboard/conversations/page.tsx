"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, MessageCircle as WhatsAppIcon, Send as TelegramIcon, ThumbsUp, ThumbsDown, UserCheck, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { ConversationSummary, Message } from "@/lib/types";

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "handoff", label: "Needs human" },
  { key: "closed", label: "Closed" },
];

const statusTone: Record<string, "success" | "warning" | "neutral"> = {
  active: "success",
  handoff: "warning",
  closed: "neutral",
};

const sentimentTone: Record<string, "danger" | "success" | "neutral"> = {
  negative: "danger",
  positive: "success",
  neutral: "neutral",
};

const channelIcon: Record<string, typeof Globe> = {
  web: Globe,
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
};

export default function ConversationsPage() {
  const [tab, setTab] = useState("all");
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [threadLoading, setThreadLoading] = useState<string | null>(null);

  useEffect(() => {
    setConversations(null);
    const qs = tab === "all" ? "" : `?status=${tab}`;
    apiFetch<{ conversations: ConversationSummary[] }>(`/api/conversations${qs}`)
      .then((r) => setConversations(r.conversations))
      .catch(() => setConversations([]));
  }, [tab]);

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!threads[id]) {
      setThreadLoading(id);
      try {
        const res = await apiFetch<{ messages: Message[] }>(`/api/conversations/${id}`);
        setThreads((prev) => ({ ...prev, [id]: res.messages }));
      } finally {
        setThreadLoading(null);
      }
    }
  }

  async function handleHandoff(id: string) {
    await apiFetch(`/api/conversations/${id}/handoff`, { method: "POST" });
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, status: "handoff" } : c)) || null);
  }

  async function handleClose(id: string) {
    await apiFetch(`/api/conversations/${id}/close`, { method: "POST" });
    setConversations((prev) => prev?.map((c) => (c.id === id ? { ...c, status: "closed" } : c)) || null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
          <p className="mt-1 text-sm text-zinc-500">Every visitor chat, across every channel.</p>
        </div>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-xl border border-black/8 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors"
          >
            {tab === t.key && (
              <motion.div layoutId="convo-tab-pill" className="absolute inset-0 rounded-lg bg-brand-gradient shadow-glow" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <span className={cn("relative z-10", tab === t.key ? "text-white" : "text-zinc-500")}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!conversations
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
          : conversations.length === 0
          ? (
            <Card className="flex flex-col items-center gap-2 p-14 text-center">
              <MessageCircleEmpty />
              <p className="text-sm font-medium">No conversations in this view yet</p>
              <p className="text-xs text-zinc-500">Chats will show up here as soon as a visitor talks to your widget.</p>
            </Card>
          )
          : conversations.map((c) => {
              const ChannelIcon = channelIcon[c.channel] || Globe;
              const isOpen = expandedId === c.id;
              return (
                <Card key={c.id} className="overflow-hidden">
                  <button onClick={() => toggleExpand(c.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient-soft text-[12px] font-semibold text-brand-to">
                      {(c.visitor_name || c.visitor_email || "?")[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{c.visitor_name || c.visitor_email || "Anonymous visitor"}</p>
                        <ChannelIcon size={12} className="shrink-0 text-zinc-400" />
                      </div>
                      <p className="truncate text-xs text-zinc-500">{c.last_message}</p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                      {c.sentiment && <Badge tone={sentimentTone[c.sentiment]}>{c.sentiment}</Badge>}
                      <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                    </div>
                    <span className="shrink-0 text-[11px] text-zinc-400 w-14 text-right">{formatRelativeTime(c.updated_at)}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-zinc-400">
                      <ChevronDown size={16} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-black/8 dark:border-white/8"
                      >
                        <div className="max-h-96 space-y-3 overflow-y-auto px-5 py-4">
                          {threadLoading === c.id ? (
                            <Skeleton className="h-24 w-full rounded-xl" />
                          ) : (
                            (threads[c.id] || []).map((m) => (
                              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                                <div
                                  className={cn(
                                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px]",
                                    m.role === "user" ? "rounded-br-sm bg-brand-gradient text-white" : "rounded-bl-sm bg-black/5 dark:bg-white/8"
                                  )}
                                >
                                  {m.content}
                                  {m.feedback && (
                                    <div className="mt-1 flex items-center gap-1 opacity-70">
                                      {m.feedback === "up" ? <ThumbsUp size={11} /> : <ThumbsDown size={11} />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2 border-t border-black/8 dark:border-white/8 px-5 py-3">
                          {c.status !== "handoff" && (
                            <Button size="sm" variant="secondary" onClick={() => handleHandoff(c.id)}>
                              <UserCheck size={13} /> Flag for human
                            </Button>
                          )}
                          {c.status !== "closed" && (
                            <Button size="sm" variant="outline" onClick={() => handleClose(c.id)}>
                              <CheckCircle2 size={13} /> Mark resolved
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
      </div>
    </div>
  );
}

function MessageCircleEmpty() {
  return (
    <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient-soft text-brand-to">
      <Globe size={22} />
    </div>
  );
}
