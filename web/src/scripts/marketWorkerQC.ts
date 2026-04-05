import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Market aliases: worker market values that should map to app market names
// Key = app market name, Value = array of worker market values that should match
const MARKET_ALIASES: Record<string, string[]> = {
  'Washington': ['DC', 'Baltimore', 'Alexandria'],
  'Los Angeles': ['Camarillo'],
  'Denver': ['Castle Rock', 'Colorado Springs'],
  'Salt Lake City': ['Park City'],
  'Miami': ['Cape Coral', 'Fort Lauderdale', 'St. Petersburg'],
  'Raleigh-Durham': ['Raleigh'],
  'Detroit': ['Grand Rapids'],
  'Knoxville': ['Pigeon Forge'],
  'Austin': ['San Marcos'],
};

// Actual MARKETS array from V2TalentCentric/index.tsx (lines 313-406)
const APP_MARKETS = [
  // AZ
  { id: "phoenix-az", name: "Phoenix", state: "AZ" },
  // CA
  { id: "bakersfield-ca", name: "Bakersfield", state: "CA" },
  { id: "cabazon-ca", name: "Cabazon", state: "CA" },
  { id: "fresno-ca", name: "Fresno", state: "CA" },
  { id: "los-angeles-ca", name: "Los Angeles", state: "CA" },
  { id: "sacramento-ca", name: "Sacramento", state: "CA" },
  { id: "san-diego-ca", name: "San Diego", state: "CA" },
  { id: "san-francisco-ca", name: "San Francisco", state: "CA" },
  { id: "san-jose-ca", name: "San Jose", state: "CA" },
  // CO
  { id: "boulder-co", name: "Boulder", state: "CO" },
  { id: "denver-co", name: "Denver", state: "CO" },
  // CT
  { id: "westport-ct", name: "Westport", state: "CT" },
  // D.C.
  { id: "washington-dc", name: "Washington", state: "D.C." },
  // DE
  { id: "wilmington-de", name: "Wilmington", state: "DE" },
  // FL
  { id: "fort-myers-fl", name: "Fort Myers", state: "FL" },
  { id: "fort-walton-beach-fl", name: "Fort Walton Beach", state: "FL" },
  { id: "miami-fl", name: "Miami", state: "FL" },
  { id: "orlando-fl", name: "Orlando", state: "FL" },
  { id: "tampa-fl", name: "Tampa", state: "FL" },
  // GA
  { id: "atlanta-ga", name: "Atlanta", state: "GA" },
  { id: "savannah-ga", name: "Savannah", state: "GA" },
  // IL
  { id: "chicago-il", name: "Chicago", state: "IL" },
  // IN
  { id: "indianapolis-in", name: "Indianapolis", state: "IN" },
  // LA
  { id: "baton-rouge-la", name: "Baton Rouge", state: "LA" },
  { id: "new-orleans-la", name: "New Orleans", state: "LA" },
  // MA
  { id: "boston-ma", name: "Boston", state: "MA" },
  // MI
  { id: "detroit-mi", name: "Detroit", state: "MI" },
  // MN
  { id: "minneapolis-mn", name: "Minneapolis", state: "MN" },
  // MO
  { id: "st-louis-mo", name: "St. Louis", state: "MO" },
  // MS
  { id: "biloxi-ms", name: "Biloxi", state: "MS" },
  // NC
  { id: "charlotte-nc", name: "Charlotte", state: "NC" },
  { id: "raleigh-durham-nc", name: "Raleigh-Durham", state: "NC" },
  // NE
  { id: "omaha-ne", name: "Omaha", state: "NE" },
  // NH
  { id: "merrimack-nh", name: "Merrimack", state: "NH" },
  // NJ
  { id: "central-new-jersey-nj", name: "Central New Jersey", state: "NJ" },
  { id: "newark-nj", name: "Newark", state: "NJ" },
  { id: "northern-new-jersey-nj", name: "Northern New Jersey", state: "NJ" },
  // NV
  { id: "las-vegas-nv", name: "Las Vegas", state: "NV" },
  // NY
  { id: "long-island-east-ny", name: "Long Island East", state: "NY" },
  { id: "long-island-west-ny", name: "Long Island West", state: "NY" },
  { id: "new-york-ny", name: "New York City", state: "NY" },
  { id: "westchester-ny", name: "Westchester", state: "NY" },
  { id: "woodbury-ny", name: "Woodbury", state: "NY" },
  // OH
  { id: "cincinnati-oh", name: "Cincinnati", state: "OH" },
  { id: "columbus-oh", name: "Columbus", state: "OH" },
  // OK
  { id: "tulsa-ok", name: "Tulsa", state: "OK" },
  // OR
  { id: "portland-or", name: "Portland", state: "OR" },
  // PA
  { id: "king-of-prussia-pa", name: "King of Prussia", state: "PA" },
  // SC
  { id: "charleston-sc", name: "Charleston", state: "SC" },
  // TN
  { id: "knoxville-tn", name: "Knoxville", state: "TN" },
  { id: "memphis-tn", name: "Memphis", state: "TN" },
  { id: "nashville-tn", name: "Nashville", state: "TN" },
  // TX
  { id: "austin-tx", name: "Austin", state: "TX" },
  { id: "dallas-tx", name: "Dallas", state: "TX" },
  { id: "houston-tx", name: "Houston", state: "TX" },
  { id: "san-antonio-tx", name: "San Antonio", state: "TX" },
  // UT
  { id: "salt-lake-city-ut", name: "Salt Lake City", state: "UT" },
  // WA
  { id: "seattle-wa", name: "Seattle", state: "WA" },
  // WI
  { id: "milwaukee-wi", name: "Milwaukee", state: "WI" },
];

// Check if a worker market matches an app market (including aliases)
function workerMatchesMarket(workerMarket: string, appMarket: { name: string }): boolean {
  const baseMarket = appMarket.name.split(' ').slice(0, 2).join(' ');
  const workerMarketLower = workerMarket.toLowerCase();

  // Check direct match
  if (workerMarketLower.startsWith(baseMarket.toLowerCase())) {
    return true;
  }

  // Check aliases
  const aliases = MARKET_ALIASES[appMarket.name] || MARKET_ALIASES[baseMarket];
  if (aliases) {
    for (const alias of aliases) {
      if (workerMarketLower.startsWith(alias.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

async function checkMarketWorkerAlignment() {
  console.log('Fetching workers from Supabase (with pagination)...');

  // Fetch all workers with pagination (Supabase default limit is 1000)
  let allWorkers: { id: string; name: string; market: string }[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, name, market')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching workers:', error);
      return;
    }

    if (!workers || workers.length === 0) break;
    allWorkers = allWorkers.concat(workers);
    if (workers.length < limit) break;
    offset += limit;
  }

  console.log(`\nTotal workers in database: ${allWorkers.length}\n`);

  // Get unique worker markets
  const workerMarkets = new Set(allWorkers.map(w => w.market));
  console.log(`Unique worker markets: ${workerMarkets.size}`);
  console.log('\n' + '='.repeat(80) + '\n');

  // Check which app markets have 0 workers
  console.log('1. APP MARKETS WITH 0 WORKERS:');
  console.log('-'.repeat(40));

  const marketsWithZeroWorkers: string[] = [];
  const marketWorkerCounts: Record<string, number> = {};

  for (const market of APP_MARKETS) {
    const matchingWorkers = allWorkers.filter(w => workerMatchesMarket(w.market, market));
    marketWorkerCounts[market.name] = matchingWorkers.length;

    if (matchingWorkers.length === 0) {
      marketsWithZeroWorkers.push(`${market.name}, ${market.state}`);
    }
  }

  if (marketsWithZeroWorkers.length === 0) {
    console.log('All app markets have at least 1 worker!');
  } else {
    console.log(`${marketsWithZeroWorkers.length} markets with 0 workers:`);
    marketsWithZeroWorkers.forEach(m => console.log(`  - ${m}`));
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Check which workers don't map to any app market
  console.log('2. WORKERS THAT DON\'T MAP TO AN APP MARKET:');
  console.log('-'.repeat(40));

  const unmappedWorkers: { id: string; name: string; market: string }[] = [];

  for (const worker of allWorkers) {
    const hasMatch = APP_MARKETS.some(appMarket => workerMatchesMarket(worker.market, appMarket));
    if (!hasMatch) {
      unmappedWorkers.push(worker);
    }
  }

  if (unmappedWorkers.length === 0) {
    console.log('All workers map to an app market!');
  } else {
    console.log(`${unmappedWorkers.length} workers don't map to an app market:`);

    // Group by market for readability
    const byMarket: Record<string, number> = {};
    unmappedWorkers.forEach(w => {
      byMarket[w.market] = (byMarket[w.market] || 0) + 1;
    });

    Object.entries(byMarket)
      .sort((a, b) => b[1] - a[1])
      .forEach(([market, count]) => {
        console.log(`  - "${market}": ${count} workers`);
      });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Summary of market worker counts (top 10 and bottom 10)
  console.log('3. MARKET WORKER COUNTS:');
  console.log('-'.repeat(40));

  const sortedCounts = Object.entries(marketWorkerCounts).sort((a, b) => b[1] - a[1]);

  console.log('\nTop 10 markets by worker count:');
  sortedCounts.slice(0, 10).forEach(([market, count]) => {
    console.log(`  ${market}: ${count} workers`);
  });

  console.log('\nBottom 10 markets by worker count:');
  sortedCounts.slice(-10).forEach(([market, count]) => {
    console.log(`  ${market}: ${count} workers`);
  });
}

checkMarketWorkerAlignment().catch(console.error);
