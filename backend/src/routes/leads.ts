import { Router } from "express";
import { withTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const { rows } = await withTenant(tenantId, (client) =>
    client.query(
      `SELECT l.*, c.status AS conversation_status
       FROM leads l LEFT JOIN conversations c ON c.id = l.conversation_id
       ORDER BY l.created_at DESC`
    )
  );
  res.json({ leads: rows });
});

export default router;
