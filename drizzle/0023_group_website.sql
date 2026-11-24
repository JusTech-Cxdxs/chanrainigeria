-- The group website address that opens is https://kewalramchanrai.com/
UPDATE "site_settings" SET "data" = replace(replace("data"::text, 'https://www.kewalramchanrai.com/', 'https://kewalramchanrai.com/'), 'https://www.kewalramchanrai.com', 'https://kewalramchanrai.com/')::jsonb;
