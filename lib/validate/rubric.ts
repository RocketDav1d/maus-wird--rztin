import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  anthropic,
  ANTHROPIC_VALIDATE_MODEL,
  CACHE_EPHEMERAL,
} from "@/lib/generation/anthropic";
import { validateResultZ, type ValidateResult } from "@/lib/generation/schema";
import { SYSTEM_VALIDATE } from "@/lib/generation/prompts";
import type { Card as CardRow } from "@/lib/db/schema";

/**
 * Grade a spoken answer against the card's rubric. Runs on the quiz hot path,
 * so it uses ANTHROPIC_VALIDATE_MODEL (Haiku 4.5 by default) with no thinking
 * and no effort param — the task is structured rubric matching, not reasoning,
 * and we care about latency more than nuance here.
 *
 * Synonyms in `answer_key_points` carry the semantic flexibility the model
 * would otherwise have done in reasoning, so dropping thinking is safe.
 */
export async function validateAnswer(
  card: CardRow,
  transcript: string,
): Promise<ValidateResult> {
  const keyPointsBlock = card.answerKeyPoints
    .map((k, i) => {
      const tag = k.required ? "[REQUIRED]" : "[bonus]";
      const syn =
        k.synonyms_de.length > 0
          ? ` (Synonyme: ${k.synonyms_de.join(", ")})`
          : "";
      return `${i + 1}. ${tag} ${k.point_de}${syn}`;
    })
    .join("\n");

  const r = await anthropic.messages.parse({
    model: ANTHROPIC_VALIDATE_MODEL,
    max_tokens: 1024,
    output_config: {
      format: zodOutputFormat(validateResultZ),
    },
    system: [
      {
        type: "text",
        text: SYSTEM_VALIDATE,
        cache_control: CACHE_EPHEMERAL,
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          `FRAGE:`,
          card.questionDe,
          ``,
          `SCHLÜSSELPUNKTE:`,
          keyPointsBlock,
          ``,
          `ANTWORT DER KANDIDATIN (Transkript):`,
          `"${transcript.trim()}"`,
        ].join("\n"),
      },
    ],
  });

  if (!r.parsed_output) {
    return {
      verdict: "incorrect",
      hit_key_points: card.answerKeyPoints.map((k) => ({
        point_de: k.point_de,
        hit: false,
      })),
      feedback_de: "Antwort konnte nicht bewertet werden.",
    };
  }
  return r.parsed_output;
}
