"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Event =
  | { type: "stage"; stage: string; detail?: string }
  | { type: "topic_map"; topics: number }
  | { type: "chunk_done"; topic: string; cards: number; index: number; total: number }
  | { type: "qc"; kept: number; dropped: number }
  | { type: "done"; deckId: string; cardCount: number }
  | { type: "error"; message: string };

const STAGE_LABELS: Record<string, string> = {
  load_pdf: "Lese PDF",
  topic_map: "Erstelle Themenkarte",
  chunking: "Teile Abschnitte ein",
  generating: "Generiere Fragen",
  qc: "Qualitätsprüfung",
  saving: "Speichere",
  done: "Fertig",
};

export function GenerationProgress({
  deckId,
  autostart,
}: {
  deckId: string;
  autostart: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [stage, setStage] = useState<string>("load_pdf");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  const chunkEvents = events.filter(
    (e): e is Extract<Event, { type: "chunk_done" }> => e.type === "chunk_done",
  );
  const totalChunks = chunkEvents.at(-1)?.total ?? 0;
  const doneChunks = chunkEvents.length;
  const totalCards = chunkEvents.reduce((n, e) => n + e.cards, 0);
  const qcEvent = events.find(
    (e): e is Extract<Event, { type: "qc" }> => e.type === "qc",
  );
  const doneEvent = events.find(
    (e): e is Extract<Event, { type: "done" }> => e.type === "done",
  );

  const progressPct = (() => {
    if (done) return 100;
    if (stage === "load_pdf") return 5;
    if (stage === "topic_map") return 15;
    if (stage === "chunking") return 25;
    if (stage === "generating") {
      return 25 + Math.round((doneChunks / Math.max(1, totalChunks)) * 50);
    }
    if (stage === "qc") return 85;
    if (stage === "saving") return 95;
    return 5;
  })();

  useEffect(() => {
    if (!autostart || started.current) return;
    started.current = true;

    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/decks/${deckId}/generate`, {
          method: "POST",
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          setError(`HTTP ${res.status}`);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.replace(/^data:\s*/, "").trim();
            if (!data) continue;
            try {
              const evt = JSON.parse(data) as Event;
              setEvents((prev) => [...prev, evt]);
              if (evt.type === "stage") setStage(evt.stage);
              if (evt.type === "error") setError(evt.message);
              if (evt.type === "done") {
                setDone(true);
                setStage("done");
              }
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      }
    })();

    return () => ctrl.abort();
  }, [deckId, autostart]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => router.refresh(), 1200);
      return () => clearTimeout(t);
    }
  }, [done, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="size-5 text-destructive" />
          ) : done ? (
            <CheckCircle2 className="size-5 text-green-600" />
          ) : (
            <Loader2 className="size-5 animate-spin" />
          )}
          {error
            ? "Fehler"
            : done
              ? `Fertig — ${doneEvent?.cardCount ?? totalCards} Karten`
              : STAGE_LABELS[stage] ?? stage}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPct} />

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1 max-h-72 overflow-y-auto">
          {events.map((e, i) => (
            <EventLine key={i} event={e} />
          ))}
        </div>

        {!done && totalChunks > 0 && (
          <p className="text-sm">
            Abschnitt {doneChunks} / {totalChunks} · {totalCards} Karten bisher
          </p>
        )}

        {qcEvent && (
          <p className="text-sm">
            QC: {qcEvent.kept} behalten, {qcEvent.dropped} verworfen.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EventLine({ event }: { event: Event }) {
  switch (event.type) {
    case "stage":
      return (
        <div>
          → {STAGE_LABELS[event.stage] ?? event.stage}
          {event.detail ? ` (${event.detail})` : ""}
        </div>
      );
    case "topic_map":
      return <div>· {event.topics} Themen identifiziert</div>;
    case "chunk_done":
      return (
        <div>
          · [{event.index}/{event.total}] {event.topic} → {event.cards} Karten
        </div>
      );
    case "qc":
      return (
        <div>
          · QC: {event.kept} behalten, {event.dropped} verworfen
        </div>
      );
    case "done":
      return <div>✓ Fertig: {event.cardCount} Karten gespeichert</div>;
    case "error":
      return <div className="text-destructive">✗ {event.message}</div>;
  }
}
