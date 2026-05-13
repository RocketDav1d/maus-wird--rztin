import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, ANTHROPIC_MODEL, CACHE_EPHEMERAL } from "./anthropic";
import { cardBatchZ, type CardCandidate } from "./schema";
import { SYSTEM_GENERATE_CARDS } from "./prompts";
import type { Chunk } from "./chunk";

const KEEP_PER_CHUNK = 3;

/**
 * Pass 2 per-chunk generation. Over-generates candidates with self-scored
 * exam_likeness, then keeps the top N per chunk.
 *
 * The long German system prompt is marked for prompt caching — every chunk in
 * one generation run reuses it, so the prefix lands in cache from the second
 * chunk onward.
 */
export async function generateForChunk(
  chunk: Chunk,
  topicMapSummary: string,
): Promise<CardCandidate[]> {
  const r = await anthropic.messages.parse({
    model: ANTHROPIC_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(cardBatchZ),
      effort: "xhigh",
    },
    system: [
      {
        type: "text",
        text: SYSTEM_GENERATE_CARDS,
        cache_control: CACHE_EPHEMERAL,
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          `Übergeordneter Themenüberblick (Prioritäten in diesem Skript):\n${topicMapSummary}`,
          "",
          `Aktuelles Thema: "${chunk.topic}" (Priorität: ${chunk.priority})`,
          `Seitenbereich: ${chunk.pageStart}–${chunk.pageEnd}`,
          "",
          "Textausschnitt (mit Seitenmarkierungen):",
          "```",
          chunk.text,
          "```",
          "",
          "Erstelle 5 bis 8 Karten-Kandidaten gemäß den Regeln. Achte besonders auf den Mix (mind. 1 clinical_case, 2 reasoning, 1 recall). Vergib exam_likeness ehrlich.",
        ].join("\n"),
      },
    ],
  });

  if (!r.parsed_output) {
    throw new Error(`Kein Ergebnis für Chunk "${chunk.topic}".`);
  }

  const candidates = [...r.parsed_output.candidates].sort(
    (a, b) => b.exam_likeness - a.exam_likeness,
  );

  const picked: CardCandidate[] = [];
  const clinicalCase = candidates.find(
    (c) => c.question_type === "clinical_case",
  );
  if (clinicalCase) picked.push(clinicalCase);

  for (const c of candidates) {
    if (picked.includes(c)) continue;
    picked.push(c);
    if (picked.length >= KEEP_PER_CHUNK) break;
  }

  return picked;
}
