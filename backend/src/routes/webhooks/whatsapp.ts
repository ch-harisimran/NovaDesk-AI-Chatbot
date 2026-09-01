import { Router } from "express";
import { migrationPool, withTenant } from "../../db/pool";
import { generateReply } from "../../services/rag";
import { Tenant } from "../../types";

const router = Router();

/**
 * Multi-channel (Phase 3, stretch): reuses the exact same generateReply()
 * engine the web widget uses, so WhatsApp visitors get RAG + order lookup +
 * lead capture identically. Wiring this to a *real* WhatsApp number requires
 * a public HTTPS URL (e.g. `ngrok http 4000`) registered with Meta's
 * WhatsApp Business API console -- this route is fully functional locally,
 * it just needs that tunnel + a real WHATSAPP_TOKEN to receive live traffic.
 *
 * Local demo only has one tenant, so we resolve to "the first tenant" here.
 * A real multi-tenant deployment would map the inbound phone_number_id to a
 * tenant_id (e.g. a `tenant_channels` table) before routing the message.
 */
async function resolveDemoTenant(): Promise<Tenant | null> {
  const { rows } = await migrationPool.query<Tenant>(`SELECT * FROM tenants ORDER BY created_at ASC LIMIT 1`);
  return rows[0] || null;
}

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === (process.env.WHATSAPP_VERIFY_TOKEN || "novadesk_local_verify")) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

router.post("/", async (req, res) => {
  res.sendStatus(200); // ack immediately per WhatsApp's webhook contract

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message || message.type !== "text") return;

    const from: string = message.from; // phone number, used as the visitor session id
    const text: string = message.text?.body || "";
    const tenant = await resolveDemoTenant();
    if (!tenant) return console.warn("[whatsapp webhook] no tenant configured yet -- run npm run seed");

    const conversationId = await withTenant(tenant.id, async (client) => {
      let { rows } = await client.query(
        `SELECT id FROM conversations WHERE tenant_id = $1 AND visitor_session_id = $2 AND channel = 'whatsapp' AND status != 'closed' ORDER BY created_at DESC LIMIT 1`,
        [tenant.id, from]
      );
      if (rows.length > 0) return rows[0].id;
      const inserted = await client.query(
        `INSERT INTO conversations (tenant_id, visitor_session_id, channel) VALUES ($1, $2, 'whatsapp') RETURNING id`,
        [tenant.id, from]
      );
      return inserted.rows[0].id;
    });

    await withTenant(tenant.id, (client) =>
      client.query(`INSERT INTO messages (conversation_id, tenant_id, role, content) VALUES ($1, $2, 'user', $3)`, [conversationId, tenant.id, text])
    );

    const result = await generateReply(tenant.id, conversationId, tenant, text);

    await withTenant(tenant.id, (client) =>
      client.query(`INSERT INTO messages (conversation_id, tenant_id, role, content) VALUES ($1, $2, 'assistant', $3)`, [conversationId, tenant.id, result.reply])
    );

    if (process.env.WHATSAPP_TOKEN) {
      const phoneNumberId = change?.metadata?.phone_number_id;
      await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: from, text: { body: result.reply } }),
      }).catch((err) => console.error("[whatsapp webhook] send failed:", err));
    } else {
      console.log(`[MOCK WHATSAPP SEND] to ${from}: ${result.reply}`);
    }
  } catch (err) {
    console.error("[whatsapp webhook] error:", err);
  }
});

export default router;
