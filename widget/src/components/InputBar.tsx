import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Paperclip, Square, X } from "lucide-react";
import { isSpeechRecognitionSupported, createRecognizer } from "../lib/speech";
import { AttachmentChip } from "./MessageBubble";

interface Props {
  gradientFrom: string;
  gradientTo: string;
  disabled: boolean;
  pendingAttachmentName: string | null;
  onClearAttachment: () => void;
  onPickFile: (file: File) => void;
  onSend: (text: string) => void;
}

export default function InputBar({ gradientFrom, gradientTo, disabled, pendingAttachmentName, onClearAttachment, onPickFile, onSend }: Props) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const speechSupported = isSpeechRecognitionSupported();

  function submit() {
    const trimmed = text.trim();
    if (!trimmed && !pendingAttachmentName) return;
    onSend(trimmed || "(sent an attachment)");
    setText("");
  }

  function toggleVoice() {
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    const recognizer = createRecognizer(
      (transcript) => setText(transcript),
      () => setListening(false)
    );
    if (!recognizer) return;
    recognizerRef.current = recognizer;
    setListening(true);
    recognizer.start();
  }

  return (
    <div className="border-t border-white/10 bg-black/20 backdrop-blur-xl p-3">
      <AnimatePresence>
        {pendingAttachmentName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center gap-2"
          >
            <AttachmentChip name={pendingAttachmentName} />
            <button onClick={onClearAttachment} className="text-zinc-500 hover:text-zinc-300">
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
            e.target.value = "";
          }}
        />
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
          aria-label="Attach a file"
        >
          <Paperclip size={17} />
        </motion.button>

        {speechSupported && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleVoice}
            className={`shrink-0 rounded-full p-2 transition-colors ${
              listening ? "text-red-400 bg-red-500/10" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
            }`}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
          >
            {listening ? <Square size={15} /> : <Mic size={17} />}
          </motion.button>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={listening ? "Listening..." : "Type a message..."}
          disabled={disabled}
          className="min-h-[38px] max-h-24 flex-1 resize-none rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-[13.5px] text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/25 transition-colors"
        />

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={submit}
          disabled={disabled || (!text.trim() && !pendingAttachmentName)}
          className="shrink-0 rounded-full p-2.5 text-white shadow-glow disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          aria-label="Send message"
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  );
}
