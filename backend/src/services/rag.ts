import { PoolClient } from "pg";
import { withTenant } from "../db/pool";
import { embedText, toPgVector } from "./embeddings";
import { chatCompletion, ChatMessage, ToolDefinition } from "./openrouter";
import { Tenant } from "../types";

const TOP_K = 5;

export interface RetrievedChunk {
  content: string;
  documentTitle: string;
  similarity: number;
}

async function retrieveRelevantChunks(client: PoolClient, tenantId: string, queryEmbedding: number[]): Promise<RetrievedChunk[]> {
  const vec = toPgVector(queryEmbedding);
  const { rows } = await client.query(
    `SELECT kc.content, kd.title AS document_title, 1 - (kc.embedding <=> $1::vector) AS similarity
     FROM knowledge_chunks kc
     JOIN knowledge_documents kd ON kd.id = kc.document_id
     WHERE kc.tenant_id = $2 AND kc.embedding IS NOT NULL
     ORDER BY kc.embedding <=> $1::vector
     LIMIT $3`,
    [vec, tenantId, TOP_K]
  );
  return rows.map((r) => ({ content: r.content, documentTitle: r.document_title, similarity: Number(r.similarity) }));
}

const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "check_order_status",
      description: "Look up the shipping/order status for a customer by order number (and optionally their email to confirm identity).",
      parameters: {
        type: "object",
        properties: {
          order_number: { type: "string", description: "The order number, e.g. NVD-10234" },
          customer_email: { type: "string", description: "The customer's email, if they provided it" },
        },
        required: ["order_number"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "capture_lead",
      description: "Save the visitor's name and/or email once they've shared it, so the business can follow up. Call this as soon as you learn either value -- don't wait to have both.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_human_handoff",
      description: "Flag this conversation for a human teammate to take over, e.g. because the visitor explicitly asked for a human, or the request is outside what you can resolve.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Brief reason a human is needed" },
        },
        required: ["reason"],
      },
    },
  },
];

function buildSystemPrompt(tenant: Tenant, chunks: RetrievedChunk[]): string {
  const context = chunks.length
    ? chunks.map((c, i) => `[${i + 1}] (from "${c.documentTitle}")\n${c.content}`).join("\n\n")
    : "No knowledge base articles matched this question closely -- answer conservatively and offer human handoff if you're unsure.";

  return `You are the AI support assistant embedded on ${tenant.name}'s website. You are warm, concise, and helpful -- you sound like a sharp member of their support team, not a generic bot.

Ground every factual claim in the knowledge base context below. If the answer isn't in the context and isn't something you can look up with a tool, say you're not sure and offer to connect them with a human teammate (use the request_human_handoff tool if they agree or ask directly).

Always reply in the same language the visitor is writing in.

If you don't yet know the visitor's name or email and the conversation has gone a couple of turns, ask for it naturally in the flow of helping them (e.g. "Happy to look into that -- what's a good email in case we need to follow up?"). Never demand it up front before answering their first question. As soon as they share a name or email, call capture_lead.

For any question about an order, shipping, or delivery status, use the check_order_status tool rather than guessing.

Knowledge base context:
${context}`;
}

export interface RagResult {
  reply: string;
  handoffRequested: boolean;
  handoffReason: string | null;
  leadCaptured: { name?: string; email?: string } | null;
}

interface OrderRow {
  order_number: string;
  status: string;
  items: string;
  tracking_number: string | null;
  estimated_delivery: string | null;
}

async function executeToolCall(
  client: PoolClient,
  tenantId: string,
  conversationId: string,
  name: string,
  args: Record<string, unknown>
): Promise<{ result: unknown; handoff?: { reason: string }; lead?: { name?: string; email?: string } }> {
  if (name === "check_order_status") {
    const orderNumber = String(args.order_number || "").trim();
    const email = args.customer_email ? String(args.customer_email).trim().toLowerCase() : undefined;
    const params: unknown[] = [tenantId, orderNumber];
    let query = `SELECT order_number, status, items, tracking_number, estimated_delivery FROM orders WHERE tenant_id = $1 AND order_number = $2`;
    if (email) {
      query += ` AND lower(customer_email) = $3`;
      params.push(email);
    }
    const { rows } = await client.query<OrderRow>(query, params);
    if (rows.length === 0) {
      return { result: { found: false, message: "No order found with that order number" + (email ? " and email" : "") + ". Double-check the order number." } };
    }
    return { result: { found: true, ...rows[0] } };
  }

  if (name === "capture_lead") {
    const leadName = args.name ? String(args.name).trim() : undefined;
    const leadEmail = args.email ? String(args.email).trim() : undefined;
    if (!leadName && !leadEmail) return { result: { saved: false } };
    await client.query(
      `INSERT INTO leads (tenant_id, conversation_id, name, email) VALUES ($1, $2, $3, $4)`,
      [tenantId, conversationId, leadName || null, leadEmail || null]
    );
    await client.query(
      `UPDATE conversations SET visitor_name = COALESCE($2, visitor_name), visitor_email = COALESCE($3, visitor_email) WHERE id = $1`,
      [conversationId, leadName || null, leadEmail || null]
    );
    return { result: { saved: true }, lead: { name: leadName, email: leadEmail } };
  }

  if (name === "request_human_handoff") {
    const reason = args.reason ? String(args.reason) : "Visitor requested a human";
    await client.query(`UPDATE conversations SET status = 'handoff' WHERE id = $1`, [conversationId]);
    return { result: { flagged: true }, handoff: { reason } };
  }

  return { result: { error: `Unknown tool ${name}` } };
}

export async function generateReply(
  tenantId: string,
  conversationId: string,
  tenant: Tenant,
  latestUserMessage: string
): Promise<RagResult> {
  return withTenant(tenantId, async (client) => {
    const queryEmbedding = await embedText(latestUserMessage);
    const chunks = await retrieveRelevantChunks(client, tenantId, queryEmbedding);

    const { rows: historyRows } = await client.query(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 20`,
      [conversationId]
    );

    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt(tenant, chunks) },
      ...historyRows.map((r): ChatMessage => ({ role: r.role, content: r.content })),
    ];

    let handoffRequested = false;
    let handoffReason: string | null = null;
    let leadCaptured: { name?: string; email?: string } | null = null;

    let completion = await chatCompletion({ messages, tools: TOOLS, model: tenant.chat_model });
    let rounds = 0;

    while (completion.message.tool_calls && completion.message.tool_calls.length > 0 && rounds < 4) {
      messages.push(completion.message);
      for (const call of completion.message.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }
        const { result, handoff, lead } = await executeToolCall(client, tenantId, conversationId, call.function.name, args);
        if (handoff) {
          handoffRequested = true;
          handoffReason = handoff.reason;
        }
        if (lead) leadCaptured = lead;
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      completion = await chatCompletion({ messages, tools: TOOLS, model: tenant.chat_model });
      rounds++;
    }

    return {
      reply: completion.message.content || "Sorry, I wasn't able to generate a response just now -- could you try rephrasing that?",
      handoffRequested,
      handoffReason,
      leadCaptured,
    };
  });
}
