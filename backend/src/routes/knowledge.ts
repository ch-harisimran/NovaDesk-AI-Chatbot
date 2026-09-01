import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { withTenant } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { ingestDocument, fetchUrlAsText, parsePdfBuffer } from "../services/ingest";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const { rows } = await withTenant(tenantId, (client) =>
    client.query(
      `SELECT id, title, source_type, source_ref, status, chunk_count, created_at FROM knowledge_documents ORDER BY created_at DESC`
    )
  );
  res.json({ documents: rows });
});

const textSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});
const urlSchema = z.object({
  title: z.string().min(1).optional(),
  url: z.string().url(),
});

/** Plain-text or pasted content. */
router.post("/upload/text", async (req: AuthedRequest, res) => {
  const parsed = textSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "title and content are required" });
  const tenantId = req.admin!.tenantId;
  const { title, content } = parsed.data;

  const doc = await withTenant(tenantId, (client) =>
    client.query(
      `INSERT INTO knowledge_documents (tenant_id, title, source_type, raw_content) VALUES ($1, $2, 'text', $3) RETURNING id`,
      [tenantId, title, content]
    )
  );
  const documentId = doc.rows[0].id;

  ingestDocument(tenantId, documentId, content).catch((err) => console.error("ingest error:", err));
  res.status(202).json({ documentId, status: "processing" });
});

/** URL source -- fetched server-side and stripped to text. */
router.post("/upload/url", async (req: AuthedRequest, res) => {
  const parsed = urlSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "A valid url is required" });
  const tenantId = req.admin!.tenantId;
  const { url, title } = parsed.data;

  try {
    const content = await fetchUrlAsText(url);
    const doc = await withTenant(tenantId, (client) =>
      client.query(
        `INSERT INTO knowledge_documents (tenant_id, title, source_type, source_ref, raw_content) VALUES ($1, $2, 'url', $3, $4) RETURNING id`,
        [tenantId, title || url, url, content]
      )
    );
    const documentId = doc.rows[0].id;
    ingestDocument(tenantId, documentId, content).catch((err) => console.error("ingest error:", err));
    res.status(202).json({ documentId, status: "processing" });
  } catch (err) {
    res.status(422).json({ error: err instanceof Error ? err.message : "Failed to fetch URL" });
  }
});

/** PDF upload. */
router.post("/upload/pdf", upload.single("file"), async (req: AuthedRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const tenantId = req.admin!.tenantId;

  try {
    const content = await parsePdfBuffer(req.file.buffer);
    const doc = await withTenant(tenantId, (client) =>
      client.query(
        `INSERT INTO knowledge_documents (tenant_id, title, source_type, source_ref, raw_content) VALUES ($1, $2, 'pdf', $3, $4) RETURNING id`,
        [tenantId, req.file!.originalname, req.file!.originalname, content]
      )
    );
    const documentId = doc.rows[0].id;
    ingestDocument(tenantId, documentId, content).catch((err) => console.error("ingest error:", err));
    res.status(202).json({ documentId, status: "processing" });
  } catch (err) {
    res.status(422).json({ error: err instanceof Error ? err.message : "Failed to parse PDF" });
  }
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  await withTenant(tenantId, (client) => client.query(`DELETE FROM knowledge_documents WHERE id = $1`, [req.params.id]));
  res.json({ ok: true });
});

/** Poll status while a document is chunking/embedding (drives the dashboard's progress UI). */
router.get("/:id", async (req: AuthedRequest, res) => {
  const tenantId = req.admin!.tenantId;
  const { rows } = await withTenant(tenantId, (client) =>
    client.query(`SELECT id, title, source_type, status, chunk_count, created_at FROM knowledge_documents WHERE id = $1`, [req.params.id])
  );
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json({ document: rows[0] });
});

export default router;
