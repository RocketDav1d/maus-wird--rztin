import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { attempts, cards, decks } from "@/lib/db/schema";
import { validateAnswer } from "@/lib/validate/rubric";
import { applyVerdictToStreak } from "@/lib/badges/service";

const bodyZ = z.object({
  cardId: z.string().uuid(),
  transcript: z.string().min(1).max(5000),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = bodyZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const [row] = await db
    .select({ card: cards, deck: decks })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(eq(cards.id, parsed.data.cardId), eq(decks.userId, session.user.id)),
    )
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Karte nicht gefunden." }, { status: 404 });
  }

  try {
    const result = await validateAnswer(row.card, parsed.data.transcript);

    const newQuizStatus =
      result.verdict === "correct"
        ? "correct"
        : result.verdict === "incomplete"
          ? "reviewing"
          : "reviewing";

    await db
      .update(cards)
      .set({ quizStatus: newQuizStatus, lastAskedAt: new Date() })
      .where(eq(cards.id, row.card.id));

    await db.insert(attempts).values({
      cardId: row.card.id,
      transcriptDe: parsed.data.transcript,
      verdict: result.verdict,
      hitKeyPoints: result.hit_key_points,
      feedbackDe: result.feedback_de,
    });

    const streak = await applyVerdictToStreak(session.user.id, result.verdict);

    return NextResponse.json({ ...result, streak });
  } catch (err) {
    console.error("Validate failed", err);
    return NextResponse.json(
      { error: "Bewertung fehlgeschlagen." },
      { status: 500 },
    );
  }
}
