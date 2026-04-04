/**
 * clean-worker-data.ts
 *
 * Unified script to clean up worker table data:
 * 1. Fix previous_experience: remove Unknown companies, map duration codes
 * 2. Fix single-word names: find first names from retailer quotes or generate
 * 3. Populate shift_experience from CSV (if CSV path provided)
 *
 * Usage:
 *   npx tsx scripts/clean-worker-data.ts
 *   npx tsx scripts/clean-worker-data.ts --shifts=/path/to/shifts.csv
 */

import { createClient } from '@supabase/supabase-js';
import { createReadStream, existsSync } from 'fs';
import { parse } from 'csv-parse';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// ============================================================
// TYPES
// ============================================================

interface Experience {
  company: string;
  duration: string;
  roles: string[];
}

interface RetailerQuote {
  quote: string;
  role?: string;
  brand?: string;
}

interface WorkerRow {
  id: string;
  worker_id: number;
  name: string;
  previous_experience: Experience[] | null;
  retailer_quotes: RetailerQuote[] | null;
}

// ============================================================
// DURATION MAPPING
// ============================================================

const DURATION_MAP: Record<string, string> = {
  'SHORT': 'Less than 6 months',
  'MEDIUM': '6 months to 1 year',
  'LONG': '1 to 2 years',
  'EXTENDED': '2+ years',
};

const DURATION_VALUES = Object.values(DURATION_MAP);

function getRandomDuration(): string {
  return DURATION_VALUES[Math.floor(Math.random() * DURATION_VALUES.length)];
}

// ============================================================
// NAME GENERATION
// ============================================================

const MALE_NAMES = ['James', 'Michael', 'David', 'Marcus', 'Andre', 'Omar', 'Carlos', 'Anthony', 'Brandon', 'Tyler'];
const FEMALE_NAMES = ['Maya', 'Jasmine', 'Aaliyah', 'Destiny', 'Brianna', 'Amira', 'Chidera', 'Simone', 'Kayla', 'Amber'];

function extractFirstNameFromQuotes(quotes: RetailerQuote[]): string | null {
  for (const q of quotes) {
    // Look for capitalized names at start of sentences or after common patterns
    const patterns = [
      /^([A-Z][a-z]+)\s+(?:was|is|did|has|worked|greeted|helped)/,
      /(?:having|with)\s+([A-Z][a-z]+)(?:\s+(?:in|on|back|again)|\.|!|$)/,
      /([A-Z][a-z]+)\s+(?:is a|was a|is very|was very|is always|was always)/,
    ];

    for (const pattern of patterns) {
      const match = q.quote.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        // Verify it's not a common word
        const commonWords = ['She', 'He', 'The', 'They', 'This', 'That', 'Very', 'Great', 'Good', 'Really'];
        if (!commonWords.includes(match[1])) {
          return match[1];
        }
      }
    }
  }
  return null;
}

function detectGenderFromQuotes(quotes: RetailerQuote[]): 'male' | 'female' | 'unknown' {
  const text = quotes.map(q => q.quote.toLowerCase()).join(' ');
  const femaleIndicators = (text.match(/\b(she|her|herself)\b/g) || []).length;
  const maleIndicators = (text.match(/\b(he|him|himself)\b/g) || []).length;

  if (femaleIndicators > maleIndicators) return 'female';
  if (maleIndicators > femaleIndicators) return 'male';
  return 'unknown';
}

function generateFirstName(gender: 'male' | 'female' | 'unknown'): string {
  if (gender === 'male') {
    return MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)];
  } else if (gender === 'female') {
    return FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];
  }
  // Unknown - pick randomly from combined
  const allNames = [...MALE_NAMES, ...FEMALE_NAMES];
  return allNames[Math.floor(Math.random() * allNames.length)];
}

// ============================================================
// TASK 1: FIX PREVIOUS EXPERIENCE
// ============================================================

async function fixPreviousExperience(): Promise<{ updated: number; removed: number; durationsFixed: number }> {
  console.log('\n=== FIXING PREVIOUS EXPERIENCE ===');

  let offset = 0;
  const limit = 1000;
  let totalUpdated = 0;
  let totalRemoved = 0;
  let totalDurationsFixed = 0;

  while (true) {
    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, previous_experience')
      .not('previous_experience', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching workers:', error);
      break;
    }

    if (!workers || workers.length === 0) break;

    for (const worker of workers) {
      const experiences = worker.previous_experience as Experience[];
      if (!Array.isArray(experiences) || experiences.length === 0) continue;

      let needsUpdate = false;

      // Filter out Unknown companies
      let filtered = experiences.filter(exp => {
        if (exp.company?.toLowerCase() === 'unknown') {
          totalRemoved++;
          needsUpdate = true;
          return false;
        }
        return true;
      });

      // Fix durations
      filtered = filtered.map(exp => {
        let duration = exp.duration;
        const upperDuration = duration?.toUpperCase()?.trim();

        // Check for duration in parentheses like "(SHORT)"
        const parenMatch = duration?.match(/\((\w+)\)/i);
        if (parenMatch) {
          const code = parenMatch[1].toUpperCase();
          if (DURATION_MAP[code]) {
            duration = DURATION_MAP[code];
            needsUpdate = true;
            totalDurationsFixed++;
          }
        }
        // Map SHORT/MEDIUM/LONG/EXTENDED
        else if (upperDuration && DURATION_MAP[upperDuration]) {
          duration = DURATION_MAP[upperDuration];
          needsUpdate = true;
          totalDurationsFixed++;
        }
        // If missing or "Unknown"
        else if (!duration || duration.toLowerCase().includes('unknown')) {
          duration = getRandomDuration();
          needsUpdate = true;
          totalDurationsFixed++;
        }

        return { ...exp, duration };
      });

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('workers')
          .update({ previous_experience: filtered })
          .eq('id', worker.id);

        if (!updateError) totalUpdated++;
      }
    }

    offset += limit;
    if (workers.length < limit) break;
  }

  console.log(`  Updated ${totalUpdated} workers`);
  console.log(`  Removed ${totalRemoved} Unknown companies`);
  console.log(`  Fixed ${totalDurationsFixed} durations`);

  return { updated: totalUpdated, removed: totalRemoved, durationsFixed: totalDurationsFixed };
}

// ============================================================
// TASK 2: FIX WORKER NAMES
// ============================================================

async function fixWorkerNames(): Promise<{ updated: number }> {
  console.log('\n=== FIXING WORKER NAMES ===');

  let offset = 0;
  const limit = 1000;
  let totalUpdated = 0;

  while (true) {
    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, worker_id, name, retailer_quotes')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching workers:', error);
      break;
    }

    if (!workers || workers.length === 0) break;

    for (const worker of workers as WorkerRow[]) {
      const nameParts = worker.name.trim().split(/\s+/);

      // Skip if already has first and last name
      if (nameParts.length >= 2) continue;

      // Single word name - needs first name
      const lastName = nameParts[0];
      let firstName: string | null = null;

      // Try to find first name in retailer quotes
      if (worker.retailer_quotes && Array.isArray(worker.retailer_quotes)) {
        firstName = extractFirstNameFromQuotes(worker.retailer_quotes);
      }

      // If not found, generate based on gender
      if (!firstName) {
        const gender = worker.retailer_quotes ? detectGenderFromQuotes(worker.retailer_quotes) : 'unknown';
        firstName = generateFirstName(gender);
      }

      const newName = `${firstName} ${lastName}`;

      const { error: updateError } = await supabase
        .from('workers')
        .update({ name: newName })
        .eq('id', worker.id);

      if (!updateError) {
        totalUpdated++;
        console.log(`  ${worker.name} -> ${newName}`);
      }
    }

    offset += limit;
    if (workers.length < limit) break;
  }

  console.log(`  Fixed ${totalUpdated} worker names`);
  return { updated: totalUpdated };
}

// ============================================================
// TASK 3: POPULATE SHIFT EXPERIENCE (from CSV)
// ============================================================

async function populateShiftExperience(csvPath: string): Promise<{ updated: number }> {
  console.log('\n=== POPULATING SHIFT EXPERIENCE ===');
  console.log(`  Reading from: ${csvPath}`);

  if (!existsSync(csvPath)) {
    console.log('  CSV file not found, skipping.');
    return { updated: 0 };
  }

  // Parse CSV and aggregate role counts per worker
  const workerRoles: Record<string, Record<string, number>> = {};

  await new Promise<void>((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row: { worker_id: string; role_requested: string }) => {
        const workerId = row.worker_id;
        const role = row.role_requested;
        if (!workerId || !role) return;

        if (!workerRoles[workerId]) workerRoles[workerId] = {};
        workerRoles[workerId][role] = (workerRoles[workerId][role] || 0) + 1;
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const workerIds = Object.keys(workerRoles);
  console.log(`  Found ${workerIds.length} workers with shift data`);

  let totalUpdated = 0;
  const batchSize = 100;

  for (let i = 0; i < workerIds.length; i += batchSize) {
    const batch = workerIds.slice(i, i + batchSize);

    for (const workerId of batch) {
      const { error } = await supabase
        .from('workers')
        .update({ shift_experience: workerRoles[workerId] })
        .eq('worker_id', parseInt(workerId, 10));

      if (!error) totalUpdated++;
    }

    if ((i + batchSize) % 1000 === 0) {
      console.log(`  Progress: ${Math.min(i + batchSize, workerIds.length)}/${workerIds.length}`);
    }
  }

  console.log(`  Updated ${totalUpdated} workers with shift experience`);
  return { updated: totalUpdated };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     WORKER DATA CLEANUP SCRIPT         ║');
  console.log('╚════════════════════════════════════════╝');

  // Parse args for optional CSV path
  const args = process.argv.slice(2);
  const shiftsArg = args.find(a => a.startsWith('--shifts='));
  const csvPath = shiftsArg ? shiftsArg.replace('--shifts=', '') : null;

  // Task 1: Fix previous experience
  await fixPreviousExperience();

  // Task 2: Fix worker names
  await fixWorkerNames();

  // Task 3: Populate shift experience (if CSV provided)
  if (csvPath) {
    await populateShiftExperience(csvPath);
  } else {
    console.log('\n=== SHIFT EXPERIENCE ===');
    console.log('  Skipped (no --shifts=<path> provided)');
  }

  console.log('\n✓ All tasks complete!');
}

main().catch(console.error);
