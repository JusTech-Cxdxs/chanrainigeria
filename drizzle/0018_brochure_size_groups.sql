-- Size groups now follow LiuGong's own product catalogue; the truck type is Mining Trucks again, with Wide-body trucks as its group.
UPDATE "products" SET "size_class" = 'Medium excavators (10 to 40 tonnes)' WHERE "slug" = 'liugong-922e';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium excavators (10 to 40 tonnes)' WHERE "slug" = 'liugong-936e';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large excavators (over 40 tonnes)' WHERE "slug" = 'liugong-952ehd';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large excavators (over 40 tonnes)' WHERE "slug" = 'liugong-975f';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium wheel loaders (3 to 7 tonnes)' WHERE "slug" = 'liugong-zl50cn';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large wheel loaders (8 to 12 tonnes)' WHERE "slug" = 'liugong-890t';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium motor graders (160 to 250 hp)' WHERE "slug" = 'liugong-4215d';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Medium bulldozers (160 to 300 hp)' WHERE "slug" = 'liugong-b230';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Large bulldozers (over 300 hp)' WHERE "slug" = 'liugong-ld36d';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Side-shifting backhoe loaders' WHERE "slug" = 'liugong-777a';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Wide-body trucks' WHERE "slug" = 'liugong-dw90a';
--> statement-breakpoint
UPDATE "families" SET "name" = 'Mining Trucks', "summary" = 'Wide-body mining trucks for hauling rock, ore and overburden in quarries and mines.' WHERE "slug" = 'mining-trucks';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro", 'rollers and wide-body trucks for Nigerian', 'rollers and mining trucks for Nigerian') WHERE "slug" = 'construction-equipment';
