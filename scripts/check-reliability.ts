import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    'https://kxfbismfpmjwvemfznvm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
  );

  // Check how many have tardy_ratio data
  const { data: withData, error: e1 } = await supabase
    .from('workers')
    .select('worker_id, current_tier, tardy_ratio, tardy_percent, urgent_cancel_ratio, urgent_cancel_percent')
    .not('tardy_ratio', 'is', null)
    .limit(5);

  console.log('Workers WITH tardy_ratio:', withData?.length || 0);
  if (withData && withData.length > 0) {
    console.log('Sample:', JSON.stringify(withData, null, 2));
  }

  // Check total workers and how many have tier but no tardy
  const { data: withTier, error: e2 } = await supabase
    .from('workers')
    .select('worker_id, current_tier, tardy_ratio, tardy_percent')
    .not('current_tier', 'is', null)
    .limit(5);

  console.log('\nWorkers WITH current_tier:', withTier?.length || 0);
  if (withTier && withTier.length > 0) {
    console.log('Sample:', JSON.stringify(withTier, null, 2));
  }
}

main();

// Check retailers_live workers
async function checkRetailersLive() {
  const supabase = createClient(
    'https://kxfbismfpmjwvemfznvm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
  );

  const { data, error } = await supabase
    .from('retailers_live')
    .select('worker_id')
    .limit(10);

  console.log('\nretailers_live worker_ids:', data?.map(d => d.worker_id));

  // Now check if those workers have tardy data
  if (data && data.length > 0) {
    const workerIds = data.map(d => d.worker_id);
    const { data: workersData } = await supabase
      .from('workers')
      .select('worker_id, current_tier, tardy_ratio, tardy_percent')
      .in('worker_id', workerIds);

    console.log('\nThose workers reliability data:', JSON.stringify(workersData, null, 2));
  }
}

checkRetailersLive();
