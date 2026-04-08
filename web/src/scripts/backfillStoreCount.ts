/**
 * backfillStoreCount.ts
 *
 * Sets unique_store_count = length of brands_worked array for every worker
 * where brands_worked is non-empty. This ensures store locations always
 * reflects at least the number of distinct brands worked.
 *
 * Usage: npx tsx web/src/scripts/backfillStoreCount.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseKey) {
  console.error('Missing Supabase key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Fetch all workers with brands_worked (paginated — Supabase caps at 1000)
  const workers: { id: string; brands_worked: any; unique_store_count: number | null }[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('id, brands_worked, unique_store_count')
      .not('brands_worked', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching workers:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    workers.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  if (workers.length === 0) {
    console.log('No workers found.');
    return;
  }

  console.log(`Found ${workers.length} workers with brands_worked`);

  let updated = 0;
  let skipped = 0;

  for (const w of workers) {
    const brands = Array.isArray(w.brands_worked) ? w.brands_worked : [];
    const derivedCount = brands.length;

    // Only update if current value is null, 0, or less than brands count
    const current = w.unique_store_count ?? 0;
    if (current >= derivedCount && current > 0) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('workers')
      .update({ unique_store_count: derivedCount })
      .eq('id', w.id);

    if (updateError) {
      console.error(`Error updating ${w.id}:`, updateError.message);
    } else {
      updated++;
    }
  }

  console.log(`Done. Updated: ${updated}, Skipped (already correct): ${skipped}`);
}

run();
