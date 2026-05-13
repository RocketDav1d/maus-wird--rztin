import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { decks, cards } from "@/lib/db/schema";
import { getExtractedText, clearExtractedText } from "./storage";
import { buildTopicMap } from "./topic-map";
import { chunkPagesForTopics } from "./chunk";
import { generateForChunk } from "./generate";
import {
  checkGrounding,
  dedupBySemantic,
  embedQuestions,
  triviality,
  type WithEmbedding,
} from "./qc";
import type { CardCandidate } from "./schema";

const HARD_CAP = 250;

export type ProgressEvent =
  | { type: "stage"; stage: string; detail?: string }
  | { type: "topic_map"; topics: number }
  | { type: "chunk_done"; topic: string; cards: number; index: number; total: number }
  | { type: "qc"; kept: number; dropped: number }
  | { type: "done"; deckId: string; cardCount: number }
  | { type: "error"; message: string };

export async function* runPipeline(deckId: string): AsyncGenerator<ProgressEvent> {
  try {
    yield { type: "stage", stage: "load_pdf" };
    const pages = await getExtractedText(deckId);
    if (!pages || pages.length === 0) {
      throw new Error("Kein extrahierter Text gefunden.");
    }
    await db
      .update(decks)
      .set({ progressStage: "topic_map" })
      .where(eq(decks.id, deckId));

    yield { type: "stage", stage: "topic_map", detail: `${pages.length} Seiten` };
    const { topics } = await buildTopicMap(pages);
    await db.update(decks).set({ topicMap: topics }).where(eq(decks.id, deckId));
    yield { type: "topic_map", topics: topics.length };

    yield { type: "stage", stage: "chunking" };
    const chunks = chunkPagesForTopics(pages, topics);
    if (chunks.length === 0) {
      throw new Error("Keine inhaltsrelevanten Abschnitte gefunden.");
    }

    const topicSummary = topics
      .filter((t) => t.priority !== "skip")
      .map((t) => `- ${t.topic} (${t.priority}, S. ${t.page_start}–${t.page_end})`)
      .join("\n");

    await db
      .update(decks)
      .set({ progressStage: "generating" })
      .where(eq(decks.id, deckId));

    yield {
      type: "stage",
      stage: "generating",
      detail: `${chunks.length} Abschnitte`,
    };

    const allCandidates: CardCandidate[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      try {
        const picked = await generateForChunk(c, topicSummary);
        const filtered = picked.filter((cand) => triviality(cand).keep);
        allCandidates.push(...filtered);
        yield {
          type: "chunk_done",
          topic: c.topic,
          cards: filtered.length,
          index: i + 1,
          total: chunks.length,
        };
        if (allCandidates.length >= HARD_CAP) break;
      } catch (err) {
        console.error(`Chunk failed: ${c.topic}`, err);
        yield {
          type: "chunk_done",
          topic: c.topic,
          cards: 0,
          index: i + 1,
          total: chunks.length,
        };
      }
    }

    if (allCandidates.length === 0) {
      throw new Error("Generierung lieferte keine Kandidaten.");
    }

    await db
      .update(decks)
      .set({ progressStage: "qc" })
      .where(eq(decks.id, deckId));
    yield { type: "stage", stage: "qc", detail: `${allCandidates.length} Kandidaten` };

    // Source-grounding check (drop hallucinations).
    const grounded: CardCandidate[] = [];
    for (const cand of allCandidates) {
      try {
        const g = await checkGrounding(cand);
        if (g.supported !== "no") grounded.push(cand);
      } catch (err) {
        console.error("Grounding check failed", err);
        grounded.push(cand);
      }
    }

    // Semantic dedup.
    const embeddings = await embedQuestions(grounded.map((g) => g.question_de));
    const withEmb: WithEmbedding<CardCandidate>[] = grounded.map((g, i) => ({
      ...g,
      embedding: embeddings[i] ?? [],
    }));
    const deduped = dedupBySemantic(withEmb).slice(0, HARD_CAP);

    yield {
      type: "qc",
      kept: deduped.length,
      dropped: allCandidates.length - deduped.length,
    };

    // Persist cards.
    await db
      .update(decks)
      .set({ progressStage: "saving" })
      .where(eq(decks.id, deckId));

    for (let i = 0; i < deduped.length; i++) {
      const c = deduped[i];
      await db.insert(cards).values({
        deckId,
        questionDe: c.question_de,
        questionType: c.question_type,
        difficulty: c.difficulty,
        topicTags: c.topic_tags,
        expectedAnswerDe: c.expected_answer_de,
        answerKeyPoints: c.answer_key_points,
        sourcePage: c.source_page,
        sourceSectionHeading: c.source_section_heading,
        sourceQuoteDe: c.source_quote_de,
        embedding: c.embedding,
        reviewStatus: "pending",
        quizStatus: "pending",
        order: i,
      });
    }

    await db
      .update(decks)
      .set({
        status: "ready",
        progressStage: "done",
        generatedCount: deduped.length,
      })
      .where(eq(decks.id, deckId));

    await clearExtractedText(deckId);

    yield { type: "done", deckId, cardCount: deduped.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Pipeline error", err);
    await db
      .update(decks)
      .set({ status: "failed", errorMessage: msg })
      .where(eq(decks.id, deckId));
    yield { type: "error", message: msg };
  }
}
