-- The construction range is now exactly the twelve models Chanrai supplies. New models (LD36D, 6118E) are added by the seed.
DELETE FROM "products" WHERE "slug" IN ('liugong-835h', 'liugong-4180d', 'liugong-425', 'liugong-b230s', 'liugong-b320', 'liugong-6114e', 'liugong-6120e', 'liugong-6212e', 'liugong-365a', 'liugong-375a');
--> statement-breakpoint
DELETE FROM "families" WHERE "slug" = 'skid-steer-loaders';
--> statement-breakpoint
UPDATE "products" SET "order" = 0 WHERE "slug" IN ('liugong-zl50cn', 'liugong-b230', 'liugong-4215d');
--> statement-breakpoint
UPDATE "products" SET "order" = 1 WHERE "slug" = 'liugong-890t';
--> statement-breakpoint
UPDATE "products" SET "size_class" = 'Motor graders (215 hp class)' WHERE "slug" = 'liugong-4215d';
--> statement-breakpoint
UPDATE "products" SET "summary" = 'A 6x4 wide-body dump truck with a 60-tonne payload for quarry and mine haulage.', "size_class" = 'Wide-body trucks (60 tonne payload)', "highlights" = '["60,000 kg payload", "38 m\u00b3 heaped body", "Yuchai YC6K480 engine, 353 kW (480 hp)", "7-speed manual gearbox, top speed of 36 km/h"]'::jsonb, "specs" = '{"ratedPayload": 60000, "heapedCapacity": 38, "struckCapacity": 32, "enginePower": 353, "engineModel": "Yuchai YC6K480", "emissions": "Tier 3 / Stage III", "transmission": "7DS220A, manual", "maxTravelSpeed": 36, "emptyWeight": 31000, "maxOperatingWeight": 91000, "driveConfiguration": "6x4", "tyres": "14.00R25"}'::jsonb, "sources" = '["https://www.liugong.com/en/product/dw90a/", "https://www.liugong.com/wp-content/uploads/2023/02/WBT-DW90A-Spec-left-hand-T3-202506.pdf"]'::jsonb WHERE "slug" = 'liugong-dw90a';
--> statement-breakpoint
UPDATE "families" SET "name" = 'Wide-Body Trucks', "summary" = 'Wide-body off-highway dump trucks for hauling rock, ore and overburden in quarries and mines.' WHERE "slug" = 'mining-trucks' AND "name" = 'Mining Trucks';
--> statement-breakpoint
UPDATE "families" SET "summary" = replace("summary", 'from 10 to 31 tonnes', 'from 16 to 31 tonnes'), "faq" = replace("faq"::text, 'the 835H is a 10-tonne-class loader and the 890T is a 31-tonne-class loader.', 'the 890T is a 31-tonne-class loader.')::jsonb WHERE "slug" = 'wheel-loaders';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro", 'Excavators, wheel loaders, dozers, graders, compactors and compact machines for Nigerian', 'Excavators, wheel loaders, bulldozers, motor graders, backhoe loaders, rollers and wide-body trucks for Nigerian') WHERE "slug" = 'construction-equipment';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'e.g. LiuGong 835H', 'e.g. LiuGong 922E')::jsonb WHERE "data"::text LIKE '%e.g. LiuGong 835H%';
--> statement-breakpoint
UPDATE "products" SET "specs_verified" = true WHERE "slug" IN ('liugong-922e', 'liugong-936e', 'liugong-b230', 'liugong-4215d', 'liugong-777a', 'liugong-dw90a');
