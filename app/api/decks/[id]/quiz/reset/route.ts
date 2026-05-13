import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cards, decks } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, session.user.id)))
    .limit(1);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(cards)
    .set({ quizStatus: "pending", lastAskedAt: null })
    .where(eq(cards.deckId, id));

  return NextResponse.json({ ok: true });
}
