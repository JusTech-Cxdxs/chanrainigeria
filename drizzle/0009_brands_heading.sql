-- Home page logo strip: "Trusted by Leading Brands" becomes "The brands we supply and support".
UPDATE "page_content" SET "data" = replace("data"::text, '"Trusted by Leading Brands"', '"The brands we supply and support"')::jsonb WHERE "data"::text LIKE '%Trusted by Leading Brands%';
