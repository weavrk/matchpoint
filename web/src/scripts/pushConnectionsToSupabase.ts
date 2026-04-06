import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Worker IDs from the database - using real Austin workers and others
// Austin workers (5):
// - Amira Talib: 8b1a7456-fdd0-4a0d-ae56-0634fbdc3868
// - Teresa Nguyen: 2fc5c3a3-9497-4a0f-9850-b24d49f2e386
// - Alexandria Calzada: 246be337-104e-4c42-97a6-5e8950c2fb6e
// - Olivia Little: cea20f1b-7f25-48d4-82f2-f99ef20a1839
// - Paige Lemon: 5e194be2-c80c-4f81-b95b-a06a54fb4e4e
// Denver worker (1):
// - Sally Guerra: 6239053a-4ebf-4d94-9329-bb5b4cb0a3ef
// Houston worker (1):
// - Christina Porter: ee517577-5f70-4cbb-8b8a-21f9b4100e98
// Dallas worker (1):
// - Kelly Mckinnon: 2bdd5d65-ca5c-4768-95a6-5a15caf6ceae

// The 8 connections with real worker_ids, markets, and chat_ids
const connections = [
  {
    worker_id: '8b1a7456-fdd0-4a0d-ae56-0634fbdc3868', // Amira Talib (Austin)
    market: 'Austin',
    status: 'connected',
    chat_id: 'chat-amira',
  },
  {
    worker_id: '2fc5c3a3-9497-4a0f-9850-b24d49f2e386', // Teresa Nguyen (Austin)
    market: 'Austin',
    status: 'invited',
    chat_id: 'chat-teresa',
  },
  {
    worker_id: '246be337-104e-4c42-97a6-5e8950c2fb6e', // Alexandria Calzada (Austin)
    market: 'Austin',
    status: 'invited',
    chat_id: 'chat-alexandria',
  },
  {
    worker_id: 'cea20f1b-7f25-48d4-82f2-f99ef20a1839', // Olivia Little (Austin)
    market: 'Austin',
    status: 'liked',
    chat_id: 'chat-olivia',
  },
  {
    worker_id: '6239053a-4ebf-4d94-9329-bb5b4cb0a3ef', // Sally Guerra (Denver)
    market: 'Denver',
    status: 'liked',
    chat_id: 'chat-sally',
  },
  {
    worker_id: 'ee517577-5f70-4cbb-8b8a-21f9b4100e98', // Christina Porter (Houston)
    market: 'Houston',
    status: 'viewed',
    chat_id: 'chat-christina',
  },
  {
    worker_id: '2bdd5d65-ca5c-4768-95a6-5a15caf6ceae', // Kelly Mckinnon (Dallas)
    market: 'Dallas',
    status: 'viewed',
    chat_id: 'chat-kelly',
  },
  {
    worker_id: '5e194be2-c80c-4f81-b95b-a06a54fb4e4e', // Paige Lemon (Austin)
    market: 'Austin',
    status: 'not_interested',
    chat_id: 'chat-paige',
  },
];

async function pushConnections() {
  console.log('Checking worker_connections table...');

  // First try to clear existing connections
  const { error: deleteError } = await supabase
    .from('worker_connections')
    .delete()
    .not('worker_id', 'is', null);

  if (deleteError) {
    console.log('Warning deleting:', deleteError.message);
  } else {
    console.log('Cleared existing connections.');
  }

  // Insert new connections
  console.log('Inserting 8 connections...');
  const { data, error: insertError } = await supabase
    .from('worker_connections')
    .insert(connections)
    .select();

  if (insertError) {
    console.error('Error inserting:', insertError.message);

    // Try inserting one at a time to see which fields work
    console.log('\nTrying single insert with just worker_id and status...');
    const { error: singleError } = await supabase
      .from('worker_connections')
      .insert({
        worker_id: '8b1a7456-fdd0-4a0d-ae56-0634fbdc3868',
        status: 'connected'
      });

    if (singleError) {
      console.log('Single insert error:', singleError.message);
    } else {
      console.log('Single insert succeeded!');
    }
    return;
  }

  console.log(`Successfully inserted ${data?.length || 0} connections!`);

  // Verify by reading back
  const { data: verifyData, error: verifyError } = await supabase
    .from('worker_connections')
    .select('*');

  if (!verifyError) {
    console.log('\nVerification - connections in database:');
    console.log(JSON.stringify(verifyData, null, 2));
  }
}

pushConnections().catch(console.error);
