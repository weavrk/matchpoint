/**
 * Add unique_store_count column to workers table
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  // Try to add the column using rpc or direct SQL
  const { error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE workers ADD COLUMN IF NOT EXISTS unique_store_count INTEGER'
  });

  if (error) {
    console.log('RPC method not available, trying alternative...');

    // Try updating a record with the new field to see if it exists
    const { data, error: testError } = await supabase
      .from('workers')
      .select('unique_store_count')
      .limit(1);

    if (testError) {
      console.log('Column does not exist. Error:', testError.message);
      console.log('\nPlease add the column manually in Supabase SQL Editor:');
      console.log('ALTER TABLE workers ADD COLUMN unique_store_count INTEGER;');
    } else {
      console.log('Column already exists!', data);
    }
  } else {
    console.log('Column added successfully!');
  }
}

addColumn();
