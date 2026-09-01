import rateLimit from "express-rate-limit";

// Generous but real limits -- protects the local demo from a runaway widget
// loop without getting in the way of normal testing.
export const widgetRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body && (req.body.tenantId || req.query.tenantId)) || "unknown"}`,
  message: { error: "Too many messages -- please slow down a moment." },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
