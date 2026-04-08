/**
 * Per-market favorite stats using CSV market names (clean single-city buckets).
 *
 * Joins CSV worker_id → market_name with DB worker_id → storeFavoriteCount.
 * A worker who appears in multiple CSV markets is counted in each.
 *
 * Usage: npx tsx web/src/scripts/_marketFavoriteStatsByCsv.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { hasEliteStoreFavorite } from '../utils/storeFavoriteElite';

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

const CSV_PATH = '/Users/katherine_1/Downloads/shift_brand_store_worker_market_role_2026-04-03T17_54_29.026392901-05_00.csv';

interface DbRow {
  worker_id: number | null;
  reflex_activity: { storeFavoriteCount?: number } | null;
  favorited_by_brands: string[] | null;
}

async function fetchAllDb(): Promise<DbRow[]> {
  const all: DbRow[] = [];
  let offset = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_id, reflex_activity, favorited_by_brands')
      .range(offset, offset + page - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    all.push(...(data as DbRow[]));
    if (data.length < page) break;
    offset += page;
  }
  return all;
}

async function main() {
  // 1. Parse CSV: worker_id → set of markets
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows: { worker_id: string; market_name: string }[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  });

  const workerMarkets = new Map<number, Set<string>>();
  for (const row of rows) {
    const wid = parseInt(row.worker_id, 10);
    if (isNaN(wid)) continue;
    let s = workerMarkets.get(wid);
    if (!s) { s = new Set(); workerMarkets.set(wid, s); }
    s.add(row.market_name);
  }

  // 2. Fetch DB workers
  const dbRows = await fetchAllDb();
  const dbByWorkerId = new Map<number, DbRow>();
  for (const r of dbRows) {
    if (r.worker_id != null) dbByWorkerId.set(r.worker_id, r);
  }

  // 3. For each CSV market, aggregate stats
  // Collect unique workers per market
  const marketWorkers = new Map<string, Set<number>>();
  for (const [wid, markets] of workerMarkets) {
    for (const m of markets) {
      let s = marketWorkers.get(m);
      if (!s) { s = new Set(); marketWorkers.set(m, s); }
      s.add(wid);
    }
  }

  interface MarketStats {
    total: number;
    inDb: number;
    favGt2: number;
    favGt3: number;
    eliteBrand: number;
  }

  const stats = new Map<string, MarketStats>();
  for (const [market, wids] of marketWorkers) {
    const st: MarketStats = { total: wids.size, inDb: 0, favGt2: 0, favGt3: 0, eliteBrand: 0 };
    for (const wid of wids) {
      const db = dbByWorkerId.get(wid);
      if (!db) continue;
      st.inDb++;
      const sfc = db.reflex_activity?.storeFavoriteCount ?? 0;
      if (sfc > 2) st.favGt2++;
      if (sfc > 3) st.favGt3++;
      if (hasEliteStoreFavorite(db.favorited_by_brands)) st.eliteBrand++;
    }
    stats.set(market, st);
  }

  const sorted = [...stats.entries()].sort((a, b) => b[1].total - a[1].total);

  console.log(
    'Market'.padEnd(22),
    'CSV Wkrs'.padStart(9),
    'In DB'.padStart(6),
    '>2 Str'.padStart(7),
    '%>2'.padStart(6),
    '>3 Str'.padStart(7),
    '%>3'.padStart(6),
    'Elite'.padStart(6),
    '%Elite'.padStart(7),
  );
  console.log('-'.repeat(82));

  let gTotal = 0, gDb = 0, gGt2 = 0, gGt3 = 0, gElite = 0;

  for (const [market, st] of sorted) {
    const pGt2 = st.inDb ? ((st.favGt2 / st.inDb) * 100).toFixed(1) : '-';
    const pGt3 = st.inDb ? ((st.favGt3 / st.inDb) * 100).toFixed(1) : '-';
    const pElite = st.inDb ? ((st.eliteBrand / st.inDb) * 100).toFixed(1) : '-';
    console.log(
      market.padEnd(22),
      String(st.total).padStart(9),
      String(st.inDb).padStart(6),
      String(st.favGt2).padStart(7),
      `${pGt2}%`.padStart(6),
      String(st.favGt3).padStart(7),
      `${pGt3}%`.padStart(6),
      String(st.eliteBrand).padStart(6),
      `${pElite}%`.padStart(7),
    );
    gTotal += st.total;
    gDb += st.inDb;
    gGt2 += st.favGt2;
    gGt3 += st.favGt3;
    gElite += st.eliteBrand;
  }

  console.log('-'.repeat(82));
  console.log(
    'TOTAL'.padEnd(22),
    String(gTotal).padStart(9),
    String(gDb).padStart(6),
    String(gGt2).padStart(7),
    `${((gGt2 / gDb) * 100).toFixed(1)}%`.padStart(6),
    String(gGt3).padStart(7),
    `${((gGt3 / gDb) * 100).toFixed(1)}%`.padStart(6),
    String(gElite).padStart(6),
    `${((gElite / gDb) * 100).toFixed(1)}%`.padStart(7),
  );

  console.log(`\nNote: "CSV Wkrs" = unique workers in CSV for that market.`);
  console.log(`"In DB" = how many of those have a matching worker_id in the workers table.`);
  console.log(`Percentages are computed against "In DB" count.`);
}

main().catch(console.error);
