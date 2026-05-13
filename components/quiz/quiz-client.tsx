"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Play, RotateCcw, Volume2, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Card as CardRow } from "@/lib/db/schema";
import {
  CardStack,
  type StackCard,
  type Verdict,
  type HitKeyPoint,
} from "./card-stack";
import { PushToTalk } from "./push-to-talk";
import { StreakHearts } from "./streak-hearts";
import { BadgeCelebration } from "./badge-celebration";
import { AdminControls } from "./admin-controls";
import type { Badge } from "@/lib/badges/registry";

type Status =
  | "idle"
  | "speaking"
  | "ready"
  | "transcribing"
  | "validating"
  | "revealing";

const STATUS_LABEL: Record<Status, string> = {
  idle: "bereit",
  speaking: "Agent spricht",
  ready: "Du bist dran",
  transcribing: "Transkribiere",
  validating: "Bewerte",
  revealing: "Feedback",
};

type ValidateResponse = {
  verdict: Verdict;
  feedback_de: string;
  hit_key_points: HitKeyPoint[];
  streak: {
    current: number;
    best: number;
    totalCorrect: number;
    totalUnlocked: number;
    justUnlocked: Badge[];
  };
};

const AUTO_ADVANCE_MS = 1400;

export function QuizClient({
  deckId,
  initialCards,
  initialStreak = 0,
}: {
  deckId: string;
  initialCards: CardRow[];
  initialStreak?: number;
}) {
  const searchParams = useSearchParams();
  const adminMode = searchParams.get("admin") === "1";

  const initialPending = useMemo(
    () => initialCards.filter((c) => c.quizStatus !== "correct"),
    [initialCards],
  );
  const initialDone = useMemo(
    () => initialCards.filter((c) => c.quizStatus === "correct"),
    [initialCards],
  );

  const [queue, setQueue] = useState<CardRow[]>(initialPending);
  const [pile, setPile] = useState<CardRow[]>(initialDone);
  const [status, setStatus] = useState<Status>("idle");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hitKeyPoints, setHitKeyPoints] = useState<HitKeyPoint[] | null>(null);
  const [pulse, setPulse] = useState(false);
  const [started, setStarted] = useState(false);
  const [streak, setStreak] = useState<number>(initialStreak);
  const [celebrationQueue, setCelebrationQueue] = useState<Badge[]>([]);
  const [pendingVerdictApply, setPendingVerdictApply] =
    useState<Verdict | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = queue[0];

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  const speakCurrent = useCallback(async () => {
    if (!current) return;
    ttsAbortRef.current?.abort();
    const ctrl = new AbortController();
    ttsAbortRef.current = ctrl;
    setStatus("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: current.questionDe }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        setStatus("ready");
      });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        setStatus("ready");
      });
      await audio.play();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error(err);
      toast.error("Sprachausgabe fehlgeschlagen.");
      setStatus("ready");
    }
  }, [current]);

  useEffect(() => {
    if (!started || !current) return;
    setVerdict(null);
    setTranscript(null);
    setFeedback(null);
    setHitKeyPoints(null);
    setPendingVerdictApply(null);
    clearAdvanceTimer();
    speakCurrent();
    return () => {
      ttsAbortRef.current?.abort();
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, started]);

  const applyResult = useCallback(
    (result: {
      verdict: Verdict;
      feedback_de: string;
      hit_key_points: HitKeyPoint[];
      streak: ValidateResponse["streak"];
    }) => {
      setVerdict(result.verdict);
      setFeedback(result.feedback_de);
      setHitKeyPoints(result.hit_key_points);
      setStreak(result.streak.current);
      setStatus("revealing");
      // Schedule auto-advance. If user opens details and clicks Weiter, that
      // path calls advanceNow() directly; the timer is cancelled then.
      clearAdvanceTimer();
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        applyVerdictTransition(result.verdict);
      }, AUTO_ADVANCE_MS);
      setPendingVerdictApply(result.verdict);

      if (result.streak.justUnlocked.length > 0) {
        setCelebrationQueue((q) => [...q, ...result.streak.justUnlocked]);
        window.dispatchEvent(new CustomEvent("badge:unlocked"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id],
  );

  const handleAudio = useCallback(
    async (blob: Blob) => {
      if (!current) return;
      setStatus("transcribing");
      try {
        const fd = new FormData();
        fd.append("audio", blob, "answer.webm");
        const sttRes = await fetch("/api/stt", { method: "POST", body: fd });
        if (!sttRes.ok) {
          const data = await sttRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Transkription fehlgeschlagen.");
        }
        const { text } = (await sttRes.json()) as { text: string };
        setTranscript(text);

        if (!text.trim()) {
          setStatus("ready");
          toast.error("Keine Sprache erkannt.");
          return;
        }

        setStatus("validating");
        const vRes = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: current.id, transcript: text }),
        });
        if (!vRes.ok) {
          const data = await vRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Bewertung fehlgeschlagen.");
        }
        const result = (await vRes.json()) as ValidateResponse;
        applyResult(result);
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Fehler.");
        setStatus("ready");
      }
    },
    [current?.id, applyResult],
  );

  const adminMark = useCallback(
    async (v: Verdict) => {
      if (!current) return;
      setTranscript(null);
      setStatus("validating");
      try {
        const res = await fetch("/api/admin/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: current.id, verdict: v }),
        });
        if (!res.ok) throw new Error();
        const result = (await res.json()) as ValidateResponse;
        applyResult(result);
      } catch {
        toast.error("Admin-Mark fehlgeschlagen.");
        setStatus("ready");
      }
    },
    [current?.id, applyResult],
  );

  const applyVerdictTransition = (v: Verdict) => {
    if (!current) return;
    if (v === "correct") {
      setQueue((q) => q.slice(1));
      setPile((p) => [...p, current]);
    } else if (v === "incorrect") {
      setQueue((q) => {
        if (q.length <= 1) return q;
        const [head, ...rest] = q;
        return [...rest, head];
      });
    } else {
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }
    setPendingVerdictApply(null);
  };

  const continueNow = () => {
    if (!pendingVerdictApply) return;
    clearAdvanceTimer();
    applyVerdictTransition(pendingVerdictApply);
  };

  const replay = () => {
    if (status === "ready" || status === "idle") speakCurrent();
  };

  const skip = () => {
    if (!current) return;
    clearAdvanceTimer();
    setQueue((q) => {
      if (q.length <= 1) return q;
      const [head, ...rest] = q;
      return [...rest, head];
    });
    setVerdict(null);
    setTranscript(null);
    setFeedback(null);
    setHitKeyPoints(null);
    setPendingVerdictApply(null);
  };

  const reset = async () => {
    try {
      const res = await fetch(`/api/decks/${deckId}/quiz/reset`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      toast.error("Zurücksetzen fehlgeschlagen.");
    }
  };

  const stackQueue: StackCard[] = queue.map((c) => ({
    id: c.id,
    questionDe: c.questionDe,
  }));
  const stackPile: StackCard[] = pile.map((c) => ({
    id: c.id,
    questionDe: c.questionDe,
  }));

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 sm:gap-8 py-6 sm:py-10 px-4">
      <CardStack
        queue={stackQueue}
        correctPile={stackPile}
        streak={streak}
        verdict={verdict}
        pulse={pulse}
        transcript={transcript}
        feedback={feedback}
        hitKeyPoints={hitKeyPoints}
        status={STATUS_LABEL[status]}
        draggable={adminMode && status === "ready"}
        onSwipeVerdict={adminMark}
        onContinue={pendingVerdictApply ? continueNow : undefined}
        onDetailsToggle={(open) => {
          if (open) clearAdvanceTimer();
        }}
      />

      <div className="flex flex-col items-center gap-4">
        {!started ? (
          <Button size="lg" onClick={() => setStarted(true)} disabled={!current}>
            <Play className="size-4" />
            Training starten
          </Button>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-lg font-medium">
              Alle Karten richtig beantwortet 🎉
            </p>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" />
              Stapel zurücksetzen
            </Button>
          </div>
        ) : (
          <>
            <PushToTalk
              disabled={status !== "ready"}
              onAudioCaptured={handleAudio}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={replay}
                disabled={status === "speaking" || status === "validating"}
              >
                <Volume2 className="size-4" />
                Wiederholen
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={skip}
                disabled={status === "speaking" || status === "validating"}
              >
                <SkipForward className="size-4" />
                Überspringen
              </Button>
            </div>
            {adminMode && (
              <AdminControls
                disabled={status === "validating"}
                onMark={adminMark}
              />
            )}
          </>
        )}
      </div>

      <BadgeCelebration
        badge={celebrationQueue[0] ?? null}
        onDismiss={() => setCelebrationQueue((q) => q.slice(1))}
      />
    </div>
  );
}
