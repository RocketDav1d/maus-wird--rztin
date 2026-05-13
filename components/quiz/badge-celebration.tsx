"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { Badge } from "@/lib/badges/registry";
import { BadgeVisual } from "@/components/badges/badge-visual";

const AUTO_DISMISS_MS = 10_000;

/**
 * Full-screen celebration overlay. Smooth, dismissible, time-bounded.
 *
 *  1. Backdrop fades in
 *  2. Badge scales in with a soft glow + halo burst
 *  3. Title + description fade in just after
 *  4. Sits until: user clicks backdrop / X / or 10s elapses
 *  5. On dismiss: badge flies to top-right (where the Badges button lives),
 *     backdrop fades out
 *
 * Designed to be motion-driven. The only words on screen are the badge title
 * (≤ 2 words) and one sentence describing the challenge.
 */
export function BadgeCelebration({
  badge,
  onDismiss,
}: {
  badge: Badge | null;
  onDismiss: () => void;
}) {
  const [exiting, setExiting] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Reset exit state + arm the 10s auto-dismiss whenever a new badge appears.
  useEffect(() => {
    setExiting(false);
    if (!badge) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [badge?.id]);

  // ESC to dismiss
  useEffect(() => {
    if (!badge) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExiting(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [badge?.id]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
  };

  const targetX = viewport.w / 2 - 32;
  const targetY = -viewport.h / 2 + 36;

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (exiting) onDismiss();
      }}
    >
      {badge && !exiting && (
        <motion.div
          key={badge.id}
          className="fixed inset-0 z-50 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop — click to dismiss */}
          <motion.button
            type="button"
            aria-label="Schließen"
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm cursor-default"
          />

          {/* Halo */}
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: [0.6, 1.4, 1.2],
              opacity: [0, 0.7, 0.35],
            }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            style={{
              width: 480,
              height: 480,
              background:
                "radial-gradient(circle at center, rgba(255,200,80,0.45), rgba(255,200,80,0) 60%)",
              filter: "blur(8px)",
            }}
          />

          {/* Card content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={badge.title}
            initial={{ scale: 0.3, opacity: 0, y: 30, rotate: -6 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              x: 0,
              rotate: 0,
            }}
            exit={{
              scale: 0.18,
              opacity: 0,
              y: targetY,
              x: targetX,
              rotate: 18,
              transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 16,
              mass: 0.9,
            }}
            className="relative flex flex-col items-center gap-5 px-8 py-7 rounded-3xl bg-background shadow-2xl border max-w-sm"
          >
            {/* Dismiss X */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Schließen"
              className="absolute top-3 right-3 size-7 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{
                scale: [0.9, 1.12, 1],
                rotate: [0, -4, 4, 0],
              }}
              transition={{
                duration: 1.1,
                ease: "easeOut",
                times: [0, 0.55, 1],
              }}
            >
              <BadgeVisual badge={badge} size={160} />
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-1.5 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Neues Badge
              </div>
              <div className="text-xl font-semibold tracking-tight">
                {badge.title}
              </div>
              <div className="text-sm text-muted-foreground max-w-[18rem]">
                {badge.description}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
