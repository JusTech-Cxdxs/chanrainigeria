-- Models are grouped by size on their type page; excavators are now the 922E, 936E, 952E HD and 975F (the two new ones are added by the seed).
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "size_class" text DEFAULT '' NOT NULL;
--> statement-breakpoint
DELETE FROM "products" WHERE "slug" IN ('liugong-915e', 'liugong-950e', 'liugong-990f');
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium excavators (20 to 40 tonnes)' WHERE "slug" = 'liugong-922e' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium excavators (20 to 40 tonnes)' WHERE "slug" = 'liugong-936e' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large excavators (over 40 tonnes)' WHERE "slug" = 'liugong-952ehd' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large excavators (over 40 tonnes)' WHERE "slug" = 'liugong-975f' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Small wheel loaders (3 tonne rated load)' WHERE "slug" = 'liugong-835h' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium wheel loaders (5 tonne rated load)' WHERE "slug" = 'liugong-zl50cn' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large wheel loaders (9.5 tonne rated load)' WHERE "slug" = 'liugong-890t' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium bulldozers (230 hp class)' WHERE "slug" = 'liugong-b230' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium bulldozers (230 hp class)' WHERE "slug" = 'liugong-b230s' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large bulldozers (320 hp class)' WHERE "slug" = 'liugong-b320' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium motor graders (180 to 220 hp)' WHERE "slug" = 'liugong-4180d' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium motor graders (180 to 220 hp)' WHERE "slug" = 'liugong-4215d' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large motor graders (over 220 hp)' WHERE "slug" = 'liugong-425' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Compact skid steer loaders (under 4 tonnes)' WHERE "slug" = 'liugong-365a' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Compact skid steer loaders (under 4 tonnes)' WHERE "slug" = 'liugong-375a' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Backhoe loaders (8 tonne class)' WHERE "slug" = 'liugong-777a' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Single-drum soil compactors (14 to 20 tonnes)' WHERE "slug" = 'liugong-6114e' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Single-drum soil compactors (14 to 20 tonnes)' WHERE "slug" = 'liugong-6120e' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Tandem asphalt rollers (12 tonne class)' WHERE "slug" = 'liugong-6212e' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Rigid mining trucks' WHERE "slug" = 'liugong-dw90a' AND "size_class" = '';
--> statement-breakpoint
UPDATE "products" SET "order" = 0 WHERE "slug" = 'liugong-922e';
--> statement-breakpoint
UPDATE "products" SET "order" = 1 WHERE "slug" = 'liugong-936e';
--> statement-breakpoint
UPDATE "products" SET "order" = 0 WHERE "slug" = 'liugong-835h';
--> statement-breakpoint
UPDATE "products" SET "order" = 1 WHERE "slug" = 'liugong-zl50cn';
--> statement-breakpoint
UPDATE "families" SET "summary" = 'Tracked hydraulic excavators from 22 to 77 tonnes for digging, trenching, loading trucks, quarry and mining work.' WHERE "slug" = 'excavators' AND "summary" = 'Tracked hydraulic excavators from 14 to 93 tonnes for digging, trenching, loading trucks and quarry work.';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Questions people ask', 'Frequently asked questions')::jsonb WHERE "data"::text LIKE '%Questions people ask%';
--> statement-breakpoint
UPDATE "families" SET "faq" = replace("faq"::text, 'A 13–15 t machine handles trenching and urban work well. Machines of 20–25 t are the general-purpose workhorses for roads and building sites. 35 t and larger suit quarry loading and mass excavation.', 'Machines of 20–25 t are the general-purpose workhorses for roads and building sites. A 35 t machine suits heavier digging and truck loading. Machines of 50 t and above suit quarry faces, mass excavation and mining.')::jsonb WHERE "slug" = 'excavators' AND "faq"::text LIKE '%A 13–15 t machine handles trenching%';
