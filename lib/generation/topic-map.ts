import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, ANTHROPIC_MODEL } from "./anthropic";
import { topicMapZ } from "./schema";
import { SYSTEM_TOPIC_MAP } from "./prompts";
import type { PdfPage } from "@/lib/pdf/parse";

/**
 * Pass 1: cheap full-document scan. We feed the first ~300 chars of each page
 * (acts as TOC + section starts) and ask the model to produce a topic map.
 * Called once per deck — no caching benefit, so the system prompt isn't marked.
 */
export async function buildTopicMap(pages: PdfPage[]) {
  const previews = pages
    .map((p) => `--- Seite ${p.pageNumber} ---\n${p.text.slice(0, 320)}`)
    .join("\n\n");

  const r = await anthropic.messages.parse({
    model: ANTHROPIC_MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(topicMapZ),
      effort: "high",
    },
    system: SYSTEM_TOPIC_MAP,
    messages: [
      {
        role: "user",
        content: [
          `Das Dokument hat ${pages.length} Seiten. Hier sind die Seitenanfänge:`,
          "",
          previews,
          "",
          "Erstelle die Themenliste in deutscher Sprache.",
        ].join("\n"),
      },
    ],
  });

  if (!r.parsed_output) {
    throw new Error("Topic map: kein strukturiertes Ergebnis erhalten.");
  }

  // Clamp page ranges to valid bounds.
  const last = pages.length;
  const topics = r.parsed_output.topics
    .map((t) => ({
      ...t,
      page_start: Math.max(1, Math.min(t.page_start, last)),
      page_end: Math.max(1, Math.min(t.page_end, last)),
    }))
    .map((t) =>
      t.page_end < t.page_start ? { ...t, page_end: t.page_start } : t,
    );

  return { topics };
}
