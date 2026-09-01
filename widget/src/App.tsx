import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Bubble from "./components/Bubble";
import ChatPanel from "./components/ChatPanel";
import { fetchTenantConfig, sendMessage, uploadFile, sendFeedback, type TenantConfig, type Attachment } from "./lib/api";
import { getOrCreateSessionId, loadHistory, saveHistory, type StoredMessage } from "./lib/session";

function useQueryParams() {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

function postToParent(type: string, payload: Record<string, unknown> = {}) {
  window.parent?.postMessage({ source: "novadesk-widget", type, ...payload }, "*");
}

export default function App() {
  const params = useQueryParams();
  const tenantId = params.get("tenantId") || "";
  const apiUrl = params.get("apiUrl") || "http://localhost:4000";

  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [open, setOpen] = useState(params.get("startOpen") === "1");
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const proactiveTimerRef = useRef<number | null>(null);
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  useEffect(() => {
    if (!tenantId) {
      setError("Missing tenant id -- check the widget's data-tenant-id attribute.");
      return;
    }
    fetchTenantConfig(apiUrl, tenantId)
      .then((cfg) => setConfig(cfg))
      .catch(() => setError("Couldn't load the chat widget. Is the NovaDesk backend running?"));
    setMessages(loadHistory(tenantId));
  }, [tenantId, apiUrl]);

  useEffect(() => {
    if (tenantId) saveHistory(tenantId, messages);
  }, [messages, tenantId]);

  useEffect(() => {
    postToParent("resize", { open });
  }, [open]);

  // Proactive greeting: auto-open once, for first-time visitors only, after the
  // configured delay -- never re-fires once the visitor has interacted.
  useEffect(() => {
    if (!config || !config.proactive_enabled || messages.length > 0) return;
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(`novadesk_proactive_shown_${tenantId}`) === "1";
    } catch {
      /* ignore */
    }
    if (alreadyShown) return;

    proactiveTimerRef.current = window.setTimeout(() => {
      setOpen(true);
      try {
        sessionStorage.setItem(`novadesk_proactive_shown_${tenantId}`, "1");
      } catch {
        /* ignore */
      }
    }, Math.max(2, config.proactive_delay_seconds) * 1000);

    return () => {
      if (proactiveTimerRef.current) window.clearTimeout(proactiveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  async function handleSend(text: string) {
    if (!config) return;
    setError(null);
    const attachments = pendingAttachment ? [pendingAttachment] : undefined;
    const userMsg: StoredMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setPendingAttachment(null);
    setSending(true);

    try {
      const res = await sendMessage(apiUrl, {
        tenantId: config.id,
        sessionId,
        message: text,
        attachments,
      });
      const assistantMsg: StoredMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.handoff) setHandoff(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handlePickFile(file: File) {
    try {
      const uploaded = await uploadFile(apiUrl, file);
      setPendingAttachment(uploaded);
    } catch {
      setError("That file couldn't be uploaded -- try a smaller file.");
    }
  }

  async function handleFeedback(id: string, feedback: "up" | "down") {
    if (!config) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, feedback } : m)));
    sendFeedback(apiUrl, config.id, id, feedback).catch(() => {});
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-zinc-400">{error}</div>
    );
  }

  if (!config) {
    return <div className="h-full w-full" />; // nothing rendered yet -- keeps the bubble invisible until config loads
  }

  return (
    <div className="relative h-full w-full font-sans">
      {/* Panel occupies everything above the bubble's row -- absolutely positioned so the
          floating bubble can stay fixed in the bottom-right corner regardless of panel state. */}
      <AnimatePresence>
        {open && (
          <div className="absolute inset-0 bottom-[88px] p-0 sm:p-4">
            <ChatPanel
              config={config}
              messages={messages}
              sending={sending}
              handoff={handoff}
              pendingAttachmentName={pendingAttachment?.name || null}
              onClearAttachment={() => setPendingAttachment(null)}
              onPickFile={handlePickFile}
              onSend={handleSend}
              onFeedback={handleFeedback}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 z-10">
        <Bubble open={open} gradientFrom={config.widget_color} gradientTo={config.widget_color_secondary} onClick={() => setOpen((v) => !v)} logoUrl={config.logo_url} />
      </div>
    </div>
  );
}
