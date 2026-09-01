"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative rounded-3xl border border-white/8 bg-white/[0.03] p-6 shadow-card transition-shadow hover:shadow-glow-lg"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow transition-transform group-hover:scale-110">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{description}</p>
    </motion.div>
  );
}
