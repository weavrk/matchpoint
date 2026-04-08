/**
 * Verify market_favorite matches store_favorite_count > 1.
 * Usage: npx tsx web/src/scripts/_verifyMarketFavorite.ts
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
  process.env.SUPABASE_SERVICE_KEY!,
);

async function main() {
  const all: { market_favorite: boolean; store_favorite_count: number | null }[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.from('workers').select('market_favorite, store_favorite_count').range(offset, offset + 999);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  let favTrue = 0, favFalse = 0, sfcGt1 = 0, sfcLe1 = 0, match = 0, mismatch = 0;
  for (const r of all) {
    const shouldBeFav = (r.store_favorite_count ?? 0) > 1;
    if (r.market_favorite) favTrue++;
    else favFalse++;
    if (shouldBeFav) sfcGt1++;
    else sfcLe1++;
    if (r.market_favorite === shouldBeFav) match++;
    else mismatch++;
  }

  console.log('Total workers:', all.length);
  console.log('market_favorite = true:', favTrue);
  console.log('market_favorite = false:', favFalse);
  console.log('store_favorite_count > 1:', sfcGt1);
  console.log('store_favorite_count <= 1:', sfcLe1);
  console.log('Match:', match, '| Mismatch:', mismatch);
}

main().catch(console.error);
