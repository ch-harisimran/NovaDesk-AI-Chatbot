"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessagesSquare,
  BookOpen,
  BarChart3,
  Settings,
  Users,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-black/8 dark:border-white/8 bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">NovaDesk AI</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-brand-gradient shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/8 dark:border-white/8 p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Appearance</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-black/8 dark:border-white/8 p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-semibold text-white">
            {initials(admin?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{admin?.name}</p>
            <p className="truncate text-[10.5px] text-zinc-500">{admin?.email}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
