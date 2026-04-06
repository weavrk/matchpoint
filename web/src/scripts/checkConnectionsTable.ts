import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  // Get all data from worker_connections to see its structure
  const { data, error } = await supabase
    .from('worker_connections')
    .select('*')
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Existing data in worker_connections:');
  console.log(JSON.stringify(data, null, 2));

  if (data && data.length > 0) {
    console.log('\nColumns found:', Object.keys(data[0]));
  }
}

checkTable().catch(console.error);
