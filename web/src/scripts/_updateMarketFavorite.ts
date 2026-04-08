/**
 * Sets market_favorite = true where store_favorite_count > 1, false otherwise.
 * Usage: npx tsx web/src/scripts/_updateMarketFavorite.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

function loadEnv() {
  for (const root of [process.cwd(), path.join(process.cwd(), '..')]) {
    dotenv.config({ path: path.join(root, '.env') });
    if (process.env.SUPABASE_SERVICE_KEY) return;
  }
}
loadEnv();

const sb = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || (() => { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1); return ''; })(),
);

async function main() {
  // Set market_favorite = true where store_favorite_count > 1
  const { count: setTrue, error: e1 } = await sb
    .from('workers')
    .update({ market_favorite: true })
    .gt('store_favorite_count', 1)
    .select('id', { count: 'exact', head: true });

  if (e1) { console.error('Error setting true:', e1); process.exit(1); }
  console.log(`Set market_favorite = true: ${setTrue} workers`);

  // Set market_favorite = false where store_favorite_count <= 1 or null
  const { count: setFalse, error: e2 } = await sb
    .from('workers')
    .update({ market_favorite: false })
    .or('store_favorite_count.is.null,store_favorite_count.lte.1')
    .select('id', { count: 'exact', head: true });

  if (e2) { console.error('Error setting false:', e2); process.exit(1); }
  console.log(`Set market_favorite = false: ${setFalse} workers`);
}

main().catch(console.error);
