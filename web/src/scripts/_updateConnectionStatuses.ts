/**
 * Update specific worker_connections statuses and add chat messages.
 *
 * Make connected + chat_open:
 *   Anita C. (Dallas), Sofia A. (Austin), Katherine G. (Austin), Trelloni R. (Houston)
 *
 * Make shift_booked:
 *   Holly S. (Orlando)
 *
 * Usage: npx tsx web/src/scripts/_updateConnectionStatuses.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Workers to make connected with chat
const CONNECT_WITH_CHAT = [
  { name: 'Anita', market: 'Dallas' },
  { name: 'Sofia', market: 'Austin' },
  { name: 'Katherine', market: 'Austin' },
  { name: 'Trelloni', market: 'Houston' },
];

// Workers to make shift_booked
const SHIFT_BOOKED = [
  { name: 'Holly', market: 'Orlando' },
];

async function run() {
  // Get all connections with worker data
  const { data: connections, error } = await supabase
    .from('worker_connections')
    .select('*, worker:workers(id, name, market)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching connections:', error);
    process.exit(1);
  }

  console.log(`Found ${connections?.length || 0} connections`);

  // Find and update "connect with chat" workers
  for (const target of CONNECT_WITH_CHAT) {
    const conn = connections?.find(c => {
      const w = c.worker as any;
      return w?.name?.toLowerCase().startsWith(target.name.toLowerCase()) &&
             w?.market?.toLowerCase().includes(target.market.toLowerCase());
    });

    if (!conn) {
      console.log(`NOT FOUND: ${target.name} in ${target.market}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('worker_connections')
      .update({
        status: 'accepted',
        connected: true,
        chat_open: true,
        invited: true,
      })
      .eq('id', conn.id);

    if (updateError) {
      console.error(`Error updating ${target.name}:`, updateError.message);
    } else {
      console.log(`Updated ${target.name} (${target.market}) → connected + chat_open`);
    }
  }

  // Find and update "shift_booked" workers
  for (const target of SHIFT_BOOKED) {
    const conn = connections?.find(c => {
      const w = c.worker as any;
      return w?.name?.toLowerCase().startsWith(target.name.toLowerCase()) &&
             w?.market?.toLowerCase().includes(target.market.toLowerCase());
    });

    if (!conn) {
      console.log(`NOT FOUND: ${target.name} in ${target.market}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('worker_connections')
      .update({
        status: 'accepted',
        connected: true,
        chat_open: true,
        shift_booked: true,
      })
      .eq('id', conn.id);

    if (updateError) {
      console.error(`Error updating ${target.name}:`, updateError.message);
    } else {
      console.log(`Updated ${target.name} (${target.market}) → shift_booked + chat_open`);
    }
  }

  console.log('Done.');
}

run();
