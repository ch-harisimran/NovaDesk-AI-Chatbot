"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Check, Copy, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetPreview } from "@/components/dashboard/WidgetPreview";
import type { Tenant } from "@/lib/types";

export default function SettingsPage() {
  const { admin } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!admin) return;
    apiFetch<{ tenant: Tenant }>(`/api/tenants/${admin.tenantId}/settings`).then((r) => setTenant(r.tenant));
  }, [admin]);

  function set<K extends keyof Tenant>(key: K, value: Tenant[K]) {
    setTenant((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function handleSave() {
    if (!tenant || !admin) return;
    setSaving(true);
    try {
      const { id, created_at, updated_at, slug, ...rest } = tenant;
      // Empty string isn't a valid URL -- normalize to null so the backend's
      // z.string().url().nullable() validation accepts a cleared logo field.
      const payload = { ...rest, logo_url: rest.logo_url && rest.logo_url.trim() ? rest.logo_url : null };
      const res = await apiFetch<{ tenant: Tenant }>(`/api/tenants/${admin.tenantId}/settings`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setTenant(res.tenant);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function copyEmbed() {
    if (!tenant) return;
    const snippet = `<script src="${process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:5173"}/widget.js" data-tenant-id="${tenant.id}"></script>`;
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!tenant) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[560px] w-full rounded-3xl lg:col-span-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Widget Settings</h1>
          <p className="mt-1 text-sm text-zinc-500">Brand your assistant. Changes preview instantly on the right.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? "Saved" : saving ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold">Branding</h2>
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input value={tenant.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Primary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tenant.widget_color}
                    onChange={(e) => set("widget_color", e.target.value)}
                    className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
                  />
                  <Input value={tenant.widget_color} onChange={(e) => set("widget_color", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Secondary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tenant.widget_color_secondary}
                    onChange={(e) => set("widget_color_secondary", e.target.value)}
                    className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
                  />
                  <Input value={tenant.widget_color_secondary} onChange={(e) => set("widget_color_secondary", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Logo URL (optional)</Label>
              <Input value={tenant.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://yoursite.com/logo.png" />
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold">Messaging</h2>
            <div className="space-y-1.5">
              <Label>Greeting message</Label>
              <Textarea rows={2} value={tenant.greeting_message} onChange={(e) => set("greeting_message", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Proactive message</Label>
              <Textarea rows={2} value={tenant.proactive_message} onChange={(e) => set("proactive_message", e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/8 dark:border-white/8 p-3.5">
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="text-zinc-400" />
                <div>
                  <p className="text-xs font-medium">Proactive auto-open</p>
                  <p className="text-[11px] text-zinc-500">Opens automatically for first-time visitors</p>
                </div>
              </div>
              <Switch checked={tenant.proactive_enabled} onChange={(v) => set("proactive_enabled", v)} />
            </div>
            {tenant.proactive_enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5">
                <Label>Delay before auto-opening (seconds)</Label>
                <Input
                  type="number"
                  min={2}
                  max={300}
                  value={tenant.proactive_delay_seconds}
                  onChange={(e) => set("proactive_delay_seconds", Number(e.target.value))}
                  className="w-32"
                />
              </motion.div>
            )}
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold">Embed on your site</h2>
            <p className="text-xs text-zinc-500">Paste this once, anywhere before <code>&lt;/body&gt;</code>.</p>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-black/40 p-3 font-mono text-[11px] text-zinc-400 overflow-x-auto">
              <span className="whitespace-nowrap">
                &lt;script src="{process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:5173"}/widget.js" data-tenant-id="{tenant.id}"&gt;&lt;/script&gt;
              </span>
              <button onClick={copyEmbed} className="ml-auto shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-8">
            <Card className="p-6">
              <WidgetPreview
                name={tenant.name}
                color={tenant.widget_color}
                colorSecondary={tenant.widget_color_secondary}
                greeting={tenant.greeting_message}
                logoUrl={tenant.logo_url || ""}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
