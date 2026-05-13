import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { evaluateUnlocks, type Badge } from "./registry";

export type StreakUpdate = {
  current: number;
  best: number;
  totalCorrect: number;
  totalUnlocked: number;
  /** All badges newly unlocked by this verdict. May be 0, 1, or several. */
  justUnlocked: Badge[];
};

/**
 * Apply a quiz verdict to the user's streak + badge collection.
 *
 *  - correct  → increments streak + total_correct; evaluates every challenge
 *  - other    → resets current_streak to 0 (totals unaffected)
 *
 * Returns the new state. Multiple badges can unlock on a single answer
 * (e.g. first-ever correct that's also the 3rd-in-a-row).
 */
export async function applyVerdictToStreak(
  userId: string,
  verdict: "correct" | "incorrect" | "incomplete",
): Promise<StreakUpdate> {
  const [user] = await db
    .select({
      currentStreak: users.currentStreak,
      bestStreak: users.bestStreak,
      totalCorrect: users.totalCorrect,
      unlockedStickers: users.unlockedStickers,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      current: 0,
      best: 0,
      totalCorrect: 0,
      totalUnlocked: 0,
      justUnlocked: [],
    };
  }

  if (verdict !== "correct") {
    if (user.currentStreak === 0) {
      return {
        current: 0,
        best: user.bestStreak,
        totalCorrect: user.totalCorrect,
        totalUnlocked: user.unlockedStickers.length,
        justUnlocked: [],
      };
    }
    await db
      .update(users)
      .set({ currentStreak: 0 })
      .where(eq(users.id, userId));
    return {
      current: 0,
      best: user.bestStreak,
      totalCorrect: user.totalCorrect,
      totalUnlocked: user.unlockedStickers.length,
      justUnlocked: [],
    };
  }

  const newStreak = user.currentStreak + 1;
  const newBest = Math.max(newStreak, user.bestStreak);
  const newTotal = user.totalCorrect + 1;

  const previouslyUnlocked = new Set(user.unlockedStickers);
  const newlyUnlocked = evaluateUnlocks({
    currentStreak: newStreak,
    totalCorrect: newTotal,
    previouslyUnlocked,
  });

  const unlocked = newlyUnlocked.length
    ? [...user.unlockedStickers, ...newlyUnlocked.map((b) => b.id)]
    : user.unlockedStickers;

  await db
    .update(users)
    .set({
      currentStreak: newStreak,
      bestStreak: newBest,
      totalCorrect: newTotal,
      unlockedStickers: unlocked,
    })
    .where(eq(users.id, userId));

  return {
    current: newStreak,
    best: newBest,
    totalCorrect: newTotal,
    totalUnlocked: unlocked.length,
    justUnlocked: newlyUnlocked,
  };
}

export async function getStreakState(userId: string) {
  const [user] = await db
    .select({
      currentStreak: users.currentStreak,
      bestStreak: users.bestStreak,
      totalCorrect: users.totalCorrect,
      unlockedStickers: users.unlockedStickers,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return (
    user ?? {
      currentStreak: 0,
      bestStreak: 0,
      totalCorrect: 0,
      unlockedStickers: [] as string[],
    }
  );
}
