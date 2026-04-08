/**
 * 1. Adds image_url column to worker_connections table
 * 2. Backfills existing connections with photos from the final pool (by gender)
 *
 * Usage: npx tsx web/src/scripts/_addConnectionImageUrl.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  for (const root of [process.cwd(), path.join(process.cwd(), '..')]) {
    dotenv.config({ path: path.join(root, '.env') });
    if (process.env.SUPABASE_SERVICE_KEY) return;
  }
}
loadEnv();

const sb = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI',
);

// Load the same final photos the app uses
const finalPhotos: { male: string[]; female: string[] } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/finalPhotos.json'), 'utf-8'),
);

async function main() {
  // Step 1: Add column (idempotent — Supabase ignores if exists via RPC, or we just catch the error)
  console.log('Adding image_url column...');
  const { error: alterErr } = await sb.rpc('exec_sql', {
    sql: `ALTER TABLE worker_connections ADD COLUMN IF NOT EXISTS image_url TEXT;`,
  });
  if (alterErr) {
    // RPC might not exist, try raw — if column already exists that's fine
    console.log('RPC not available, column may already exist. Continuing...');
  } else {
    console.log('Column added (or already existed).');
  }

  // Step 2: Fetch all connections that need a photo
  console.log('Fetching connections without image_url...');
  const { data: connections, error: fetchErr } = await sb
    .from('worker_connections')
    .select('id, worker_id')
    .is('image_url', null);

  if (fetchErr) { console.error(fetchErr); process.exit(1); }
  if (!connections || connections.length === 0) {
    console.log('No connections need backfill.');
    return;
  }
  console.log(`${connections.length} connections to backfill.`);

  // Step 3: Get worker gender for each
  const workerIds = [...new Set(connections.map(c => c.worker_id))];
  const { data: workers, error: wErr } = await sb
    .from('workers')
    .select('id, gender')
    .in('id', workerIds);

  if (wErr) { console.error(wErr); process.exit(1); }

  const genderMap = new Map<string, 'male' | 'female'>();
  for (const w of (workers || [])) {
    genderMap.set(w.id, w.gender || 'female');
  }

  // Step 4: Assign photos deterministically (hash worker_id to index)
  function hashToIndex(workerId: string, poolSize: number): number {
    let hash = 0;
    for (let i = 0; i < workerId.length; i++) {
      hash = ((hash << 5) - hash + workerId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % poolSize;
  }

  const updates: { id: string; image_url: string }[] = [];
  for (const conn of connections) {
    const gender = genderMap.get(conn.worker_id) || 'female';
    const pool = finalPhotos[gender];
    if (!pool || pool.length === 0) continue;
    const idx = hashToIndex(conn.worker_id, pool.length);
    const imageUrl = `/images/avatars/${gender}/${pool[idx]}`;
    updates.push({ id: conn.id, image_url: imageUrl });
  }

  // Step 5: Batch update
  console.log(`Updating ${updates.length} connections...`);
  let success = 0;
  let errors = 0;
  const BATCH = 100;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(u => sb.from('worker_connections').update({ image_url: u.image_url }).eq('id', u.id)),
    );
    const batchErrors = results.filter(r => r.error).length;
    errors += batchErrors;
    success += batch.length - batchErrors;
    process.stdout.write(`  ${Math.min(i + BATCH, updates.length)}/${updates.length}\r`);
  }

  console.log(`\nDone. Updated: ${success}, Errors: ${errors}`);
}

main().catch(console.error);
