"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Deck } from "@/lib/db/schema";

type DeckCardProps = {
  deck: Deck;
  totalCards: number;
  approvedCards: number;
  correctCards: number;
};

export function DeckCard({
  deck,
  totalCards,
  approvedCards,
  correctCards,
}: DeckCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Löschen fehlgeschlagen.");
        return;
      }
      toast.success("Stapel gelöscht.");
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative group aspect-square">
      <Link href={`/decks/${deck.id}`} className="block h-full">
        <Card className="hover:border-foreground/30 transition-colors h-full justify-between">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight">
                {deck.name}
              </CardTitle>
              <StatusBadge status={deck.status} />
            </div>
            <CardDescription className="text-xs">
              {deck.sourceFilename ?? "Manuell erstellt"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{totalCards}</span>{" "}
              Karten
            </span>
            <span>
              <span className="font-medium text-foreground">
                {approvedCards}
              </span>{" "}
              freigegeben
            </span>
            <span>
              <span className="font-medium text-foreground">
                {correctCards}
              </span>{" "}
              richtig
            </span>
          </CardContent>
        </Card>
      </Link>

      <Button
        variant="destructive"
        size="icon-sm"
        onClick={onDeleteClick}
        aria-label={`Stapel „${deck.name}“ löschen`}
        title="Stapel löschen"
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        <Trash2 className="size-4" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stapel wirklich löschen?</DialogTitle>
            <DialogDescription>
              „{deck.name}“ und alle {totalCards} Karten werden endgültig
              entfernt. Das lässt sich nicht rückgängig machen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? "Lösche …" : "Ja, löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Deck["status"] }) {
  if (status === "ready") return <Badge variant="secondary">bereit</Badge>;
  if (status === "processing")
    return <Badge variant="outline">verarbeite …</Badge>;
  return <Badge variant="destructive">Fehler</Badge>;
}
