import { motion } from "framer-motion";

export default function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/8 px-4 py-3 w-fit backdrop-blur-md border border-white/10">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
