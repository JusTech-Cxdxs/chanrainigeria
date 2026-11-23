-- Phone is now required on every form: drop "(optional)" from saved labels.
UPDATE "page_content" SET "data" = replace("data"::text, 'Phone (optional)', 'Phone')::jsonb WHERE "data"::text LIKE '%Phone (optional)%';
