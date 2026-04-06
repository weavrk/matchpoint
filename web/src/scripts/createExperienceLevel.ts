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
    'department manager', 'area manager', 'regional manager'
  ];

  for (const job of workExperience) {
    // Check roles array (primary field in our data)
    const roles = job.roles || [];
    if (Array.isArray(roles)) {
      for (const role of roles) {
        const roleLower = (role || '').toLowerCase();
        if (managementKeywords.some(keyword => roleLower.includes(keyword))) {
          return true;
        }
      }
    }

    // Also check role/title fields as fallback
    const roleStr = (job.role || job.title || '').toLowerCase();
    if (managementKeywords.some(keyword => roleStr.includes(keyword))) {
      return true;
    }

    // Also check company field since sometimes role is embedded there
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

async function createAndPopulateExperienceLevel() {
  console.log('Step 1: Adding experience_level column via RPC...');

  // Try to add the column - this requires database function or direct SQL
  // Since we can't run DDL directly from anon key, we'll need to use Supabase Dashboard
  // OR check if the column already exists

  console.log('\n⚠️  NOTE: You need to manually add the column in Supabase Dashboard:');
  console.log('   1. Go to https://supabase.com/dashboard/project/kxfbismfpmjwvemfznvm/editor');
  console.log('   2. Open SQL Editor');
  console.log('   3. Run: ALTER TABLE workers ADD COLUMN IF NOT EXISTS experience_level TEXT;');
  console.log('\n   Press Ctrl+C to exit, then run this script again after adding the column.\n');

  // Check if column exists by trying a query
  const { error: checkError } = await supabase
    .from('workers')
    .select('experience_level')
    .limit(1);

  if (checkError && checkError.message.includes('does not exist')) {
    console.log('❌ Column does not exist yet. Please add it manually first.');
    return;
  }

  console.log('✓ Column exists! Proceeding to populate...\n');

  console.log('Step 2: Fetching all workers...');

  const { data: workers, error: fetchError } = await supabase
    .from('workers')
    .select('id, name, shifts_on_reflex, previous_experience');

  if (fetchError) {
    console.error('Error fetching workers:', fetchError.message);
    return;
  }

  console.log(`Found ${workers?.length} workers`);

  // Calculate experience levels
  const updates: { id: string; experience_level: string }[] = [];
  const levelCounts = { rising: 0, experienced: 0, seasoned: 0, proven_leader: 0 };

  for (const worker of workers || []) {
    const level = determineExperienceLevel(worker);
    updates.push({ id: worker.id, experience_level: level });
    levelCounts[level as keyof typeof levelCounts]++;
  }

  console.log('\n--- Distribution ---');
  console.log(`Rising talent: ${levelCounts.rising}`);
  console.log(`Experienced: ${levelCounts.experienced}`);
  console.log(`Seasoned pro: ${levelCounts.seasoned}`);
  console.log(`Proven leader: ${levelCounts.proven_leader}`);

  // Update each worker with their experience level
  console.log('\nStep 3: Updating workers...');

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

createAndPopulateExperienceLevel().catch(console.error);
