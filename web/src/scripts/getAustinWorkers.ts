import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getWorkers() {
  // Get workers from Austin
  const { data: austinWorkers, error: austinError } = await supabase
    .from('workers')
    .select('id, name, market')
    .ilike('market', '%austin%')
    .limit(10);

  if (austinError) {
    console.log('Error getting Austin workers:', austinError.message);
  } else {
    console.log('Austin workers:');
    austinWorkers?.forEach(w => console.log(`  ${w.id}: ${w.name} (${w.market})`));
  }

  // Also check other markets
  const { data: denverWorkers, error: denverError } = await supabase
    .from('workers')
    .select('id, name, market')
    .ilike('market', '%denver%')
    .limit(3);

  if (!denverError && denverWorkers?.length) {
    console.log('\nDenver workers:');
    denverWorkers?.forEach(w => console.log(`  ${w.id}: ${w.name} (${w.market})`));
  }

  const { data: houstonWorkers, error: houstonError } = await supabase
    .from('workers')
    .select('id, name, market')
    .ilike('market', '%houston%')
    .limit(3);

  if (!houstonError && houstonWorkers?.length) {
    console.log('\nHouston workers:');
    houstonWorkers?.forEach(w => console.log(`  ${w.id}: ${w.name} (${w.market})`));
  }

  const { data: dallasWorkers, error: dallasError } = await supabase
    .from('workers')
    .select('id, name, market')
    .ilike('market', '%dallas%')
    .limit(3);

  if (!dallasError && dallasWorkers?.length) {
    console.log('\nDallas workers:');
    dallasWorkers?.forEach(w => console.log(`  ${w.id}: ${w.name} (${w.market})`));
  }

  // Get total worker count
  const { count } = await supabase
    .from('workers')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal workers in database: ${count}`);
}

getWorkers().catch(console.error);
