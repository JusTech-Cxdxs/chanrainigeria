-- Two CNG services are no longer offered: safety relief valve testing and equipment leasing.
--> statement-breakpoint
DELETE FROM "services" WHERE "slug" IN ('cng-srv-testing', 'cng-equipment-leasing');
--> statement-breakpoint
UPDATE "families" SET "faq" = (SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM jsonb_array_elements("faq") x WHERE x->>'q' <> 'Can cascades be leased?') WHERE "slug" = 'cascades-storage';
