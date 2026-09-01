"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ThumbsUp, ThumbsDown, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/lib/useCountUp";
import type { AnalyticsData } from "@/lib/types";

const RESOLUTION_COLORS: Record<string, string> = { closed: "#10B981", active: "#6366F1", handoff: "#F59E0B" };
const SENTIMENT_COLORS: Record<string, string> = { positive: "#10B981", neutral: "#8B93A6", negative: "#EF4444" };

const tooltipStyle = { background: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" };

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    apiFetch<AnalyticsData>("/api/analytics?days=14").then(setData);
  }, []);

  const avgResponse = useCountUp(data ? Math.round(data.avgResponseSeconds) : 0);
  const upVotes = data?.feedback.find((f) => f.feedback === "up")?.count || 0;
  const downVotes = data?.feedback.find((f) => f.feedback === "down")?.count || 0;
  const upCount = useCountUp(upVotes);
  const downCount = useCountUp(downVotes);

  const resolutionData = data?.resolution.map((r) => ({ name: r.status, value: Number(r.count) })) || [];
  const resolvedShare = data
    ? Math.round(((Number(data.resolution.find((r) => r.status === "closed")?.count || 0)) / Math.max(1, data.totals.total_conversations)) * 100)
    : 0;
  const resolvedShareAnimated = useCountUp(resolvedShare);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">How your AI assistant is performing, at a glance.</p>
      </div>

      {!data ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2"><TrendingUp size={15} className="text-brand-to" /> Conversation & message volume</h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.volume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,140,0.12)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: "#8b8b96" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8b8b96" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="conversations" name="Conversations" stroke="#8B5CF6" strokeWidth={2.5} dot={false} animationDuration={1400} />
                  <Line type="monotone" dataKey="messages" name="Messages" stroke="#6366F1" strokeWidth={2} strokeDasharray="4 3" dot={false} animationDuration={1400} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="mb-5 text-sm font-semibold">Most-asked questions</h2>
                {data.topQuestions.length === 0 ? (
                  <p className="py-10 text-center text-xs text-zinc-500">Not enough data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.topQuestions.map((q) => ({ ...q, label: q.content.length > 34 ? q.content.slice(0, 34) + "..." : q.content }))} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,140,0.12)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#8b8b96" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="label" width={200} tick={{ fontSize: 11, fill: "#8b8b96" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <Card className="flex h-full flex-col p-6">
                <h2 className="mb-2 text-sm font-semibold">Resolution rate</h2>
                <div className="relative flex flex-1 items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={resolutionData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={82} paddingAngle={3} animationDuration={1200}>
                        {resolutionData.map((entry) => (
                          <Cell key={entry.name} fill={RESOLUTION_COLORS[entry.name] || "#8B93A6"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold tabular-nums">{resolvedShareAnimated}%</span>
                    <span className="text-[10px] text-zinc-500">resolved</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-[11px]">
                  {resolutionData.map((r) => (
                    <div key={r.name} className="flex items-center gap-1.5 capitalize">
                      <span className="h-2 w-2 rounded-full" style={{ background: RESOLUTION_COLORS[r.name] || "#8B93A6" }} />
                      {r.name} ({r.value})
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Card className="p-6">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <Clock size={14} /> Avg. response time
                </div>
                <p className="text-3xl font-semibold tabular-nums">{avgResponse}s</p>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <Card className="p-6">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <ThumbsUp size={14} /> Positive feedback
                </div>
                <p className="text-3xl font-semibold tabular-nums text-emerald-500">{upCount}</p>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
              <Card className="p-6">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <ThumbsDown size={14} /> Needs improvement
                </div>
                <p className="text-3xl font-semibold tabular-nums text-red-500">{downCount}</p>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
