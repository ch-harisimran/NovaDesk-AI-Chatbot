"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, BookOpen, Package, UserCheck, Users, Palette, Layers,
  ArrowRight, Check, Globe2, ShieldCheck, Zap,
} from "lucide-react";
import { FeatureCard } from "@/components/marketing/FeatureCard";

const WIDGET_URL = process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:5173";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const FEATURES = [
  { icon: BookOpen, title: "Grounded in your knowledge base", description: "Every answer is retrieved from articles, PDFs, or URLs you add — not hallucinated. RAG with pgvector similarity search under the hood." },
  { icon: Package, title: "Order & account lookups", description: "Function-calling lets the assistant check real order status by number and email, live, mid-conversation." },
  { icon: UserCheck, title: "Human handoff when it matters", description: "The assistant knows its limits — it flags conversations for your team the moment a visitor needs a real person." },
  { icon: Users, title: "Lead capture, automatically", description: "Names and emails are captured naturally in conversation and saved straight to your dashboard." },
  { icon: Palette, title: "Branded to match your product", description: "Colors, logo, and greeting update live in the dashboard — see exactly what visitors will see before you save." },
  { icon: Layers, title: "Multi-tenant from day one", description: "One platform, many client sites. Row-level security keeps every tenant's data completely isolated." },
];

const STEPS = [
  { n: "01", title: "Add your knowledge base", description: "Paste FAQs, upload a PDF, or point to a URL. Content is chunked and embedded automatically." },
  { n: "02", title: "Drop in one script tag", description: "The widget renders in an isolated iframe — it can't break your site's styling, and your site can't break it." },
  { n: "03", title: "Watch it work", description: "Conversations, leads, feedback, and analytics land in your dashboard in real time." },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-surface text-white">
      <Nav />
      <Hero />
      <LogosBand />
      <Features />
      <HowItWorks />
      <TrustBand />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">NovaDesk AI</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 sm:flex">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#trust" className="hover:text-white transition-colors">Multi-tenant & security</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-zinc-300 hover:text-white sm:block">
            Sign in
          </Link>
          <Link
            href="/login"
            className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-glow transition-shadow hover:shadow-glow-lg"
          >
            Open dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 animate-blob rounded-full bg-brand/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 animate-blob rounded-full bg-violet-500/25 blur-[110px]" style={{ animationDelay: "2.5s" }} />
      <div className="pointer-events-none absolute left-1/3 top-96 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/15 blur-[110px]" style={{ animationDelay: "5s" }} />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Multi-tenant · Runs entirely on localhost
          </motion.div>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            {["AI support that", "actually knows", "your business."].map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.12, ease: "easeOut" }}
                className="block"
              >
                {i === 1 ? <span className="text-gradient">{line}</span> : line}
              </motion.span>
            ))}
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 max-w-md text-lg text-zinc-400">
            Embed one script tag. Ground it in a real knowledge base. Look up orders, capture leads, and hand off to a human — all from a dashboard your whole team can use.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.62 }}
            className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/login" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-brand-gradient px-6 py-3.5 text-[15px] font-medium text-white shadow-glow-lg">
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" style={{ transform: "skewX(-20deg)" }} />
              Explore the dashboard <ArrowRight size={16} />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3.5 text-[15px] font-medium text-white hover:bg-white/5 transition-colors">
              See what it does
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 flex items-center gap-5 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> Real RAG, not a demo script</span>
            <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> Row-level security per tenant</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-[420px]"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-gradient opacity-20 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d14] shadow-glow-lg">
            <div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 truncate text-[11px] text-zinc-500">solaceskincare.com</span>
            </div>
            <iframe
              title="Live NovaDesk AI widget demo"
              src={`${WIDGET_URL}/?tenantId=solace-skincare&apiUrl=${encodeURIComponent(API_URL)}&startOpen=1`}
              className="h-[560px] w-full border-0 bg-gradient-to-b from-zinc-900 to-zinc-950"
            />
          </div>
          <p className="mt-3 text-center text-[11px] text-zinc-500">
            This is the real widget, talking to a real local backend — try asking about shipping or an order.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function LogosBand() {
  const items = ["Skincare", "SaaS", "D2C Retail", "Fintech", "Marketplaces", "Education"];
  return (
    <section className="border-y border-white/8 bg-white/[0.015] py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 text-xs uppercase tracking-wider text-zinc-500">
        <span className="text-zinc-600">Built for teams like</span>
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-to">Everything included</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">One platform, the whole support loop</h2>
          <p className="mt-3 text-zinc-400">From the first message to the resolved ticket, every piece is wired together and running locally.</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/8 bg-white/[0.015] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-to">How it works</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Live in three steps</h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <span className="text-4xl font-semibold text-white/10">{step.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBand() {
  const points = [
    { icon: ShieldCheck, title: "Row-level security", description: "Every table is scoped by tenant_id with Postgres RLS policies — cross-tenant reads fail closed, not open." },
    { icon: Globe2, title: "Multi-language, natively", description: "The model replies in whatever language your visitor writes in — no translation layer required." },
    { icon: Zap, title: "Fast by default", description: "pgvector similarity search plus a lean context window keeps responses quick, even with a large knowledge base." },
  ];
  return (
    <section id="trust" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {points.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.08 }}>
              <p.icon size={22} className="text-brand-to" />
              <h3 className="mt-3 text-[15px] font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-400">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-brand-gradient-soft px-8 py-16 text-center"
      >
        <div className="pointer-events-none absolute inset-0 bg-brand-gradient opacity-[0.12]" />
        <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">Running on your machine in minutes</h2>
        <p className="relative mx-auto mt-3 max-w-md text-zinc-400">Backend, dashboard, and widget — one seed script, three <code className="text-violet-300">npm run dev</code> commands.</p>
        <div className="relative mt-8 flex justify-center">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-7 py-3.5 text-[15px] font-medium text-white shadow-glow-lg">
            Open the dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/8 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-zinc-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-gradient">
            <Sparkles size={12} className="text-white" />
          </div>
          NovaDesk AI — local development build
        </div>
        <p>Seeded demo tenant: Solace Skincare Co.</p>
      </div>
    </footer>
  );
}
