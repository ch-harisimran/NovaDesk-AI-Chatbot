import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { migrationPool, withTenant } from "../db/pool";
import { ingestDocument } from "../services/ingest";
import { knowledgeArticles } from "./data/knowledgeArticles";
import { seedOrders } from "./data/orders";
import { seedConversations } from "./data/conversations";
import { standaloneLeads } from "./data/leads";

dotenv.config();

const TENANT_SLUG = "solace-skincare";
const ADMIN_EMAIL = "admin@solaceskincare.com";
const ADMIN_PASSWORD = "SolaceDemo!2026";
const ADMIN_NAME = "Mohammad Haris Imran";

function daysAgoAtHour(daysAgo: number, hour: number, minuteOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minuteOffset, Math.floor(Math.random() * 50), 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function applySchema() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf-8");
  await migrationPool.query(sql);
  console.log("Schema ensured.");
}

async function checkOllamaReady() {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/tags`);
  } catch {
    console.error(`Couldn't reach Ollama at ${baseUrl}.`);
    console.error("Install it from https://ollama.com/download, make sure it's running, then run:");
    console.error(`  ollama pull ${model}`);
    console.error("...and re-run npm run seed.");
    process.exit(1);
  }

  const json = (await res.json().catch(() => ({}))) as { models?: { name: string }[] };
  const hasModel = json.models?.some((m) => m.name === model || m.name.startsWith(`${model}:`));
  if (!hasModel) {
    console.error(`Ollama is running, but the "${model}" model isn't pulled yet. Run:`);
    console.error(`  ollama pull ${model}`);
    console.error("...and re-run npm run seed.");
    process.exit(1);
  }

  console.log(`Ollama ready (model: ${model}).`);
}

async function main() {
  await checkOllamaReady();
  await applySchema();

  console.log(`Resetting demo tenant "${TENANT_SLUG}" (if it already exists)...`);
  await migrationPool.query(`DELETE FROM tenants WHERE slug = $1`, [TENANT_SLUG]);

  console.log("Creating demo tenant: Solace Skincare Co....");
  const tenantRes = await migrationPool.query(
    `INSERT INTO tenants (name, slug, widget_color, widget_color_secondary, greeting_message, proactive_message, proactive_delay_seconds, proactive_enabled, chat_model)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8) RETURNING id`,
    [
      "Solace Skincare Co.",
      TENANT_SLUG,
      "#6366F1",
      "#8B5CF6",
      "Hi there! I'm the Solace Skincare assistant. Ask me anything about your order, our products, or your skincare routine.",
      "Have a question about your order or our products? I'm here to help.",
      14,
      "openai/gpt-4o-mini",
    ]
  );
  const tenantId: string = tenantRes.rows[0].id;

  console.log("Creating demo admin account...");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await migrationPool.query(
    `INSERT INTO admins (tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'owner')`,
    [tenantId, ADMIN_EMAIL, passwordHash, ADMIN_NAME]
  );

  console.log(`Ingesting ${knowledgeArticles.length} knowledge base articles (chunking + embedding via local Ollama)...`);
  for (const article of knowledgeArticles) {
    const doc = await withTenant(tenantId, (client) =>
      client.query(
        `INSERT INTO knowledge_documents (tenant_id, title, source_type, raw_content) VALUES ($1, $2, 'text', $3) RETURNING id`,
        [tenantId, article.title, article.content]
      )
    );
    const documentId = doc.rows[0].id;
    const result = await ingestDocument(tenantId, documentId, article.content);
    console.log(`  - "${article.title}" -> ${result.chunkCount} chunks`);
  }

  console.log(`Seeding ${seedOrders.length} mock orders...`);
  for (const o of seedOrders) {
    const estimatedDelivery =
      o.estimated_delivery_days_from_now === null ? null : addDays(new Date(), o.estimated_delivery_days_from_now).toISOString().slice(0, 10);
    await migrationPool.query(
      `INSERT INTO orders (tenant_id, order_number, customer_email, status, items, total_cents, tracking_number, estimated_delivery)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tenantId, o.order_number, o.customer_email, o.status, o.items, o.total_cents, o.tracking_number, estimatedDelivery]
    );
  }

  console.log(`Seeding ${seedConversations.length} conversations with realistic message threads...`);
  let leadCount = 0;
  for (const convo of seedConversations) {
    const startedAt = daysAgoAtHour(convo.daysAgo, convo.hour);
    const sessionId = `seed-${convo.daysAgo}-${convo.hour}-${Math.random().toString(36).slice(2, 8)}`;

    const convoRes = await migrationPool.query(
      `INSERT INTO conversations (tenant_id, visitor_session_id, visitor_name, visitor_email, channel, status, sentiment, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        tenantId,
        sessionId,
        convo.visitorName,
        convo.visitorEmail,
        convo.channel,
        convo.status,
        convo.sentiment,
        startedAt,
        startedAt,
      ]
    );
    const conversationId = convoRes.rows[0].id;

    let lastTs = startedAt;
    for (let i = 0; i < convo.messages.length; i++) {
      const m = convo.messages[i];
      const ts = new Date(startedAt.getTime() + i * (2 + Math.random() * 3) * 60 * 1000);
      lastTs = ts;
      await migrationPool.query(
        `INSERT INTO messages (conversation_id, tenant_id, role, content, feedback, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
        [conversationId, tenantId, m.role, m.content, m.feedback || null, ts]
      );
    }
    await migrationPool.query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [conversationId, lastTs]);

    if (convo.lead) {
      await migrationPool.query(
        `INSERT INTO leads (tenant_id, conversation_id, name, email, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, conversationId, convo.lead.name || null, convo.lead.email || null, lastTs]
      );
      leadCount++;
    }
  }

  console.log(`Seeding ${standaloneLeads.length} additional standalone leads...`);
  for (const lead of standaloneLeads) {
    await migrationPool.query(
      `INSERT INTO leads (tenant_id, name, email, created_at) VALUES ($1, $2, $3, $4)`,
      [tenantId, lead.name, lead.email, daysAgoAtHour(lead.daysAgo, 12)]
    );
    leadCount++;
  }

  console.log("\n=================================================================");
  console.log(" NovaDesk AI -- seed complete");
  console.log("=================================================================");
  console.log(` Tenant:        Solace Skincare Co.  (id: ${tenantId})`);
  console.log(` Admin login:   ${ADMIN_EMAIL}`);
  console.log(` Password:      ${ADMIN_PASSWORD}`);
  console.log(` Knowledge:     ${knowledgeArticles.length} articles ingested`);
  console.log(` Orders:        ${seedOrders.length}`);
  console.log(` Conversations: ${seedConversations.length}`);
  console.log(` Leads:         ${leadCount}`);
  console.log(` Widget tenant id (for the demo site's data-tenant-id): ${tenantId}`);
  console.log("=================================================================\n");

  await migrationPool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
