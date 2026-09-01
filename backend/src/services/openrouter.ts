/**
 * Thin client for OpenRouter's OpenAI-compatible chat completions endpoint.
 * https://openrouter.ai/api/v1/chat/completions
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResult {
  message: ChatMessage;
  raw: unknown;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function chatCompletion(opts: {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  model?: string;
  temperature?: number;
}): Promise<ChatCompletionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set. Add it to backend/.env");
  }

  const body: Record<string, unknown> = {
    model: opts.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    messages: opts.messages,
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "NovaDesk AI (local dev)",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    choices: { message: ChatMessage }[];
  };

  const message = json.choices?.[0]?.message;
  if (!message) {
    throw new Error("OpenRouter returned no message choice");
  }

  return { message, raw: json };
}
