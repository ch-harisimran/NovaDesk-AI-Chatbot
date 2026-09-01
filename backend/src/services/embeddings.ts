/**
 * Embeddings via a local Ollama instance -- fully free, no API key, no
 * internet dependency once the model is pulled. Uses Ollama's unified
 * /api/embed endpoint, which accepts either a single string or an array
 * of strings as `input` and always returns an `embeddings` array.
 *
 * Setup (one-time):
 *   1. Install Ollama: https://ollama.com/download
 *   2. Pull the embedding model: `ollama pull nomic-embed-text`
 *   3. Make sure Ollama is running (the desktop app does this automatically,
 *      or run `ollama serve` yourself)
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

// nomic-embed-text outputs 768-dimensional vectors. If you swap in a
// different Ollama embedding model with a different output size, update
// this constant AND the `vector(768)` column in db/schema.sql to match --
// pgvector requires a fixed dimension per column.
const EMBEDDING_DIMS = 768;

async function callOllamaEmbed(input: string | string[]): Promise<number[][]> {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, input }),
    });
  } catch {
    throw new Error(
      `Couldn't reach Ollama at ${OLLAMA_BASE_URL}. Is it installed and running? ` +
        `See https://ollama.com/download, then run: ollama pull ${OLLAMA_EMBEDDING_MODEL}`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 404 && /model.*not found/i.test(text)) {
      throw new Error(`Ollama model "${OLLAMA_EMBEDDING_MODEL}" isn't pulled yet. Run: ollama pull ${OLLAMA_EMBEDDING_MODEL}`);
    }
    throw new Error(`Ollama embeddings request failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { embeddings: number[][] };
  return json.embeddings;
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await callOllamaEmbed(text);
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  // Keep each request to a modest batch size -- local inference is slower
  // than a hosted API, so smaller batches keep progress visible during seeding.
  const BATCH_SIZE = 32;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await callOllamaEmbed(batch);
    out.push(...embeddings);
  }
  return out;
}

export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export const EMBEDDING_DIMENSIONS = EMBEDDING_DIMS;
