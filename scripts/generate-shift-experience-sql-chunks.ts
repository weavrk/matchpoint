import { createReadStream, writeFileSync } from 'fs';
import { parse } from 'csv-parse';

const CSV_PATH = '/Users/katherine_1/Downloads/shift_brand_store_worker_market_role_2026-04-03T17_54_29.026392901-05_00.csv';
const OUTPUT_DIR = '/Users/katherine_1/Downloads';
const CHUNK_SIZE = 500; // 500 updates per file

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

  // Generate SQL chunks
  const totalChunks = Math.ceil(workerIds.length / CHUNK_SIZE);

  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    const start = chunkIdx * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, workerIds.length);
    const chunkWorkerIds = workerIds.slice(start, end);

    let sql = `-- Chunk ${chunkIdx + 1} of ${totalChunks} (workers ${start + 1} to ${end})\n\n`;

    for (const workerId of chunkWorkerIds) {
      const shiftExperience = JSON.stringify(workerRoles[workerId]);
      sql += `UPDATE workers SET shift_experience = '${shiftExperience}'::jsonb WHERE worker_id = ${workerId};\n`;
    }

    const filename = `${OUTPUT_DIR}/shift_exp_${String(chunkIdx + 1).padStart(2, '0')}.sql`;
    writeFileSync(filename, sql);
  }

  console.log(`\nGenerated ${totalChunks} SQL files in ${OUTPUT_DIR}/`);
  console.log(`Files: shift_exp_01.sql through shift_exp_${String(totalChunks).padStart(2, '0')}.sql`);
  console.log(`Run each file in Supabase SQL Editor in order.`);
}

main().catch(console.error);
