import { Router } from "express";
import { z } from "zod";
import { withTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/:id/settings", async (req: AuthedRequest, res) => {
  if (req.params.id !== req.admin!.tenantId) return res.status(403).json({ error: "Forbidden" });
  const { rows } = await withTenant(req.admin!.tenantId, (client) => client.query(`SELECT * FROM tenants WHERE id = $1`, [req.params.id]));
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json({ tenant: rows[0] });
});

const settingsSchema = z.object({
  name: z.string().min(1).optional(),
  widget_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  widget_color_secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_url: z.string().url().nullable().optional(),
  greeting_message: z.string().min(1).optional(),
  proactive_message: z.string().min(1).optional(),
  proactive_delay_seconds: z.number().int().min(0).max(300).optional(),
  proactive_enabled: z.boolean().optional(),
  chat_model: z.string().min(1).optional(),
});

router.patch("/:id/settings", async (req: AuthedRequest, res) => {
  if (req.params.id !== req.admin!.tenantId) return res.status(403).json({ error: "Forbidden" });
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid settings payload", details: parsed.error.flatten() });

  const fields = parsed.data;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: "No fields provided" });

  const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const values = keys.map((k) => (fields as Record<string, unknown>)[k]);

  const { rows } = await withTenant(req.admin!.tenantId, (client) =>
    client.query(`UPDATE tenants SET ${setClauses} WHERE id = $1 RETURNING *`, [req.params.id, ...values])
  );
  res.json({ tenant: rows[0] });
});

export default router;
