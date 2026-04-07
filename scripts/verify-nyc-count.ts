import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

async function run() {
  // Simulate exactly what fetchWorkersByMarket("New York City") does now
  const orFilters = [
    'market.ilike.%New York%',
    'market.ilike.%Long Island East%',
    'market.ilike.%Long Island West%',
    'market.ilike.%Northern New Jersey%',
    'market.ilike.%Newark%',
  ].join(',');

  const { data, error, count } = await supabase
    .from('workers')
    .select('id, market', { count: 'exact' })
    .or(orFilters);

  if (error) { console.error(error); return; }

  console.log(`NYC query returns: ${data?.length} workers (exact count: ${count})`);

  // Also check breakdown
  const terms = ['New York', 'Long Island East', 'Long Island West', 'Northern New Jersey', 'Newark'];
  for (const term of terms) {
    const matches = (data || []).filter(w => w.market?.includes(term));
    console.log(`  Contains "${term}": ${matches.length}`);
  }

  // Check if any workers were added with NYC from our script
  const addedByScript = (data || []).filter(w => {
    const m = w.market || '';
    return m.includes('New York City') && (m.includes('Long Island East') || m.includes('Long Island West') || m.includes('Northern New Jersey'));
  });
  console.log(`\nWorkers with NYC + LI/NNJ (updated by script): ${addedByScript.length}`);
  addedByScript.slice(0, 3).forEach(w => console.log(' ', w.market));
}

run();
