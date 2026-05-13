import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cards, decks } from "@/lib/db/schema";

const keyPointZ = z.object({
  point_de: z.string().min(1),
  required: z.boolean(),
  synonyms_de: z.array(z.string()),
});

const patchZ = z.object({
  questionDe: z.string().min(3).optional(),
  expectedAnswerDe: z.string().min(3).optional(),
  answerKeyPoints: z.array(keyPointZ).optional(),
  reviewStatus: z
    .enum(["pending", "approved", "edited", "rejected"])
    .optional(),
  quizStatus: z.enum(["pending", "correct", "reviewing"]).optional(),
});

async function getOwnedCard(
  userId: string,
  deckId: string,
  cardId: string,
) {
  const [row] = await db
    .select({ deck: decks, card: cards })
    .from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cards.id, cardId),
        eq(decks.id, deckId),
        eq(decks.userId, userId),
      ),
    )
    .limit(1);
  return row;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; cardId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, cardId } = await ctx.params;
  const owned = await getOwnedCard(session.user.id, id, cardId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Daten." },
      { status: 400 },
    );
  }

  const updates = parsed.data;
  const finalUpdates: Partial<typeof updates> & { reviewStatus?: "pending" | "approved" | "edited" | "rejected" } = { ...updates };
  if (
    (updates.questionDe || updates.expectedAnswerDe || updates.answerKeyPoints) &&
    !updates.reviewStatus
  ) {
    finalUpdates.reviewStatus = "edited";
  }

  await db.update(cards).set(finalUpdates).where(eq(cards.id, cardId));

  const [updated] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; cardId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, cardId } = await ctx.params;
  const owned = await getOwnedCard(session.user.id, id, cardId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(cards).where(eq(cards.id, cardId));
  return NextResponse.json({ ok: true });
}
