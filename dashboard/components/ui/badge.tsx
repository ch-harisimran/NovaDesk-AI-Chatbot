import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-black/5 dark:bg-white/8 text-zinc-600 dark:text-zinc-300 border-black/10 dark:border-white/10",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  brand: "bg-brand-gradient-soft text-brand-to dark:text-violet-300 border-brand/20",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
