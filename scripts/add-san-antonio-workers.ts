import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSanAntonioWorkers() {
  // Get existing worker_ids in connections
  const { data: existingConnections } = await supabase
    .from('worker_connections')
    .select('worker_id');

  const existingWorkerIds = new Set(existingConnections?.map(c => c.worker_id) || []);

  // Get 12 random workers not already in connections
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('id')
    .limit(100); // Get more than we need to filter

  if (workersError) {
    console.error('Error fetching workers:', workersError);
    return;
  }

  // Filter out workers already in connections and shuffle
  const availableWorkers = workers
    .filter(w => !existingWorkerIds.has(w.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);

  if (availableWorkers.length < 12) {
    console.log(`Only found ${availableWorkers.length} available workers`);
  }

  // Create connection records with varied statuses
  const newConnections = availableWorkers.map((worker, index) => {
    const rowNum = index + 1;
    return {
      worker_id: worker.id,
      market: 'San Antonio',
      chat_id: `chat-sa-${rowNum}`,
      status: rowNum <= 9 ? 'accepted' : 'liked',
      invited: true,
      connected: rowNum <= 9,
      chat_open: rowNum <= 5,
      shift_booked: rowNum <= 2,
      shift_scheduled: rowNum <= 1,
      saved_for_later: rowNum > 9
    };
  });

  console.log('Inserting connections:', newConnections);

  const { data: insertedData, error: insertError } = await supabase
    .from('worker_connections')
    .insert(newConnections)
    .select();

  if (insertError) {
    console.error('Error inserting connections:', insertError);
    return;
  }

  console.log(`Successfully inserted ${insertedData?.length || 0} San Antonio connections`);

  // Verify counts by market
  const { data: counts } = await supabase
    .from('worker_connections')
    .select('market');

  const marketCounts: Record<string, number> = {};
  counts?.forEach(c => {
    marketCounts[c.market] = (marketCounts[c.market] || 0) + 1;
  });

  console.log('\nConnections by market:');
  Object.entries(marketCounts).sort().forEach(([market, count]) => {
    console.log(`  ${market}: ${count}`);
  });
}

addSanAntonioWorkers();
