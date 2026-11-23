-- Mr Ghosh's review, 23 Nov (2): CNG range aimed at CNG retailers and gas distribution companies, no fleet wording, parts are stocked OEM and genuine, simpler forms.
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part') WHERE "intro"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part')::jsonb WHERE "applications"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part')::jsonb WHERE "choosing_tips"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part') WHERE "name"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part') WHERE "summary"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part')::jsonb WHERE "includes"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part')::jsonb WHERE "data"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'The range is aimed at developers, fleet operators and industrial users taking part', 'The range is aimed at CNG retailers and gas distribution companies taking part')::jsonb WHERE "data"::text LIKE '%The range is aimed at developers, fleet operators and industrial users taking part%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses') WHERE "intro"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses')::jsonb WHERE "applications"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses')::jsonb WHERE "choosing_tips"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses') WHERE "name"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses') WHERE "summary"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses')::jsonb WHERE "includes"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses')::jsonb WHERE "data"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'contractors, fleet operators, warehouses', 'contractors, warehouses')::jsonb WHERE "data"::text LIKE '%contractors, fleet operators, warehouses%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.') WHERE "intro"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.')::jsonb WHERE "applications"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.')::jsonb WHERE "choosing_tips"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.') WHERE "name"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.') WHERE "summary"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.')::jsonb WHERE "includes"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.')::jsonb WHERE "data"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'A machine to buy, a station to build, a fleet to keep running.', 'A machine to buy, a station to build, equipment to keep running.')::jsonb WHERE "data"::text LIKE '%A machine to buy, a station to build, a fleet to keep running.%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?') WHERE "intro"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?')::jsonb WHERE "applications"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?')::jsonb WHERE "choosing_tips"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?') WHERE "name"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?') WHERE "summary"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?')::jsonb WHERE "includes"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?')::jsonb WHERE "data"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Worked with us on a machine, a station or a fleet?', 'Worked with us on a machine or a station?')::jsonb WHERE "data"::text LIKE '%Worked with us on a machine, a station or a fleet?%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply') WHERE "intro"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply')::jsonb WHERE "applications"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply')::jsonb WHERE "choosing_tips"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply') WHERE "name"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply') WHERE "summary"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply')::jsonb WHERE "includes"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply')::jsonb WHERE "data"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Large fleet depots with a pipeline gas supply', 'Large bus and truck depots with a pipeline gas supply')::jsonb WHERE "data"::text LIKE '%Large fleet depots with a pipeline gas supply%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG') WHERE "intro"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG')::jsonb WHERE "applications"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG')::jsonb WHERE "choosing_tips"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG') WHERE "name"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG') WHERE "summary"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG')::jsonb WHERE "includes"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG')::jsonb WHERE "data"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG', 'Depots refuelling buses, taxis, tricycles or trucks from delivered CNG')::jsonb WHERE "data"::text LIKE '%Fleet depots refuelling buses, taxis, tricycles or trucks from delivered CNG%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks') WHERE "intro"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks')::jsonb WHERE "applications"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks')::jsonb WHERE "choosing_tips"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks') WHERE "name"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks') WHERE "summary"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks')::jsonb WHERE "includes"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks')::jsonb WHERE "data"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Captive fleet depots for buses, taxis, tricycles and logistics trucks', 'Captive depots for buses, taxis, tricycles and logistics trucks')::jsonb WHERE "data"::text LIKE '%Captive fleet depots for buses, taxis, tricycles and logistics trucks%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills') WHERE "intro"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills')::jsonb WHERE "applications"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills')::jsonb WHERE "choosing_tips"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills') WHERE "name"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills') WHERE "summary"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills')::jsonb WHERE "includes"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills')::jsonb WHERE "data"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'to match your fleet. Bus fills', 'to match your vehicles. Bus fills')::jsonb WHERE "data"::text LIKE '%to match your fleet. Bus fills%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots') WHERE "intro"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots')::jsonb WHERE "applications"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots')::jsonb WHERE "choosing_tips"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots') WHERE "name"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots') WHERE "summary"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots')::jsonb WHERE "includes"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots')::jsonb WHERE "data"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'High-flow bus and truck lanes at fleet depots', 'High-flow bus and truck lanes at depots')::jsonb WHERE "data"::text LIKE '%High-flow bus and truck lanes at fleet depots%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types') WHERE "intro"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types')::jsonb WHERE "applications"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types')::jsonb WHERE "choosing_tips"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types') WHERE "name"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types') WHERE "summary"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types')::jsonb WHERE "includes"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types')::jsonb WHERE "data"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Mixed-fleet stations with car and bus nozzles', 'Stations serving cars and buses, with both nozzle types')::jsonb WHERE "data"::text LIKE '%Mixed-fleet stations with car and bus nozzles%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run') WHERE "intro"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run')::jsonb WHERE "applications"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run')::jsonb WHERE "choosing_tips"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run') WHERE "name"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run') WHERE "summary"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run')::jsonb WHERE "includes"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run')::jsonb WHERE "data"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Service history records for every truck in your fleet', 'Service history records for every truck you run')::jsonb WHERE "data"::text LIKE '%Service history records for every truck in your fleet%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand') WHERE "intro"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand')::jsonb WHERE "applications"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand')::jsonb WHERE "choosing_tips"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand') WHERE "name"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand') WHERE "summary"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand')::jsonb WHERE "includes"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand')::jsonb WHERE "data"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Recommended stock lists for fleets that need parts on hand', 'Recommended stock lists for sites that need parts on hand')::jsonb WHERE "data"::text LIKE '%Recommended stock lists for fleets that need parts on hand%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Fleet & Site Assessment', 'Site Assessment') WHERE "intro"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Fleet & Site Assessment', 'Site Assessment')::jsonb WHERE "applications"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Fleet & Site Assessment', 'Site Assessment')::jsonb WHERE "choosing_tips"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Fleet & Site Assessment', 'Site Assessment') WHERE "name"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Fleet & Site Assessment', 'Site Assessment') WHERE "summary"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Fleet & Site Assessment', 'Site Assessment')::jsonb WHERE "includes"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Fleet & Site Assessment', 'Site Assessment')::jsonb WHERE "data"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Fleet & Site Assessment', 'Site Assessment')::jsonb WHERE "data"::text LIKE '%Fleet & Site Assessment%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks') WHERE "intro"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks')::jsonb WHERE "applications"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks')::jsonb WHERE "choosing_tips"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks') WHERE "name"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks') WHERE "summary"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks')::jsonb WHERE "includes"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks')::jsonb WHERE "data"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Comparison against existing diesel, LPG or lead-acid fleet', 'Comparison against existing diesel, LPG or lead-acid trucks')::jsonb WHERE "data"::text LIKE '%Comparison against existing diesel, LPG or lead-acid fleet%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals') WHERE "intro"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals')::jsonb WHERE "applications"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals')::jsonb WHERE "choosing_tips"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals') WHERE "name"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals') WHERE "summary"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals')::jsonb WHERE "includes"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals')::jsonb WHERE "data"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Fleet service records and reminders for upcoming intervals', 'Service records and reminders for upcoming intervals')::jsonb WHERE "data"::text LIKE '%Fleet service records and reminders for upcoming intervals%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.') WHERE "intro"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.')::jsonb WHERE "applications"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.')::jsonb WHERE "choosing_tips"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.') WHERE "name"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.') WHERE "summary"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.')::jsonb WHERE "includes"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.')::jsonb WHERE "data"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.', 'We stock genuine LiuGong OEM parts, from routine filter kits to major components.')::jsonb WHERE "data"::text LIKE '%We supply genuine LiuGong parts identified from your machine''s model and serial number, from routine filter kits to major components.%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock') WHERE "intro"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "applications"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "choosing_tips"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock') WHERE "name"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock') WHERE "summary"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "includes"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "data"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Parts lookup by part number, model or serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "data"::text LIKE '%Parts lookup by part number, model or serial number%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.') WHERE "intro"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.')::jsonb WHERE "applications"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.')::jsonb WHERE "choosing_tips"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.') WHERE "name"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.') WHERE "summary"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.')::jsonb WHERE "includes"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.')::jsonb WHERE "data"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.', 'We stock genuine BYD OEM parts and consumables for counterbalance forklifts and warehouse equipment.')::jsonb WHERE "data"::text LIKE '%Supply of BYD replacement parts and consumables for counterbalance forklifts and warehouse equipment, identified by model and serial number to get the correct part first time.%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock') WHERE "intro"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "applications"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "choosing_tips"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock') WHERE "name"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock') WHERE "summary"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "includes"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "data"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Parts identification from model and serial number', 'OEM and genuine parts held in stock')::jsonb WHERE "data"::text LIKE '%Parts identification from model and serial number%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.') WHERE "intro"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.')::jsonb WHERE "applications"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.')::jsonb WHERE "choosing_tips"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.') WHERE "name"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.') WHERE "summary"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.')::jsonb WHERE "includes"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.')::jsonb WHERE "data"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.', 'Filters, wear parts, hydraulic components, batteries and station spares. We stock OEM and genuine parts. Tell us what you need and we''ll confirm availability.')::jsonb WHERE "data"::text LIKE '%Filters, wear parts, hydraulic components, batteries and station spares. Send the machine''s serial number and the part numbers if you have them, and we''ll confirm availability.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Part numbers or descriptions', 'Parts you need')::jsonb WHERE "data"::text LIKE '%Part numbers or descriptions%';
--> statement-breakpoint
UPDATE "categories" SET "intro" = replace("intro"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.') WHERE "intro"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "families" SET "applications" = replace("applications"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.')::jsonb WHERE "applications"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "families" SET "choosing_tips" = replace("choosing_tips"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.')::jsonb WHERE "choosing_tips"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "services" SET "name" = replace("name"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.') WHERE "name"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "services" SET "summary" = replace("summary"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.') WHERE "summary"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "services" SET "includes" = replace("includes"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.')::jsonb WHERE "includes"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "site_settings" SET "data" = replace("data"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.')::jsonb WHERE "data"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'One per line. If you don''t have part numbers, describe the part.', 'One per line, e.g. oil filter, hydraulic hose, forklift tyre.')::jsonb WHERE "data"::text LIKE '%One per line. If you don''t have part numbers, describe the part.%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Product (optional)', 'Equipment (optional)')::jsonb WHERE "data"::text LIKE '%Product (optional)%';
--> statement-breakpoint
UPDATE "page_content" SET "data" = replace("data"::text, 'Choose a product', 'Choose equipment')::jsonb WHERE "data"::text LIKE '%Choose a product%';
--> statement-breakpoint
UPDATE "testimonials" SET "name" = 'Plant engineer' WHERE "name" = 'Fleet engineer';
