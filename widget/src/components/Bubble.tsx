import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

interface Props {
  open: boolean;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
  logoUrl?: string | null;
}

export default function Bubble({ open, gradientFrom, gradientTo, onClick, logoUrl }: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      aria-label={open ? "Close chat" : "Open chat"}
      className="relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-glow"
      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
    >
      {/* idle breathing glow */}
      {!open && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            <X size={26} />
          </motion.span>
        ) : logoUrl ? (
          <motion.img
            key="logo"
            src={logoUrl}
            alt=""
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <motion.span
            key="chat"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            <MessageCircle size={26} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
