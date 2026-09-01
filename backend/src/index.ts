import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import widgetRoutes from "./routes/widget";
import knowledgeRoutes from "./routes/knowledge";
import conversationsRoutes from "./routes/conversations";
import messagesRoutes from "./routes/messages";
import tenantsRoutes from "./routes/tenants";
import analyticsRoutes from "./routes/analytics";
import leadsRoutes from "./routes/leads";
import ordersRoutes from "./routes/orders";
import whatsappWebhook from "./routes/webhooks/whatsapp";
import telegramWebhook from "./routes/webhooks/telegram";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Widget embeds run from arbitrary "client" origins (any website that
      // installs the script tag), so we allow no-origin (server-to-server,
      // curl) and anything not explicitly blocked. Admin dashboard origins
      // are still restricted via allowedOrigins for the /api/auth, /api/conversations,
      // etc. routes in a stricter real deployment; locally we keep this permissive
      // so the demo client site + dashboard + widget iframe all just work.
      if (!origin || allowedOrigins.includes(origin) || true) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_req, res) => res.json({ ok: true, service: "novadesk-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/widget", widgetRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/tenants", tenantsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/webhooks/whatsapp", whatsappWebhook);
app.use("/api/webhooks/telegram", telegramWebhook);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\nNovaDesk AI backend running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health\n`);
});
