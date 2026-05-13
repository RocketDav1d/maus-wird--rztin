import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import { and, asc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cards, decks } from "@/lib/db/schema";
import { CardReviewItem } from "@/components/card-review-item";
import { GenerationProgress } from "@/components/generation-progress";

export const dynamic = "force-dynamic";

export default async function DeckDetailPage({
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
    .where(eq(cards.deckId, id))
    .orderBy(asc(cards.order));

  const usable = rows.filter((c) => c.reviewStatus !== "rejected");

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-10 flex-1">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{deck.name}</h1>
            {deck.sourceFilename && (
              <p className="text-sm text-muted-foreground mt-1">
                {deck.sourceFilename} · {deck.totalPages} Seiten
              </p>
            )}
          </div>
          {deck.status === "ready" && usable.length > 0 && (
            <Button asChild size="lg">
              <Link href={`/decks/${deck.id}/quiz`}>
                <Play className="size-4" />
                Training starten
              </Link>
            </Button>
          )}
        </header>

        {deck.status === "processing" && (
          <GenerationProgress deckId={deck.id} autostart />
        )}

        {deck.status === "failed" && (
          <Alert variant="destructive">
            <AlertTitle>Generierung fehlgeschlagen</AlertTitle>
            <AlertDescription>
              {deck.errorMessage ?? "Unbekannter Fehler."}
            </AlertDescription>
          </Alert>
        )}

        {deck.status === "ready" && rows.length === 0 && (
          <Alert>
            <AlertTitle>Keine Karten</AlertTitle>
            <AlertDescription>
              Hmm, hier sind keine Karten rausgekommen. Probier’s mit einem
              anderen PDF, Mausi 🐭
            </AlertDescription>
          </Alert>
        )}

        {rows.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {usable.length} verwendbare Karten · {rows.length} gesamt. Schau
              sie kurz durch und wirf raus, was nicht passt — dann kann’s
              losgehen.
            </p>
            <div className="space-y-4">
              {rows.map((card, i) => (
                <CardReviewItem key={card.id} card={card} index={i + 1} />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
