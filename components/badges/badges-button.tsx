"use client";

import { useEffect, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgesSheet } from "./badges-sheet";

/**
 * Header icon → opens the badges sheet.
 * Pulses + glows when the `badge:unlocked` event fires (dispatched from the
 * quiz when a sticker celebration starts).
 */
export function BadgesButton() {
  const [open, setOpen] = useState(false);
  const [hasAny, setHasAny] = useState(false);
  const controls = useAnimationControls();

  // Fetch unlocked count on mount + whenever an unlock event fires.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/me/badges", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { unlockedStickers: string[] };
        if (!cancelled) setHasAny((data.unlockedStickers ?? []).length > 0);
      } catch {
        // ignore
      }
    };
    load();
    const onUnlock = () => {
      load();
      controls.start({
        scale: [1, 1.35, 1],
        rotate: [0, -8, 8, 0],
        transition: { duration: 0.7, ease: "easeOut" },
      });
    };
    window.addEventListener("badge:unlocked", onUnlock);
    return () => {
      cancelled = true;
      window.removeEventListener("badge:unlocked", onUnlock);
    };
  }, [controls]);

  return (
    <>
      <motion.div animate={controls}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label="Badges"
          title="Badges"
          className={hasAny ? "text-amber-500 dark:text-amber-400" : undefined}
        >
          <Award className="size-4" />
        </Button>
      </motion.div>
      <BadgesSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
