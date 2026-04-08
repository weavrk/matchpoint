/**
 * Workers by DB market with storeFavoriteCount >1, >2, >3.
 *
 * - "Long Island" = sum of any market containing "Long Island"
 * - "New York City (metro)" = NYC + Northern NJ + Long Island workers
 *   (those workers also appear in their own market rows)
 *
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

  // Canonical single-market buckets
  const buckets = new Map<string, Bucket>();
  // Also accumulate NYC metro and Long Island rollups
  const longIsland = empty();
  const nycMetro = empty();

  for (const row of rows) {
    const m = row.market || '(empty)';
    const sfc = row.reflex_activity?.storeFavoriteCount ?? 0;

    // Put into exact DB market bucket
    if (!buckets.has(m)) buckets.set(m, empty());
    add(buckets.get(m)!, sfc);

    // Long Island rollup: any market string containing "Long Island"
    if (m.includes('Long Island')) {
      add(longIsland, sfc);
    }

    // NYC metro rollup: market contains NYC, Northern NJ, or Long Island
    if (m.includes('New York City') || m.includes('Northern New Jersey') || m.includes('Long Island')) {
      add(nycMetro, sfc);
    }
  }

  // Sort by total desc, show markets with >= 10 workers
  const sorted = [...buckets.entries()]
    .filter(([, v]) => v.total >= 10)
    .sort((a, b) => b[1].total - a[1].total);

  const hdr = (s: string) => s.padStart(7);
  console.log('Market'.padEnd(32), hdr('Total'), hdr('>1'), hdr('%>1'), hdr('>2'), hdr('%>2'), hdr('>3'), hdr('%>3'));
  console.log('-'.repeat(80));

  function printRow(label: string, b: Bucket) {
    const p1 = b.total ? ((b.gt1 / b.total) * 100).toFixed(1) : '0.0';
    const p2 = b.total ? ((b.gt2 / b.total) * 100).toFixed(1) : '0.0';
    const p3 = b.total ? ((b.gt3 / b.total) * 100).toFixed(1) : '0.0';
    console.log(
      label.padEnd(32),
      String(b.total).padStart(7),
      String(b.gt1).padStart(7), `${p1}%`.padStart(7),
      String(b.gt2).padStart(7), `${p2}%`.padStart(7),
      String(b.gt3).padStart(7), `${p3}%`.padStart(7),
    );
  }

  for (const [market, b] of sorted) {
    printRow(market, b);
  }

  console.log('-'.repeat(80));
  printRow('** Long Island (rollup)', longIsland);
  printRow('** NYC Metro (rollup)', nycMetro);

  // Grand total
  let grand = empty();
  for (const [, b] of buckets) {
    grand.total += b.total;
    grand.gt1 += b.gt1;
    grand.gt2 += b.gt2;
    grand.gt3 += b.gt3;
  }
  console.log('-'.repeat(80));
  printRow('TOTAL', grand);
}

main().catch(console.error);
