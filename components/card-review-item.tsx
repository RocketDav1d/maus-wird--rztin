"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Card as CardRow } from "@/lib/db/schema";

const TYPE_LABEL: Record<CardRow["questionType"], string> = {
  recall: "Faktenfrage",
  reasoning: "Argumentation",
  clinical_case: "Klinikvignette",
};

export function CardReviewItem({
  card,
  index,
}: {
  card: CardRow;
  index: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const rejected = card.reviewStatus === "rejected";

  const patch = (updates: Record<string, unknown>) =>
    startTransition(async () => {
      const res = await fetch(`/api/decks/${card.deckId}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        toast.error("Speichern fehlgeschlagen.");
        return;
      }
      router.refresh();
    });

  return (
    <Card className={rejected ? "opacity-60 border-dashed" : undefined}>
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-md bg-muted text-xs font-mono text-muted-foreground select-none">
            {String(index).padStart(2, "0")}
          </div>
          <ButtonGroup>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Einklappen" : "Details"}
              title={open ? "Einklappen" : "Details"}
            >
              {open ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(true)}
              disabled={pending}
              aria-label="Bearbeiten"
              title="Bearbeiten"
            >
              <Pencil className="size-4" />
            </Button>
            {rejected ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => patch({ reviewStatus: "pending" })}
                disabled={pending}
                aria-label="Wiederherstellen"
                title="Wiederherstellen"
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => patch({ reviewStatus: "rejected" })}
                disabled={pending}
                aria-label="Verwerfen"
                title="Verwerfen"
              >
                <X className="size-4" />
              </Button>
            )}
          </ButtonGroup>
        </div>
        <div className="space-y-3">
          <p className="font-medium text-[15px] leading-relaxed">
            {card.questionDe}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {TYPE_LABEL[card.questionType]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Schwierigkeit {card.difficulty}
            </Badge>
            {card.sourcePage && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                S. {card.sourcePage}
              </Badge>
            )}
            <StatusBadge status={card.reviewStatus} />
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-2 space-y-5 text-sm">
          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Erwartete Antwort
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">
              {card.expectedAnswerDe}
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Schlüsselpunkte
            </div>
            <ul className="space-y-2">
              {card.answerKeyPoints.map((k, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check
                    className={cn(
                      "size-4 shrink-0 mt-0.5",
                      k.required
                        ? "text-foreground"
                        : "text-muted-foreground/40",
                    )}
                    strokeWidth={k.required ? 2.5 : 2}
                  />
                  <div className="flex-1 leading-relaxed">
                    <span>{k.point_de}</span>
                    {k.synonyms_de.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        · {k.synonyms_de.join(", ")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {card.sourceQuoteDe && (
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Quelle
                {card.sourceSectionHeading ? ` · ${card.sourceSectionHeading}` : ""}
              </div>
              <blockquote className="border-l-2 pl-3 italic text-muted-foreground leading-relaxed">
                {card.sourceQuoteDe}
              </blockquote>
            </div>
          )}
        </CardContent>
      )}

      <EditDialog
        open={editing}
        onOpenChange={setEditing}
        card={card}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    </Card>
  );
}

function StatusBadge({ status }: { status: CardRow["reviewStatus"] }) {
  if (status === "rejected")
    return <Badge variant="destructive" className="text-xs">verworfen</Badge>;
  if (status === "edited")
    return <Badge className="text-xs">bearbeitet</Badge>;
  if (status === "approved")
    return <Badge variant="secondary" className="text-xs">freigegeben</Badge>;
  return null;
}

function EditDialog({
  open,
  onOpenChange,
  card,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  card: CardRow;
  onSaved: () => void;
}) {
  const [question, setQuestion] = useState(card.questionDe);
  const [answer, setAnswer] = useState(card.expectedAnswerDe);
  const [keyPoints, setKeyPoints] = useState(card.answerKeyPoints);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/decks/${card.deckId}/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionDe: question.trim(),
        expectedAnswerDe: answer.trim(),
        answerKeyPoints: keyPoints,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Speichern fehlgeschlagen.");
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Karte bearbeiten</DialogTitle>
          <DialogDescription>
            Frage, Antwort und Schlüsselpunkte für die Bewertung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1 -mr-1">
          <div className="grid gap-2">
            <Label htmlFor="edit-question">Frage</Label>
            <Textarea
              id="edit-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-answer">Erwartete Antwort</Label>
            <Textarea
              id="edit-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Schlüsselpunkte</Label>
              <span className="text-xs text-muted-foreground">
                {keyPoints.length} Punkt{keyPoints.length === 1 ? "" : "e"}
              </span>
            </div>

            <div className="space-y-3">
              {keyPoints.map((k, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-muted/30 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${i}`}
                        checked={k.required}
                        onCheckedChange={(checked) =>
                          setKeyPoints((kp) =>
                            kp.map((p, j) =>
                              j === i ? { ...p, required: checked } : p,
                            ),
                          )
                        }
                      />
                      <Label
                        htmlFor={`required-${i}`}
                        className="text-xs font-medium cursor-pointer"
                      >
                        Pflichtpunkt
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setKeyPoints((kp) => kp.filter((_, j) => j !== i))
                      }
                      aria-label="Punkt entfernen"
                      title="Punkt entfernen"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <Textarea
                    rows={2}
                    placeholder="Was muss die Antwort enthalten?"
                    value={k.point_de}
                    onChange={(e) =>
                      setKeyPoints((kp) =>
                        kp.map((p, j) =>
                          j === i ? { ...p, point_de: e.target.value } : p,
                        ),
                      )
                    }
                  />

                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={`synonyms-${i}`}
                      className="text-xs text-muted-foreground font-normal"
                    >
                      Synonyme (Komma-getrennt)
                    </Label>
                    <Input
                      id={`synonyms-${i}`}
                      placeholder="z. B. Sigmoid, Kolon descendens"
                      value={k.synonyms_de.join(", ")}
                      onChange={(e) =>
                        setKeyPoints((kp) =>
                          kp.map((p, j) =>
                            j === i
                              ? {
                                  ...p,
                                  synonyms_de: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                }
                              : p,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setKeyPoints((kp) => [
                  ...kp,
                  { point_de: "", required: true, synonyms_de: [] },
                ])
              }
            >
              <Plus className="size-4" />
              Schlüsselpunkt hinzufügen
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Speichern …" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
