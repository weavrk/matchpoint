import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

const NYC_TRIGGER_TERMS = ['Long Island East', 'Long Island West', 'Northern New Jersey'];

async function run() {
  const { data, error } = await supabase.from('workers').select('id, market');
  if (error) { console.error(error); return; }

  const toUpdate: { id: string; market: string }[] = [];

  for (const w of data || []) {
    const market: string = w.market || '';
    const hasNYC = market.includes('New York City');
    const hasTrigger = NYC_TRIGGER_TERMS.some(t => market.includes(t));

    if (hasTrigger && !hasNYC) {
      toUpdate.push({ id: w.id, market: market + ', New York City' });
    }
  }

  console.log(`Workers to update: ${toUpdate.length}`);
  if (toUpdate.length === 0) { console.log('Nothing to do.'); return; }

  // Update in batches of 50
  let updated = 0;
  for (let i = 0; i < toUpdate.length; i += 50) {
    const batch = toUpdate.slice(i, i + 50);
    for (const w of batch) {
      const { error } = await supabase
        .from('workers')
        .update({ market: w.market })
        .eq('id', w.id);
      if (error) console.error(`Failed ${w.id}:`, error);
      else updated++;
    }
    console.log(`Updated ${Math.min(i + 50, toUpdate.length)}/${toUpdate.length}...`);
  }
  console.log(`\nDone. ${updated} workers now include New York City.`);
}

run();
