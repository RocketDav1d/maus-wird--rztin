ALTER TABLE "users" ADD COLUMN "total_correct" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Badge registry was redesigned (8 challenge-based badges with new IDs).
-- Wipe any pre-existing sticker IDs that no longer map to current badges.
UPDATE "users" SET "unlocked_stickers" = '[]'::jsonb, "current_streak" = 0;