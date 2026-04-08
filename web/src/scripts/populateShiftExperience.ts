/**
 * populateShiftExperience.ts
 *
 * Builds shift_experience JSONB from actual Reflex shift records.
 * Groups role_requested counts per worker_id from the shift CSV,
 * then updates ALL workers (overwrites any prior-experience-derived values).
 *
 * Usage: npx tsx web/src/scripts/populateShiftExperience.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const SHIFT_CSV = '/Users/katherine_1/Downloads/shift_brand_store_worker_market_role_2026-04-03T17_54_29.026392901-05_00.csv';
const BATCH_SIZE = 500;

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) { console.error('ERROR: SUPABASE_SERVICE_KEY not in .env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
    else { current += char; }
  }
  values.push(current);
  return values;
}

async function buildShiftExperienceMap(): Promise<Map<number, Record<string, number>>> {
  return new Promise((resolve, reject) => {
    const map = new Map<number, Record<string, number>>();
    let headers: string[] = [];
    let lineNum = 0;

    const rl = readline.createInterface({ input: fs.createReadStream(SHIFT_CSV), crlfDelay: Infinity });

    rl.on('line', (line) => {
      lineNum++;
      if (lineNum === 1) {
        headers = parseCsvLine(line);
        return;
      }
      if (!line.trim()) return;

      const parts = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (parts[i] || '').trim(); });

      const workerId = parseInt(row.worker_id);
      const role = row.role_requested?.trim();
      if (isNaN(workerId) || !role) return;

      if (!map.has(workerId)) map.set(workerId, {});
      const counts = map.get(workerId)!;
      counts[role] = (counts[role] || 0) + 1;
    });

    rl.on('close', () => {
      console.log(`Processed ${lineNum.toLocaleString()} shift rows`);
      console.log(`Unique workers in shift data: ${map.size.toLocaleString()}`);
      resolve(map);
    });

    rl.on('error', reject);
  });
}

async function run() {
  console.log('=== populateShiftExperience ===\n');

  // 1. Build worker → role counts from shift CSV
  console.log('Reading shift CSV...');
  const shiftMap = await buildShiftExperienceMap();
  console.log();

  // 2. Build update list — only workers that exist in shift data
  const updates = Array.from(shiftMap.entries()).map(([worker_id, shift_experience]) => ({
    worker_id,
    shift_experience,
  }));

  console.log(`Workers to update: ${updates.length.toLocaleString()}\n`);

  // 3. Batch update Supabase
  const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, updates.length)})... `);

    const results = await Promise.all(batch.map(u =>
      supabase.from('workers')
        .update({ shift_experience: u.shift_experience })
        .eq('worker_id', u.worker_id)
    ));

    const batchErrors = results.filter(r => r.error).length;
    errorCount += batchErrors;
    successCount += batch.length - batchErrors;
    console.log(batchErrors > 0 ? `${batchErrors} errors` : '✓');

    if (i + BATCH_SIZE < updates.length) await delay(50);
  }

  console.log('\n=== Done ===');
  console.log(`Updated: ${successCount.toLocaleString()}  |  Errors: ${errorCount}`);
  console.log(`Workers not in shift data (no Reflex shifts): ${(10870 - successCount).toLocaleString()}`);
}

run().catch(console.error);
