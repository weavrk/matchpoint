/**
 * assignWorkerPhotos.ts
 *
 * Assigns avatar photos to workers that have no photo set.
 * - Uses only *_cleaned.jpg files from the avatar directories
 * - Picks photo deterministically from gender-matched pool using worker_id
 * - Updates `photo` column in the workers table
 *
 * Usage: npx tsx web/src/scripts/assignWorkerPhotos.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const AVATAR_BASE = '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/web/public/images/avatars';
const BATCH_SIZE = 500;

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) { console.error('ERROR: SUPABASE_SERVICE_KEY not in .env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function getCleanedPhotos(gender: 'female' | 'male'): string[] {
  const dir = `${AVATAR_BASE}/${gender}`;
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('_cleaned.jpg'))
    .sort()
    .map(f => `/images/avatars/${gender}/${f}`);
}

function pickPhoto(pool: string[], workerId: number): string {
  return pool[workerId % pool.length];
}

async function run() {
  console.log('=== assignWorkerPhotos ===\n');

  const femalePool = getCleanedPhotos('female');
  const malePool = getCleanedPhotos('male');
  console.log(`Female photo pool: ${femalePool.length}`);
  console.log(`Male photo pool:   ${malePool.length}\n`);

  // Fetch all workers missing a photo
  const PAGE_SIZE = 1000;
  const workers: { worker_id: number; gender: string }[] = [];
  let from = 0;

  console.log('Fetching workers without photos...');
  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_id, gender')
      .is('photo', null)
      .not('worker_id', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data?.length) break;

    workers.push(...data);
    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }

  console.log(`Workers needing photos: ${workers.length}\n`);

  const updates = workers.map(w => {
    const pool = w.gender === 'male' ? malePool : femalePool;
    return {
      worker_id: w.worker_id,
      photo: pickPhoto(pool, w.worker_id),
    };
  });

  const totalBatches = Math.ceil(updates.length / BATCH_SIZE);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, updates.length)})... `);

    const results = await Promise.all(batch.map(u =>
      supabase.from('workers').update({ photo: u.photo }).eq('worker_id', u.worker_id)
    ));

    const batchErrors = results.filter(r => r.error).length;
    errorCount += batchErrors;
    successCount += batch.length - batchErrors;
    console.log(batchErrors > 0 ? `${batchErrors} errors` : '✓');

    if (i + BATCH_SIZE < updates.length) await delay(50);
  }

  console.log('\n=== Done ===');
  console.log(`Assigned: ${successCount}  |  Errors: ${errorCount}`);
}

run().catch(console.error);
