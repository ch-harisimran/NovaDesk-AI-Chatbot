/**
 * Lightweight, dependency-free sentiment heuristic. This is intentionally
 * simple (keyword/phrase scoring) rather than a model call -- it runs
 * synchronously on every visitor message with zero added latency or cost,
 * which is exactly what "flag negative-sentiment conversations" needs.
 */

const NEGATIVE_WORDS = [
  "angry", "annoyed", "annoying", "terrible", "horrible", "awful", "worst",
  "hate", "useless", "broken", "scam", "refund", "cancel", "cancelled",
  "disappointed", "disappointing", "frustrated", "frustrating", "unacceptable",
  "ridiculous", "never again", "waste of money", "not working", "doesn't work",
  "still waiting", "ignored", "rude", "complaint", "furious", "garbage",
  "poor quality", "damaged", "late again", "no response", "sick of",
];

const POSITIVE_WORDS = [
  "thanks", "thank you", "great", "awesome", "love", "amazing", "perfect",
  "helpful", "appreciate", "excellent", "wonderful", "happy", "fantastic",
  "nice", "good", "works great", "impressed", "glad", "cool", "sounds good",
];

export type Sentiment = "positive" | "neutral" | "negative";

export function analyzeSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 1;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 1;

  // exclamation-heavy + negative word combo often signals real frustration
  const exclaims = (lower.match(/!/g) || []).length;
  if (score < 0 && exclaims >= 2) score -= 1;

  if (score <= -1) return "negative";
  if (score >= 1) return "positive";
  return "neutral";
}
