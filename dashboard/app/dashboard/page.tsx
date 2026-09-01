"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessagesSquare, Users, BookOpenCheck, AlertTriangle, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { formatRelativeTime } from "@/lib/utils";
import type { AnalyticsData, ConversationSummary } from "@/lib/types";

const statusTone: Record<string, "success" | "warning" | "neutral"> = {
  active: "success",
  handoff: "warning",
  closed: "neutral",
};

export default function DashboardHome() {
  const { admin } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    apiFetch<AnalyticsData>("/api/analytics?days=14").then(setAnalytics).catch(() => {});
    apiFetch<{ conversations: ConversationSummary[] }>("/api/conversations").then((r) => setConversations(r.conversations.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back{admin?.name ? `, ${admin.name.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-sm text-zinc-500">Here's what's happening across your support widget.</p>
      </div>

      {!analytics ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total conversations" value={analytics.totals.total_conversations} icon={MessagesSquare} tone="brand" delay={0} />
          <StatCard label="Active right now" value={analytics.totals.active_conversations} icon={ArrowUpRight} tone="emerald" delay={0.05} />
          <StatCard label="Needs a human" value={analytics.totals.handoff_conversations} icon={AlertTriangle} tone="amber" delay={0.1} />
          <StatCard label="Leads captured" value={analytics.totals.total_leads} icon={Users} tone="sky" delay={0.15} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-3">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Conversation volume (14 days)</h2>
              <Link href="/dashboard/analytics" className="text-xs font-medium text-brand-to hover:underline">
                Full analytics
              </Link>
            </div>
            {!analytics ? (
              <Skeleton className="h-56 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics.volume}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: "#8b8b96" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="conversations" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#volGradient)" animationDuration={1200} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent conversations</h2>
              <Link href="/dashboard/conversations" className="text-xs font-medium text-brand-to hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {!conversations
                ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl mb-2" />)
                : conversations.map((c) => (
                    <Link
                      key={c.id}
                      href="/dashboard/conversations"
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient-soft text-[11px] font-semibold text-brand-to">
                        {(c.visitor_name || "?")[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{c.visitor_name || c.visitor_email || "Anonymous visitor"}</p>
                        <p className="truncate text-[11px] text-zinc-500">{c.last_message}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                        <span className="text-[10px] text-zinc-400">{formatRelativeTime(c.updated_at)}</span>
                      </div>
                    </Link>
                  ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {analytics && analytics.totals.ready_documents > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <BookOpenCheck size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Knowledge base is live</p>
              <p className="text-xs text-zinc-500">{analytics.totals.ready_documents} articles ready and grounding every AI response.</p>
            </div>
            <Link href="/dashboard/knowledge" className="text-xs font-medium text-brand-to hover:underline">
              Manage
            </Link>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
