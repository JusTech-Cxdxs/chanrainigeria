-- The client's own order: CNG compression & gas equipment first, then construction equipment, then forklifts.
UPDATE "categories" SET "name" = 'CNG Compression & Gas Equipment' WHERE "slug" = 'cng-gas-equipment' AND "name" IN ('CNG & Gas Equipment', 'CNG and Gas Equipment');--> statement-breakpoint
UPDATE "categories" SET "order" = 1 WHERE "slug" = 'cng-gas-equipment';--> statement-breakpoint
UPDATE "categories" SET "order" = 2 WHERE "slug" = 'construction-equipment';--> statement-breakpoint
UPDATE "categories" SET "order" = 3 WHERE "slug" = 'forklifts-material-handling';--> statement-breakpoint
-- Saved settings: only the original default wording is changed; anything staff wrote themselves is left alone.
UPDATE "site_settings" SET "data" = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace("data"::text,
  'Construction machinery, CNG systems and forklifts. Supplied, installed and serviced where you work.',
  'CNG compression and gas equipment, construction machinery and electric forklifts. Supplied, installed and serviced where you work.'),
  'Chanrai Nigeria supplies construction equipment, CNG and gas equipment, and electric forklifts to contractors, fleet operators, gas distributors and industry across Nigeria.',
  'Chanrai Nigeria supplies CNG compression and gas equipment, construction equipment and electric forklifts to gas distributors, CNG station operators, contractors, fleet operators and industry across Nigeria.'),
  'on the job site, at the station or in the warehouse',
  'at the station, on the job site or in the warehouse'),
  'See CNG and gas equipment',
  'See CNG compression and gas equipment'),
  'Construction equipment, CNG station systems and electric forklifts, with sales, genuine parts and technicians who come to your site.',
  'CNG compression and gas equipment, construction equipment and electric forklifts, with sales, genuine parts and technicians who come to your site.'),
  'Machines that keep Nigeria building, moving and fuelled',
  'Equipment that keeps Nigeria fuelled, building and moving'),
  'Excavators don''t drive to workshops and compressors don''t leave the station.',
  'Compressors don''t leave the station and excavators don''t drive to workshops.'),
  'Chanrai Nigeria | Construction, CNG and forklift equipment',
  'Chanrai Nigeria | CNG compression, construction and forklift equipment'),
  'Construction machinery, CNG and gas equipment, and electric forklifts in Nigeria.',
  'CNG compression and gas equipment, construction machinery and electric forklifts in Nigeria.'),
  'Construction equipment, CNG and gas equipment, and electric forklifts available from',
  'CNG compression and gas equipment, construction equipment and electric forklifts available from')::jsonb;--> statement-breakpoint
-- Saved home slides still in the original order: show the CNG slide first.
UPDATE "site_settings" SET "data" = jsonb_set("data", '{home,slides}',
  jsonb_build_array("data" #> '{home,slides,1}', "data" #> '{home,slides,0}')
  || COALESCE((SELECT jsonb_agg(e ORDER BY i) FROM jsonb_array_elements("data" #> '{home,slides}') WITH ORDINALITY AS t(e, i) WHERE i > 2), '[]'::jsonb))
WHERE "data" #>> '{home,slides,0,ctaHref}' = '/products/construction-equipment'
  AND "data" #>> '{home,slides,1,ctaHref}' = '/products/cng-gas-equipment';--> statement-breakpoint
-- Saved page wording: same rule, original defaults only.
UPDATE "page_content" SET "data" = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace("data"::text,
  'Equipment lines: construction, CNG and gas, forklifts',
  'Equipment lines: CNG and gas, construction, forklifts'),
  'Construction equipment, CNG and gas equipment, and electric forklifts available from',
  'CNG compression and gas equipment, construction equipment and electric forklifts available from'),
  'On-site field service, maintenance contracts, CNG station installation, parts and training.',
  'CNG station installation and maintenance, on-site field service, maintenance contracts, parts and training.'),
  'Request genuine parts for construction equipment, CNG equipment and forklifts.',
  'Request genuine parts for CNG compression and gas equipment, construction equipment and forklifts.'),
  'Book an on-site service visit for construction equipment, CNG equipment or forklifts anywhere in Nigeria.',
  'Book an on-site service visit for CNG compression and gas equipment, construction equipment or forklifts anywhere in Nigeria.'),
  '[{"text": "Excavator"}, {"text": "Forklift"}, {"text": "CNG dispenser"},',
  '[{"text": "CNG compressor"}, {"text": "Excavator"}, {"text": "Forklift"},'),
  'See CNG and gas equipment',
  'See CNG compression and gas equipment'),
  'Excavators don''t drive to workshops and compressors don''t leave the station.',
  'Compressors don''t leave the station and excavators don''t drive to workshops.'),
  'on the job site, at the station or in the warehouse',
  'at the station, on the job site or in the warehouse'),
  'on the job site, at the station or in your warehouse',
  'at the station, on the job site or in your warehouse'),
  '[{"text": "How do I book a technician?"}, {"text": "Which forklift for a warehouse?"}, {"text": "Where are you located?"}]',
  '[{"text": "What does a CNG station need?"}, {"text": "How do I book a technician?"}, {"text": "Which forklift for a warehouse?"}, {"text": "Where are you located?"}]')::jsonb;
