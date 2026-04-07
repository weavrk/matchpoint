import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// Same aliases as supabase.ts
const ALIASES: Record<string, string[]> = {
  'Washington': ['DC', 'Baltimore', 'Alexandria'],
  'Los Angeles': ['Camarillo'],
  'Denver': ['Castle Rock', 'Colorado Springs'],
  'Salt Lake City': ['Park City'],
  'Miami': ['Cape Coral', 'Fort Lauderdale', 'St. Petersburg'],
  'Raleigh-Durham': ['Raleigh'],
  'Detroit': ['Grand Rapids'],
  'Knoxville': ['Pigeon Forge'],
  'Pigeon Forge': ['Knoxville'],
  'Austin': ['San Marcos'],
  'Long Island West': ['New York City'],
  'Northern New Jersey': ['Newark'],
  // NYC rollup (what we want to add)
  'New York City': ['Long Island', 'Long Island East', 'Long Island West', 'Northern New Jersey', 'Newark'],
};

async function run() {
  const { data } = await supabase.from('workers').select('market');
  
  // Split each worker's market string and count individual market appearances
  const individualCounts: Record<string, number> = {};
  for (const w of data || []) {
    const markets = (w.market || '').split(',').map((m: string) => m.trim()).filter(Boolean);
    for (const m of markets) {
      individualCounts[m] = (individualCounts[m] || 0) + 1;
    }
  }

  // Now simulate what fetchWorkersByMarket returns for each display market
  // (using ilike first-2-words prefix match + aliases)
  const displayMarkets = [
    'Atlanta', 'Austin', 'Bakersfield', 'Baton Rouge', 'Biloxi', 'Boston',
    'Boulder', 'Cabazon', 'Central New Jersey', 'Charleston', 'Charlotte',
    'Chicago', 'Cincinnati', 'Columbus', 'Dallas', 'Denver', 'Detroit',
    'Fort Myers', 'Fort Walton Beach', 'Fresno', 'Houston', 'Indianapolis',
    'King of Prussia', 'Knoxville', 'Las Vegas', 'Long Island East',
    'Long Island West', 'Los Angeles', 'Memphis', 'Miami', 'Milwaukee',
    'Minneapolis', 'Nashville', 'New Orleans', 'New York City',
    'Northern New Jersey', 'Omaha', 'Orlando', 'Phoenix', 'Pigeon Forge',
    'Portland', 'Raleigh-Durham', 'Sacramento', 'Salt Lake City', 'San Antonio',
    'San Diego', 'San Francisco', 'San Jose', 'Seattle', 'Tampa',
    'Tulsa', 'Washington', 'Westport', 'Wilmington',
  ];

  const results: { market: string; count: number }[] = [];

  for (const dm of displayMarkets) {
    const base = dm.split(' ').slice(0, 2).join(' ');
    const aliases = ALIASES[dm] || ALIASES[base] || [];
    const searchTerms = [base, ...aliases];
    
    let count = 0;
    for (const [market, c] of Object.entries(individualCounts)) {
      for (const term of searchTerms) {
        if (market.toLowerCase().startsWith(term.toLowerCase())) {
          count += c;
          break;
        }
      }
    }
    results.push({ market: dm, count });
  }

  results.sort((a, b) => b.count - a.count);
  console.log('\nMarket | Estimated worker count');
  for (const r of results) {
    const flag = r.count < 20 ? ' ❌' : r.count === 0 ? ' 🚫' : ' ✓';
    console.log(`${flag} ${r.count.toString().padStart(4)} | ${r.market}`);
  }
  console.log('\nKeep (>=20):', results.filter(r => r.count >= 20).length);
  console.log('Markets to keep:', results.filter(r => r.count >= 20).map(r => r.market).join(', '));
}

run();
