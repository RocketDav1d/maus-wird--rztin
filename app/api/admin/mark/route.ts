import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { attempts, cards, decks } from "@/lib/db/schema";
import { applyVerdictToStreak } from "@/lib/badges/service";

const bodyZ = z.object({
  cardId: z.string().uuid(),
  verdict: z.enum(["correct", "incorrect", "incomplete"]),
});

/**
 * Admin-only verdict bypass — no LLM call. Used by ?admin=1 mode in the quiz to
 * simulate answers and quickly test streak / sticker behavior.
 *
 * In this single-user MVP, any authenticated user can hit this endpoint. If the
 * app later opens to multiple users, gate this behind a role/env check.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodyZ.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  }

  const [row] = await db
    .select({ card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(eq(cards.id, parsed.data.cardId), eq(decks.userId, session.user.id)),
    )
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Karte nicht gefunden." }, { status: 404 });
  }

  const newQuizStatus =
    parsed.data.verdict === "correct" ? "correct" : "reviewing";

  await db
    .update(cards)
    .set({ quizStatus: newQuizStatus, lastAskedAt: new Date() })
    .where(eq(cards.id, row.card.id));

  await db.insert(attempts).values({
    cardId: row.card.id,
    transcriptDe: "[admin]",
    verdict: parsed.data.verdict,
    hitKeyPoints: [],
    feedbackDe: null,
  });

  const streak = await applyVerdictToStreak(session.user.id, parsed.data.verdict);

  return NextResponse.json({
    verdict: parsed.data.verdict,
    feedback_de:
      parsed.data.verdict === "correct"
        ? "Admin-Override: richtig."
        : parsed.data.verdict === "incomplete"
          ? "Admin-Override: unvollständig."
          : "Admin-Override: falsch.",
    hit_key_points: [],
    streak,
  });
}
