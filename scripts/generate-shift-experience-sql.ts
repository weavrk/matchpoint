import { createReadStream, writeFileSync } from 'fs';
import { parse } from 'csv-parse';

const CSV_PATH = '/Users/katherine_1/Downloads/shift_brand_store_worker_market_role_2026-04-03T17_54_29.026392901-05_00.csv';
const OUTPUT_PATH = '/Users/katherine_1/Downloads/update_shift_experience.sql';

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

  // Generate SQL
  let sql = '-- Update shift_experience for workers based on shift role data\n';
  sql += '-- Generated from shift CSV\n\n';

  for (const workerId of workerIds) {
    const shiftExperience = JSON.stringify(workerRoles[workerId]);
    sql += `UPDATE workers SET shift_experience = '${shiftExperience}'::jsonb WHERE worker_id = ${workerId};\n`;
  }

  writeFileSync(OUTPUT_PATH, sql);
  console.log(`\nSQL written to: ${OUTPUT_PATH}`);
  console.log(`Total UPDATE statements: ${workerIds.length}`);
}

main().catch(console.error);
