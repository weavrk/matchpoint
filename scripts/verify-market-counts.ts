import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

const MARKET_ALIASES: Record<string, string[]> = {
  'Washington': ['DC', 'Baltimore', 'Alexandria'],
  'Los Angeles': ['Camarillo'],
  'Denver': ['Castle Rock', 'Colorado Springs'],
  'Miami': ['Cape Coral', 'Fort Lauderdale', 'St. Petersburg'],
  'Raleigh-Durham': ['Raleigh'],
  'Austin': ['San Marcos'],
  'Northern New Jersey': ['Newark'],
  'New York City': ['Long Island East', 'Long Island West', 'Northern New Jersey', 'Newark'],
};

// All markets that were in the ORIGINAL list (pre-trim) + our kept 20
const ALL_MARKETS = [
  'Phoenix', 'Bakersfield', 'Cabazon', 'Fresno', 'Los Angeles', 'Sacramento', 'San Diego', 'San Francisco', 'San Jose',
  'Boulder', 'Denver', 'Westport', 'Washington', 'Wilmington',
  'Fort Myers', 'Fort Walton Beach', 'Miami', 'Orlando', 'Tampa',
  'Atlanta', 'Savannah', 'Chicago', 'Indianapolis', 'Baton Rouge', 'New Orleans', 'Boston',
  'Detroit', 'Minneapolis', 'St. Louis', 'Biloxi', 'Charlotte', 'Raleigh-Durham', 'Omaha', 'Merrimack',
  'Central New Jersey', 'Northern New Jersey', 'Las Vegas',
  'Long Island East', 'Long Island West', 'New York City', 'Westchester', 'Woodbury',
  'Cincinnati', 'Columbus', 'Tulsa', 'Portland', 'King of Prussia', 'Charleston',
  'Knoxville', 'Memphis', 'Nashville', 'Pigeon Forge',
  'Austin', 'Dallas', 'Houston', 'San Antonio', 'Salt Lake City', 'Seattle', 'Milwaukee',
];

async function run() {
  console.log('Market | Count | Had collision risk (3+ word name)?');
  console.log('-------|-------|------');
  for (const market of ALL_MARKETS) {
    const patterns = [market, ...(MARKET_ALIASES[market] || [])];
    const orFilters = patterns.map(p => `market.ilike.%${p}%`).join(',');
    const { count } = await supabase.from('workers').select('id', { count: 'exact', head: true }).or(orFilters);
    const wordCount = market.split(' ').length;
    const hadRisk = wordCount > 2 ? ' ← was truncated to "' + market.split(' ').slice(0,2).join(' ') + '"' : '';
    const flag = (count ?? 0) > 0 ? '✓' : '–';
    console.log(`${flag} ${String(count ?? 0).padStart(4)} | ${market}${hadRisk}`);
  }
}

run();
