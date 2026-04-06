import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Green achievement criteria (dark green only, not light green):
// - Market Favorite (market_favorite === true)
// - 100% On-Time (tardy_percent === 0)
// - 0 Call-Outs (urgent_cancel_percent === 0)

function hasGreenAchievement(worker: any): boolean {
  // Market Favorite
  if (worker.market_favorite === true) return true;
  // 100% On-Time
  if (worker.tardy_percent === 0) return true;
  // 0 Call-Outs
  if (worker.urgent_cancel_percent === 0) return true;

  return false;
}

async function checkConnectionWorkers() {
  // Get all connections with worker data
  const { data: connections, error: connError } = await supabase
    .from('worker_connections')
    .select('id, worker_id, market, status');

  if (connError) {
    console.error('Error fetching connections:', connError);
    return;
  }

  const workerIds = connections?.map(c => c.worker_id).filter(Boolean) || [];

  // Get worker data for all connected workers
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('id, name, shifts_on_reflex, market_favorite, tardy_percent, urgent_cancel_percent, store_favorite_count')
    .in('id', workerIds);

  if (workersError) {
    console.error('Error fetching workers:', workersError);
    return;
  }

  const workerMap = new Map(workers?.map(w => [w.id, w]) || []);

  console.log('=== CONNECTIONS WITH LOW SHIFTS OR NO GREEN ACHIEVEMENT ===\n');

  const problemConnections: any[] = [];

  connections?.forEach(conn => {
    const worker = workerMap.get(conn.worker_id);
    if (!worker) {
      console.log(`Connection ${conn.id}: Worker not found`);
      problemConnections.push({
        connectionId: conn.id,
        workerId: conn.worker_id,
        name: 'NOT FOUND',
        market: conn.market,
        shifts: 0,
        hasGreenAchievement: false
      });
      return;
    }

    const shifts = worker.shifts_on_reflex ?? 0;
    const hasGreen = hasGreenAchievement(worker);

    if (shifts < 30 || !hasGreen) {
      problemConnections.push({
        connectionId: conn.id,
        workerId: worker.id,
        name: worker.name,
        market: conn.market,
        shifts,
        marketFavorite: worker.market_favorite,
        tardyPercent: worker.tardy_percent,
        urgentCancelPercent: worker.urgent_cancel_percent,
        hasGreenAchievement: hasGreen
      });
      console.log(`${worker.name} (${conn.market}): ${shifts} shifts, Green: ${hasGreen}`);
      console.log(`  MarketFav: ${worker.market_favorite}, Tardy: ${worker.tardy_percent}%, UC: ${worker.urgent_cancel_percent}%`);
    }
  });

  console.log(`\nTotal problem connections: ${problemConnections.length}`);

  // Find replacement candidates
  console.log('\n=== AVAILABLE HIGH-QUALITY REPLACEMENT WORKERS ===\n');

  const existingWorkerIds = new Set(workerIds);

  const { data: replacements, error: replError } = await supabase
    .from('workers')
    .select('id, name, shifts_on_reflex, market_favorite, tardy_percent, urgent_cancel_percent, store_favorite_count')
    .gte('shifts_on_reflex', 30)
    .order('shifts_on_reflex', { ascending: false })
    .limit(200);

  if (replError) {
    console.error('Error fetching replacements:', replError);
    return;
  }

  const availableReplacements = replacements?.filter(w =>
    !existingWorkerIds.has(w.id) && hasGreenAchievement(w)
  ) || [];

  console.log(`Found ${availableReplacements.length} available high-quality workers`);
  availableReplacements.slice(0, 20).forEach(w => {
    console.log(`${w.name}: ${w.shifts_on_reflex} shifts, MarketFav: ${w.market_favorite}, Tardy: ${w.tardy_percent}%, UC: ${w.urgent_cancel_percent}%`);
  });

  // Output JSON for replacement script
  console.log('\n=== REPLACEMENT PLAN ===\n');
  const replacementPlan = problemConnections.map((prob, idx) => ({
    connectionId: prob.connectionId,
    oldWorkerId: prob.workerId,
    oldWorkerName: prob.name,
    newWorkerId: availableReplacements[idx]?.id,
    newWorkerName: availableReplacements[idx]?.name,
    newShifts: availableReplacements[idx]?.shifts_on_reflex
  }));

  console.log(JSON.stringify(replacementPlan, null, 2));
}

checkConnectionWorkers();
