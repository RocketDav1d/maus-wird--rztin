"use client";

import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "motion/react";
import { Info, X, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StreakHearts } from "./streak-hearts";

export type Verdict = "correct" | "incorrect" | "incomplete";

export type StackCard = {
  id: string;
  questionDe: string;
};

export type HitKeyPoint = { point_de: string; hit: boolean };

const BORDER_BY_VERDICT: Record<Verdict, string> = {
  correct: "border-green-500/80 shadow-green-500/30",
  incorrect: "border-red-500/80 shadow-red-500/30",
  incomplete: "border-amber-500/80 shadow-amber-500/30",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  correct: "Richtig",
  incomplete: "Unvollständig",
  incorrect: "Falsch",
};

const SWIPE_THRESHOLD = 120;

export function CardStack({
  queue,
  correctPile,
  streak,
  verdict,
  pulse,
  transcript,
  feedback,
  hitKeyPoints,
  status,
  draggable = false,
  onSwipeVerdict,
  onContinue,
  onDetailsToggle,
}: {
  queue: StackCard[];
  correctPile: StackCard[];
  streak: number;
  verdict: Verdict | null;
  pulse: boolean;
  transcript: string | null;
  feedback: string | null;
  hitKeyPoints: HitKeyPoint[] | null;
  status: string;
  /** Enables drag-to-verdict swipes (admin mode). */
  draggable?: boolean;
  /** Fired when a drag crosses the swipe threshold. */
  onSwipeVerdict?: (v: Verdict) => void;
  /** Fired when the user clicks "Weiter" after reviewing details. */
  onContinue?: () => void;
  /** Fired whenever the details panel is opened or closed. */
  onDetailsToggle?: (open: boolean) => void;
}) {
  const top = queue[0];
  const under = queue.slice(1, 4);

  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    if (!verdict) setDetailsOpen(false);
  }, [verdict, top?.id]);

  // Drag offset (admin swipe)
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dragOverlay = useTransform(
    [dragX, dragY] as unknown as [typeof dragX, typeof dragY],
    (latest) => {
      const [x, y] = latest as unknown as [number, number];
      if (Math.abs(x) > Math.abs(y)) {
        return x > 0
          ? `rgba(34,197,94,${Math.min(0.35, Math.abs(x) / 400)})`
          : `rgba(239,68,68,${Math.min(0.35, Math.abs(x) / 400)})`;
      }
      if (y > 30) {
        return `rgba(245,158,11,${Math.min(0.35, y / 400)})`;
      }
      return "rgba(0,0,0,0)";
    },
  );

  const showDetails =
    verdict === "incorrect" || verdict === "incomplete";

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (!draggable || !onSwipeVerdict) return;
    const { offset } = info;
    if (Math.abs(offset.x) >= SWIPE_THRESHOLD) {
      onSwipeVerdict(offset.x > 0 ? "correct" : "incorrect");
    } else if (offset.y >= SWIPE_THRESHOLD) {
      onSwipeVerdict("incomplete");
    } else {
      dragX.set(0);
      dragY.set(0);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col h-[55vh] min-h-[340px] sm:h-[60vh] sm:min-h-[400px]">
      {/* Status row — streak progress on the left, session count on the right
          (mobile only). On desktop the count is shown by the visual pile. */}
      <div className="flex items-center justify-between gap-3 px-1 pb-2 sm:pb-3 shrink-0 min-h-[20px]">
        <StreakHearts streak={streak} />
        {correctPile.length > 0 && (
          <div className="sm:hidden flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <span
              aria-hidden
              className="block size-2 rounded-sm bg-green-500/80"
            />
            {correctPile.length} richtig
          </div>
        )}
      </div>

      {/* Card area */}
      <div className="relative flex-1">
        {/* Visual correct pile — desktop only. Mobile uses the inline count. */}
        <div className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative w-16 h-24">
            {correctPile.slice(-4).map((c, i, arr) => (
              <div
                key={c.id}
                className="absolute inset-0 rounded-md border border-green-500/60 bg-green-50 dark:bg-green-950/40 shadow-sm"
                style={{
                  transform: `translate(${i * -2}px, ${i * -3}px) rotate(${(i - arr.length / 2) * -2}deg)`,
                  zIndex: i,
                }}
              />
            ))}
            {correctPile.length > 0 && (
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-medium text-green-700 dark:text-green-400">
                {correctPile.length}
              </div>
            )}
          </div>
        </div>

        <div className="relative w-full h-full grid place-items-center">
        {under.map((c, i) => (
          <div
            key={c.id}
            className="absolute w-[88%] max-w-md h-[68%] rounded-2xl border bg-card shadow-md"
            style={{
              transform: `translate(0, ${(i + 1) * 8}px) scale(${1 - (i + 1) * 0.03})`,
              opacity: 1 - (i + 1) * 0.2,
              zIndex: -1 - i,
            }}
          />
        ))}

        <AnimatePresence mode="popLayout">
          {top && (
            <motion.div
              key={top.id}
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                x: 0,
                rotate: pulse && verdict === "incomplete" ? [0, -1, 1, -1, 0] : 0,
              }}
              exit={
                verdict === "correct"
                  ? { x: -360, opacity: 0, rotate: -8, scale: 0.9 }
                  : verdict === "incorrect"
                    ? { y: 80, opacity: 0, rotate: 12, scale: 0.85 }
                    : { opacity: 0, scale: 0.95 }
              }
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              drag={draggable && !verdict}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              style={{ x: dragX, y: dragY }}
              className={cn(
                "relative w-[88%] max-w-md min-h-[68%] rounded-2xl border-2 bg-card shadow-xl",
                "flex flex-col p-5 sm:p-7 gap-3 sm:gap-4",
                verdict ? BORDER_BY_VERDICT[verdict] : "border-border",
                draggable && !verdict ? "cursor-grab active:cursor-grabbing" : "",
              )}
            >
              {/* Drag-color overlay */}
              {draggable && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: dragOverlay }}
                />
              )}

              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Frage
                </div>
                <StatusPill status={status} />
              </div>
              <p className="text-base sm:text-xl leading-relaxed font-medium relative z-10">
                {top.questionDe}
              </p>

              <div className="mt-auto space-y-3 text-sm relative z-10">
                {transcript && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Deine Antwort
                    </div>
                    <p className="text-muted-foreground italic whitespace-pre-wrap">
                      „{transcript}"
                    </p>
                  </div>
                )}

                {verdict && (
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={cn(
                        "text-xs uppercase tracking-wide font-medium",
                        verdict === "correct"
                          ? "text-green-600"
                          : verdict === "incorrect"
                            ? "text-red-600"
                            : "text-amber-600",
                      )}
                    >
                      {VERDICT_LABEL[verdict]}
                    </div>
                    {showDetails && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = !detailsOpen;
                          setDetailsOpen(next);
                          onDetailsToggle?.(next);
                        }}
                        aria-pressed={detailsOpen}
                        aria-label={detailsOpen ? "Details schließen" : "Warum?"}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-full px-2 py-0.5 -mr-1"
                      >
                        <Info className="size-3.5" />
                        {detailsOpen ? "schließen" : "warum?"}
                      </button>
                    )}
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {detailsOpen && showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pt-2 border-t border-border/60">
                        {hitKeyPoints && hitKeyPoints.length > 0 && (
                          <ul className="space-y-1">
                            {hitKeyPoints.map((k, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs leading-snug"
                              >
                                {k.hit ? (
                                  <Check className="size-3.5 mt-0.5 shrink-0 text-green-600" />
                                ) : (
                                  <X className="size-3.5 mt-0.5 shrink-0 text-red-500/80" />
                                )}
                                <span
                                  className={
                                    k.hit
                                      ? "text-muted-foreground line-through decoration-from-font"
                                      : "text-foreground"
                                  }
                                >
                                  {k.point_de}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {feedback && (
                          <p className="text-xs text-muted-foreground leading-snug">
                            {feedback}
                          </p>
                        )}
                        {onContinue && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={onContinue}
                              className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:opacity-80 transition-opacity"
                            >
                              Weiter
                              <ChevronRight className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {!top && (
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Keine Karten mehr.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (!status) return null;
  return (
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border">
      {status}
    </div>
  );
}
