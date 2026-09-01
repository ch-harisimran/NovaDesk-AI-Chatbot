"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@solaceskincare.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong logging in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-blob rounded-full bg-brand/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 animate-blob rounded-full bg-violet-500/25 blur-[100px]" style={{ animationDelay: "3s" }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-glow-lg backdrop-blur-2xl"
      >
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-[16px] font-semibold tracking-tight text-white">NovaDesk AI</span>
        </Link>

        <h1 className="mb-1.5 text-xl font-semibold text-white">Welcome back</h1>
        <p className="mb-7 text-sm text-zinc-400">Sign in to manage your knowledge base and conversations.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-400">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400">Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
              placeholder="••••••••••"
            />
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={15} /></>}
          </Button>
        </form>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11.5px] leading-relaxed text-zinc-400">
          <span className="font-medium text-zinc-300">Demo credentials</span> (seeded by <code className="text-violet-300">npm run seed</code>):<br />
          admin@solaceskincare.com · SolaceDemo!2026
        </div>
      </motion.div>
    </div>
  );
}
