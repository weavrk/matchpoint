/**
 * Per DB market: total workers and % with storeFavoriteCount > 2.
 * This is what the app will actually render.
 * Usage: npx tsx web/src/scripts/_dbMarketSfcStats.ts
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
  const byMarket = new Map<string, { total: number; gt2: number }>();

  for (const row of rows) {
    const m = row.market || '(empty)';
    let e = byMarket.get(m);
    if (!e) { e = { total: 0, gt2: 0 }; byMarket.set(m, e); }
    e.total++;
    if ((row.reflex_activity?.storeFavoriteCount ?? 0) > 2) e.gt2++;
  }

  // Sort by total desc, only show markets with >= 10 workers to keep it readable
  const sorted = [...byMarket.entries()]
    .filter(([, v]) => v.total >= 10)
    .sort((a, b) => b[1].total - a[1].total);

  console.log('Market'.padEnd(30), 'Workers'.padStart(7), '>2 Str'.padStart(7), '  %');
  console.log('-'.repeat(52));

  let gTotal = 0, gGt2 = 0;
  for (const [market, { total, gt2 }] of sorted) {
    const pct = ((gt2 / total) * 100).toFixed(1);
    console.log(market.padEnd(30), String(total).padStart(7), String(gt2).padStart(7), `${pct}%`.padStart(6));
    gTotal += total;
    gGt2 += gt2;
  }

  // Also tally the small markets
  const small = [...byMarket.entries()].filter(([, v]) => v.total < 10);
  let sTotal = 0, sGt2 = 0;
  for (const [, { total, gt2 }] of small) { sTotal += total; sGt2 += gt2; }

  console.log('-'.repeat(52));
  console.log(`(${small.length} markets with <10 workers)`.padEnd(30), String(sTotal).padStart(7), String(sGt2).padStart(7), `${((sGt2 / sTotal) * 100).toFixed(1)}%`.padStart(6));
  console.log('-'.repeat(52));
  console.log('TOTAL'.padEnd(30), String(gTotal + sTotal).padStart(7), String(gGt2 + sGt2).padStart(7), `${(((gGt2 + sGt2) / (gTotal + sTotal)) * 100).toFixed(1)}%`.padStart(6));
}

main().catch(console.error);
