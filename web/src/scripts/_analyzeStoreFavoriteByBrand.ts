/**
 * Per-brand Store Favorite coverage: if allowlist were only brand X, what % qualify?
 * Also compares original 8 vs +RL Factory/VV/Faherty vs full list.
 *
 * npx tsx web/src/scripts/_analyzeStoreFavoriteByBrand.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { canonicalizeFavoritedBrandName, hasEliteStoreFavorite } from '../utils/storeFavoriteElite';

function loadEnv() {
  for (const root of [process.cwd(), path.join(process.cwd(), '..')]) {
    dotenv.config({ path: path.join(root, '.env') });
    if (process.env.SUPABASE_SERVICE_KEY) return;
  }
}
loadEnv();

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  process.env.SUPABASE_SERVICE_KEY!
);

const ORIGINAL_8 = new Set([
  'ariat',
  'ralph lauren',
  'golden goose',
  'marc jacobs',
  'tecovas',
  'skims',
  'ugg',
  'rag and bone',
]);

const ADDED_3 = new Set(['ralph lauren factory store', 'vineyard vines', 'faherty']);

const ALL_ELITE = new Set([...ORIGINAL_8, ...ADDED_3]);

const BRAND_LABELS: Record<string, string> = {
  ariat: 'Ariat',
  'ralph lauren': 'Ralph Lauren',
  'ralph lauren factory store': 'Ralph Lauren Factory Store',
  'golden goose': 'Golden Goose',
  'marc jacobs': 'Marc Jacobs',
  tecovas: 'Tecovas',
  skims: 'SKIMS',
  ugg: 'UGG',
  'rag and bone': 'Rag & Bone',
  'vineyard vines': 'Vineyard Vines',
  faherty: 'Faherty',
};

type Row = { market: string; favorited_by_brands: string[] | null };

function primaryMarket(m: string) {
  return (m || '').split(',')[0].trim() || '(empty)';
}

function workerMatchesSet(brands: string[] | null | undefined, allow: Set<string>): boolean {
  if (!brands?.length) return false;
  return brands.some((b) => allow.has(canonicalizeFavoritedBrandName(b)));
}

async function fetchAll(): Promise<Row[]> {
  const all: Row[] = [];
  let offset = 0;
  const size = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('workers')
      .select('market, favorited_by_brands')
      .range(offset, offset + size - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < size) break;
    offset += size;
  }
  return all;
}

function pct(n: number, d: number) {
  return d ? (100 * n) / d : 0;
}

async function main() {
  const rows = await fetchAll();
  const n = rows.length;

  console.log(`Workers: ${n}\n`);

  console.log('=== If allowlist were ONLY this one brand (global % of all workers) ===\n');
  const singles: { key: string; pct: number; count: number }[] = [];
  for (const key of ALL_ELITE) {
    const set = new Set([key]);
    const count = rows.filter((r) => workerMatchesSet(r.favorited_by_brands, set)).length;
    singles.push({ key, pct: pct(count, n), count });
  }
  singles.sort((a, b) => b.pct - a.pct);
  for (const { key, pct: p, count } of singles) {
    const inBand = p >= 35 && p <= 50 ? '  ← 35–50% band' : '';
    console.log(`${(BRAND_LABELS[key] || key).padEnd(28)} ${p.toFixed(1)}%`.padEnd(36) + `(${count})${inBand}`);
  }

  const origCount = rows.filter((r) => workerMatchesSet(r.favorited_by_brands, ORIGINAL_8)).length;
  const addedOnlyCount = rows.filter((r) => {
    if (!workerMatchesSet(r.favorited_by_brands, ADDED_3)) return false;
    return !workerMatchesSet(r.favorited_by_brands, ORIGINAL_8);
  }).length;
  const fullCount = rows.filter((r) => hasEliteStoreFavorite(r.favorited_by_brands)).length;

  console.log('\n=== Pooled allowlists (global) ===\n');
  console.log(`Original 8 only              ${pct(origCount, n).toFixed(1)}% (${origCount})`);
  console.log(`Added 3 only (not in orig 8) ${pct(addedOnlyCount, n).toFixed(1)}% (${addedOnlyCount})  ← incremental from VV/RL Factory/Faherty`);
  console.log(`Full current list (11)       ${pct(fullCount, n).toFixed(1)}% (${fullCount})`);

  // Median market % for markets with ≥50 workers — original 8 vs full
  const marketTotals = new Map<string, number>();
  for (const r of rows) {
    const m = primaryMarket(r.market);
    marketTotals.set(m, (marketTotals.get(m) ?? 0) + 1);
  }
  const bigMarkets = [...marketTotals.entries()].filter(([, t]) => t >= 50).map(([m]) => m);

  function marketRates(allow: Set<string>): number[] {
    return bigMarkets.map((m) => {
      const inM = rows.filter((r) => primaryMarket(r.market) === m);
      const hit = inM.filter((r) => workerMatchesSet(r.favorited_by_brands, allow)).length;
      return pct(hit, inM.length);
    });
  }
  function median(arr: number[]) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  const ratesOrig = marketRates(ORIGINAL_8);
  const ratesFull = marketRates(ALL_ELITE);

  console.log('\n=== Among markets with ≥50 workers (${count} markets) ===\n'.replace('${count}', String(bigMarkets.length)));
  console.log(`Median market % (original 8): ${median(ratesOrig).toFixed(1)}%`);
  console.log(`Median market % (full 11):    ${median(ratesFull).toFixed(1)}%`);

  const inBandOrig = ratesOrig.filter((p) => p >= 35 && p <= 50).length;
  const inBandFull = ratesFull.filter((p) => p >= 35 && p <= 50).length;
  console.log(`Markets in 35–50% band:       ${inBandOrig} (orig 8) vs ${inBandFull} (full 11)`);

  const combos: { label: string; set: Set<string> }[] = [
    { label: 'Original 8 + RL Factory only', set: new Set([...ORIGINAL_8, 'ralph lauren factory store']) },
    { label: 'Original 8 + VV + Faherty (no RL Factory)', set: new Set([...ORIGINAL_8, 'vineyard vines', 'faherty']) },
    { label: 'Original 8 + VV only', set: new Set([...ORIGINAL_8, 'vineyard vines']) },
    { label: 'Original 8 + Faherty only', set: new Set([...ORIGINAL_8, 'faherty']) },
    { label: 'Original 8 + RL Factory + VV (no Faherty)', set: new Set([...ORIGINAL_8, 'ralph lauren factory store', 'vineyard vines']) },
    { label: 'Original 8 + RL Factory + Faherty (no VV)', set: new Set([...ORIGINAL_8, 'ralph lauren factory store', 'faherty']) },
    { label: 'Original 8 + all 3 adds', set: ALL_ELITE },
  ];
  console.log('\n=== Subsets near 35–50% global ===\n');
  for (const { label, set } of combos) {
    const c = rows.filter((r) => workerMatchesSet(r.favorited_by_brands, set)).length;
    const p = pct(c, n);
    const band = p >= 35 && p <= 50 ? '  ✓ 35–50%' : p < 35 ? '  (below)' : '  (above)';
    console.log(`${label.padEnd(42)} ${p.toFixed(1)}% (${c})${band}`);
  }
}

main().catch(console.error);
