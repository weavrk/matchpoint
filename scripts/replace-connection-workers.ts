import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Green achievement criteria (dark green only, not light green):
// - Market Favorite (market_favorite === true)
// - 100% On-Time (tardy_percent === 0)
// - 0 Call-Outs (urgent_cancel_percent === 0)

function hasGreenAchievement(worker: any): boolean {
  if (worker.market_favorite === true) return true;
  if (worker.tardy_percent === 0) return true;
  if (worker.urgent_cancel_percent === 0) return true;
  return false;
}

async function replaceConnectionWorkers() {
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
    .select('id, name, shifts_on_reflex, market_favorite, tardy_percent, urgent_cancel_percent')
    .in('id', workerIds);

  if (workersError) {
    console.error('Error fetching workers:', workersError);
    return;
  }

  const workerMap = new Map(workers?.map(w => [w.id, w]) || []);

  // Find problem connections
  const problemConnections: any[] = [];

  connections?.forEach(conn => {
    const worker = workerMap.get(conn.worker_id);
    if (!worker) {
      problemConnections.push({ connectionId: conn.id, workerId: conn.worker_id });
      return;
    }

    const shifts = worker.shifts_on_reflex ?? 0;
    const hasGreen = hasGreenAchievement(worker);

    if (shifts < 30 || !hasGreen) {
      problemConnections.push({
        connectionId: conn.id,
        workerId: worker.id,
        name: worker.name
      });
    }
  });

  console.log(`Found ${problemConnections.length} connections to replace`);

  // Find replacement candidates
  const existingWorkerIds = new Set(workerIds);

  const { data: replacements, error: replError } = await supabase
    .from('workers')
    .select('id, name, shifts_on_reflex, market_favorite, tardy_percent, urgent_cancel_percent')
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

  console.log(`Found ${availableReplacements.length} available replacement workers`);

  if (availableReplacements.length < problemConnections.length) {
    console.error('Not enough replacement workers available!');
    return;
  }

  // Perform replacements
  let successCount = 0;
  for (let i = 0; i < problemConnections.length; i++) {
    const prob = problemConnections[i];
    const replacement = availableReplacements[i];

    const { error: updateError } = await supabase
      .from('worker_connections')
      .update({ worker_id: replacement.id })
      .eq('id', prob.connectionId);

    if (updateError) {
      console.error(`Error replacing ${prob.name}:`, updateError);
    } else {
      console.log(`Replaced ${prob.name || 'unknown'} with ${replacement.name} (${replacement.shifts_on_reflex} shifts)`);
      successCount++;
      // Add replacement to existing set to avoid duplicates
      existingWorkerIds.add(replacement.id);
    }
  }

  console.log(`\nSuccessfully replaced ${successCount}/${problemConnections.length} connections`);

  // Verify final state
  const { data: finalConnections } = await supabase
    .from('worker_connections')
    .select('worker_id');

  const finalWorkerIds = finalConnections?.map(c => c.worker_id).filter(Boolean) || [];

  const { data: finalWorkers } = await supabase
    .from('workers')
    .select('id, name, shifts_on_reflex, market_favorite, tardy_percent, urgent_cancel_percent')
    .in('id', finalWorkerIds);

  let lowShiftCount = 0;
  let noGreenCount = 0;

  finalWorkers?.forEach(w => {
    if ((w.shifts_on_reflex ?? 0) < 30) lowShiftCount++;
    if (!hasGreenAchievement(w)) noGreenCount++;
  });

  console.log(`\nVerification:`);
  console.log(`  Workers with <30 shifts: ${lowShiftCount}`);
  console.log(`  Workers without green achievement: ${noGreenCount}`);
}

replaceConnectionWorkers();
