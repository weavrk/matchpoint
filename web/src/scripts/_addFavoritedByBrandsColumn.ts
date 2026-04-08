/**
 * One-time migration: adds favorited_by_brands JSONB column to workers table.
 * Run once: npx tsx web/src/scripts/_addFavoritedByBrandsColumn.ts
 */
import pg from 'pg';

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString:
      'postgresql://postgres:reflexmatchpoint123@db.kxfbismfpmjwvemfznvm.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected. Running migration...');

  await client.query(
    'ALTER TABLE workers ADD COLUMN IF NOT EXISTS favorited_by_brands JSONB;'
  );
  console.log('✓ favorited_by_brands column added (or already exists).');

  await client.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
