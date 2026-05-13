"use client";

import { motion } from "motion/react";
import { STREAK_PER_STICKER } from "@/lib/badges/stickers";

/**
 * 3-dot streak progress indicator. Self-explanatory: dots fill in on each
 * correct answer. Wraps modulo STREAK_PER_STICKER so after a sticker drop
 * the dots reset visually.
 */
export function StreakDots({ streak }: { streak: number }) {
  const filled = streak % STREAK_PER_STICKER;
  // When streak is an exact multiple of 3, briefly show all-filled before resetting.
  const showFull = streak > 0 && filled === 0;
  const displayCount = showFull ? STREAK_PER_STICKER : filled;

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: STREAK_PER_STICKER }).map((_, i) => {
        const isOn = i < displayCount;
        return (
          <motion.span
            key={i}
            className="block rounded-full"
            animate={{
              width: isOn ? 10 : 6,
              height: isOn ? 10 : 6,
              backgroundColor: isOn
                ? "var(--color-foreground)"
                : "transparent",
              borderColor: isOn
                ? "var(--color-foreground)"
                : "color-mix(in oklab, var(--color-foreground) 30%, transparent)",
              scale: isOn ? [1, 1.4, 1] : 1,
            }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              border: "1px solid",
            }}
          />
        );
      })}
    </div>
  );
}
