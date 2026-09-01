import { Router } from "express";
import { withTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

/** Admin-side view of feedback (visitor-submitted, via /api/widget/feedback/:id) -- this route lets an
 * admin correct/clear a feedback flag from the dashboard if needed. */
router.post("/:id/feedback", async (req: AuthedRequest, res) => {
  const { feedback } = req.body as { feedback: "up" | "down" | null };
  if (feedback !== "up" && feedback !== "down" && feedback !== null) {
    return res.status(400).json({ error: "feedback must be 'up', 'down', or null" });
  }
  const tenantId = req.admin!.tenantId;
  const updated = await withTenant(tenantId, (client) =>
    client.query(`UPDATE messages SET feedback = $1 WHERE id = $2 RETURNING *`, [feedback, req.params.id])
  );
  if (updated.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json({ message: updated.rows[0] });
});

export default router;
