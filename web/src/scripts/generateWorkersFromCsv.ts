/**
 * Script 1: generateWorkersFromCsv.ts
 *
 * Transforms Reflex platform CSV export and inserts new workers directly into Supabase.
 * - Queries Supabase for existing worker_ids → skips them
 * - Detects gender: (1) retailer_feedback pronouns, (2) first name lookup, (3) default female
 * - Generates full name: first name from gender pool + last name from display_name
 * - Parses all CSV fields into workers table schema
 * - Calculates experience_level using same rules as addExperienceLevel.ts
 * - photo is left NULL — to be filled via portrait review GUI
 * - Inserts in batches of INSERT_BATCH_SIZE directly to Supabase
 *
 * Usage: npx tsx web/src/scripts/generateWorkersFromCsv.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const CSV_PATH = '/Users/katherine_1/Downloads/query_result_2026-04-07T15_08_37.011663421-05_00.csv';
const INSERT_BATCH_SIZE = 200;

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) { console.error('ERROR: SUPABASE_SERVICE_KEY not in .env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Name pools ────────────────────────────────────────────────────────────────

const FEMALE_FIRST_NAMES = [
  'Aaliyah','Adriana','Alexis','Alicia','Alisha','Aliyah','Allison','Alyssa','Amanda','Amber',
  'Amelia','Amy','Ana','Andrea','Angela','Anita','Anna','Ariana','Ashley','Autumn',
  'Ava','Bailey','Bianca','Briana','Brianna','Brittany','Brooke','Brooklyn','Caitlin','Camila',
  'Carmen','Caroline','Cassandra','Charlotte','Chelsea','Chloe','Christina','Christine','Claire','Claudia',
  'Courtney','Crystal','Daisy','Dana','Danielle','Destiny','Diana','Dominique','Elena','Elizabeth',
  'Ella','Emily','Emma','Erica','Erika','Erin','Eva','Faith','Felicia','Genesis',
  'Gianna','Grace','Hailey','Haley','Hannah','Heather','Holly','Hope','Imani','Isabella',
  'Jackie','Jade','Jada','Jamie','Jasmine','Jennifer','Jessica','Jillian','Jocelyn','Jordan',
  'Josephine','Joy','Julia','Juliana','Kayla','Kendra','Kennedy','Kiara','Kimberly','Kristen',
  'Kylie','Laura','Lauren','Leah','Leslie','Lillian','Lily','Lindsay','Lisa','Lucy',
  'Mackenzie','Madeline','Madison','Maria','Mariah','Marissa','Maya','Megan','Melanie','Melissa',
  'Mia','Michelle','Miranda','Molly','Monica','Morgan','Nadia','Naomi','Natalie','Natasha',
  'Nicole','Nina','Olivia','Paige','Patricia','Peyton','Priscilla','Rachel','Raven','Rebecca',
  'Riley','Rosa','Ruby','Sabrina','Samantha','Sara','Savannah','Selena','Shannon','Shelby',
  'Sierra','Skylar','Sophia','Stacy','Stephanie','Summer','Sydney','Tara','Taylor','Tessa',
  'Tiffany','Trinity','Valerie','Vanessa','Veronica','Victoria','Vivian','Whitney','Zoe','Zoey',
];

const MALE_FIRST_NAMES = [
  'Aaron','Adam','Adrian','Alex','Alexander','Andre','Andrew','Angel','Anthony','Austin',
  'Benjamin','Blake','Brandon','Brian','Bryan','Caleb','Cameron','Carlos','Casey','Chad',
  'Charles','Chase','Christian','Christopher','Cody','Cole','Colin','Connor','Corey','Curtis',
  'Damian','Daniel','Darren','David','Derek','Devin','Dominic','Drew','Dylan','Edgar',
  'Eli','Elijah','Eric','Ethan','Evan','Felix','Fernando','Francisco','Gabriel','Garrett',
  'Gavin','George','Hector','Hunter','Ian','Isaac','Ivan','Jack','Jackson','Jacob',
  'Jaden','Jake','James','Jared','Jason','Jaylen','Jeremy','Jesse','Joel','John',
  'Jonathan','Jordan','Jorge','Jose','Joseph','Joshua','Julian','Justin','Kai','Keith',
  'Kevin','Kyle','Levi','Liam','Logan','Louis','Lucas','Luis','Luke','Marcus',
  'Mark','Martin','Mason','Matthew','Max','Michael','Miguel','Miles','Mitchell','Nathan',
  'Nelson','Nicholas','Noah','Oliver','Omar','Oscar','Owen','Parker','Patrick','Paul',
  'Pedro','Philip','Preston','Rafael','Raymond','Ricardo','Richard','Robert','Ronald','Ryan',
  'Samuel','Sean','Seth','Shane','Shawn','Spencer','Stephen','Steven','Timothy','Tony',
  'Travis','Trevor','Tristan','Troy','Tyler','Victor','Vincent','Wesley','William','Xavier',
];

// ── Gender detection ──────────────────────────────────────────────────────────

const FEMALE_NAMES_SET = new Set(FEMALE_FIRST_NAMES.map(n => n.toLowerCase()));
const MALE_NAMES_SET = new Set(MALE_FIRST_NAMES.map(n => n.toLowerCase()));

function detectGender(retailerFeedback: string, firstName: string): 'male' | 'female' {
  // Priority 1: pronouns in retailer feedback
  if (retailerFeedback) {
    const text = retailerFeedback.toLowerCase();
    const femaleCount = (text.match(/\b(she|her|hers|herself)\b/g) || []).length;
    const maleCount = (text.match(/\b(he|him|his|himself)\b/g) || []).length;
    if (femaleCount > maleCount && femaleCount >= 2) return 'female';
    if (maleCount > femaleCount && maleCount >= 2) return 'male';
  }

  // Priority 2: first name lookup
  const lower = firstName.toLowerCase();
  if (FEMALE_NAMES_SET.has(lower)) return 'female';
  if (MALE_NAMES_SET.has(lower)) return 'male';

  // Default: female
  return 'female';
}

// ── Deterministic name picker (hash worker_id → index) ───────────────────────

function hashWorkerIdToIndex(workerId: number, poolSize: number): number {
  let h = workerId;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = (h >>> 16) ^ h;
  return Math.abs(h) % poolSize;
}

function pickFirstName(workerId: number, gender: 'male' | 'female'): string {
  const pool = gender === 'female' ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES;
  return pool[hashWorkerIdToIndex(workerId, pool.length)];
}

// ── Field parsers ─────────────────────────────────────────────────────────────

const DURATION_MAP: Record<string, string> = {
  SHORT: '< 6 months',
  MEDIUM: '6-18 months',
  LONG: '2+ years',
  UNKNOWN: '',
};

interface PriorJob {
  company: string;
  roles: string[];
  duration: string;
}

function parsePriorExperience(raw: string): PriorJob[] {
  if (!raw || !raw.trim()) return [];

  const entries = raw.split('|').map(e => e.trim()).filter(Boolean);
  const jobs: PriorJob[] = [];

  for (const entry of entries) {
    // Pattern: "Company [bracket] - Role (DURATION)" or "Company - Role (DURATION)"
    const match = entry.match(/^(.*?)\s*-\s*(.+?)\s*\((SHORT|MEDIUM|LONG|UNKNOWN)\)\s*$/i);
    if (!match) continue;

    let company = match[1].trim().replace(/\[.*?\]/g, '').trim();
    const role = match[2].trim();
    const duration = DURATION_MAP[match[3].toUpperCase()] ?? '';

    // Skip empty or generic company names
    if (!company || company.toLowerCase() === 'unknown') company = '';
    if (!role || role.toLowerCase() === 'unknown') continue;

    jobs.push({ company, roles: [role], duration });
  }

  return jobs;
}

function parseEndorsementCounts(raw: string): Record<string, number> {
  if (!raw || !raw.trim()) return {};
  const counts: Record<string, number> = {};
  for (const tag of raw.split(',').map(t => t.trim()).filter(Boolean)) {
    counts[tag] = (counts[tag] || 0) + 1;
  }
  return counts;
}

function parseBrandsWorked(raw: string): { name: string }[] {
  if (!raw || !raw.trim()) return [];
  return raw.split(',').map(b => b.trim()).filter(Boolean).map(name => ({ name }));
}

function parseRatio(raw: string): { ratio: string; percent: number } | null {
  if (!raw || !raw.trim()) return null;
  const match = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  const num = parseInt(match[1]);
  const den = parseInt(match[2]);
  const ratio = `${num}/${den}`;
  const percent = den > 0 ? parseFloat(((num / den) * 100).toFixed(2)) : 0;
  return { ratio, percent };
}

function extractShiftExperience(jobs: PriorJob[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    for (const role of job.roles) {
      if (role && role.toLowerCase() !== 'unknown') {
        counts[role] = (counts[role] || 0) + 1;
      }
    }
  }
  return counts;
}

// ── Experience level (same rules as addExperienceLevel.ts) ───────────────────

const MANAGEMENT_KEYWORDS = [
  'manager', 'lead', 'supervisor', 'director', 'head', 'chief',
  'assistant manager', 'shift lead', 'team lead', 'store manager',
  'department manager', 'area manager', 'regional manager', 'key holder',
];

function durationToMonths(duration: string): number {
  if (!duration) return 0;
  if (duration === '< 6 months') return 3;
  if (duration === '6-18 months') return 12;
  if (duration === '2+ years') return 24;
  return 0;
}

function calcExperienceLevel(jobs: PriorJob[], shiftsOnReflex: number): string {
  // proven_leader: has management role
  const hasManagement = jobs.some(j =>
    j.roles.some(r => MANAGEMENT_KEYWORDS.some(k => r.toLowerCase().includes(k))) ||
    MANAGEMENT_KEYWORDS.some(k => j.company.toLowerCase().includes(k))
  );
  if (hasManagement) return 'proven_leader';

  const totalMonths = jobs.reduce((sum, j) => sum + durationToMonths(j.duration), 0);

  if (totalMonths >= 24 || shiftsOnReflex >= 50) return 'seasoned';
  if (totalMonths >= 6 || shiftsOnReflex >= 20) return 'experienced';
  return 'rising';
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

function sql(s: string | null | undefined): string {
  if (s === null || s === undefined) return 'NULL';
  return `'${s.replace(/'/g, "''")}'`;
}

function sqlJson(obj: unknown): string {
  if (obj === null || obj === undefined) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function sqlBool(b: boolean): string {
  return b ? 'true' : 'false';
}

function sqlNum(n: number | null): string {
  if (n === null || n === undefined) return 'NULL';
  return String(n);
}

// ── CSV parser (handles quoted fields with commas) ────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }

  return rows;
}

// ── Supabase: fetch all existing worker_ids ───────────────────────────────────

async function fetchExistingWorkerIds(): Promise<Set<number>> {
  const PAGE_SIZE = 1000;
  const ids = new Set<number>();
  let from = 0;

  console.log('Fetching existing worker_ids from Supabase...');

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_id')
      .not('worker_id', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching workers:', error.message);
      break;
    }

    for (const row of data || []) {
      if (row.worker_id != null) ids.add(Number(row.worker_id));
    }

    console.log(`  Fetched ${from}–${from + (data?.length ?? 0) - 1} (${ids.size} IDs so far)`);

    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`→ ${ids.size} existing workers found, will skip these.\n`);
  return ids;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('=== generateWorkersFromCsv ===\n');

  // 1. Get existing worker_ids from DB
  const existingIds = await fetchExistingWorkerIds();

  // 2. Read and parse CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const csv = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCSV(csv);
  console.log(`CSV rows: ${rows.length}`);

  // 3. Filter to new workers only
  const newRows = rows.filter(row => {
    const wid = parseInt(row.worker_id);
    return !isNaN(wid) && !existingIds.has(wid);
  });

  console.log(`New workers to insert: ${newRows.length}`);
  console.log(`Skipping: ${rows.length - newRows.length} existing\n`);

  // 4. Transform all rows into worker objects
  const workers: Record<string, unknown>[] = [];
  const levelCounts = { rising: 0, experienced: 0, seasoned: 0, proven_leader: 0 };
  const genderCounts = { male: 0, female: 0 };
  let skipped = 0;

  for (const row of newRows) {
    const workerId = parseInt(row.worker_id);
    const workerUuid = row.worker_uuid?.trim();

    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!workerUuid || !uuidPattern.test(workerUuid)) { skipped++; continue; }

    const lastName = row.display_name?.trim() || '';
    if (!lastName) { skipped++; continue; }

    const gender = detectGender(row.retailer_feedback || '', lastName.split(' ')[0]);
    genderCounts[gender]++;

    const firstName = pickFirstName(workerId, gender);
    const shiftsOnReflex = parseInt(row.completed_shift_count) || 0;
    const markets = (row.markets || '').split(',').map(m => m.trim()).filter(Boolean);
    const tardyParsed = parseRatio(row.tardy_ratio);
    const cancelParsed = parseRatio(row.urgent_cancel_ratio);
    const prevExperience = parsePriorExperience(row.prior_experience || '');
    const endorsementCounts = parseEndorsementCounts(row.endorsement_tags || '');
    const brandsWorked = parseBrandsWorked(row.brands_worked || '');
    const shiftExperience = extractShiftExperience(prevExperience);
    const experienceLevel = calcExperienceLevel(prevExperience, shiftsOnReflex);
    levelCounts[experienceLevel as keyof typeof levelCounts]++;

    const retailerFeedback = (row.retailer_feedback || '').trim();

    let interviewTranscript: unknown = null;
    if (row.interview_transcript && row.interview_transcript !== '{}') {
      try { interviewTranscript = JSON.parse(row.interview_transcript); } catch { /* skip */ }
    }

    workers.push({
      id: randomUUID(),
      worker_id: workerId,
      worker_uuid: workerUuid,
      name: `${firstName} ${lastName}`,
      gender,
      market: markets[0] || null,
      shift_verified: shiftsOnReflex > 0,
      actively_looking: (row.current_status || '').toUpperCase() === 'ACTIVE',
      market_favorite: parseFloat(row.retailer_score) >= 80 && shiftsOnReflex >= 10,
      shifts_on_reflex: shiftsOnReflex,
      invited_back_stores: parseInt(row.invite_back_count) || 0,
      unique_store_count: parseInt(row.locations_favorited) || 0,
      tardy_ratio: tardyParsed?.ratio ?? null,
      tardy_percent: tardyParsed?.percent ?? null,
      urgent_cancel_ratio: cancelParsed?.ratio ?? null,
      urgent_cancel_percent: cancelParsed?.percent ?? null,
      current_tier: row.current_tier || null,
      experience_level: experienceLevel,
      brands_worked: brandsWorked.length ? brandsWorked : null,
      endorsement_counts: Object.keys(endorsementCounts).length ? endorsementCounts : null,
      shift_experience: Object.keys(shiftExperience).length ? shiftExperience : null,
      previous_experience: prevExperience.length ? prevExperience : null,
      retailer_quotes: retailerFeedback ? [{ quote: retailerFeedback }] : null,
      reflex_activity: shiftsOnReflex > 0
        ? { shiftsByTier: { [row.current_tier || 'unknown']: shiftsOnReflex } }
        : null,
      interview_transcript: interviewTranscript,
    });
  }

  console.log(`Transformed: ${workers.length} workers  |  Skipped (invalid): ${skipped}\n`);

  // 5. Batch insert directly into Supabase
  let insertedCount = 0;
  let errorCount = 0;
  const totalBatches = Math.ceil(workers.length / INSERT_BATCH_SIZE);

  for (let i = 0; i < workers.length; i += INSERT_BATCH_SIZE) {
    const batch = workers.slice(i, i + INSERT_BATCH_SIZE);
    const batchNum = Math.floor(i / INSERT_BATCH_SIZE) + 1;

    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + INSERT_BATCH_SIZE, workers.length)})... `);

    const { error } = await supabase
      .from('workers')
      .insert(batch, { onConflict: 'worker_id' } as Record<string, unknown>);

    if (error) {
      console.error(`ERROR: ${error.message}`);
      errorCount += batch.length;
    } else {
      insertedCount += batch.length;
      console.log('✓');
    }

    // Small delay to avoid hammering the API
    if (i + INSERT_BATCH_SIZE < workers.length) await delay(100);
  }

  // 6. Summary
  console.log('\n=== Done ===');
  console.log(`Inserted: ${insertedCount}  |  Errors: ${errorCount}  |  Skipped: ${skipped}`);
  console.log(`\nGender:  Female ${genderCounts.female}  |  Male ${genderCounts.male}`);
  console.log(`\nExperience levels:`);
  console.log(`  Rising: ${levelCounts.rising}  |  Experienced: ${levelCounts.experienced}  |  Seasoned: ${levelCounts.seasoned}  |  Proven leader: ${levelCounts.proven_leader}`);
}

run().catch(console.error);
