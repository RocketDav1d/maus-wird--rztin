import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { and, asc, eq, ne } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cards, decks } from "@/lib/db/schema";
import { QuizClient } from "@/components/quiz/quiz-client";
import { BadgesButton } from "@/components/badges/badges-button";
import { getStreakState } from "@/lib/badges/service";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, id), eq(decks.userId, session.user.id)))
    .limit(1);
  if (!deck) notFound();

  const rows = await db
    .select()
    .from(cards)
    .where(
      and(eq(cards.deckId, id), ne(cards.reviewStatus, "rejected")),
    )
    .orderBy(asc(cards.order));

  const streakState = await getStreakState(session.user.id);

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b">
        <div className="mx-auto w-full max-w-5xl px-6 py-3 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/decks/${id}`}>
              <ArrowLeft className="size-4" />
              {deck.name}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              Training · {rows.length} Karten
            </div>
            <BadgesButton />
          </div>
        </div>
      </header>
      <QuizClient
        deckId={id}
        initialCards={rows}
        initialStreak={streakState.currentStreak}
      />
    </main>
  );
}
