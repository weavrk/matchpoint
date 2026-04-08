/**
 * Per-market spread analysis: which allowlists keep big markets in ~30–45%?
 *
 * npx tsx web/src/scripts/_analyzeStoreFavoriteSpread.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { canonicalizeFavoritedBrandName } from '../utils/storeFavoriteElite';

function loadEnv() {
  for (const root of [process.cwd(), path.join(process.cwd(), '..')]) {
    dotenv.config({ path: path.join(root, '.env') });
    if (process.env.SUPABASE_SERVICE_KEY) return;
  }
}
loadEnv();

const ORIG8 = new Set([
  'ariat',
  'ralph lauren',
  'golden goose',
  'marc jacobs',
  'tecovas',
  'skims',
  'ugg',
  'rag and bone',
]);
const RLFS = 'ralph lauren factory store';
const VV = 'vineyard vines';
const FAH = 'faherty';

const CANDIDATE_LIFT_BRANDS = [
  'pacsun',
  'true religion',
  'karl lagerfeld',
  'j. crew factory',
  '7 for all mankind',
  'vineyard vines',
  'faherty',
] as const;

type Row = { market: string; favorited_by_brands: string[] | null };

function matches(brands: string[] | null | undefined, allow: Set<string>): boolean {
  if (!brands?.length) return false;
  return brands.some((b) => allow.has(canonicalizeFavoritedBrandName(b)));
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
}

function primaryMarket(m: string) {
  return (m || '').split(',')[0].trim() || '(empty)';
}

function analyzeMarkets(
  rows: Row[],
  allow: Set<string>,
  minMarketN: number,
  usePrimaryMarket: boolean
): {
  rates: number[];
  min: number;
  max: number;
  median: number;
  sd: number;
  in3045: number;
  total: number;
  below30: string[];
  above45: string[];
  globalPct: number;
} {
  const byM = new Map<string, { e: number; t: number }>();
  for (const r of rows) {
    const m = usePrimaryMarket ? primaryMarket(r.market || '') : r.market || '(empty)';
    let x = byM.get(m);
    if (!x) {
      x = { e: 0, t: 0 };
      byM.set(m, x);
    }
    x.t += 1;
    if (matches(r.favorited_by_brands, allow)) x.e += 1;
  }

  const big = [...byM.entries()].filter(([, v]) => v.t >= minMarketN);
  const rates = big.map(([, v]) => (v.t ? (100 * v.e) / v.t : 0));
  const sorted = [...rates].sort((a, b) => a - b);
  const median = sorted.length % 2
    ? sorted[Math.floor(sorted.length / 2)]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

  let elite = 0,
    tot = 0;
  for (const r of rows) {
    tot += 1;
    if (matches(r.favorited_by_brands, allow)) elite += 1;
  }
  const globalPct = tot ? (100 * elite) / tot : 0;

  const below30: string[] = [];
  const above45: string[] = [];
  let in3045 = 0;
  for (const [m, v] of big) {
    const p = v.t ? (100 * v.e) / v.t : 0;
    if (p < 30) below30.push(`${m} (${p.toFixed(1)}%)`);
    else if (p > 45) above45.push(`${m} (${p.toFixed(1)}%)`);
    else in3045 += 1;
  }

  return {
    rates,
    min: Math.min(...rates),
    max: Math.max(...rates),
    median,
    sd: stdev(rates),
    in3045,
    total: big.length,
    below30,
    above45,
    globalPct,
  };
}

async function fetchAll(sb: ReturnType<typeof createClient>): Promise<Row[]> {
  const all: Row[] = [];
  let offset = 0;
  const size = 1000;
  for (;;) {
    const { data, error } = await sb.from('workers').select('market, favorited_by_brands').range(offset, offset + size - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < size) break;
    offset += size;
  }
  return all;
}

async function main() {
  const key = process.env.SUPABASE_SERVICE_KEY!;
  const sb = createClient('https://kxfbismfpmjwvemfznvm.supabase.co', key);
  const rows = await fetchAll(sb);
  const MIN_N = 50;

  const variants: { name: string; set: Set<string> }[] = [
    { name: 'Orig 8 only', set: new Set(ORIG8) },
    { name: 'Orig 8 + RL Factory', set: new Set([...ORIG8, RLFS]) },
    { name: 'Orig 8 + RL + VV', set: new Set([...ORIG8, RLFS, VV]) },
    { name: 'Orig 8 + RL + Faherty', set: new Set([...ORIG8, RLFS, FAH]) },
    { name: 'Full 11 (Orig8+RL+VV+Faherty)', set: new Set([...ORIG8, RLFS, VV, FAH]) },
    { name: 'Orig 8 + RL + PacSun', set: new Set([...ORIG8, RLFS, 'pacsun']) },
    { name: 'Orig 8 + RL + VV + PacSun', set: new Set([...ORIG8, RLFS, VV, 'pacsun']) },
    { name: 'Orig 8 + RL + True Religion', set: new Set([...ORIG8, RLFS, 'true religion']) },
    { name: 'Orig 8 + RL + Karl Lagerfeld', set: new Set([...ORIG8, RLFS, 'karl lagerfeld']) },
    { name: 'Orig 8 + RL + J.Crew Factory', set: new Set([...ORIG8, RLFS, 'j. crew factory']) },
    { name: 'Orig 8 + RL + 7 For All Mankind', set: new Set([...ORIG8, RLFS, '7 for all mankind']) },
    { name: 'Orig 8 + RL + PacSun + True Religion', set: new Set([...ORIG8, RLFS, 'pacsun', 'true religion']) },
  ];

  for (const usePrimary of [false, true]) {
    const label = usePrimary ? 'PRIMARY market (first city in field)' : 'FULL market string (as stored)';
    console.log(`\n${'='.repeat(85)}\n${label}\nWorkers: ${rows.length}. Markets with n≥${MIN_N}.\n`);
    console.log(
      'Variant'.padEnd(38),
      'Global%'.padStart(7),
      'min'.padStart(6),
      'max'.padStart(6),
      'med'.padStart(6),
      'σ'.padStart(6),
      'in30–45'.padStart(8)
    );
    console.log('-'.repeat(85));

    let best: { name: string; score: number; a: ReturnType<typeof analyzeMarkets> } | null = null;
    for (const { name, set } of variants) {
      const a = analyzeMarkets(rows, set, MIN_N, usePrimary);
      const outOfBand = a.below30.length + a.above45.length;
      const score = outOfBand * 1000 + a.sd;
      if (!best || score < best.score) best = { name, score, a };
      console.log(
        name.padEnd(38),
        a.globalPct.toFixed(1).padStart(7),
        a.min.toFixed(1).padStart(6),
        a.max.toFixed(1).padStart(6),
        a.median.toFixed(1).padStart(6),
        a.sd.toFixed(1).padStart(6),
        `${a.in3045}/${a.total}`.padStart(8)
      );
    }

    console.log('\n--- Best in this grouping ---');
    if (best) {
      console.log(best.name);
      console.log(`  Global ${best.a.globalPct.toFixed(1)}% | in 30–45%: ${best.a.in3045}/${best.a.total} | σ=${best.a.sd.toFixed(1)}`);
      console.log(`  <30% (${best.a.below30.length}):`, best.a.below30.slice(0, 6).join('; ') || '(none)');
      console.log(`  >45% (${best.a.above45.length}):`, best.a.above45.slice(0, 8).join('; ') || '(none)');
    }
  }

  console.log('\n=== Honest constraint ===');
  console.log(
    'A single global allowlist cannot force every market into 30–45% unless the underlying\n' +
      'favorited_by_brand mix is already similar. Outlet-heavy markets (Cabazon, small-N combos)\n' +
      'will stay high; PacSun-heavy markets need broader brands to lift lows.\n'
  );

  // Which brands lift Dallas / Seattle / Boston most?
  const lowMarkets = ['Dallas', 'Boston', 'Seattle', 'Charlotte', 'Westport'];
  console.log('=== Marginal lift in selected low markets (add one brand to Orig8+RL) ===\n');
  const base = new Set([...ORIG8, RLFS]);
  for (const brand of CANDIDATE_LIFT_BRANDS) {
    const extended = new Set([...base, brand]);
    const lines: string[] = [];
    for (const m of lowMarkets) {
      const inM = rows.filter((r) => (r.market || '').split(',')[0].trim() === m);
      if (inM.length < 30) continue;
      const b0 = inM.filter((r) => matches(r.favorited_by_brands, base)).length;
      const b1 = inM.filter((r) => matches(r.favorited_by_brands, extended)).length;
      const d = ((b1 - b0) / inM.length) * 100;
      if (d > 0.5) lines.push(`${m} +${d.toFixed(1)}pp`);
    }
    if (lines.length) console.log(brand.padEnd(22), lines.join('  '));
  }
}

main().catch(console.error);
