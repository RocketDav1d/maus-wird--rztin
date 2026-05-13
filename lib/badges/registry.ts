/**
 * The full badge catalog. Each badge has a challenge predicate and a visual.
 *
 * Visuals come in two flavors:
 *  - "sticker" — a file under /public/badges/<file>.png
 *  - "icon"    — a lucide icon name + a tailwind gradient class for the chip
 *                (kept in the type for future use; not used by the current catalog)
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
  /** Special "final boss" treatment in the UI (larger card, richer celebration). */
  final?: boolean;
};

export const stickerPath = (file: string) => `/badges/${file}`;

/**
 * Order matters — used as display order in the achievement sheet.
 * The first 10 form a 5×2 grid of regular badges; the 11th (doctor) is the
 * final-boss badge, rendered in its own centered row.
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
    visual: { type: "sticker", file: "bisschenstolz.png" },
  },
  {
    id: "streak_5",
    title: "5 in Folge",
    description: "Fünf richtige Antworten hintereinander.",
    visual: { type: "sticker", file: "wow.png" },
  },
  {
    id: "streak_10",
    title: "10 in Folge",
    description: "Zehn richtige Antworten hintereinander.",
    visual: { type: "sticker", file: "amIcoolyet.png" },
  },
  {
    id: "streak_20",
    title: "20 in Folge",
    description: "Zwanzig richtige Antworten hintereinander.",
    visual: { type: "sticker", file: "proudofyou.png" },
  },
  {
    id: "total_10",
    title: "10 Karten",
    description: "Insgesamt 10 Karten richtig beantwortet.",
    visual: { type: "sticker", file: "mausiii.png" },
  },
  {
    id: "total_25",
    title: "25 Karten",
    description: "Insgesamt 25 Karten richtig beantwortet.",
    visual: { type: "sticker", file: "youredoingsuper.png" },
  },
  {
    id: "total_50",
    title: "50 Karten",
    description: "Insgesamt 50 Karten richtig beantwortet.",
    visual: { type: "sticker", file: "schlaue-maus.png" },
  },
  {
    id: "total_100",
    title: "100 Karten",
    description: "Insgesamt 100 Karten richtig beantwortet.",
    visual: { type: "sticker", file: "mausmodus.png" },
  },
  {
    id: "total_200",
    title: "200 Karten",
    description: "Insgesamt 200 Karten richtig beantwortet.",
    visual: { type: "sticker", file: "mausitastisch.png" },
  },
  {
    id: "doctor",
    title: "Doktor",
    description: "Alle Challenges abgeschlossen. Du hast es geschafft, Mausi.",
    visual: { type: "sticker", file: "doctor.png" },
    final: true,
  },
];

/** IDs of every regular (non-final) badge, in display order. */
export const REGULAR_BADGE_IDS = BADGES.filter((b) => !b.final).map((b) => b.id);

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
 *
 * The `doctor` badge is the final boss — it unlocks only when every other
 * (regular) badge is already in the user's collection (including ones we
 * just unlocked in this same evaluation pass).
 */
export function evaluateUnlocks(snapshot: {
  currentStreak: number;
  totalCorrect: number;
  previouslyUnlocked: Set<string>;
}): Badge[] {
  const out: Badge[] = [];
  const { currentStreak, totalCorrect, previouslyUnlocked } = snapshot;

  // Mutable copy — we add to it as we unlock things so the doctor predicate
  // can see badges unlocked earlier in this same call.
  const nowUnlocked = new Set(previouslyUnlocked);

  const tryUnlock = (id: string, predicate: boolean) => {
    if (!predicate) return;
    if (nowUnlocked.has(id)) return;
    const badge = BADGE_BY_ID[id];
    if (!badge) return;
    out.push(badge);
    nowUnlocked.add(id);
  };

  // Regulars
  tryUnlock("first_step", totalCorrect >= 1);
  tryUnlock("streak_3", currentStreak >= 3);
  tryUnlock("streak_5", currentStreak >= 5);
  tryUnlock("streak_10", currentStreak >= 10);
  tryUnlock("streak_20", currentStreak >= 20);
  tryUnlock("total_10", totalCorrect >= 10);
  tryUnlock("total_25", totalCorrect >= 25);
  tryUnlock("total_50", totalCorrect >= 50);
  tryUnlock("total_100", totalCorrect >= 100);
  tryUnlock("total_200", totalCorrect >= 200);

  // Final boss — unlocks when all regulars are in the now-unlocked set.
  const allRegularsUnlocked = REGULAR_BADGE_IDS.every((id) =>
    nowUnlocked.has(id),
  );
  tryUnlock("doctor", allRegularsUnlocked);

  return out;
}
