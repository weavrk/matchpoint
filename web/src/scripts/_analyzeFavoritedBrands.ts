/**
 * Analyzes favorited_by_brands data to find top brands not in the elite list,
 * and simulates what adding each would do to per-market coverage.
 *
 * Usage: npx tsx web/src/scripts/_analyzeFavoritedBrands.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { hasEliteStoreFavorite, canonicalizeFavoritedBrandName } from '../utils/storeFavoriteElite';

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

type Row = { market: string; favorited_by_brands: string[] | null };

async function fetchAll(): Promise<Row[]> {
  const all: Row[] = [];
  let offset = 0;
  const size = 1000;
  for (;;) {
    const { data, error } = await supabase
      .from('workers')
      .select('market, favorited_by_brands')
      .range(offset, offset + size - 1);
    if (error) { console.error(error); process.exit(1); }
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < size) break;
    offset += size;
  }
  return all;
}

// Normalize multi-market workers to their primary (first listed) market
function primaryMarket(market: string): string {
  return market.split(',')[0].trim();
}

async function main() {
  const rows = await fetchAll();

  // --- Market totals (primary market) ---
  const marketTotals = new Map<string, number>();
  const marketElite = new Map<string, number>();
  for (const r of rows) {
    const m = primaryMarket(r.market || '(empty)');
    marketTotals.set(m, (marketTotals.get(m) ?? 0) + 1);
    if (hasEliteStoreFavorite(r.favorited_by_brands)) {
      marketElite.set(m, (marketElite.get(m) ?? 0) + 1);
    }
  }

  // --- Brand frequency (exclude already-elite brands) ---
  const brandCount = new Map<string, number>();
  for (const r of rows) {
    if (!r.favorited_by_brands?.length) continue;
    const seen = new Set<string>();
    for (const b of r.favorited_by_brands) {
      const canon = canonicalizeFavoritedBrandName(b);
      if (!seen.has(canon)) {
        seen.add(canon);
        brandCount.set(canon, (brandCount.get(canon) ?? 0) + 1);
      }
    }
  }

  // Separate non-elite from elite
  const CURRENT_ELITE = new Set([
    'ariat', 'ralph lauren', 'golden goose', 'marc jacobs',
    'tecovas', 'skims', 'ugg', 'rag and bone',
  ]);

  // Also bucket non-elite brands by worker
  // For each non-elite brand, track which workers (primary market) it adds
  type MarketWorkerSet = Map<string, Set<number>>;
  const brandMarketNewWorkers = new Map<string, MarketWorkerSet>();

  rows.forEach((r, idx) => {
    if (!r.favorited_by_brands?.length) return;
    if (hasEliteStoreFavorite(r.favorited_by_brands)) return; // already elite
    const m = primaryMarket(r.market || '(empty)');
    const seen = new Set<string>();
    for (const b of r.favorited_by_brands) {
      const canon = canonicalizeFavoritedBrandName(b);
      if (CURRENT_ELITE.has(canon)) continue;
      if (seen.has(canon)) continue;
      seen.add(canon);
      if (!brandMarketNewWorkers.has(canon)) brandMarketNewWorkers.set(canon, new Map());
      const mws = brandMarketNewWorkers.get(canon)!;
      if (!mws.has(m)) mws.set(m, new Set());
      mws.get(m)!.add(idx);
    }
  });

  // Score each non-elite brand: how many markets would hit >=50% if we added it?
  const topN = [...brandMarketNewWorkers.entries()]
    .map(([brand, mws]) => {
      const totalNewWorkers = [...mws.values()].reduce((s, v) => s + v.size, 0);
      let marketsHit50 = 0;
      for (const [m, ws] of mws) {
        const total = marketTotals.get(m) ?? 0;
        const currentElite = marketElite.get(m) ?? 0;
        const newElite = currentElite + ws.size;
        if (total > 0 && newElite / total >= 0.5) marketsHit50++;
      }
      return { brand, totalNewWorkers, marketsHit50 };
    })
    .sort((a, b) => b.totalNewWorkers - a.totalNewWorkers)
    .slice(0, 40);

  console.log('\n=== Top non-elite brands by # new workers they unlock ===\n');
  console.log('Brand'.padEnd(35), 'New workers', 'Markets→50%+');
  for (const { brand, totalNewWorkers, marketsHit50 } of topN) {
    console.log(brand.padEnd(35), String(totalNewWorkers).padStart(11), String(marketsHit50).padStart(12));
  }

  // Also show current market coverage (single markets only, total > 50 workers)
  console.log('\n=== Current Store Favorite % by primary market (≥50 workers) ===\n');
  const marketRows = [...marketTotals.entries()]
    .filter(([, t]) => t >= 50)
    .map(([m, t]) => ({ m, t, e: marketElite.get(m) ?? 0 }))
    .sort((a, b) => b.t - a.t);
  console.log('Market'.padEnd(28), 'Elite', 'Total', 'Pct');
  for (const { m, t, e } of marketRows) {
    const pct = ((e / t) * 100).toFixed(1);
    console.log(m.padEnd(28), String(e).padStart(5), String(t).padStart(5), `${pct}%`);
  }
}

main().catch(console.error);
