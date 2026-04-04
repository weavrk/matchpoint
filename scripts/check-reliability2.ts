import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    'https://kxfbismfpmjwvemfznvm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
  );

  // Check retailers_live structure
  const { data: rlData, error: rlErr } = await supabase
    .from('retailers_live')
    .select('*')
    .limit(3);

  console.log('retailers_live sample:', JSON.stringify(rlData, null, 2));
  if (rlErr) console.log('Error:', rlErr);

  // If it has worker_id, check those workers
  if (rlData && rlData.length > 0 && rlData[0].worker_id) {
    const workerIds = rlData.map((d: any) => d.worker_id);
    const { data: wData } = await supabase
      .from('workers')
      .select('worker_id, current_tier, tardy_ratio, tardy_percent, urgent_cancel_ratio, urgent_cancel_percent')
      .in('worker_id', workerIds);
    console.log('\nThose workers from workers table:', JSON.stringify(wData, null, 2));
  }
}

main();
