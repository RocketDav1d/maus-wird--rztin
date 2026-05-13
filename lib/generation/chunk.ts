import type { PdfPage } from "@/lib/pdf/parse";
import { estimateTokens } from "@/lib/pdf/parse";
import type { TopicEntry } from "./schema";

export type Chunk = {
  topic: string;
  priority: TopicEntry["priority"];
  pageStart: number;
  pageEnd: number;
  text: string;
  tokens: number;
};

const TARGET_TOKENS = 6000;
const MAX_TOKENS = 8000;
const OVERLAP_TOKENS = 500;

/**
 * Pass 2 chunking. For each high/med priority topic, split its page range into
 * chunks of ~6k tokens. We work page-by-page so we preserve page numbers for
 * source citations.
 */
export function chunkPagesForTopics(
  pages: PdfPage[],
  topics: TopicEntry[],
): Chunk[] {
  const pageMap = new Map(pages.map((p) => [p.pageNumber, p]));
  const out: Chunk[] = [];

  for (const t of topics) {
    if (t.priority === "skip") continue;
    if (t.priority === "low") continue; // budget — only generate from high/med

    const range: PdfPage[] = [];
    for (let i = t.page_start; i <= t.page_end; i++) {
      const p = pageMap.get(i);
      if (p && p.text.length > 0) range.push(p);
    }
    if (range.length === 0) continue;

    let current: PdfPage[] = [];
    let currentTokens = 0;

    const flush = () => {
      if (current.length === 0) return;
      const text = current
        .map((p) => `[Seite ${p.pageNumber}]\n${p.text}`)
        .join("\n\n");
      out.push({
        topic: t.topic,
        priority: t.priority,
        pageStart: current[0].pageNumber,
        pageEnd: current[current.length - 1].pageNumber,
        text,
        tokens: currentTokens,
      });
    };

    for (const page of range) {
      const t2 = estimateTokens(page.text);
      if (currentTokens + t2 > MAX_TOKENS && current.length > 0) {
        flush();
        // overlap by keeping last page if its tokens fit in OVERLAP budget
        const lastPage = current[current.length - 1];
        const lastT = estimateTokens(lastPage.text);
        if (lastT <= OVERLAP_TOKENS) {
          current = [lastPage];
          currentTokens = lastT;
        } else {
          current = [];
          currentTokens = 0;
        }
      }
      current.push(page);
      currentTokens += t2;
      if (currentTokens >= TARGET_TOKENS) {
        flush();
        current = [];
        currentTokens = 0;
      }
    }
    flush();
  }

  return out;
}
