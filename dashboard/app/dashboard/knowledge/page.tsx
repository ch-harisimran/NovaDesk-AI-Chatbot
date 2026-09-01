"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Link2, Type, Trash2, CheckCircle2, Loader2, XCircle, FileUp } from "lucide-react";
import { apiFetch, apiUpload, API_URL } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { KnowledgeDocument } from "@/lib/types";

type Mode = "text" | "url" | "pdf";

const statusMeta: Record<string, { tone: "success" | "warning" | "danger"; icon: typeof CheckCircle2; label: string }> = {
  ready: { tone: "success", icon: CheckCircle2, label: "Ready" },
  processing: { tone: "warning", icon: Loader2, label: "Embedding..." },
  failed: { tone: "danger", icon: XCircle, label: "Failed" },
};

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[] | null>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const refresh = useCallback(() => {
    apiFetch<{ documents: KnowledgeDocument[] }>("/api/knowledge").then((r) => setDocuments(r.documents));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function watchDocument(id: string) {
    if (pollRef.current[id]) return;
    pollRef.current[id] = setInterval(async () => {
      const res = await apiFetch<{ document: KnowledgeDocument }>(`/api/knowledge/${id}`);
      setDocuments((prev) => (prev ? prev.map((d) => (d.id === id ? res.document : d)) : prev));
      if (res.document.status !== "processing") {
        clearInterval(pollRef.current[id]);
        delete pollRef.current[id];
      }
    }, 1400);
  }

  async function submitText() {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ documentId: string }>("/api/knowledge/upload/text", {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });
      setTitle("");
      setContent("");
      refresh();
      watchDocument(res.documentId);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitUrl() {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ documentId: string }>("/api/knowledge/upload/url", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      setUrl("");
      refresh();
      watchDocument(res.documentId);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPdf(file: File) {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiUpload<{ documentId: string }>("/api/knowledge/upload/pdf", form);
      refresh();
      watchDocument(res.documentId);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) submitPdf(file);
  }

  async function handleDelete(id: string) {
    setDocuments((prev) => prev?.filter((d) => d.id !== id) || null);
    await apiFetch(`/api/knowledge/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="mt-1 text-sm text-zinc-500">What your AI assistant knows. Add articles, PDFs, or URLs -- they're chunked and embedded automatically.</p>
      </div>

      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn("p-6 transition-colors", dragActive && "border-brand/60 bg-brand-gradient-soft")}
      >
        <div className="mb-5 flex w-fit items-center gap-1 rounded-xl border border-black/8 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.03] p-1">
          {([
            { key: "text", label: "Paste text", icon: Type },
            { key: "url", label: "From URL", icon: Link2 },
            { key: "pdf", label: "Upload PDF", icon: FileText },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setMode(t.key)} className="relative rounded-lg px-3.5 py-1.5 text-xs font-medium">
              {mode === t.key && <motion.div layoutId="kb-mode-pill" className="absolute inset-0 rounded-lg bg-brand-gradient shadow-glow" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className={cn("relative z-10 flex items-center gap-1.5", mode === t.key ? "text-white" : "text-zinc-500")}>
                <t.icon size={13} /> {t.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "text" && (
            <motion.div key="text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Return & Exchange Policy" />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste the full article or FAQ content here..." />
              </div>
              <Button onClick={submitText} disabled={submitting || !title.trim() || !content.trim()}>
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />} Add to knowledge base
              </Button>
            </motion.div>
          )}

          {mode === "url" && (
            <motion.div key="url" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Page URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yoursite.com/faq" />
              </div>
              <Button onClick={submitUrl} disabled={submitting || !url.trim()}>
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />} Fetch & add
              </Button>
            </motion.div>
          )}

          {mode === "pdf" && (
            <motion.div key="pdf" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-black/15 dark:border-white/15 px-6 py-10 text-center transition-colors hover:border-brand/50"
              >
                <FileUp size={26} className="text-brand-to" />
                <p className="text-sm font-medium">Drop a PDF here, or click to browse</p>
                <p className="text-xs text-zinc-500">We'll extract the text, chunk it, and embed it automatically.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) submitPdf(file);
                  e.target.value = "";
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <div className="space-y-3">
        {!documents ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
        ) : documents.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-14 text-center">
            <FileText size={26} className="text-zinc-400" />
            <p className="text-sm font-medium">No knowledge base articles yet</p>
            <p className="text-xs text-zinc-500">Add your first article above to start grounding your AI's answers.</p>
          </Card>
        ) : (
          documents.map((doc) => {
            const meta = statusMeta[doc.status];
            return (
              <motion.div key={doc.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient-soft text-brand-to">
                    <FileText size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-zinc-500">
                      {doc.source_type.toUpperCase()} · {doc.chunk_count} chunks · {formatRelativeTime(doc.created_at)}
                    </p>
                    {doc.status === "processing" && (
                      <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <motion.div
                          className="h-full bg-brand-gradient"
                          initial={{ width: "5%" }}
                          animate={{ width: "88%" }}
                          transition={{ duration: 6, ease: "easeOut" }}
                        />
                      </div>
                    )}
                  </div>
                  <Badge tone={meta.tone} className="shrink-0">
                    <meta.icon size={11} className={doc.status === "processing" ? "animate-spin" : ""} />
                    {meta.label}
                  </Badge>
                  <button onClick={() => handleDelete(doc.id)} className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
