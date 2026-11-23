-- Wheel loaders are now three models: ZL50CN, 835H and 890T (the two new ones are added by the seed).
DELETE FROM "products" WHERE "slug" IN ('liugong-842h', 'liugong-856h', 'liugong-862h', 'liugong-890h');
--> statement-breakpoint
UPDATE "products" SET "order" = 1, "specs_verified" = true WHERE "slug" = 'liugong-835h';
--> statement-breakpoint
UPDATE "families" SET "faq" = replace("faq"::text, 'the 890H is a 30-tonne-class loader.', 'the 890T is a 31-tonne-class loader. The ZL50CN follows an older naming: the 50 stands for its 5-tonne rated load.')::jsonb WHERE "slug" = 'wheel-loaders' AND "faq"::text LIKE '%the 890H is a 30-tonne-class loader.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'e.g. LiuGong 856H', 'e.g. LiuGong 835H')::jsonb WHERE "data"::text LIKE '%e.g. LiuGong 856H%';
