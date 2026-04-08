/**
 * populateFavoritedBrands.ts
 *
 * Reads favorited_by_brands from the active worker list CSV and updates
 * the workers table with:
 *   - favorited_by_brands: string[]  (JSONB array of brand names)
 *   - market_favorite: true if any favorited brands exist
 *
 * Prerequisite — run once in Supabase SQL editor:
 *   ALTER TABLE workers ADD COLUMN IF NOT EXISTS favorited_by_brands JSONB;
 *
 * Usage: npx tsx web/src/scripts/populateFavoritedBrands.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const CSV_PATH = '/Users/katherine_1/Downloads/active_worker_list_2026-04-08T12_25_13.11534095-05_00.csv';
const BATCH_SIZE = 500;

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) { console.error('ERROR: SUPABASE_SERVICE_KEY not in .env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }

  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('=== populateFavoritedBrands ===\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'));
  console.log(`CSV rows: ${rows.length}`);

  // Build update payloads — only for rows with actual brand data
  type UpdateRow = { worker_id: number; favorited_by_brands: string[]; store_favorite_count: number; market_favorite: boolean };
  const updates: UpdateRow[] = [];
  let withBrands = 0;
  let withoutBrands = 0;

  for (const row of rows) {
    const workerId = parseInt(row.worker_id);
    if (isNaN(workerId)) continue;

    const raw = (row.favorited_by_brands || '').trim();

    // Skip empty, "0", or pure numbers
    if (!raw || /^\d+$/.test(raw)) {
      withoutBrands++;
      continue;
    }

    const brands = raw.split(',').map(b => b.trim()).filter(Boolean);
    if (brands.length === 0) { withoutBrands++; continue; }

    updates.push({
      worker_id: workerId,
      favorited_by_brands: brands,
      store_favorite_count: brands.length,
      market_favorite: true,
    });
    withBrands++;
  }

  console.log(`Workers with favorited brands: ${withBrands}`);
  console.log(`Workers without:               ${withoutBrands}`);
  console.log(`\nUpdating Supabase in batches of ${BATCH_SIZE}...\n`);

  const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, updates.length)})... `);

    // Update each worker individually (upsert by worker_id not supported for partial update)
    const results = await Promise.all(batch.map(u =>
      supabase
        .from('workers')
        .update({ favorited_by_brands: u.favorited_by_brands, store_favorite_count: u.store_favorite_count, market_favorite: u.market_favorite })
        .eq('worker_id', u.worker_id)
    ));

    const batchErrors = results.filter(r => r.error).length;
    errorCount += batchErrors;
    successCount += batch.length - batchErrors;
    console.log(batchErrors > 0 ? `${batchErrors} errors` : '✓');

    if (i + BATCH_SIZE < updates.length) await delay(50);
  }

  console.log('\n=== Done ===');
  console.log(`Updated: ${successCount}  |  Errors: ${errorCount}`);
}

run().catch(console.error);
