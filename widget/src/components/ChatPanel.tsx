import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import InputBar from "./InputBar";
import type { StoredMessage } from "../lib/session";
import type { TenantConfig } from "../lib/api";

interface Props {
  config: TenantConfig;
  messages: StoredMessage[];
  sending: boolean;
  handoff: boolean;
  pendingAttachmentName: string | null;
  onClearAttachment: () => void;
  onPickFile: (file: File) => void;
  onSend: (text: string) => void;
  onFeedback: (id: string, feedback: "up" | "down") => void;
}

export default function ChatPanel({
  config,
  messages,
  sending,
  handoff,
  pendingAttachmentName,
  onClearAttachment,
  onPickFile,
  onSend,
  onFeedback,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0F]/95 shadow-2xl backdrop-blur-2xl"
    >
      <div
        className="flex items-center gap-3 px-4 py-3.5 shrink-0"
        style={{ background: `linear-gradient(135deg, ${config.widget_color}, ${config.widget_color_secondary})` }}
      >
        {config.logo_url ? (
          <img src={config.logo_url} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30">
            <Sparkles size={16} className="text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{config.name}</p>
          <p className="flex items-center gap-1 text-[11px] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Typically replies instantly
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <MessageBubble
          message={{ id: "greeting", role: "assistant", content: config.greeting_message, createdAt: new Date().toISOString() }}
          gradientFrom={config.widget_color}
          gradientTo={config.widget_color_secondary}
          onFeedback={() => {}}
        />
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} gradientFrom={config.widget_color} gradientTo={config.widget_color_secondary} onFeedback={onFeedback} />
        ))}
        <AnimatePresence>
          {sending && (
            <motion.div exit={{ opacity: 0 }}>
              <TypingIndicator color={config.widget_color} />
            </motion.div>
          )}
        </AnimatePresence>
        {handoff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-300"
          >
            A teammate has been notified and will follow up shortly
          </motion.div>
        )}
      </div>

      <InputBar
        gradientFrom={config.widget_color}
        gradientTo={config.widget_color_secondary}
        disabled={sending}
        pendingAttachmentName={pendingAttachmentName}
        onClearAttachment={onClearAttachment}
        onPickFile={onPickFile}
        onSend={onSend}
      />

      <div className="border-t border-white/5 px-4 py-1.5 text-center text-[10px] text-zinc-600">Powered by NovaDesk AI</div>
    </motion.div>
  );
}
