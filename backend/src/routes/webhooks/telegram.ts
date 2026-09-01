import { Router } from "express";
import { migrationPool, withTenant } from "../../db/pool";
import { generateReply } from "../../services/rag";
import { Tenant } from "../../types";

const router = Router();

/**
 * Same pattern as the WhatsApp webhook: reuses generateReply() so Telegram
 * visitors get the identical RAG/order-lookup/lead-capture experience.
 * For live traffic, run `ngrok http 4000` and register the resulting URL as
 * `https://<ngrok-domain>/api/webhooks/telegram/<TELEGRAM_BOT_TOKEN>` via
 * https://api.telegram.org/bot<token>/setWebhook?url=...
 */
async function resolveDemoTenant(): Promise<Tenant | null> {
  const { rows } = await migrationPool.query<Tenant>(`SELECT * FROM tenants ORDER BY created_at ASC LIMIT 1`);
  return rows[0] || null;
}

router.post("/:token", async (req, res) => {
  res.sendStatus(200);

  try {
    const update = req.body;
    const message = update?.message;
    const text: string | undefined = message?.text;
    const chatId = message?.chat?.id;
    if (!text || !chatId) return;

    const tenant = await resolveDemoTenant();
    if (!tenant) return console.warn("[telegram webhook] no tenant configured yet -- run npm run seed");

    const sessionId = `telegram-${chatId}`;
    const conversationId = await withTenant(tenant.id, async (client) => {
      let { rows } = await client.query(
        `SELECT id FROM conversations WHERE tenant_id = $1 AND visitor_session_id = $2 AND channel = 'telegram' AND status != 'closed' ORDER BY created_at DESC LIMIT 1`,
        [tenant.id, sessionId]
      );
      if (rows.length > 0) return rows[0].id;
      const inserted = await client.query(
        `INSERT INTO conversations (tenant_id, visitor_session_id, channel) VALUES ($1, $2, 'telegram') RETURNING id`,
        [tenant.id, sessionId]
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

    const token = process.env.TELEGRAM_BOT_TOKEN || req.params.token;
    if (process.env.TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: result.reply }),
      }).catch((err) => console.error("[telegram webhook] send failed:", err));
    } else {
      console.log(`[MOCK TELEGRAM SEND] to chat ${chatId}: ${result.reply}`);
    }
  } catch (err) {
    console.error("[telegram webhook] error:", err);
  }
});

export default router;
