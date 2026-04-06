import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  // Get sample previous_experience data to understand structure
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, previous_experience')
    .not('previous_experience', 'is', null)
    .limit(10);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Sample previous_experience structures:\n');
  for (const w of workers || []) {
    console.log(`--- ${w.name} ---`);
    console.log(JSON.stringify(w.previous_experience, null, 2));
    console.log();
  }

  // Search for any entries that might contain management keywords
  console.log('\n=== Searching for management keywords ===\n');

  const { data: allWorkers } = await supabase
    .from('workers')
    .select('id, name, previous_experience');

  const managementKeywords = ['manager', 'lead', 'supervisor', 'director', 'head', 'chief'];
  let found = 0;

  for (const w of allWorkers || []) {
    const exp = w.previous_experience || [];
    if (!Array.isArray(exp)) continue;

    for (const job of exp) {
      const jsonStr = JSON.stringify(job).toLowerCase();
      for (const kw of managementKeywords) {
        if (jsonStr.includes(kw)) {
          console.log(`Found "${kw}" in ${w.name}:`);
          console.log(JSON.stringify(job, null, 2));
          console.log();
          found++;
          break;
        }
      }
    }
  }

  console.log(`\nTotal entries with management keywords: ${found}`);
}

debug().catch(console.error);
