import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Experience Level Assignment Rules:
 *
 * 1. "proven_leader" - Has management experience (check work_experience for manager/lead/supervisor roles)
 * 2. "seasoned" - 2+ years retail experience OR 50+ Flexes
 * 3. "experienced" - 6 months to 2 years retail experience OR 20-49 Flexes
 * 4. "rising" - Under 6 months experience OR under 20 Flexes (default)
 *
 * Priority: proven_leader > seasoned > experienced > rising
 * Each worker goes in exactly one bucket.
 */

// Helper to parse duration string to months
function parseDurationToMonths(duration: string): number {
  if (!duration) return 0;

  const lower = duration.toLowerCase();

  // Match patterns like "2 years", "1 year", "6 months", "18 months", "1.5 years"
  const yearsMatch = lower.match(/(\d+\.?\d*)\s*(?:year|yr)/);
  const monthsMatch = lower.match(/(\d+)\s*(?:month|mo)/);

  let totalMonths = 0;

  if (yearsMatch) {
    totalMonths += parseFloat(yearsMatch[1]) * 12;
  }
  if (monthsMatch) {
    totalMonths += parseInt(monthsMatch[1]);
  }

  // Handle ranges like "1-2 years" - take the higher end
  const rangeMatch = lower.match(/(\d+)\s*-\s*(\d+)\s*(?:year|yr)/);
  if (rangeMatch) {
    totalMonths = parseInt(rangeMatch[2]) * 12;
  }

  return totalMonths;
}

// Check if work experience includes management roles
function hasManagementExperience(workExperience: any[]): boolean {
  if (!workExperience || !Array.isArray(workExperience)) return false;

  const managementKeywords = [
    'manager', 'lead', 'supervisor', 'director', 'head', 'chief',
    'assistant manager', 'shift lead', 'team lead', 'store manager',
    'department manager', 'area manager', 'regional manager', 'key holder'
  ];

  for (const job of workExperience) {
    // Check role field (string)
    const role = (job.role || job.title || '').toLowerCase();
    if (managementKeywords.some(keyword => role.includes(keyword))) {
      return true;
    }

    // Check roles array (array of strings)
    if (job.roles && Array.isArray(job.roles)) {
      for (const r of job.roles) {
        if (managementKeywords.some(keyword => r.toLowerCase().includes(keyword))) {
          return true;
        }
      }
    }

    // Check company field for embedded role (e.g., "Company [Store Manager]")
    const company = (job.company || '').toLowerCase();
    if (managementKeywords.some(keyword => company.includes(keyword))) {
      return true;
    }
  }

  return false;
}

// Calculate total retail experience in months from work_experience
function getTotalRetailExperienceMonths(workExperience: any[]): number {
  if (!workExperience || !Array.isArray(workExperience)) return 0;

  let totalMonths = 0;

  for (const job of workExperience) {
    const duration = job.duration || '';
    totalMonths += parseDurationToMonths(duration);
  }

  return totalMonths;
}

// Determine experience level for a worker
function determineExperienceLevel(worker: any): string {
  const shiftsOnReflex = worker.shifts_on_reflex || 0;
  const workExperience = worker.previous_experience || [];

  // Check for management experience first (highest priority)
  if (hasManagementExperience(workExperience)) {
    return 'proven_leader';
  }

  const totalMonths = getTotalRetailExperienceMonths(workExperience);

  // Seasoned: 2+ years (24 months) OR 50+ Flexes
  if (totalMonths >= 24 || shiftsOnReflex >= 50) {
    return 'seasoned';
  }

  // Experienced: 6-24 months OR 20-49 Flexes
  if (totalMonths >= 6 || shiftsOnReflex >= 20) {
    return 'experienced';
  }

  // Rising: under 6 months AND under 20 Flexes
  return 'rising';
}

// Fetch all rows from a table, paginating past Supabase's 1000-row default limit
async function fetchAllWorkers() {
  const PAGE_SIZE = 1000;
  let allWorkers: any[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, shifts_on_reflex, previous_experience')
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching workers:', error.message);
      return null;
    }

    allWorkers = allWorkers.concat(data || []);
    console.log(`  Fetched rows ${from}–${from + (data?.length ?? 0) - 1} (${allWorkers.length} total so far)`);

    if (!data || data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return allWorkers;
}

async function addExperienceLevel() {
  console.log('Fetching all workers (paginated)...');

  const workers = await fetchAllWorkers();
  if (!workers) return;

  console.log(`\nFound ${workers.length} workers total`);

  // Calculate experience levels
  const updates: { id: string; experience_level: string }[] = [];
  const levelCounts = { rising: 0, experienced: 0, seasoned: 0, proven_leader: 0 };

  for (const worker of workers) {
    const level = determineExperienceLevel(worker);
    updates.push({ id: worker.id, experience_level: level });
    levelCounts[level as keyof typeof levelCounts]++;
  }

  console.log('\n--- Distribution ---');
  console.log(`Rising talent:  ${levelCounts.rising}`);
  console.log(`Experienced:    ${levelCounts.experienced}`);
  console.log(`Seasoned pro:   ${levelCounts.seasoned}`);
  console.log(`Proven leader:  ${levelCounts.proven_leader}`);
  console.log(`Total:          ${updates.length}`);

  // Update each worker — do in batches to avoid hammering the API
  console.log('\nUpdating workers...');
  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('workers')
      .update({ experience_level: update.experience_level })
      .eq('id', update.id);

    if (updateError) {
      console.error(`Error updating ${update.id}:`, updateError.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`\n✓ Done! Updated ${successCount} workers, ${errorCount} errors.`);
}

addExperienceLevel().catch(console.error);
