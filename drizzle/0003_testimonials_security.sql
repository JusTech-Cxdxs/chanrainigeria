CREATE TYPE "public"."testimonial_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'MASTER' BEFORE 'ADMIN';--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"company" text,
	"email" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"quote" text NOT NULL,
	"status" "testimonial_status" DEFAULT 'PENDING' NOT NULL,
	"is_example" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "session_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "failed_logins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "testimonials_status" ON "testimonials" USING btree ("status","created_at");