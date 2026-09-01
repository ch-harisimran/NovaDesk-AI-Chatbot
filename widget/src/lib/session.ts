const STORAGE_KEY = "novadesk_session_id";

export function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // localStorage unavailable (e.g. strict privacy mode) -- fall back to an in-memory id
    return crypto.randomUUID();
  }
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  feedback?: "up" | "down" | null;
}

function historyKey(tenantId: string): string {
  return `novadesk_history_${tenantId}`;
}

export function loadHistory(tenantId: string): StoredMessage[] {
  try {
    const raw = window.localStorage.getItem(historyKey(tenantId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(tenantId: string, messages: StoredMessage[]): void {
  try {
    window.localStorage.setItem(historyKey(tenantId), JSON.stringify(messages.slice(-50)));
  } catch {
    // ignore -- non-critical
  }
}
