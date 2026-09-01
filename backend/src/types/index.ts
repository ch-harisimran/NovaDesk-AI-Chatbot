export interface Tenant {
  id: string;
  name: string;
  slug: string;
  widget_color: string;
  widget_color_secondary: string;
  logo_url: string | null;
  greeting_message: string;
  proactive_message: string;
  proactive_delay_seconds: number;
  proactive_enabled: boolean;
  chat_model: string;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "agent";
}

export interface KnowledgeDocument {
  id: string;
  tenant_id: string;
  title: string;
  source_type: "text" | "pdf" | "url";
  source_ref: string | null;
  status: "processing" | "ready" | "failed";
  chunk_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  visitor_session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  channel: "web" | "whatsapp" | "telegram";
  status: "active" | "handoff" | "closed";
  sentiment: "positive" | "neutral" | "negative" | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  tenant_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments: { url: string; name: string; type: string }[];
  feedback: "up" | "down" | null;
  created_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  conversation_id: string | null;
  name: string | null;
  email: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_email: string;
  status: "processing" | "shipped" | "out_for_delivery" | "delivered" | "delayed" | "cancelled" | "returned";
  items: string;
  total_cents: number;
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

export interface AuthTokenPayload {
  adminId: string;
  tenantId: string;
  email: string;
  role: string;
}
