import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

async function check() {
  const { data, error, count } = await supabase
    .from('workers')
    .select('id, name, market, shift_verified', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✓ Total workers in Supabase:', count);
  console.log('\nFirst 5 workers:');
  data?.slice(0, 5).forEach(w =>
    console.log(`  ${w.id} | ${w.name} | ${w.market} | verified: ${w.shift_verified}`)
  );

  // Check verified count
  const verified = data?.filter(w => w.shift_verified).length || 0;
  console.log(`\n✓ Shift verified workers: ${verified}`);
  console.log(`✓ Non-verified workers: ${(count || 0) - verified}`);
}

check().catch(console.error);
