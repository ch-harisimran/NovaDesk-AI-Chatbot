import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { withTenant, migrationPool } from "../db/pool";
import { generateReply } from "../services/rag";
import { analyzeSentiment } from "../services/sentiment";
import { widgetRateLimit } from "../middleware/rateLimit";
import { Tenant } from "../types";

const router = Router();

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The widget's data-tenant-id attribute accepts either a real tenant UUID
 * (what you'd use in production) or a human-friendly slug like
 * "solace-skincare" (what the seeded demo tenant and demo site use, since
 * the UUID is regenerated every time you run `npm run seed`).
 */
async function resolveTenant(idOrSlug: string): Promise<Tenant | null> {
  const column = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const { rows } = await migrationPool.query<Tenant>(`SELECT * FROM tenants WHERE ${column} = $1`, [idOrSlug]);
  return rows[0] || null;
}

/** Public: widget branding config, used by the loader/widget UI before any chat starts. */
router.get("/config/:tenantId", async (req, res) => {
  // Config lookup happens before we know the tenant is legitimate, so it runs
  // against the migration pool (read-only, single row, no user input in the
  // query text) rather than the RLS-scoped pool which requires the tenant
  // already be "current".
  const tenant = await resolveTenant(req.params.tenantId);
  if (!tenant) return res.status(404).json({ error: "Unknown tenant" });
  const { id, name, widget_color, widget_color_secondary, logo_url, greeting_message, proactive_message, proactive_delay_seconds, proactive_enabled } = tenant;
  res.json({ tenant: { id, name, widget_color, widget_color_secondary, logo_url, greeting_message, proactive_message, proactive_delay_seconds, proactive_enabled } });
});

const messageSchema = z.object({
  tenantId: z.string().min(1),
  sessionId: z.string().min(1),
  message: z.string().min(1).max(4000),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional(),
  channel: z.enum(["web", "whatsapp", "telegram"]).optional(),
  attachments: z.array(z.object({ url: z.string(), name: z.string(), type: z.string() })).optional(),
});

router.post("/message", widgetRateLimit, async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
  const { tenantId: tenantIdOrSlug, sessionId, message, visitorName, visitorEmail, channel, attachments } = parsed.data;

  const tenant = await resolveTenant(tenantIdOrSlug);
  if (!tenant) return res.status(404).json({ error: "Unknown tenant" });
  const tenantId = tenant.id;

  try {
    const result = await withTenant(tenantId, async (client) => {
      let { rows: convoRows } = await client.query(
        `SELECT id, status FROM conversations WHERE tenant_id = $1 AND visitor_session_id = $2 AND status != 'closed' ORDER BY created_at DESC LIMIT 1`,
        [tenantId, sessionId]
      );
      let conversationId: string;
      if (convoRows.length > 0) {
        conversationId = convoRows[0].id;
        if (visitorName || visitorEmail) {
          await client.query(
            `UPDATE conversations SET visitor_name = COALESCE($2, visitor_name), visitor_email = COALESCE($3, visitor_email) WHERE id = $1`,
            [conversationId, visitorName || null, visitorEmail || null]
          );
        }
      } else {
        const inserted = await client.query(
          `INSERT INTO conversations (tenant_id, visitor_session_id, visitor_name, visitor_email, channel)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [tenantId, sessionId, visitorName || null, visitorEmail || null, channel || "web"]
        );
        conversationId = inserted.rows[0].id;
      }

      const sentiment = analyzeSentiment(message);
      await client.query(
        `INSERT INTO messages (conversation_id, tenant_id, role, content, attachments) VALUES ($1, $2, 'user', $3, $4::jsonb)`,
        [conversationId, tenantId, message, JSON.stringify(attachments || [])]
      );
      await client.query(
        `UPDATE conversations SET sentiment = CASE WHEN $2 = 'negative' THEN 'negative' ELSE COALESCE(sentiment, $2) END WHERE id = $1`,
        [conversationId, sentiment]
      );

      return { conversationId };
    });

    const ragResult = await generateReply(tenantId, result.conversationId, tenant, message);

    await withTenant(tenantId, async (client) => {
      await client.query(
        `INSERT INTO messages (conversation_id, tenant_id, role, content) VALUES ($1, $2, 'assistant', $3)`,
        [result.conversationId, tenantId, ragResult.reply]
      );
    });

    if (ragResult.handoffRequested) {
      // Mock email alert -- in production this would hit a real provider.
      console.log(
        `[MOCK EMAIL] To: ${tenant.name} support team | Subject: Conversation needs a human | ` +
          `Conversation ${result.conversationId} flagged for handoff. Reason: ${ragResult.handoffReason}`
      );
    }

    res.json({
      conversationId: result.conversationId,
      reply: ragResult.reply,
      handoff: ragResult.handoffRequested,
    });
  } catch (err) {
    console.error("widget/message error:", err);
    res.status(500).json({ error: "Something went wrong generating a response. Please try again." });
  }
});

router.post("/upload", widgetRateLimit, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, name: req.file.originalname, type: req.file.mimetype });
});

/** Public: visitor thumbs up/down on an assistant message. */
router.post("/feedback/:messageId", widgetRateLimit, async (req, res) => {
  const { tenantId: tenantIdOrSlug, feedback } = req.body as { tenantId?: string; feedback?: "up" | "down" };
  if (!tenantIdOrSlug || (feedback !== "up" && feedback !== "down")) {
    return res.status(400).json({ error: "tenantId and feedback ('up'|'down') are required" });
  }
  const tenant = await resolveTenant(tenantIdOrSlug);
  if (!tenant) return res.status(404).json({ error: "Unknown tenant" });
  await withTenant(tenant.id, async (client) => {
    await client.query(`UPDATE messages SET feedback = $1 WHERE id = $2 AND role = 'assistant'`, [feedback, req.params.messageId]);
  });
  res.json({ ok: true });
});

export default router;
