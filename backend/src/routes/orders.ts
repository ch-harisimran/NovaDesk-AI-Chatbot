import { Router } from "express";
import { withTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const { rows } = await withTenant(tenantId, (client) => client.query(`SELECT * FROM orders ORDER BY created_at DESC`));
  res.json({ orders: rows });
});

export default router;
