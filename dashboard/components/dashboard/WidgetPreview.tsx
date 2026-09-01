"use client";

import { motion } from "framer-motion";
import { Sparkles, Send, Paperclip, Mic } from "lucide-react";

interface Props {
  name: string;
  color: string;
  colorSecondary: string;
  greeting: string;
  logoUrl: string;
}

export function WidgetPreview({ name, color, colorSecondary, greeting, logoUrl }: Props) {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="relative rounded-[2.25rem] border-[6px] border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden" style={{ aspectRatio: "9/17.5" }}>
        <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-1.5">
          <div className="h-4 w-24 rounded-full bg-black" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-950" />

        <div className="absolute inset-x-3 bottom-3 top-10 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0F]/95 shadow-2xl">
          <motion.div
            key={color + colorSecondary}
            className="flex items-center gap-2.5 px-4 py-3.5"
            style={{ background: `linear-gradient(135deg, ${color}, ${colorSecondary})` }}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/30" onError={(e) => (e.currentTarget.style.display = "none")} />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
                <Sparkles size={14} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">{name || "Your Business"}</p>
              <p className="flex items-center gap-1 text-[10px] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Typically replies instantly
              </p>
            </div>
          </motion.div>

          <div className="flex-1 space-y-2.5 px-3.5 py-3.5">
            <motion.div
              key={greeting}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/8 px-3 py-2 text-[11.5px] leading-snug text-zinc-100 backdrop-blur-md"
            >
              {greeting || "Hi there! How can I help you today?"}
            </motion.div>
            <div className="ml-auto w-fit max-w-[75%] rounded-2xl rounded-br-sm px-3 py-2 text-[11.5px] text-white" style={{ background: `linear-gradient(135deg, ${color}, ${colorSecondary})` }}>
              Do you ship internationally?
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-white/8 px-3 py-2 w-fit backdrop-blur-md">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block h-1 w-1 rounded-full"
                  style={{ backgroundColor: color }}
                  animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-white/10 bg-black/20 p-2.5">
            <Paperclip size={13} className="text-zinc-500" />
            <Mic size={13} className="text-zinc-500" />
            <div className="flex-1 rounded-lg bg-white/8 px-2.5 py-1.5 text-[10.5px] text-zinc-500">Type a message...</div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${color}, ${colorSecondary})` }}>
              <Send size={11} />
            </div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${colorSecondary})` }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <Sparkles size={16} />
        </motion.div>
      </div>
      <p className="mt-3 text-center text-[11px] text-zinc-500">Live preview — updates as you type</p>
    </div>
  );
}
