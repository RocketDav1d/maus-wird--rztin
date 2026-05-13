import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { decks } from "@/lib/db/schema";
import type { PdfPage } from "@/lib/pdf/parse";

export async function setExtractedText(deckId: string, pages: PdfPage[]) {
  await db
    .update(decks)
    .set({ extractedText: pages })
    .where(eq(decks.id, deckId));
}

export async function getExtractedText(
  deckId: string,
): Promise<PdfPage[] | null> {
  const [row] = await db
    .select({ extractedText: decks.extractedText })
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1);
  return row?.extractedText ?? null;
}

export async function clearExtractedText(deckId: string) {
  await db.update(decks).set({ extractedText: null }).where(eq(decks.id, deckId));
}
