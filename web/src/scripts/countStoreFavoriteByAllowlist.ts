/**
 * Store Favorite counts by market for a custom allowlist (canonical brand keys).
 *
 * Usage:
 *   npx tsx web/src/scripts/countStoreFavoriteByAllowlist.ts orig8-rlfactory
 *
 * Presets:
 *   orig8-rlfactory — original 8 + Ralph Lauren Factory Store only
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { canonicalizeFavoritedBrandName } from '../utils/storeFavoriteElite';

function loadEnv() {
  const roots = [process.cwd(), path.join(process.cwd(), '..')];
  for (const root of roots) {
    const p = path.join(root, '.env');
    dotenv.config({ path: p });
    if (process.env.SUPABASE_SERVICE_KEY) return;
  }
}

loadEnv();

const PRESETS: Record<string, Set<string>> = {
  'orig8-rlfactory': new Set([
    'ariat',
    'ralph lauren',
    'ralph lauren factory store',
    'golden goose',
    'marc jacobs',
    'tecovas',
    'skims',
    'ugg',
    'rag and bone',
  ]),
};

function matches(favorited: string[] | null | undefined, allow: Set<string>): boolean {
  if (!favorited?.length) return false;
  return favorited.some((b) => allow.has(canonicalizeFavoritedBrandName(b)));
}

async function main() {
  const preset = process.argv[2] || 'orig8-rlfactory';
  const allow = PRESETS[preset];
  if (!allow) {
    console.error('Unknown preset:', preset, '| available:', Object.keys(PRESETS).join(', '));
    process.exit(1);
  }

  const key = process.env.SUPABASE_SERVICE_KEY || '';
  if (!key) {
    console.error('Missing SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const supabase = createClient('https://kxfbismfpmjwvemfznvm.supabase.co', key);
  const pageSize = 1000;
  let offset = 0;
  const rows: { market: string; favorited_by_brands: string[] | null }[] = [];
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
    rows.push(...(data as typeof rows));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  const byMarket = new Map<string, { elite: number; total: number }>();
  for (const row of rows) {
    const m = row.market || '(empty)';
    let cur = byMarket.get(m);
    if (!cur) {
      cur = { elite: 0, total: 0 };
      byMarket.set(m, cur);
    }
    cur.total += 1;
    if (matches(row.favorited_by_brands, allow)) cur.elite += 1;
  }

  const sorted = [...byMarket.entries()].sort((a, b) => b[1].elite - a[1].elite);
  const totalElite = sorted.reduce((s, [, v]) => s + v.elite, 0);
  const totalWorkers = sorted.reduce((s, [, v]) => s + v.total, 0);

  console.log(`Store Favorite by market — preset: ${preset}\n`);
  console.log('Market'.padEnd(28), 'Elite', 'Total', 'Pct');
  for (const [market, { elite, total }] of sorted) {
    const pct = total ? ((elite / total) * 100).toFixed(1) : '0.0';
    console.log(market.padEnd(28), String(elite).padStart(5), String(total).padStart(5), `${pct}%`);
  }
  console.log('\nTotal qualifying workers:', totalElite, '/', totalWorkers);
  console.log('Global:', ((totalElite / totalWorkers) * 100).toFixed(1), '%');
}

main().catch(console.error);
