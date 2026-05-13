"use client";

import { motion } from "motion/react";
import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Verdict } from "./card-stack";

/**
 * Three big tap targets to simulate a verdict — for testing the streak +
 * sticker flow without speaking. Only renders when ?admin=1.
 */
export function AdminControls({
  disabled,
  onMark,
}: {
  disabled?: boolean;
  onMark: (v: Verdict) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mr-2 select-none">
        admin
      </span>
      <Btn
        intent="incorrect"
        onClick={() => onMark("incorrect")}
        disabled={disabled}
        ariaLabel="Als falsch markieren"
      >
        <X className="size-4" />
      </Btn>
      <Btn
        intent="incomplete"
        onClick={() => onMark("incomplete")}
        disabled={disabled}
        ariaLabel="Als unvollständig markieren"
      >
        <Minus className="size-4" />
      </Btn>
      <Btn
        intent="correct"
        onClick={() => onMark("correct")}
        disabled={disabled}
        ariaLabel="Als richtig markieren"
      >
        <Check className="size-4" />
      </Btn>
    </motion.div>
  );
}

function Btn({
  intent,
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  intent: Verdict;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const color =
    intent === "correct"
      ? "border-green-500/40 text-green-600 hover:bg-green-500/10"
      : intent === "incorrect"
        ? "border-red-500/40 text-red-600 hover:bg-red-500/10"
        : "border-amber-500/40 text-amber-600 hover:bg-amber-500/10";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "size-9 rounded-full border grid place-items-center transition-colors",
        color,
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}
