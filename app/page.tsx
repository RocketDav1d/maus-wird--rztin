import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { DeckCard } from "@/components/deck-card";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cards, decks } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rows = await db
    .select({
      deck: decks,
      totalCards: sql<number>`count(${cards.id})::int`,
      approvedCards: sql<number>`count(${cards.id}) filter (where ${cards.reviewStatus} = 'approved')::int`,
      correctCards: sql<number>`count(${cards.id}) filter (where ${cards.quizStatus} = 'correct')::int`,
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .where(eq(decks.userId, session.user.id))
    .groupBy(decks.id)
    .orderBy(desc(decks.createdAt));

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10 flex-1">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Deine Karteikarten Sets 💛
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hi Mausi — wähl dir einen Stapel und leg los. Du schaffst das.
          </p>
        </div>

        {rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <FileText className="size-10 mx-auto text-muted-foreground" />
              <CardTitle className="text-lg">Noch kein Stapel da 🐭</CardTitle>
              <CardDescription>
                Lad ein PDF hoch und ich bastel daraus deine ersten Karten.
              </CardDescription>
              <Button asChild className="mt-2">
                <Link href="/decks/new">
                  <Plus className="size-4" />
                  Ersten Stapel anlegen
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map(({ deck, totalCards, approvedCards, correctCards }) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                totalCards={totalCards}
                approvedCards={approvedCards}
                correctCards={correctCards}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
