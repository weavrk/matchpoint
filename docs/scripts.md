# Useful Scripts

Run with `npx tsx <path>` (or `node <path>` for `.mjs`)

| Script | Description |
| ------ | ----------- |
| [`clean-worker-data.ts`](../scripts/clean-worker-data.ts) | Removes "Unknown" companies, maps duration codes, fixes names, generates first names. Optional: `--shifts=<csv>` |
| [`update-worker-photos-all.mjs`](../scripts/update-worker-photos-all.mjs) | Update worker photos from Cloudinary, Pexels, RandomUser |
| [`populate-shift-experience.ts`](../scripts/populate-shift-experience.ts) | Reads Reflex CSV export and writes `shift_experience` counts to Supabase workers |
| [`generate-shift-experience-sql.ts`](../scripts/generate-shift-experience-sql.ts) | Reads Reflex CSV export and outputs SQL UPDATE statements for `shift_experience` |
| [`market-worker-counts.ts`](../scripts/market-worker-counts.ts) | Prints worker counts broken down by market |
| [`find-store-managers.ts`](../scripts/find-store-managers.ts) | Lists workers with manager/supervisor/director roles in their experience history |
| [`fix-worker-names.ts`](../scripts/fix-worker-names.ts) | Fixes name formatting issues (capitalization, single-word names) in Supabase |
| [`addExperienceLevel.ts`](../web/src/scripts/addExperienceLevel.ts) | Assigns `experience_level` to all workers in Supabase based on retail duration + flex count |
| [`generateWorkerSummariesV2.ts`](../web/src/scripts/generateWorkerSummariesV2.ts) | Generates AI `about_me`, retailer quotes, and endorsements for workers via Gemini |
| [`generateWorkersSql.ts`](../web/src/scripts/generateWorkersSql.ts) | Generates SQL INSERT statements from local `workers.ts` data |
| [`populateWorkerConnections.ts`](../web/src/scripts/populateWorkerConnections.ts) | Seeds `worker_connections` table with initial retailer–worker relationship data |
| [`addQuoteAttribution.ts`](../web/src/scripts/addQuoteAttribution.ts) | Adds `role` and `brand` attribution fields to `retailer_quotes` for each worker |
