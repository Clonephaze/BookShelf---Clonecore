ALTER TABLE "user_preferences" ADD COLUMN "font_family" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "accent_color" text DEFAULT 'copper' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "reading_comfort" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "simple_shelf_view" boolean DEFAULT false NOT NULL;