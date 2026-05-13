/**
 * Re-export from registry for back-compat with older imports.
 * @deprecated Use lib/badges/registry directly.
 */
export {
  BADGES,
  BADGE_BY_ID,
  stickerPath,
  type Badge,
  type BadgeVisual,
} from "./registry";

/** Streak goal for the on-quiz dots indicator. */
export const STREAK_PER_STICKER = 3;
