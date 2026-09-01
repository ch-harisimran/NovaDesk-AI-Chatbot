import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Paperclip } from "lucide-react";
import type { StoredMessage } from "../lib/session";

interface Props {
  message: StoredMessage;
  gradientFrom: string;
  gradientTo: string;
  onFeedback: (id: string, feedback: "up" | "down") => void;
}

export default function MessageBubble({ message, gradientFrom, gradientTo, onFeedback }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
          isUser ? "rounded-br-sm text-white" : "rounded-bl-sm text-zinc-100 bg-white/8 border border-white/10 backdrop-blur-md"
        }`}
        style={isUser ? { background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` } : undefined}
      >
        {message.content}
      </div>

      {!isUser && (
        <div className="flex items-center gap-1 pl-1">
          <button
            aria-label="Good response"
            onClick={() => onFeedback(message.id, "up")}
            className={`rounded-lg p-1 transition-colors hover:bg-white/10 active:scale-90 ${
              message.feedback === "up" ? "text-emerald-400" : "text-zinc-500"
            }`}
          >
            <ThumbsUp size={13} />
          </button>
          <button
            aria-label="Bad response"
            onClick={() => onFeedback(message.id, "down")}
            className={`rounded-lg p-1 transition-colors hover:bg-white/10 active:scale-90 ${
              message.feedback === "down" ? "text-red-400" : "text-zinc-500"
            }`}
          >
            <ThumbsDown size={13} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function AttachmentChip({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] text-zinc-300 border border-white/10">
      <Paperclip size={12} />
      <span className="truncate max-w-[140px]">{name}</span>
    </div>
  );
}
