/**
 * Worker Migration Script
 *
 * Migrates worker data from SAMPLE_WORKERS (workers.ts) to Supabase workers table.
 *
 * Usage:
 *   1. First run the SQL schema in Supabase (Downloads/matchpoint_workers_schema.sql)
 *   2. Then run: npx ts-node src/scripts/migrateWorkers.ts
 */

import { createClient } from '@supabase/supabase-js';
import { SAMPLE_WORKERS } from '../data/workers';

const SUPABASE_URL = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrateWorkers() {
  console.log(`Starting migration of ${SAMPLE_WORKERS.length} workers...`);

  let successCount = 0;
  let errorCount = 0;

  for (const worker of SAMPLE_WORKERS) {
    // Transform WorkerProfile to database row format
    const dbRow = {
      id: worker.id,
      name: worker.name,
      photo: worker.photo || null,
      market: worker.market,
      shift_verified: worker.shiftVerified,
      shifts_on_reflex: worker.shiftsOnReflex,
      invited_back_stores: worker.invitedBackStores,
      on_time_rating: worker.onTimeRating,
      commitment_score: worker.commitmentScore,
      preference: worker.preference,
      actively_looking: worker.activelyLooking,
      target_brands: worker.targetBrands,
      about: worker.about,
      brands_worked: worker.brandsWorked,
      endorsements: worker.endorsements,
      previous_experience: worker.previousExperience,
      work_style: worker.workStyle,
      reliability: worker.reliability,
      availability: worker.availability,
      reflex_activity: worker.reflexActivity,
      retailer_quotes: worker.retailerQuotes || null,
    };

    const { error } = await supabase
      .from('workers')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting worker ${worker.id} (${worker.name}):`, error.message);
      errorCount++;
    } else {
      console.log(`✓ Migrated: ${worker.id} - ${worker.name}`);
      successCount++;
    }
  }

  console.log('\n--- Migration Complete ---');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${SAMPLE_WORKERS.length}`);
}

migrateWorkers().catch(console.error);
