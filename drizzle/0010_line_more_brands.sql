ALTER TABLE "categories" ADD COLUMN "more_brand_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "categories" SET "more_brand_ids" = jsonb_build_array((SELECT "id" FROM "brands" WHERE "slug" = 'fornovogas'))
  WHERE "slug" = 'cng-gas-equipment' AND "more_brand_ids" = '[]'::jsonb AND EXISTS (SELECT 1 FROM "brands" WHERE "slug" = 'fornovogas');
