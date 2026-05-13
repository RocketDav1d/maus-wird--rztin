CREATE TYPE "public"."deck_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('recall', 'reasoning', 'clinical_case');--> statement-breakpoint
CREATE TYPE "public"."quiz_status" AS ENUM('pending', 'correct', 'reviewing');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'edited', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('correct', 'incorrect', 'incomplete');--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"transcript_de" text NOT NULL,
	"verdict" "verdict" NOT NULL,
	"hit_key_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"feedback_de" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"question_de" text NOT NULL,
	"question_type" "question_type" DEFAULT 'reasoning' NOT NULL,
	"difficulty" integer DEFAULT 2 NOT NULL,
	"topic_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expected_answer_de" text NOT NULL,
	"answer_key_points" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_page" integer,
	"source_section_heading" text,
	"source_quote_de" text,
	"embedding" jsonb,
	"review_status" "review_status" DEFAULT 'pending' NOT NULL,
	"quiz_status" "quiz_status" DEFAULT 'pending' NOT NULL,
	"last_asked_at" timestamp with time zone,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"source_filename" text,
	"status" "deck_status" DEFAULT 'processing' NOT NULL,
	"progress_stage" text,
	"total_pages" integer DEFAULT 0 NOT NULL,
	"generated_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"extracted_text" jsonb,
	"topic_map" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_card_idx" ON "attempts" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "cards_deck_idx" ON "cards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "cards_quiz_status_idx" ON "cards" USING btree ("deck_id","quiz_status");--> statement-breakpoint
CREATE INDEX "decks_user_idx" ON "decks" USING btree ("user_id");