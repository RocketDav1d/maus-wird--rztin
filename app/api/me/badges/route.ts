import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStreakState } from "@/lib/badges/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const state = await getStreakState(session.user.id);
  return NextResponse.json({
    currentStreak: state.currentStreak,
    bestStreak: state.bestStreak,
    unlockedStickers: state.unlockedStickers,
  });
}
