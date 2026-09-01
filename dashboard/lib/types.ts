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

export interface AdminUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

export interface ConversationSummary {
  id: string;
  visitor_session_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  channel: "web" | "whatsapp" | "telegram";
  status: "active" | "handoff" | "closed";
  sentiment: "positive" | "neutral" | "negative" | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments: { url: string; name: string; type: string }[];
  feedback: "up" | "down" | null;
  created_at: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  source_type: "text" | "pdf" | "url";
  source_ref: string | null;
  status: "processing" | "ready" | "failed";
  chunk_count: number;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  conversation_id: string | null;
  conversation_status: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  status: string;
  items: string;
  total_cents: number;
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

export interface AnalyticsData {
  volume: { date: string; conversations: number; messages: number }[];
  topQuestions: { content: string; count: number }[];
  resolution: { status: string; count: number }[];
  feedback: { feedback: "up" | "down"; count: number }[];
  sentiment: { sentiment: string; count: number }[];
  avgResponseSeconds: number;
  totals: {
    total_conversations: number;
    active_conversations: number;
    handoff_conversations: number;
    total_leads: number;
    ready_documents: number;
  };
}
