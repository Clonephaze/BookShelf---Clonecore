CREATE TABLE "reading_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_book_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"timer_mode" text DEFAULT 'open' NOT NULL,
	"timer_duration_seconds" integer,
	"start_page" integer,
	"end_page" integer,
	"pages_read" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reading_goals" DROP CONSTRAINT "reading_goals_user_year_unique";--> statement-breakpoint
ALTER TABLE "reading_goals" ADD COLUMN "period_type" text DEFAULT 'yearly' NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_goals" ADD COLUMN "period_value" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_progress_log" ADD COLUMN "minutes_listened" integer;--> statement-breakpoint
ALTER TABLE "user_books" ADD COLUMN "total_minutes" integer;--> statement-breakpoint
ALTER TABLE "user_books" ADD COLUMN "current_minutes" integer;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_user_book_id_user_books_id_fk" FOREIGN KEY ("user_book_id") REFERENCES "public"."user_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reading_sessions_user_id_idx" ON "reading_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reading_sessions_user_book_idx" ON "reading_sessions" USING btree ("user_book_id");--> statement-breakpoint
CREATE INDEX "reading_sessions_user_active_idx" ON "reading_sessions" USING btree ("user_id","status");--> statement-breakpoint
ALTER TABLE "reading_goals" ADD CONSTRAINT "reading_goals_user_period_unique" UNIQUE("user_id","period_type","year","period_value");