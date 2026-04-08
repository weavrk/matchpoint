/**
 * Compare store_favorite_count column vs reflex_activity.storeFavoriteCount JSONB.
 * Usage: npx tsx web/src/scripts/_compareSfcFields.ts
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
  // Paginate all workers
  const all: { market: string; store_favorite_count: number | null; reflex_activity: { storeFavoriteCount?: number } | null }[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.from('workers').select('market, store_favorite_count, reflex_activity').range(offset, offset + 999);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  let colGt0 = 0, jsonbGt0 = 0, both = 0, colOnly = 0, jsonbOnly = 0, match = 0, mismatch = 0;
  for (const r of all) {
    const col = r.store_favorite_count ?? 0;
    const jb = r.reflex_activity?.storeFavoriteCount ?? 0;
    if (col > 0) colGt0++;
    if (jb > 0) jsonbGt0++;
    if (col > 0 && jb > 0) { both++; if (col === jb) match++; else mismatch++; }
    if (col > 0 && jb === 0) colOnly++;
    if (col === 0 && jb > 0) jsonbOnly++;
  }

  console.log('Total workers:', all.length);
  console.log('');
  console.log('store_favorite_count (column) > 0:', colGt0);
  console.log('reflex_activity.storeFavoriteCount (JSONB) > 0:', jsonbGt0);
  console.log('');
  console.log('Both > 0:', both, `(match: ${match}, mismatch: ${mismatch})`);
  console.log('Column only (JSONB = 0):', colOnly);
  console.log('JSONB only (column = 0):', jsonbOnly);

  // Show some examples of each case
  console.log('\n--- Sample: column > 0 but JSONB = 0 (first 5) ---');
  let shown = 0;
  for (const r of all) {
    if (shown >= 5) break;
    const col = r.store_favorite_count ?? 0;
    const jb = r.reflex_activity?.storeFavoriteCount ?? 0;
    if (col > 0 && jb === 0) {
      console.log(`  market="${r.market}" col=${col} jsonb=${jb}`);
      shown++;
    }
  }

  console.log('\n--- Sample: JSONB > 0 (first 5) ---');
  shown = 0;
  for (const r of all) {
    if (shown >= 5) break;
    const jb = r.reflex_activity?.storeFavoriteCount ?? 0;
    const col = r.store_favorite_count ?? 0;
    if (jb > 0) {
      console.log(`  market="${r.market}" col=${col} jsonb=${jb}`);
      shown++;
    }
  }

  // By-market breakdown: how many have col > 0 vs jsonb > 0 for top markets
  console.log('\n--- Top markets: col vs jsonb coverage ---');
  const byMkt = new Map<string, { total: number; colGt0: number; jbGt0: number }>();
  for (const r of all) {
    const m = r.market;
    let e = byMkt.get(m);
    if (!e) { e = { total: 0, colGt0: 0, jbGt0: 0 }; byMkt.set(m, e); }
    e.total++;
    if ((r.store_favorite_count ?? 0) > 0) e.colGt0++;
    if ((r.reflex_activity?.storeFavoriteCount ?? 0) > 0) e.jbGt0++;
  }
  const sorted = [...byMkt.entries()].filter(([,v]) => v.total >= 50).sort((a,b) => b[1].total - a[1].total);
  console.log('Market'.padEnd(30), 'Total'.padStart(6), 'Col>0'.padStart(6), 'JSONB>0'.padStart(8));
  for (const [m, v] of sorted) {
    console.log(m.padEnd(30), String(v.total).padStart(6), String(v.colGt0).padStart(6), String(v.jbGt0).padStart(8));
  }
}

main().catch(console.error);
