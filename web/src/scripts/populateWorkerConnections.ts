import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Distribution requirements for 43 workers:
// - 40% store favorites (17 workers) -> saved_for_later: true
// - 12+ open chat (at least 12) -> chat_open: true, with chat_id
// - 80% connected (34 workers) -> connected: true
// - All invited (43) -> invited: true
// - 3 shift scheduled -> shift_scheduled: true
// - 2 shift booked -> shift_booked: true
// - 20% saved for later (9 workers) -> saved_for_later: true
// - 30% with resumes (13 workers) -> connected: true, chat_open: true (pool for shift booked/scheduled)
// - 4 SW markets: Austin, Dallas, Houston, Phoenix

async function populateConnections() {
  // First get workers from each market
  const { data: austinWorkers } = await supabase
    .from('workers')
    .select('id, name, market')
    .eq('market', 'Austin')
    .limit(15);

  const { data: dallasWorkers } = await supabase
    .from('workers')
    .select('id, name, market')
    .eq('market', 'Dallas')
    .limit(15);

  const { data: houstonWorkers } = await supabase
    .from('workers')
    .select('id, name, market')
    .eq('market', 'Houston')
    .limit(10);

  const { data: phoenixWorkers } = await supabase
    .from('workers')
    .select('id, name, market')
    .eq('market', 'Phoenix')
    .limit(3);

  const allWorkers = [
    ...(austinWorkers || []),
    ...(dallasWorkers || []),
    ...(houstonWorkers || []),
    ...(phoenixWorkers || []),
  ];

  console.log(`Total workers: ${allWorkers.length}`);
  console.log(`- Austin: ${austinWorkers?.length || 0}`);
  console.log(`- Dallas: ${dallasWorkers?.length || 0}`);
  console.log(`- Houston: ${houstonWorkers?.length || 0}`);
  console.log(`- Phoenix: ${phoenixWorkers?.length || 0}`);

  // Generate name-based chat IDs
  const getChatId = (name: string) => 'chat-' + name.toLowerCase().split(' ')[0];

  // Status assignments based on requirements:
  // Workers 0-2: shift_scheduled (3) - must have connected, chat_open, resume pool
  // Workers 3-4: shift_booked (2) - must have connected, chat_open, resume pool
  // Workers 5-12: chat_open with resume (8 more to hit 13 total with resumes)
  // Workers 13-16: chat_open without resume (4 more to ensure 12+ chat_open)
  // Workers 17-33: connected but chat closed (17 workers)
  // Workers 34-42: saved_for_later only (9 workers - 20%)

  // Status enum values based on flow:
  // liked -> saved_for_later bucket
  // invited -> waiting for response
  // accepted -> connected, chat_open
  // not_interested -> no connection
  // removed -> no connection

  const connections = allWorkers.map((worker, idx) => {
    // Determine status and flags based on position
    let status: string;
    let connected: boolean;
    let chat_open: boolean;
    let shift_booked: boolean;
    let shift_scheduled: boolean;
    let saved_for_later: boolean;
    let chat_id: string | null;

    if (idx < 3) {
      // Shift scheduled (3) - highest engagement
      status = 'accepted';
      connected = true;
      chat_open = true;
      shift_booked = true; // had to book first
      shift_scheduled = true;
      saved_for_later = false;
      chat_id = getChatId(worker.name);
    } else if (idx < 5) {
      // Shift booked (2) - very high engagement
      status = 'accepted';
      connected = true;
      chat_open = true;
      shift_booked = true;
      shift_scheduled = false;
      saved_for_later = false;
      chat_id = getChatId(worker.name);
    } else if (idx < 13) {
      // Connected + chat open with resume potential (8)
      status = 'accepted';
      connected = true;
      chat_open = true;
      shift_booked = false;
      shift_scheduled = false;
      saved_for_later = false;
      chat_id = getChatId(worker.name);
    } else if (idx < 17) {
      // Connected + chat open, no resume (4)
      status = 'accepted';
      connected = true;
      chat_open = true;
      shift_booked = false;
      shift_scheduled = false;
      saved_for_later = false;
      chat_id = getChatId(worker.name);
    } else if (idx < 34) {
      // Connected but chat closed (17) - store favorites
      status = 'accepted';
      connected = true;
      chat_open = false;
      shift_booked = false;
      shift_scheduled = false;
      // 40% store favorites = ~17 workers (spread across connected)
      saved_for_later = idx < 26; // first 9 of this group are saved for later too
      chat_id = null;
    } else {
      // Saved for later only (9) - liked but not connected
      status = 'liked';
      connected = false;
      chat_open = false;
      shift_booked = false;
      shift_scheduled = false;
      saved_for_later = true;
      chat_id = null;
    }

    return {
      worker_id: worker.id,
      market: worker.market,
      status,
      invited: true, // all are invited
      connected,
      chat_open,
      shift_booked,
      shift_scheduled,
      saved_for_later,
      chat_id,
    };
  });

  // Clear existing
  const { error: deleteError } = await supabase
    .from('worker_connections')
    .delete()
    .not('worker_id', 'is', null);

  if (deleteError) {
    console.log('Delete error:', deleteError.message);
  }

  // Insert new connections
  const { data, error } = await supabase
    .from('worker_connections')
    .insert(connections)
    .select();

  if (error) {
    console.error('Insert error:', error.message);
    return;
  }

  console.log(`\nInserted ${data?.length} connections`);

  // Summary stats
  const stats = {
    total: connections.length,
    invited: connections.filter(c => c.invited).length,
    connected: connections.filter(c => c.connected).length,
    chat_open: connections.filter(c => c.chat_open).length,
    shift_booked: connections.filter(c => c.shift_booked).length,
    shift_scheduled: connections.filter(c => c.shift_scheduled).length,
    saved_for_later: connections.filter(c => c.saved_for_later).length,
    with_chat_id: connections.filter(c => c.chat_id).length,
  };

  console.log('\n--- Summary ---');
  console.log(`Total: ${stats.total}`);
  console.log(`Invited (100%): ${stats.invited} (${Math.round(stats.invited/stats.total*100)}%)`);
  console.log(`Connected (80%): ${stats.connected} (${Math.round(stats.connected/stats.total*100)}%)`);
  console.log(`Chat open (12+): ${stats.chat_open}`);
  console.log(`Shift booked (2): ${stats.shift_booked}`);
  console.log(`Shift scheduled (3): ${stats.shift_scheduled}`);
  console.log(`Saved for later (20%): ${stats.saved_for_later} (${Math.round(stats.saved_for_later/stats.total*100)}%)`);
  console.log(`With chat_id: ${stats.with_chat_id}`);

  // List by market
  console.log('\n--- By Market ---');
  const byMarket: Record<string, number> = {};
  connections.forEach(c => {
    byMarket[c.market] = (byMarket[c.market] || 0) + 1;
  });
  Object.entries(byMarket).forEach(([m, c]) => console.log(`${m}: ${c}`));
}

populateConnections().catch(console.error);
