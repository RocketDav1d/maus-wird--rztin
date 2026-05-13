/**
 * The full badge catalog. Each badge has a challenge predicate and a visual.
 *
 * Visuals come in two flavors:
 *  - "sticker" — a file under /public/maus/<file>.png (your existing pack)
 *  - "icon"    — a lucide icon name + a tailwind gradient class for the chip
 */

export type StickerVisual = { type: "sticker"; file: string };
export type IconVisual = {
  type: "icon";
  /** lucide icon name (must be in BADGE_ICONS map in the UI). */
  iconName: "Sparkles" | "Flame" | "Star" | "Trophy";
  /** Tailwind gradient classes for the badge chip backdrop. */
  gradient: string;
};
export type BadgeVisual = StickerVisual | IconVisual;

export type Badge = {
  id: string;
  title: string;
  description: string;
  visual: BadgeVisual;
};

export const stickerPath = (file: string) => `/maus/${file}`;

/**
 * Order matters — used as display order in the achievement sheet.
 * Stickers first, then total-progress icons.
 */
export const BADGES: Badge[] = [
  {
    id: "first_step",
    title: "Erste Karte",
    description: "Deine erste richtige Antwort.",
    visual: { type: "sticker", file: "nice.png" },
  },
  {
    id: "streak_3",
    title: "3 in Folge",
    description: "Drei richtige Antworten hintereinander.",
    visual: { type: "sticker", file: "wow.png" },
  },
  {
    id: "streak_5",
    title: "5 in Folge",
    description: "Fünf richtige Antworten hintereinander.",
    visual: { type: "sticker", file: "doctor.png" },
  },
  {
    id: "streak_10",
    title: "10 in Folge",
    description: "Zehn richtige Antworten hintereinander.",
    visual: { type: "sticker", file: "doctor-nice.png" },
  },
  {
    id: "total_10",
    title: "10 Karten",
    description: "Insgesamt 10 Karten richtig beantwortet.",
    visual: {
      type: "icon",
      iconName: "Sparkles",
      gradient: "from-amber-300 to-amber-500",
    },
  },
  {
    id: "total_25",
    title: "25 Karten",
    description: "Insgesamt 25 Karten richtig beantwortet.",
    visual: {
      type: "icon",
      iconName: "Flame",
      gradient: "from-orange-400 to-rose-500",
    },
  },
  {
    id: "total_50",
    title: "50 Karten",
    description: "Insgesamt 50 Karten richtig beantwortet.",
    visual: {
      type: "icon",
      iconName: "Star",
      gradient: "from-yellow-300 to-yellow-500",
    },
  },
  {
    id: "total_100",
    title: "100 Karten",
    description: "Insgesamt 100 Karten richtig beantwortet.",
    visual: {
      type: "icon",
      iconName: "Trophy",
      gradient: "from-violet-400 to-fuchsia-500",
    },
  },
];

export const BADGE_BY_ID: Record<string, Badge> = Object.fromEntries(
  BADGES.map((b) => [b.id, b]),
);

/**
 * Predicate evaluation — given a snapshot of the user's stats AFTER applying
 * the new verdict, returns every badge whose challenge was just satisfied
 * (and isn't already unlocked).
 *
 * Only `correct` answers can unlock things. The streak badges fire when
 * currentStreak reaches the threshold exactly (so they unlock on the
 * milestone correct answer, not every correct after that).
 */
export function evaluateUnlocks(snapshot: {
  currentStreak: number;
  totalCorrect: number;
  previouslyUnlocked: Set<string>;
}): Badge[] {
  const out: Badge[] = [];
  const { currentStreak, totalCorrect, previouslyUnlocked } = snapshot;

  const tryUnlock = (id: string, predicate: boolean) => {
    if (!predicate) return;
    if (previouslyUnlocked.has(id)) return;
    const badge = BADGE_BY_ID[id];
    if (badge) out.push(badge);
  };

  tryUnlock("first_step", totalCorrect >= 1);
  tryUnlock("streak_3", currentStreak >= 3);
  tryUnlock("streak_5", currentStreak >= 5);
  tryUnlock("streak_10", currentStreak >= 10);
  tryUnlock("total_10", totalCorrect >= 10);
  tryUnlock("total_25", totalCorrect >= 25);
  tryUnlock("total_50", totalCorrect >= 50);
  tryUnlock("total_100", totalCorrect >= 100);

  return out;
}
