/**
 * Naive but effective token-aware chunker. We don't pull in a tokenizer
 * dependency for a local demo -- ~4 characters per token is a solid
 * approximation for English text, so we chunk by words and target ~500
 * tokens (~2000 characters) per chunk, with a small overlap so context
 * isn't lost at chunk boundaries.
 */

export interface Chunk {
  index: number;
  content: string;
  tokenCount: number;
}

const TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function chunkText(raw: string): Chunk[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const targetChars = TARGET_TOKENS * CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;

  // Split on paragraph boundaries first so we don't cut mid-sentence when avoidable.
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  const chunks: Chunk[] = [];
  let buffer = "";

  const pushBuffer = () => {
    const content = buffer.trim();
    if (content.length > 0) {
      chunks.push({ index: chunks.length, content, tokenCount: estimateTokens(content) });
    }
    buffer = "";
  };

  for (const para of paragraphs) {
    if ((buffer + "\n\n" + para).length > targetChars && buffer.length > 0) {
      pushBuffer();
      // seed the new buffer with a small overlap from the end of the previous chunk
      const prev = chunks[chunks.length - 1]?.content ?? "";
      buffer = prev.slice(Math.max(0, prev.length - overlapChars));
    }

    if (para.length > targetChars) {
      // paragraph itself is too big -- hard-split by sentence/word
      const words = para.split(/\s+/);
      let sub = buffer;
      for (const word of words) {
        if ((sub + " " + word).length > targetChars) {
          buffer = sub;
          pushBuffer();
          sub = "";
        }
        sub = sub ? `${sub} ${word}` : word;
      }
      buffer = sub;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  pushBuffer();

  return chunks;
}
