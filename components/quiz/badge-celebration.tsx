"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import type { Badge } from "@/lib/badges/registry";
import { BadgeVisual } from "@/components/badges/badge-visual";
import { cn } from "@/lib/utils";

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
 * The final-boss badge (`doctor`) gets richer treatment: larger card + visual,
 * gold ring, brighter halo, and a "FINALE" pre-label.
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

  const isFinal = !!badge?.final;

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const visualSize = isFinal ? 220 : 160;
  const haloSize = isFinal ? 720 : 480;
  const haloGradient = isFinal
    ? "radial-gradient(circle at center, rgba(252,211,77,0.7), rgba(252,211,77,0) 60%)"
    : "radial-gradient(circle at center, rgba(255,200,80,0.45), rgba(255,200,80,0) 60%)";

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
            className={cn(
              "absolute inset-0 backdrop-blur-sm cursor-default",
              isFinal ? "bg-black/70" : "bg-black/55",
            )}
          />

          {/* Halo — bigger and warmer for the final boss */}
          <motion.div
            aria-hidden
            className="absolute pointer-events-none"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: isFinal ? [0.5, 1.5, 1.25, 1.35] : [0.6, 1.4, 1.2],
              opacity: isFinal ? [0, 0.85, 0.55, 0.7] : [0, 0.7, 0.35],
            }}
            transition={{
              duration: isFinal ? 2.4 : 1.4,
              ease: "easeOut",
              repeat: isFinal ? Infinity : 0,
              repeatType: "mirror",
            }}
            style={{
              width: haloSize,
              height: haloSize,
              background: haloGradient,
              filter: "blur(8px)",
            }}
          />

          {/* Card */}
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
              stiffness: isFinal ? 180 : 220,
              damping: isFinal ? 14 : 16,
              mass: 0.9,
            }}
            className={cn(
              "relative flex flex-col items-center gap-5 rounded-3xl shadow-2xl border",
              isFinal
                ? "px-12 py-10 max-w-md bg-gradient-to-br from-amber-50 via-background to-amber-50 dark:from-amber-950/60 dark:via-background dark:to-amber-950/60 ring-2 ring-amber-400/60 shadow-amber-500/30"
                : "px-8 py-7 max-w-sm bg-background",
            )}
          >
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
                scale: isFinal ? [0.85, 1.2, 1.05, 1] : [0.9, 1.12, 1],
                rotate: isFinal ? [0, -6, 6, -3, 0] : [0, -4, 4, 0],
              }}
              transition={{
                duration: isFinal ? 1.6 : 1.1,
                ease: "easeOut",
                times: isFinal ? [0, 0.4, 0.75, 1] : [0, 0.55, 1],
              }}
            >
              <BadgeVisual badge={badge} size={visualSize} />
            </motion.div>

            <motion.div
              className="flex flex-col items-center gap-1.5 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.35 }}
            >
              <div
                className={cn(
                  "text-[10px] uppercase tracking-[0.22em]",
                  isFinal
                    ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {isFinal ? "Finale" : "Neues Badge"}
              </div>
              <div
                className={cn(
                  "font-semibold tracking-tight",
                  isFinal ? "text-3xl" : "text-xl",
                )}
              >
                {badge.title}
              </div>
              <div className="text-sm text-muted-foreground max-w-[20rem]">
                {badge.description}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
