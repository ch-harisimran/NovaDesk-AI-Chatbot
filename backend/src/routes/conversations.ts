import { Router } from "express";
import { withTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const { rows } = await withTenant(tenantId, (client) => {
    const params: unknown[] = [];
    let where = "";
    if (status && status !== "all") {
      params.push(status);
      where = `WHERE c.status = $1`;
    }
    return client.query(
      `SELECT c.id, c.visitor_session_id, c.visitor_name, c.visitor_email, c.channel, c.status, c.sentiment,
              c.created_at, c.updated_at,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
       FROM conversations c
       ${where}
       ORDER BY c.updated_at DESC
       LIMIT 200`,
      params
    );
  });
  res.json({ conversations: rows });
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const { convo, messages } = await withTenant(tenantId, async (client) => {
    const convoRes = await client.query(`SELECT * FROM conversations WHERE id = $1`, [req.params.id]);
    const msgRes = await client.query(`SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`, [req.params.id]);
    return { convo: convoRes.rows[0], messages: msgRes.rows };
  });
  if (!convo) return res.status(404).json({ error: "Not found" });
  res.json({ conversation: convo, messages });
});

router.post("/:id/handoff", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const updated = await withTenant(tenantId, (client) =>
    client.query(`UPDATE conversations SET status = 'handoff' WHERE id = $1 RETURNING *`, [req.params.id])
  );
  if (updated.rows.length === 0) return res.status(404).json({ error: "Not found" });
  console.log(`[MOCK EMAIL] Conversation ${req.params.id} manually flagged for handoff by ${req.admin!.email}`);
  res.json({ conversation: updated.rows[0] });
});

router.post("/:id/close", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const updated = await withTenant(tenantId, (client) =>
    client.query(`UPDATE conversations SET status = 'closed' WHERE id = $1 RETURNING *`, [req.params.id])
  );
  if (updated.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json({ conversation: updated.rows[0] });
});

export default router;
