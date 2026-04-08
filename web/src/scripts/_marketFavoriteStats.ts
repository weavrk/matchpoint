/**
 * Per-market stats: total workers and % favorited at >3 stores.
 * Usage: npx tsx web/src/scripts/_marketFavoriteStats.ts
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

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || (() => { console.error('Missing SUPABASE_SERVICE_KEY'); process.exit(1); return ''; })(),
);

interface Row {
  market: string;
  reflex_activity: { storeFavoriteCount?: number } | null;
}

async function fetchAll(): Promise<Row[]> {
  const all: Row[] = [];
  let offset = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('workers')
      .select('market, reflex_activity')
      .range(offset, offset + page - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < page) break;
    offset += page;
  }
  return all;
}

async function main() {
  const rows = await fetchAll();

  const byMarket = new Map<string, { total: number; favGt3: number; favGt2: number; favCounts: number[] }>();

  for (const row of rows) {
    const m = row.market || '(empty)';
    let entry = byMarket.get(m);
    if (!entry) { entry = { total: 0, favGt3: 0, favGt2: 0, favCounts: [] }; byMarket.set(m, entry); }
    entry.total++;
    const sfc = row.reflex_activity?.storeFavoriteCount ?? 0;
    entry.favCounts.push(sfc);
    if (sfc > 3) entry.favGt3++;
    if (sfc > 2) entry.favGt2++;
  }

  // Sort by total descending
  const sorted = [...byMarket.entries()].sort((a, b) => b[1].total - a[1].total);

  console.log('Market'.padEnd(32), 'Workers'.padStart(7), '>2 Str'.padStart(7), '%>2'.padStart(6), '>3 Str'.padStart(7), '%>3'.padStart(6));
  console.log('-'.repeat(66));

  let grandTotal = 0, grandFavGt2 = 0, grandFavGt3 = 0;

  for (const [market, { total, favGt2, favGt3 }] of sorted) {
    const pct2 = total ? ((favGt2 / total) * 100).toFixed(1) : '0.0';
    const pct3 = total ? ((favGt3 / total) * 100).toFixed(1) : '0.0';
    console.log(market.padEnd(32), String(total).padStart(7), String(favGt2).padStart(7), `${pct2}%`.padStart(6), String(favGt3).padStart(7), `${pct3}%`.padStart(6));
    grandTotal += total;
    grandFavGt2 += favGt2;
    grandFavGt3 += favGt3;
  }

  console.log('-'.repeat(66));
  console.log(
    'TOTAL'.padEnd(32),
    String(grandTotal).padStart(7),
    String(grandFavGt2).padStart(7),
    `${((grandFavGt2 / grandTotal) * 100).toFixed(1)}%`.padStart(6),
    String(grandFavGt3).padStart(7),
    `${((grandFavGt3 / grandTotal) * 100).toFixed(1)}%`.padStart(6),
  );
}

main().catch(console.error);
