/**
 * Workers by DB market with store_favorite_count (column) >1, >2, >3.
 * Usage: npx tsx web/src/scripts/_dbMarketSfcCounts.ts
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

interface Row { market: string; store_favorite_count: number | null }

async function fetchAll(): Promise<Row[]> {
  const all: Row[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.from('workers').select('market, store_favorite_count').range(offset, offset + 999);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

interface Bucket { total: number; gt1: number; gt2: number; gt3: number }
function empty(): Bucket { return { total: 0, gt1: 0, gt2: 0, gt3: 0 }; }
function add(b: Bucket, sfc: number) {
  b.total++;
  if (sfc > 1) b.gt1++;
  if (sfc > 2) b.gt2++;
  if (sfc > 3) b.gt3++;
}

async function main() {
  const rows = await fetchAll();
  const buckets = new Map<string, Bucket>();
  const longIsland = empty();
  const nycMetro = empty();

  for (const row of rows) {
    const m = row.market || '(empty)';
    const sfc = row.store_favorite_count ?? 0;
    if (!buckets.has(m)) buckets.set(m, empty());
    add(buckets.get(m)!, sfc);
    if (m.includes('Long Island')) add(longIsland, sfc);
    if (m.includes('New York City') || m.includes('Northern New Jersey') || m.includes('Long Island')) add(nycMetro, sfc);
  }

  const sorted = [...buckets.entries()].filter(([, v]) => v.total >= 50).sort((a, b) => b[1].total - a[1].total);
  const hdr = (s: string) => s.padStart(7);
  console.log('Market'.padEnd(30), hdr('Total'), hdr('>1'), hdr('%>1'), hdr('>2'), hdr('%>2'), hdr('>3'), hdr('%>3'));
  console.log('-'.repeat(80));

  function printRow(label: string, b: Bucket) {
    const p = (n: number) => b.total ? ((n / b.total) * 100).toFixed(1) : '0.0';
    console.log(label.padEnd(30), String(b.total).padStart(7), String(b.gt1).padStart(7), `${p(b.gt1)}%`.padStart(7),
      String(b.gt2).padStart(7), `${p(b.gt2)}%`.padStart(7), String(b.gt3).padStart(7), `${p(b.gt3)}%`.padStart(7));
  }

  for (const [m, b] of sorted) printRow(m, b);
  console.log('-'.repeat(80));
  printRow('** Long Island (rollup)', longIsland);
  printRow('** NYC Metro (rollup)', nycMetro);
  console.log('-'.repeat(80));
  let grand = empty();
  for (const [, b] of buckets) { grand.total += b.total; grand.gt1 += b.gt1; grand.gt2 += b.gt2; grand.gt3 += b.gt3; }
  printRow('TOTAL', grand);
}

main().catch(console.error);
