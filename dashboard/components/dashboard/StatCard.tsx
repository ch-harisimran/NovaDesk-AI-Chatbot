"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCountUp } from "@/lib/useCountUp";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  suffix?: string;
  tone?: "brand" | "emerald" | "amber" | "sky";
  delay?: number;
}

const toneClasses = {
  brand: "bg-brand-gradient text-white",
  emerald: "bg-gradient-to-br from-emerald-400 to-teal-500 text-white",
  amber: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
  sky: "bg-gradient-to-br from-sky-400 to-blue-500 text-white",
};

export function StatCard({ label, value, icon: Icon, suffix = "", tone = "brand", delay = 0 }: StatCardProps) {
  const count = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -3 }}
    >
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">{label}</span>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shadow-glow", toneClasses[tone])}>
            <Icon size={15} />
          </div>
        </div>
        <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
          {count}
          {suffix}
        </p>
      </Card>
    </motion.div>
  );
}
