import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

async function main() {
  // Fetch workers with single-word names from the screenshot
  const singleNames = ['Barnes', 'Chippy', 'DeYoung', 'Elbernoussi', 'Gallo', 'Gonzales',
    'Korsah-Yorke', 'Talib', 'Williams', 'okorocha', 'AJ West'];

  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, worker_id, name, retailer_quotes')
    .in('worker_id', [86266, 115581, 24784, 158518, 98973, 81643, 234877, 77975, 80598, 334174, 271992, 55589]);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Workers with potential single names:\n');

  for (const worker of workers || []) {
    console.log(`\n=== ${worker.name} (worker_id: ${worker.worker_id}) ===`);

    // Check retailer_quotes for first name mentions
    if (worker.retailer_quotes && Array.isArray(worker.retailer_quotes)) {
      console.log('Retailer quotes:');
      for (const q of worker.retailer_quotes) {
        console.log(`  - "${q.quote}"`);
      }
    }

  }
}

main();
