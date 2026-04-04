/**
 * Add unique store count to workers
 * Parses CSV to count distinct stores per worker
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_PATH = '/Users/katherine_1/Downloads/shift_brand_store_worker_market_role_2026-04-03T17_54_29.026392901-05_00.csv';

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function addUniqueStoreCount() {
  console.log('Reading CSV file...');

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Parse header
  const header = parseCSVLine(lines[0]);
  const workerIdIdx = header.indexOf('worker_id');
  const storeIdx = header.indexOf('store');

  console.log(`Header indices: worker_id=${workerIdIdx}, store=${storeIdx}`);

  // Build map of worker_id -> Set of unique stores
  const workerStores = new Map<string, Set<string>>();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const workerId = fields[workerIdIdx];
    const store = fields[storeIdx];

    if (!workerId || !store) continue;

    if (!workerStores.has(workerId)) {
      workerStores.set(workerId, new Set());
    }
    workerStores.get(workerId)!.add(store);
  }

  console.log(`Found ${workerStores.size} unique workers in CSV`);

  // Update each worker in Supabase
  let updatedCount = 0;
  let errorCount = 0;

  for (const [workerId, stores] of workerStores) {
    const uniqueCount = stores.size;

    // Match by worker_id column (integer)
    const { data, error } = await supabase
      .from('workers')
      .update({ unique_store_count: uniqueCount })
      .eq('worker_id', parseInt(workerId))
      .select('id');

    if (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.log(`Error updating worker ${workerId}: ${error.message}`);
      }
    } else if (data && data.length > 0) {
      updatedCount++;
    }
    // If no rows matched, silently skip (worker not in our DB)

    if (updatedCount % 100 === 0 && updatedCount > 0) {
      console.log(`Updated ${updatedCount} workers...`);
    }
  }

  console.log(`\nDone! Updated ${updatedCount} workers, ${errorCount} errors`);
}

addUniqueStoreCount();
