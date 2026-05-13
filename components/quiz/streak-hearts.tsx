"use client";

import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";

/**
 * Streak progress that mirrors the actual badge ladder.
 *
 * Streak badges unlock at 3 → 5 → 10 → 20 in a row. The bar always shows
 * N dots where N is the next milestone, with filled hearts for current
 * progress. Past 20, shows a flame counter (no more streak badges left).
 */

const STREAK_MILESTONES = [3, 5, 10, 20] as const;

function nextMilestone(streak: number): number | null {
  for (const m of STREAK_MILESTONES) {
    if (streak < m) return m;
  }
  return null;
}

export function StreakHearts({ streak }: { streak: number }) {
  const next = nextMilestone(streak);

  if (next === null) {
    // Past the last streak badge — show a "you're on fire" counter instead
    // since rendering 20+ dots is too much for mobile.
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-foreground">
        <span aria-hidden>🔥</span>
        <span>{streak}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <AnimatePresence initial={false} mode="popLayout">
        {Array.from({ length: next }).map((_, i) => {
          const filled = i < streak;
          return (
            <motion.span
              key={`${next}-${i}`}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              {filled ? (
                <motion.span
                  initial={{ scale: 0.4 }}
                  animate={{
                    scale: [0.4, 1.35, 1],
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    times: [0, 0.6, 1],
                  }}
                  className="inline-flex"
                >
                  <Heart
                    className="size-3 text-red-500"
                    fill="currentColor"
                    strokeWidth={0}
                    aria-hidden
                  />
                </motion.span>
              ) : (
                <span
                  aria-hidden
                  className="block size-2 rounded-full border border-foreground/30"
                />
              )}
            </motion.span>
          );
        })}
      </AnimatePresence>
      <span className="sr-only">
        {streak} von {next} Karten in Folge
      </span>
    </div>
  );
}
