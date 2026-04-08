/**
 * Counts workers per market who qualify for the Store Favorite chip:
 * favorited_by_brands intersects the elite retailer list (see storeFavoriteElite.ts).
 *
 * Usage (repo root): npx tsx web/src/scripts/countEliteStoreFavoritesByMarket.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { hasEliteStoreFavorite } from '../utils/storeFavoriteElite';

function loadEnv() {
  const roots = [process.cwd(), path.join(process.cwd(), '..')];
  for (const root of roots) {
    const p = path.join(root, '.env');
    const r = dotenv.config({ path: p });
    if (!r.error && process.env.SUPABASE_SERVICE_KEY) return;
  }
}

loadEnv();

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const key = process.env.SUPABASE_SERVICE_KEY || '';
if (!key) {
  console.error('Missing SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, key);

async function fetchAllEliteRows(): Promise<{ market: string; favorited_by_brands: string[] | null }[]> {
  const pageSize = 1000;
  let offset = 0;
  const all: { market: string; favorited_by_brands: string[] | null }[] = [];
  for (;;) {
    const { data, error } = await supabase
      .from('workers')
      .select('market, favorited_by_brands')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(error);
      process.exit(1);
    }
    if (!data?.length) break;
    all.push(...(data as { market: string; favorited_by_brands: string[] | null }[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function main() {
  const rows = await fetchAllEliteRows();
  const byMarket = new Map<string, { elite: number; total: number }>();

  for (const row of rows) {
    const m = row.market || '(empty)';
    const cur = byMarketsGet(byMarket, m);
    cur.total += 1;
    if (hasEliteStoreFavorite(row.favorited_by_brands)) cur.elite += 1;
  }

  const sorted = [...byMarket.entries()].sort((a, b) => b[1].elite - a[1].elite);
  const totalElite = sorted.reduce((s, [, v]) => s + v.elite, 0);
  const totalWorkers = sorted.reduce((s, [, v]) => s + v.total, 0);

  console.log('Store Favorite (elite brand in favorited_by_brands) by market\n');
  console.log('Market'.padEnd(28), 'Elite', 'Total', 'Pct');
  for (const [market, { elite, total }] of sorted) {
    const pct = total ? ((elite / total) * 100).toFixed(1) : '0.0';
    console.log(market.padEnd(28), String(elite).padStart(5), String(total).padStart(5), `${pct}%`);
  }
  console.log('\nTotal qualifying workers:', totalElite, '/', totalWorkers);
}

function byMarketsGet(map: Map<string, { elite: number; total: number }>, m: string) {
  let cur = map.get(m);
  if (!cur) {
    cur = { elite: 0, total: 0 };
    map.set(m, cur);
  }
  return cur;
}

main().catch(console.error);
