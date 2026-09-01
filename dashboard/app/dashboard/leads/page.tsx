"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Mail, MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => {
    apiFetch<{ leads: Lead[] }>("/api/leads").then((r) => setLeads(r.leads));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">Names and emails your assistant captured mid-conversation.</p>
      </div>

      <Card className="overflow-hidden">
        {!leads ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-14 text-center">
            <Users size={26} className="text-zinc-400" />
            <p className="text-sm font-medium">No leads captured yet</p>
            <p className="text-xs text-zinc-500">Your assistant will save a visitor's name or email as soon as they share one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 dark:border-white/8 text-left text-xs text-zinc-500">
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Captured</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient-soft text-[11px] font-semibold text-brand-to">
                        {(lead.name || lead.email || "?")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{lead.name || "Unnamed visitor"}</p>
                        {lead.email && (
                          <p className="flex items-center gap-1 text-xs text-zinc-500">
                            <Mail size={10} /> {lead.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {lead.conversation_id ? (
                      <Badge tone="brand">
                        <MessageSquare size={10} /> chat
                      </Badge>
                    ) : (
                      <Badge tone="neutral">manual</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-500">{formatRelativeTime(lead.created_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
