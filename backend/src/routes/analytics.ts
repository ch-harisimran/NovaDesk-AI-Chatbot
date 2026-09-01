import { Router } from "express";
import { withTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 14));

  const data = await withTenant(tenantId, async (client) => {
    // Cast everything to plain `date` before joining -- conversations/messages
    // store TIMESTAMPTZ, generate_series here produces timestamps derived from
    // CURRENT_DATE, and mixing timestamptz/timestamp equality is timezone-
    // dependent. Comparing `::date` on both sides sidesteps that entirely.
    const volume = await client.query(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
              COALESCE(c.count, 0) AS conversations,
              COALESCE(m.count, 0) AS messages
       FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, interval '1 day') AS d(day)
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*) AS count
         FROM conversations WHERE tenant_id = $2 GROUP BY 1
       ) c ON c.day = d.day::date
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*) AS count
         FROM messages WHERE tenant_id = $2 AND role = 'user' GROUP BY 1
       ) m ON m.day = d.day::date
       ORDER BY d.day ASC`,
      [days, tenantId]
    );

    const topQuestions = await client.query(
      `SELECT content, COUNT(*) AS count
       FROM messages
       WHERE tenant_id = $1 AND role = 'user'
       GROUP BY content
       ORDER BY count DESC, MAX(created_at) DESC
       LIMIT 8`,
      [tenantId]
    );

    const resolution = await client.query(
      `SELECT status, COUNT(*) AS count FROM conversations WHERE tenant_id = $1 GROUP BY status`,
      [tenantId]
    );

    const feedbackCounts = await client.query(
      `SELECT feedback, COUNT(*) AS count FROM messages WHERE tenant_id = $1 AND feedback IS NOT NULL GROUP BY feedback`,
      [tenantId]
    );

    const sentimentCounts = await client.query(
      `SELECT sentiment, COUNT(*) AS count FROM conversations WHERE tenant_id = $1 AND sentiment IS NOT NULL GROUP BY sentiment`,
      [tenantId]
    );

    // Average time between a user message and the next assistant reply, in seconds.
    const avgResponse = await client.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (a.created_at - u.created_at))) AS avg_seconds
       FROM messages u
       JOIN LATERAL (
         SELECT created_at FROM messages a2
         WHERE a2.conversation_id = u.conversation_id AND a2.role = 'assistant' AND a2.created_at > u.created_at
         ORDER BY a2.created_at ASC LIMIT 1
       ) a ON true
       WHERE u.tenant_id = $1 AND u.role = 'user'`,
      [tenantId]
    );

    const totals = await client.query(
      `SELECT
         (SELECT COUNT(*) FROM conversations WHERE tenant_id = $1) AS total_conversations,
         (SELECT COUNT(*) FROM conversations WHERE tenant_id = $1 AND status = 'active') AS active_conversations,
         (SELECT COUNT(*) FROM conversations WHERE tenant_id = $1 AND status = 'handoff') AS handoff_conversations,
         (SELECT COUNT(*) FROM leads WHERE tenant_id = $1) AS total_leads,
         (SELECT COUNT(*) FROM knowledge_documents WHERE tenant_id = $1 AND status = 'ready') AS ready_documents`,
      [tenantId]
    );

    return {
      volume: volume.rows,
      topQuestions: topQuestions.rows,
      resolution: resolution.rows,
      feedback: feedbackCounts.rows,
      sentiment: sentimentCounts.rows,
      avgResponseSeconds: Number(avgResponse.rows[0]?.avg_seconds) || 0,
      totals: totals.rows[0],
    };
  });

  res.json(data);
});

export default router;
