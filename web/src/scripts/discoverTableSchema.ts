import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function discoverSchema() {
  // Try to get table information from information_schema
  // This might work with RPC
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_table_columns', { table_name: 'worker_connections' });

  if (tablesError) {
    console.log('RPC error:', tablesError.message);

    // Try direct insert with empty object to see what columns are required
    console.log('\nTrying minimal insert to discover columns...');
    const { error: insertError } = await supabase
      .from('worker_connections')
      .insert({});

    if (insertError) {
      console.log('Insert error (this reveals required columns):', insertError.message);
    }

    // Try with just one field
    console.log('\nTrying insert with status only...');
    const { error: insert2Error } = await supabase
      .from('worker_connections')
      .insert({ status: 'viewed' });

    if (insert2Error) {
      console.log('Insert error:', insert2Error.message);
    }
  } else {
    console.log('Table columns:', tables);
  }
}

discoverSchema().catch(console.error);
