import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const SUPABASE_URL = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CSV_PATH = '/Users/katherine_1/Downloads/shift_brand_store_worker_market_role_2026-04-03T17_54_29.026392901-05_00.csv';

interface RoleCounts {
  [role: string]: number;
}

interface WorkerRoles {
  [workerId: string]: RoleCounts;
}

async function main() {
  console.log('Reading CSV and aggregating role counts per worker...');

  const workerRoles: WorkerRoles = {};
  let rowCount = 0;

  // Parse CSV and aggregate
  await new Promise<void>((resolve, reject) => {
    createReadStream(CSV_PATH)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
      }))
      .on('data', (row: { worker_id: string; role_requested: string }) => {
        rowCount++;
        const workerId = row.worker_id;
        const role = row.role_requested;

        if (!workerRoles[workerId]) {
          workerRoles[workerId] = {};
        }
        workerRoles[workerId][role] = (workerRoles[workerId][role] || 0) + 1;

        if (rowCount % 50000 === 0) {
          console.log(`Processed ${rowCount} rows...`);
        }
      })
      .on('end', () => {
        console.log(`Finished parsing ${rowCount} rows`);
        resolve();
      })
      .on('error', reject);
  });

  const workerIds = Object.keys(workerRoles);
  console.log(`Found ${workerIds.length} unique workers with shift experience`);

  // Update Supabase in batches
  const BATCH_SIZE = 100;
  let updated = 0;
  let notFound = 0;

  for (let i = 0; i < workerIds.length; i += BATCH_SIZE) {
    const batch = workerIds.slice(i, i + BATCH_SIZE);

    // Process each worker in the batch
    for (const workerId of batch) {
      const shiftExperience = workerRoles[workerId];

      const { error } = await supabase
        .from('workers')
        .update({ shift_experience: shiftExperience })
        .eq('worker_id', parseInt(workerId, 10));

      if (error) {
        // Worker might not exist in our workers table
        notFound++;
      } else {
        updated++;
      }
    }

    console.log(`Updated ${updated} workers, ${notFound} not found in workers table (batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(workerIds.length / BATCH_SIZE)})`);
  }

  console.log('\nDone!');
  console.log(`Total workers updated: ${updated}`);
  console.log(`Workers not in table: ${notFound}`);
}

main().catch(console.error);
