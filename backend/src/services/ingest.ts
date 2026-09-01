import { withTenant } from "../db/pool";
import { chunkText } from "./chunking";
import { embedBatch, toPgVector } from "./embeddings";

export interface IngestResult {
  documentId: string;
  chunkCount: number;
}

/**
 * Chunks + embeds a document's raw_content and writes the chunks to
 * knowledge_chunks, scoped to the given tenant. Called right after a
 * knowledge_documents row is inserted (status starts as 'processing').
 */
export async function ingestDocument(tenantId: string, documentId: string, rawContent: string): Promise<IngestResult> {
  const chunks = chunkText(rawContent);

  if (chunks.length === 0) {
    await withTenant(tenantId, (client) =>
      client.query(`UPDATE knowledge_documents SET status = 'failed', chunk_count = 0 WHERE id = $1`, [documentId])
    );
    return { documentId, chunkCount: 0 };
  }

  const embeddings = await embedBatch(chunks.map((c) => c.content));

  await withTenant(tenantId, async (client) => {
    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        `INSERT INTO knowledge_chunks (document_id, tenant_id, chunk_index, content, token_count, embedding)
         VALUES ($1, $2, $3, $4, $5, $6::vector)`,
        [documentId, tenantId, chunks[i].index, chunks[i].content, chunks[i].tokenCount, toPgVector(embeddings[i])]
      );
    }
    await client.query(
      `UPDATE knowledge_documents SET status = 'ready', chunk_count = $1 WHERE id = $2`,
      [chunks.length, documentId]
    );
  });

  return { documentId, chunkCount: chunks.length };
}

/** Best-effort readable-text extraction for a URL source (no headless browser -- strips tags). */
export async function fetchUrlAsText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "NovaDeskAI-Ingest/1.0" } });
  if (!res.ok) throw new Error(`Failed to fetch URL (${res.status})`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}
