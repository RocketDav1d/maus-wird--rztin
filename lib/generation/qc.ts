import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, ANTHROPIC_MODEL, CACHE_EPHEMERAL } from "./anthropic";
import { openai, MODELS } from "./openai";
import { groundingZ, type CardCandidate } from "./schema";
import { SYSTEM_GROUNDING } from "./prompts";

const FORBIDDEN_QUESTION_PATTERNS = [
  /^\s*in welchem jahr/i,
  /^\s*wann wurde\b/i,
  /^\s*wer entdeckte\b/i,
  /^\s*wer beschrieb\b/i,
  /^\s*wie viele\b.*(?:phasen|stufen|stadien)\b/i,
  /^\s*was bedeutet die abkürzung\b/i,
];

const MIN_ANSWER_WORDS = 12;

/** Heuristic filter. Drops obviously trivial cards before we spend tokens. */
export function triviality(c: CardCandidate): { keep: boolean; reason?: string } {
  if (
    FORBIDDEN_QUESTION_PATTERNS.some((re) => re.test(c.question_de.trim()))
  ) {
    return { keep: false, reason: "Frage matcht Trivia-Muster." };
  }
  const words = c.expected_answer_de.trim().split(/\s+/).filter(Boolean);
  if (words.length < MIN_ANSWER_WORDS) {
    return { keep: false, reason: "Antwort zu kurz." };
  }
  const required = c.answer_key_points.filter((k) => k.required).length;
  if (required < 2) {
    return { keep: false, reason: "Zu wenige Pflicht-Schlüsselpunkte." };
  }
  return { keep: true };
}

/**
 * Per-card LLM check: is the expected answer actually supported by the quote?
 * Called once per candidate during a QC pass — cache_control on the system prompt
 * means the second call onward reuses the cached prefix (if it meets the model's
 * minimum prefix size).
 */
export async function checkGrounding(c: CardCandidate): Promise<{
  supported: "yes" | "no" | "partial";
  reason: string;
}> {
  const r = await anthropic.messages.parse({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(groundingZ),
      effort: "high",
    },
    system: [
      {
        type: "text",
        text: SYSTEM_GROUNDING,
        cache_control: CACHE_EPHEMERAL,
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          `Frage: ${c.question_de}`,
          "",
          `Erwartete Antwort (Schlüsselpunkte):`,
          ...c.answer_key_points.map(
            (k) => `- ${k.required ? "[required] " : ""}${k.point_de}`,
          ),
          "",
          `Quellzitat (Seite ${c.source_page}):`,
          `"${c.source_quote_de}"`,
        ].join("\n"),
      },
    ],
  });

  if (!r.parsed_output) {
    return { supported: "partial", reason: "Kein Ergebnis." };
  }
  return {
    supported: r.parsed_output.supported,
    reason: r.parsed_output.reason_de,
  };
}

/** Embed many strings in a single call. Embeddings stay on OpenAI. */
export async function embedQuestions(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const r = await openai.embeddings.create({
    model: MODELS.embedding,
    input: texts,
  });
  return r.data.map((d) => d.embedding);
}

/** Cosine similarity for unit-ish vectors (OpenAI embeddings are normalized). */
function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export type WithEmbedding<T> = T & { embedding: number[] };

/**
 * Greedy dedup. For each card, if a kept card has cosine >= threshold,
 * keep whichever has higher difficulty (or earlier order on tie).
 */
export function dedupBySemantic<T extends { difficulty: number }>(
  cards: WithEmbedding<T>[],
  threshold = 0.88,
): WithEmbedding<T>[] {
  const kept: WithEmbedding<T>[] = [];
  for (const c of cards) {
    const idx = kept.findIndex((k) => cosine(k.embedding, c.embedding) >= threshold);
    if (idx === -1) {
      kept.push(c);
    } else if (c.difficulty > kept[idx].difficulty) {
      kept[idx] = c;
    }
  }
  return kept;
}
