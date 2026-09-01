import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { withoutTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", authRateLimit, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email or password format" });

  const { email, password } = parsed.data;

  const admin = await withoutTenant(async (client) => {
    const { rows } = await client.query(`SELECT * FROM find_admin_by_email($1)`, [email]);
    return rows[0];
  });

  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { adminId: admin.id, tenantId: admin.tenant_id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"] }
  );

  res.json({
    token,
    admin: { id: admin.id, tenantId: admin.tenant_id, email: admin.email, name: admin.name, role: admin.role },
  });
});

router.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ admin: req.admin });
});

export default router;
