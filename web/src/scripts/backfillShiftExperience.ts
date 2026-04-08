/**
 * backfillShiftExperience.ts
 *
 * Fixes workers that have null shift_experience due to (EXTENDED) duration
 * not being handled by the original parser. Re-parses prior_experience from
 * the CSV and updates shift_experience + previous_experience in the DB.
 *
 * Usage: npx tsx web/src/scripts/backfillShiftExperience.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const CSV_PATH = '/Users/katherine_1/Downloads/active_worker_list_2026-04-07T16_08_10.140723639-05_00.csv';
const BATCH_SIZE = 500;

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) { console.error('ERROR: SUPABASE_SERVICE_KEY not in .env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Duration map (now includes EXTENDED) ────────────────────────────────────

const DURATION_MAP: Record<string, string> = {
  SHORT: '< 6 months',
  MEDIUM: '6-18 months',
  LONG: '2+ years',
  EXTENDED: '2+ years',
  UNKNOWN: '',
};

interface PriorJob { company: string; roles: string[]; duration: string; }

function parsePriorExperience(raw: string): PriorJob[] {
  if (!raw?.trim()) return [];
  const entries = raw.split('|').map(e => e.trim()).filter(Boolean);
  const jobs: PriorJob[] = [];
  for (const entry of entries) {
    const match = entry.match(/^(.*?)\s*-\s*(.+?)\s*\((SHORT|MEDIUM|LONG|EXTENDED|UNKNOWN)\)\s*$/i);
    if (!match) continue;
    let company = match[1].trim().replace(/\[.*?\]/g, '').trim();
    const role = match[2].trim();
    const duration = DURATION_MAP[match[3].toUpperCase()] ?? '';
    if (!company || company.toLowerCase() === 'unknown') company = '';
    if (!role || role.toLowerCase() === 'unknown') continue;
    jobs.push({ company, roles: [role], duration });
  }
  return jobs;
}

function extractShiftExperience(jobs: PriorJob[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    for (const role of job.roles) {
      if (role && role.toLowerCase() !== 'unknown') {
        counts[role] = (counts[role] || 0) + 1;
      }
    }
  }
  return counts;
}

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

async function run() {
  console.log('=== backfillShiftExperience ===\n');

  // 1. Fetch workers with null shift_experience from DB
  const PAGE_SIZE = 1000;
  const nullWorkers: { worker_id: number }[] = [];
  let from = 0;

  console.log('Fetching workers with null shift_experience...');
  while (true) {
    const { data, error } = await supabase
      .from('workers').select('worker_id')
      .is('shift_experience', null)
      .not('worker_id', 'is', null)
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data?.length) break;
    nullWorkers.push(...data);
    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }
  console.log(`Workers with null shift_experience: ${nullWorkers.length}\n`);

  // 2. Index CSV by worker_id
  console.log('Reading CSV...');
  const csvRows = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'));
  const csvMap = new Map<number, Record<string, string>>();
  for (const row of csvRows) {
    const id = parseInt(row.worker_id);
    if (!isNaN(id)) csvMap.set(id, row);
  }
  console.log(`CSV indexed: ${csvMap.size} rows\n`);

  // 3. Re-parse and build updates
  type Update = { worker_id: number; shift_experience: Record<string, number>; previous_experience: PriorJob[] };
  const updates: Update[] = [];
  let noData = 0;

  for (const { worker_id } of nullWorkers) {
    const row = csvMap.get(worker_id);
    if (!row?.prior_experience?.trim()) { noData++; continue; }

    const jobs = parsePriorExperience(row.prior_experience);
    const shiftExp = extractShiftExperience(jobs);

    if (Object.keys(shiftExp).length === 0) { noData++; continue; }

    updates.push({ worker_id, shift_experience: shiftExp, previous_experience: jobs });
  }

  console.log(`Workers with recoverable shift_experience: ${updates.length}`);
  console.log(`Workers with no parseable data:            ${noData}\n`);

  // 4. Batch update
  const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, updates.length)})... `);

    const results = await Promise.all(batch.map(u =>
      supabase.from('workers')
        .update({ shift_experience: u.shift_experience, previous_experience: u.previous_experience })
        .eq('worker_id', u.worker_id)
    ));

    const batchErrors = results.filter(r => r.error).length;
    errorCount += batchErrors;
    successCount += batch.length - batchErrors;
    console.log(batchErrors > 0 ? `${batchErrors} errors` : '✓');

    if (i + BATCH_SIZE < updates.length) await delay(50);
  }

  console.log('\n=== Done ===');
  console.log(`Updated: ${successCount}  |  Errors: ${errorCount}  |  No data: ${noData}`);
}

run().catch(console.error);
