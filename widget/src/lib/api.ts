export interface TenantConfig {
  id: string;
  name: string;
  widget_color: string;
  widget_color_secondary: string;
  logo_url: string | null;
  greeting_message: string;
  proactive_message: string;
  proactive_delay_seconds: number;
  proactive_enabled: boolean;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
}

export interface SendMessageResponse {
  conversationId: string;
  reply: string;
  handoff: boolean;
}

function base(apiUrl: string) {
  return apiUrl.replace(/\/$/, "");
}

export async function fetchTenantConfig(apiUrl: string, tenantId: string): Promise<TenantConfig> {
  const res = await fetch(`${base(apiUrl)}/api/widget/config/${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error("Failed to load widget configuration");
  const json = await res.json();
  return json.tenant;
}

export async function sendMessage(
  apiUrl: string,
  params: {
    tenantId: string;
    sessionId: string;
    message: string;
    visitorName?: string;
    visitorEmail?: string;
    attachments?: Attachment[];
  }
): Promise<SendMessageResponse> {
  const res = await fetch(`${base(apiUrl)}/api/widget/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Something went wrong" }));
    throw new Error(err.error || "Something went wrong");
  }
  return res.json();
}

export async function uploadFile(apiUrl: string, file: File): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base(apiUrl)}/api/widget/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function sendFeedback(apiUrl: string, tenantId: string, messageId: string, feedback: "up" | "down"): Promise<void> {
  await fetch(`${base(apiUrl)}/api/widget/feedback/${messageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId, feedback }),
  });
}
