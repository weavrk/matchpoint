import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  // Check for experience_level column
  const { data, error } = await supabase
    .from('workers')
    .select('id, name, experience_level')
    .limit(10);

  if (error) {
    console.log('Error:', error.message);
    console.log('Full error:', error);
    return;
  }

  console.log('Sample workers with experience_level:');
  console.log(JSON.stringify(data, null, 2));

  // Count by level
  const { data: counts, error: countError } = await supabase
    .from('workers')
    .select('experience_level');

  if (countError) {
    console.log('Count error:', countError.message);
    return;
  }

  const levelCounts = { rising: 0, experienced: 0, seasoned: 0, proven_leader: 0, null: 0 };
  for (const w of counts || []) {
    const level = w.experience_level || 'null';
    levelCounts[level as keyof typeof levelCounts]++;
  }
  console.log('\nDistribution:', levelCounts);
}

check().catch(console.error);
