import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const deckStatusEnum = pgEnum("deck_status", [
  "processing",
  "ready",
  "failed",
]);
export const questionTypeEnum = pgEnum("question_type", [
  "recall",
  "reasoning",
  "clinical_case",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "edited",
  "rejected",
]);
export const quizStatusEnum = pgEnum("quiz_status", [
  "pending",
  "correct",
  "reviewing",
]);
export const verdictEnum = pgEnum("verdict", [
  "correct",
  "incorrect",
  "incomplete",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  totalCorrect: integer("total_correct").notNull().default(0),
  unlockedStickers: jsonb("unlocked_stickers")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const decks = pgTable(
  "decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sourceFilename: text("source_filename"),
    status: deckStatusEnum("status").notNull().default("processing"),
    progressStage: text("progress_stage"),
    totalPages: integer("total_pages").notNull().default(0),
    generatedCount: integer("generated_count").notNull().default(0),
    errorMessage: text("error_message"),
    extractedText: jsonb("extracted_text")
      .$type<Array<{ pageNumber: number; text: string }> | null>(),
    topicMap: jsonb("topic_map")
      .$type<
        Array<{
          topic: string;
          priority: "high" | "med" | "low" | "skip";
          page_start: number;
          page_end: number;
          rationale_de: string;
        }> | null
      >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("decks_user_idx").on(t.userId)],
);

/**
 * answer_key_points shape:
 *   [{ point_de: string, required: boolean, synonyms_de: string[] }]
 *
 * topic_tags shape: string[]
 *
 * embedding: JSON array of 1536 floats (text-embedding-3-small).
 * Stored as jsonb so we don't need pgvector for an MVP-sized deck.
 */
export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    questionDe: text("question_de").notNull(),
    questionType: questionTypeEnum("question_type")
      .notNull()
      .default("reasoning"),
    difficulty: integer("difficulty").notNull().default(2),
    topicTags: jsonb("topic_tags").$type<string[]>().notNull().default([]),
    expectedAnswerDe: text("expected_answer_de").notNull(),
    answerKeyPoints: jsonb("answer_key_points")
      .$type<
        Array<{
          point_de: string;
          required: boolean;
          synonyms_de: string[];
        }>
      >()
      .notNull()
      .default([]),
    sourcePage: integer("source_page"),
    sourceSectionHeading: text("source_section_heading"),
    sourceQuoteDe: text("source_quote_de"),
    embedding: jsonb("embedding").$type<number[] | null>(),
    reviewStatus: reviewStatusEnum("review_status")
      .notNull()
      .default("pending"),
    quizStatus: quizStatusEnum("quiz_status").notNull().default("pending"),
    lastAskedAt: timestamp("last_asked_at", { withTimezone: true }),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("cards_deck_idx").on(t.deckId),
    index("cards_quiz_status_idx").on(t.deckId, t.quizStatus),
  ],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    transcriptDe: text("transcript_de").notNull(),
    verdict: verdictEnum("verdict").notNull(),
    hitKeyPoints: jsonb("hit_key_points")
      .$type<Array<{ point_de: string; hit: boolean }>>()
      .notNull()
      .default([]),
    feedbackDe: text("feedback_de"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("attempts_card_idx").on(t.cardId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  decks: many(decks),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, { fields: [decks.userId], references: [users.id] }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  deck: one(decks, { fields: [cards.deckId], references: [decks.id] }),
  attempts: many(attempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  card: one(cards, { fields: [attempts.cardId], references: [cards.id] }),
}));

export type User = typeof users.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type Card = typeof cards.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type CardInsert = typeof cards.$inferInsert;
