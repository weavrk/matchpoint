/**
 * Script 2: generateWorkerSummariesV3.ts
 *
 * AI summary generation for new workers inserted by generateWorkersFromCsv.ts.
 * - Queries Supabase for workers missing about_me → only processes those
 * - Matches them back to CSV rows by worker_id to get retailer_feedback + experience data
 * - Generates about_me + retailer_summary using Gemini
 * - Updates Supabase directly after every batch — no SQL files, no manual pasting
 * - Resume-safe: re-querying DB each run means already-done workers are naturally skipped
 * - Ctrl+C any time → re-run to pick up where you left off
 *
 * Usage:
 *   npx tsx web/src/scripts/generateWorkerSummariesV3.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs'; // used for CSV reading
import * as dotenv from 'dotenv';

dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const CSV_PATH = '/Users/katherine_1/Downloads/active_worker_list_2026-04-07T16_08_10.140723639-05_00.csv';
const BATCH_SIZE = 10;
const DELAY_MS = 200;

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseServiceKey) { console.error('ERROR: SUPABASE_SERVICE_KEY not in .env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ── Gender detection (matches generateWorkersFromCsv.ts logic) ────────────────

const FEMALE_NAMES_SET = new Set([
  'aaliyah','adriana','alexis','alicia','alisha','aliyah','allison','alyssa','amanda','amber',
  'amelia','amy','ana','andrea','angela','anita','anna','ariana','ashley','autumn',
  'ava','bailey','bianca','briana','brianna','brittany','brooke','brooklyn','caitlin','camila',
  'carmen','caroline','cassandra','charlotte','chelsea','chloe','christina','christine','claire','claudia',
  'courtney','crystal','daisy','dana','danielle','destiny','diana','dominique','elena','elizabeth',
  'ella','emily','emma','erica','erika','erin','eva','faith','felicia','genesis',
  'gianna','grace','hailey','haley','hannah','heather','holly','hope','imani','isabella',
  'jackie','jade','jada','jamie','jasmine','jennifer','jessica','jillian','jocelyn','jordan',
  'josephine','joy','julia','juliana','kayla','kendra','kennedy','kiara','kimberly','kristen',
  'kylie','laura','lauren','leah','leslie','lillian','lily','lindsay','lisa','lucy',
  'mackenzie','madeline','madison','maria','mariah','marissa','maya','megan','melanie','melissa',
  'mia','michelle','miranda','molly','monica','morgan','nadia','naomi','natalie','natasha',
  'nicole','nina','olivia','paige','patricia','peyton','priscilla','rachel','raven','rebecca',
  'riley','rosa','ruby','sabrina','samantha','sara','savannah','selena','shannon','shelby',
  'sierra','skylar','sophia','stacy','stephanie','summer','sydney','tara','taylor','tessa',
  'tiffany','trinity','valerie','vanessa','veronica','victoria','vivian','whitney','zoe','zoey',
  // legacy names from V2
  'mary','patricia','linda','barbara','susan','karen','betty','margaret','sandra',
  'donna','dorothy','carol','deborah','sharon','cynthia','kathleen','shirley','janet',
  'catherine','heather','diane','ruth','julie','virginia','kelly','joan','evelyn',
  'judith','jacqueline','martha','gloria','teresa','ann','frances','kathryn','janice',
  'jean','abigail','alice','judy','denise','doris','marilyn','beverly','theresa',
  'brittney','crystal','destiny','adrienne','autumn','chippy','essence','ashonte','aarika',
  'kiora','kisha','kristi','kristine','moira','yesenia','yoko',
]);

const MALE_NAMES_SET = new Set([
  'aaron','adam','adrian','alex','alexander','andre','andrew','angel','anthony','austin',
  'benjamin','blake','brandon','brian','bryan','caleb','cameron','carlos','casey','chad',
  'charles','chase','christian','christopher','cody','cole','colin','connor','corey','curtis',
  'damian','daniel','darren','david','derek','devin','dominic','drew','dylan','edgar',
  'eli','elijah','eric','ethan','evan','felix','fernando','francisco','gabriel','garrett',
  'gavin','george','hector','hunter','ian','isaac','ivan','jack','jackson','jacob',
  'jaden','jake','james','jared','jason','jaylen','jeremy','jesse','joel','john',
  'jonathan','jordan','jorge','jose','joseph','joshua','julian','justin','kai','keith',
  'kevin','kyle','levi','liam','logan','louis','lucas','luis','luke','marcus',
  'mark','martin','mason','matthew','max','michael','miguel','miles','mitchell','nathan',
  'nelson','nicholas','noah','oliver','omar','oscar','owen','parker','patrick','paul',
  'pedro','philip','preston','rafael','raymond','ricardo','richard','robert','ronald','ryan',
  'samuel','sean','seth','shane','shawn','spencer','stephen','steven','timothy','tony',
  'travis','trevor','tristan','troy','tyler','victor','vincent','wesley','william','xavier',
  // legacy
  'james','robert','john','donald','kenneth','george','larry','scott','gary','jerry',
  'dennis','walter','harold','arthur','lawrence','wayne','billy','bruce','alan','juan',
  'roy','ralph','eugene','russell','bobby','aj','talib','kimar','gallo',
]);

function detectGender(retailerFeedback: string, firstName: string): 'she' | 'he' {
  if (retailerFeedback) {
    const text = retailerFeedback.toLowerCase();
    const femaleCount = (text.match(/\b(she|her|hers|herself)\b/g) || []).length;
    const maleCount = (text.match(/\b(he|him|his|himself)\b/g) || []).length;
    if (femaleCount > maleCount && femaleCount >= 2) return 'she';
    if (maleCount > femaleCount && maleCount >= 2) return 'he';
  }
  const lower = firstName.toLowerCase();
  if (FEMALE_NAMES_SET.has(lower)) return 'she';
  if (MALE_NAMES_SET.has(lower)) return 'he';
  return 'she';
}

function getPronouns(gender: 'she' | 'he') {
  return gender === 'she'
    ? { subject: 'she', object: 'her', possessive: 'her' }
    : { subject: 'he', object: 'him', possessive: 'his' };
}

// ── Gemini response cleaner ───────────────────────────────────────────────────

function cleanResponse(text: string): string {
  let t = text.trim().replace(/^["']|["']$/g, '');
  const opt1 = t.match(/\*\*Option 1\*\*\s*\n?([\s\S]*?)(?=\*\*Option 2\*\*|Option 2:|$)/i) ||
               t.match(/Option 1:\s*\n?([\s\S]*?)(?=Option 2:|$)/i);
  if (opt1?.[1]) t = opt1[1].trim();
  t = t.replace(/\*\*/g, '').replace(/^(Here are .+?:\s*\n?)/i, '').replace(/^(Here's .+?:\s*\n?)/i, '');
  return t.trim();
}

// ── Prompt examples ───────────────────────────────────────────────────────────

const RETAILER_SUMMARY_EXAMPLES = `
Examples of good retailer summary styles (vary your structure):
- "Store managers consistently praise {Name} for her customer engagement skills."
- "{Name} has earned a reputation among brands for his reliability and professionalism."
- "Feedback from store teams highlights {Name}'s ability to handle high-volume days with ease."
- "Across multiple locations, {Name} is known for her attention to detail and initiative."
- "{Name} stands out to managers for his sales instincts — he reads customers well and closes naturally."
- "Store teams describe {Name} as someone who elevates the energy on the floor."
- "Brand after brand, the feedback is clear: {Name} shows up prepared and ready to contribute."
- "{Name}'s work ethic has made her a favorite with store managers who request her back."
- "What sets {Name} apart, according to brands, is his ability to jump in without needing hand-holding."
- "Managers at multiple locations have noted {Name}'s quick learning and adaptability."
`;

const ABOUT_ME_EXAMPLES = `
Examples of good "About Me" summaries (vary your style):
- "Customer service comes naturally to me after 3 years at Nordstrom and Saks."
- "I thrive in fast-paced luxury retail — my managers always said I could handle anything."
- "Started as seasonal at Gap, worked my way up to key holder, and discovered I'm great at visual merchandising."
- "Eight years of retail taught me that great customer service is about listening first."
- "I've worked everything from fast fashion to luxury — I adapt quickly and hit the floor running."
- "My background in beauty retail means I genuinely connect with customers on a personal level."
- "I know what good retail looks like because I've lived it — from stockroom to sales floor."
- "Three brands, six years, and one thing stays constant: customers remember how you made them feel."
- "Luxury retail trained me to read the room — I know when to engage and when to give space."
- "I come from a hospitality background, which means I treat every customer like a guest."
`;

// ── AI generation ─────────────────────────────────────────────────────────────

async function generateAboutMe(
  priorExperience: string,
  brandsWorked: string,
  endorsementTags: string,
  interviewTranscript: string,
  shiftsOnReflex?: string,
  market?: string,
  tier?: string
): Promise<string | null> {
  let interviewInsights = '';
  if (interviewTranscript && interviewTranscript !== '{}') {
    try {
      const t = JSON.parse(interviewTranscript);
      if (t?.typeform_response?.answers) {
        interviewInsights = (t.typeform_response.answers as { answer_text?: string }[])
          .filter(a => a.answer_text)
          .map(a => a.answer_text)
          .join(' ')
          .substring(0, 1000);
      }
    } catch { /* skip */ }
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as never });
  const prompt = `Write ONE "About Me" summary (2-4 sentences) for a retail worker's profile. Write in first person. Be conversational and natural.

${ABOUT_ME_EXAMPLES}

CRITICAL: Write ONLY the summary text. No options, no labels. Just one natural paragraph.

RULES:
- Never start with "As a..." or "As an..."
- Never use the worker's name
- Sound like a real person, not a resume
- 2-4 sentences, no quotation marks
- If data is sparse, write a genuine generic retail worker bio — do NOT say "I don't have enough info"

Worker background:
- Shifts completed on Reflex: ${shiftsOnReflex || '1'}
- Market: ${market || 'retail'}
- Previous experience: ${priorExperience || 'retail roles'}
- Brands worked with: ${brandsWorked || 'retail brands'}
- Top endorsements from managers: ${endorsementTags || 'reliability, customer service'}
${interviewInsights ? `- In their own words: ${interviewInsights}` : ''}

Write the summary now:`;

  const result = await withRetry(() => model.generateContent(prompt));
  return cleanResponse(result.response.text());
}

async function generateRetailerSummary(
  firstName: string,
  gender: 'she' | 'he',
  retailerFeedback: string,
  endorsementTags?: string
): Promise<string | null> {
  const hasFeedback = retailerFeedback?.trim();
  const hasEndorsements = endorsementTags?.trim();
  if (!hasFeedback && !hasEndorsements) return null;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as never });
  const p = getPronouns(gender);

  const sentenceCount = hasFeedback ? '2-4 sentences' : '1-2 sentences';

  const prompt = `Write ONE summary of what store teams and managers say about this worker. Use first name "${firstName}" and ${p.subject}/${p.object}/${p.possessive} pronouns.

${RETAILER_SUMMARY_EXAMPLES}

CRITICAL: Write ONLY the summary text. No options, no labels. Just one natural paragraph.

RULES:
- Use ONLY first name "${firstName}"
- Use ${p.subject}/${p.object}/${p.possessive} pronouns — NOT they/them/their
- ${sentenceCount}
- Use "store managers", "store teams", "brands" instead of "retailers"
- No quotation marks
${!hasFeedback ? `- Only endorsement data is available — write 1-2 sentences praising ${p.object} for the listed qualities` : ''}

${hasFeedback ? `Feedback from store managers:\n${retailerFeedback.substring(0, 1500)}` : ''}
${hasEndorsements ? `Top endorsements from managers: ${endorsementTags}` : ''}

Write the summary now:`;

  const result = await withRetry(() => model.generateContent(prompt));
  return cleanResponse(result.response.text());
}

// ── CSV parser ────────────────────────────────────────────────────────────────

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
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }

  return rows;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchWorkersMissingAboutMe(): Promise<Set<number>> {
  const PAGE_SIZE = 1000;
  const ids = new Set<number>();
  let from = 0;
  console.log('Fetching workers without about_me...');
  while (true) {
    const { data, error } = await supabase
      .from('workers').select('worker_id')
      .is('about_me', null).not('worker_id', 'is', null)
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error('Supabase error:', error.message); break; }
    for (const row of data || []) ids.add(Number(row.worker_id));
    console.log(`  ${from}–${from + (data?.length ?? 0) - 1} (${ids.size})`);
    if (!data?.length || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  console.log(`→ ${ids.size} workers need about_me\n`);
  return ids;
}

async function fetchWorkersMissingRetailerSummary(): Promise<Set<number>> {
  const PAGE_SIZE = 1000;
  const ids = new Set<number>();
  let from = 0;
  console.log('Fetching workers with about_me but no retailer_summary...');
  while (true) {
    const { data, error } = await supabase
      .from('workers').select('worker_id')
      .not('about_me', 'is', null).is('retailer_summary', null)
      .not('worker_id', 'is', null)
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error('Supabase error:', error.message); break; }
    for (const row of data || []) ids.add(Number(row.worker_id));
    console.log(`  ${from}–${from + (data?.length ?? 0) - 1} (${ids.size})`);
    if (!data?.length || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  console.log(`→ ${ids.size} workers need retailer_summary\n`);
  return ids;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Retry with exponential backoff ───────────────────────────────────────────

let quotaExhausted = false;

class QuotaExhaustedError extends Error {
  constructor() { super('Daily Gemini quota exhausted — stopping AI calls'); this.name = 'QuotaExhaustedError'; }
}

function isDailyQuota(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('per_day') || msg.includes('per_model_per_day') || msg.includes('requests_per_day');
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelayMs = 2000): Promise<T> {
  if (quotaExhausted) throw new QuotaExhaustedError();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status ??
                     (err as { httpMetadata?: { status?: number } })?.httpMetadata?.status;
      // Don't retry client errors (bad request, auth)
      if (status === 400 || status === 401 || status === 403) throw err;
      // Daily quota — stop everything, no point retrying
      if (status === 429 && isDailyQuota(err)) {
        quotaExhausted = true;
        console.error('\n  ✖ Daily Gemini quota hit — bailing out of AI calls.');
        throw new QuotaExhaustedError();
      }
      if (attempt === maxRetries) throw err;
      const backoff = baseDelayMs * Math.pow(2, attempt);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`\n  ⟳ Retry ${attempt + 1}/${maxRetries} after ${backoff}ms (${msg})`);
      await delay(backoff);
    }
  }
  throw new Error('withRetry: unreachable');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('=== generateWorkerSummariesV3 ===\n');

  // 1. Query DB for workers without about_me — these are the only ones we need to process.
  //    Re-running the script naturally skips already-done workers.
  const needsSummary = await fetchWorkersMissingAboutMe();

  if (needsSummary.size === 0) {
    console.log('Nothing to do — all workers already have summaries.');
    return;
  }

  // 2. Read CSV and build lookup by worker_id
  console.log('Reading CSV...');
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }
  const csvByWorkerId = new Map<number, Record<string, string>>();
  for (const row of parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'))) {
    const wid = parseInt(row.worker_id);
    if (!isNaN(wid)) csvByWorkerId.set(wid, row);
  }
  console.log(`CSV indexed: ${csvByWorkerId.size} rows.\n`);

  // 3. Filter to rows that exist in both DB (needs summary) and CSV (has source data)
  const toProcess = Array.from(needsSummary)
    .filter(id => csvByWorkerId.has(id))
    .map(id => csvByWorkerId.get(id)!);

  const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);
  const etaMinutes = Math.ceil((toProcess.length * (DELAY_MS + 800)) / 1000 / 60);
  console.log(`Workers to process: ${toProcess.length}  |  Batches: ${totalBatches}  |  ETA: ~${etaMinutes} min\n`);

  // 4. Process batches — generate summaries and update Supabase directly
  let aboutMeCount = 0;
  let retailerSummaryCount = 0;
  let dbErrorCount = 0;
  let aiErrorCount = 0;
  let skipped = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    if (quotaExhausted) { console.log('Quota exhausted — skipping remaining CSV batches.'); break; }
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, toProcess.length)})... `);

    const results = await Promise.all(batch.map(async (row) => {
      const workerUuid = row.worker_uuid?.trim();
      const lastName = row.display_name?.trim() || '';
      if (!lastName || !workerUuid) return null;

      const gender = detectGender(row.retailer_feedback || '', lastName.split(' ')[0]);
      const firstName = lastName.split(' ')[0];
      const updates: Record<string, string> = {};
      let hadAiError = false;
      let aiErrorMsg = '';

      const [aboutMe, retailerSummary] = await Promise.allSettled([
        generateAboutMe(
          row.prior_experience || '',
          row.brands_worked || '',
          row.endorsement_tags || '',
          row.interview_transcript || '',
          row.completed_shift_count || '1',
          (row.markets || '').split(',')[0].trim(),
          row.current_tier || ''
        ),
        (row.retailer_feedback?.trim() || row.endorsement_tags?.trim())
          ? generateRetailerSummary(firstName, gender, row.retailer_feedback || '', row.endorsement_tags || '')
          : Promise.resolve(null),
      ]);
      if (aboutMe.status === 'fulfilled' && aboutMe.value) {
        updates.about_me = aboutMe.value;
      } else if (aboutMe.status === 'rejected') {
        hadAiError = true;
        aiErrorMsg = String((aboutMe as PromiseRejectedResult).reason);
      }

      if (retailerSummary.status === 'fulfilled' && retailerSummary.value) {
        updates.retailer_summary = retailerSummary.value;
      } else if (retailerSummary.status === 'rejected') {
        hadAiError = true;
        if (!aiErrorMsg) aiErrorMsg = String((retailerSummary as PromiseRejectedResult).reason);
      }

      return { workerUuid, updates, hadAiError, aiErrorMsg };
    }));

    // Write each result directly to Supabase
    let batchDone = 0;
    for (const r of results) {
      if (!r) { skipped++; continue; }
      if (r.hadAiError) {
        aiErrorCount++;
        if (aiErrorCount <= 3) console.error(`\n  AI error for ${r.workerUuid}: ${r.aiErrorMsg}`);
      }
      if (Object.keys(r.updates).length === 0) continue;

      const { error } = await supabase
        .from('workers')
        .update(r.updates)
        .eq('worker_uuid', r.workerUuid);

      if (error) {
        console.error(`\n  DB error for ${r.workerUuid}: ${error.message}`);
        dbErrorCount++;
      } else {
        if (r.updates.about_me) aboutMeCount++;
        if (r.updates.retailer_summary) retailerSummaryCount++;
        batchDone++;
      }
    }

    console.log(`✓ ${batchDone} saved to DB`);
    await delay(DELAY_MS);
  }

  // 5. DB-only pass — workers still missing about_me that weren't in the CSV
  if (!quotaExhausted) await generateAboutMeFromDb();
  else console.log('\nSkipping DB-only about_me pass (quota exhausted).');

  // 6. Second pass — workers that already have about_me but are missing retailer_summary
  const needsRetailerOnly = await fetchWorkersMissingRetailerSummary();
  const retailerOnlyToProcess = Array.from(needsRetailerOnly)
    .filter(id => csvByWorkerId.has(id))
    .map(id => csvByWorkerId.get(id)!);

  if (retailerOnlyToProcess.length > 0) {
    const r2Batches = Math.ceil(retailerOnlyToProcess.length / BATCH_SIZE);
    console.log(`Retailer-summary-only pass: ${retailerOnlyToProcess.length} workers  |  Batches: ${r2Batches}\n`);

    for (let i = 0; i < retailerOnlyToProcess.length; i += BATCH_SIZE) {
      if (quotaExhausted) { console.log('Quota exhausted — skipping remaining retailer batches.'); break; }
      const batch = retailerOnlyToProcess.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      process.stdout.write(`  R-Batch ${batchNum}/${r2Batches} (${i + 1}–${Math.min(i + BATCH_SIZE, retailerOnlyToProcess.length)})... `);

      const results = await Promise.all(batch.map(async (row) => {
        const workerUuid = row.worker_uuid?.trim();
        const lastName = row.display_name?.trim() || '';
        if (!lastName || !workerUuid) return null;
        if (!row.retailer_feedback?.trim() && !row.endorsement_tags?.trim()) return null;

        const gender = detectGender(row.retailer_feedback || '', lastName.split(' ')[0]);
        const firstName = lastName.split(' ')[0];

        try {
          const summary = await generateRetailerSummary(firstName, gender, row.retailer_feedback || '', row.endorsement_tags || '');
          return summary ? { workerUuid, retailer_summary: summary } : null;
        } catch {
          aiErrorCount++;
          return null;
        }
      }));

      let batchDone = 0;
      for (const r of results) {
        if (!r) continue;
        const { error } = await supabase
          .from('workers').update({ retailer_summary: r.retailer_summary }).eq('worker_uuid', r.workerUuid);
        if (error) { dbErrorCount++; } else { retailerSummaryCount++; batchDone++; }
      }
      console.log(`✓ ${batchDone} saved`);
      await delay(DELAY_MS);
    }
  }

  // 7. DB-only retailer summary pass — workers with retailer_quotes or endorsement_counts in DB but no retailer_summary
  if (!quotaExhausted) await generateRetailerSummaryFromDb();
  else console.log('\nSkipping DB-only retailer summary pass (quota exhausted).');

  // 8. Generic retailer line for workers with shift/tier data but no feedback (no AI — always runs)
  await generateGenericRetailerSummaries();

  // 9. Trim any existing retailer_summaries that are 5 sentences (old over-long generations)
  if (!quotaExhausted) await trimLongRetailerSummaries();
  else console.log('\nSkipping trim pass (quota exhausted).');

  // 10. Summary
  console.log('\n=== Complete ===');
  console.log(`about_me generated:        ${aboutMeCount}`);
  console.log(`retailer_summary generated: ${retailerSummaryCount}`);
  console.log(`Skipped (no uuid/name):    ${skipped}`);
  console.log(`AI errors:                 ${aiErrorCount}`);
  console.log(`DB errors:                 ${dbErrorCount}`);
  console.log('\nRe-run to retry any workers that errored (they still have no about_me in DB).');
}

// ── DB-only about_me pass (workers not in CSV) ──────────────────────────────

async function generateAboutMeFromDb() {
  console.log('\n--- DB-only about_me pass (workers not in CSV) ---');

  const PAGE_SIZE = 1000;
  type DbWorker = {
    worker_uuid: string; name: string; market: string | null;
    shifts_on_reflex: number; current_tier: string | null;
    shift_experience: Record<string, number> | null;
    brands_worked: { name: string }[] | null;
    previous_experience: { company: string; roles: string[]; duration: string }[] | null;
    endorsement_counts: Record<string, number> | null;
  };
  const workers: DbWorker[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_uuid, name, market, shifts_on_reflex, current_tier, shift_experience, brands_worked, previous_experience, endorsement_counts')
      .is('about_me', null)
      .not('worker_uuid', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) { console.error('Supabase error:', error.message); break; }
    if (!data?.length) break;
    for (const row of data) workers.push(row as DbWorker);
    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }

  if (workers.length === 0) {
    console.log('All workers already have about_me.');
    return;
  }

  const totalBatches = Math.ceil(workers.length / BATCH_SIZE);
  console.log(`${workers.length} workers still need about_me (DB-only).  Batches: ${totalBatches}\n`);

  let generated = 0;
  let errors = 0;

  for (let i = 0; i < workers.length; i += BATCH_SIZE) {
    if (quotaExhausted) { console.log('Quota exhausted — skipping remaining DB about_me batches.'); break; }
    const batch = workers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`  DB-Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, workers.length)})... `);

    const results = await Promise.allSettled(batch.map(async (w) => {
      // Build inputs from DB columns
      const priorExp = w.previous_experience
        ? w.previous_experience.map(j => `${j.company} - ${j.roles.join(', ')} (${j.duration})`).join(' | ')
        : '';
      const brands = w.brands_worked
        ? w.brands_worked.map(b => b.name).join(', ')
        : '';
      const endorsements = w.endorsement_counts
        ? Object.keys(w.endorsement_counts).join(', ')
        : '';

      const aboutMe = await generateAboutMe(
        priorExp, brands, endorsements, '',
        String(w.shifts_on_reflex || 1),
        w.market || 'retail',
        w.current_tier || ''
      );

      return aboutMe ? { workerUuid: w.worker_uuid, about_me: aboutMe } : null;
    }));

    let batchDone = 0;
    for (const r of results) {
      if (r.status === 'rejected') { errors++; continue; }
      if (!r.value) continue;
      const { error } = await supabase
        .from('workers')
        .update({ about_me: r.value.about_me })
        .eq('worker_uuid', r.value.workerUuid);
      if (error) { errors++; } else { generated++; batchDone++; }
    }

    console.log(`✓ ${batchDone} saved`);
    await delay(DELAY_MS);
  }

  console.log(`DB-only about_me: ${generated} written  |  ${errors} errors`);
}

// ── DB-only retailer summary pass ────────────────────────────────────────────

async function generateRetailerSummaryFromDb() {
  console.log('\n--- DB-only retailer summary pass ---');

  const PAGE_SIZE = 1000;
  type DbWorker = {
    worker_uuid: string; name: string; gender: string;
    retailer_quotes: { quote: string }[] | null;
    endorsement_counts: Record<string, number> | null;
  };
  const workers: DbWorker[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_uuid, name, gender, retailer_quotes, endorsement_counts')
      .is('retailer_summary', null)
      .not('worker_uuid', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) { console.error('Supabase error:', error.message); break; }
    if (!data?.length) break;
    for (const row of data) workers.push(row as DbWorker);
    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }

  // Only workers that have retailer_quotes or endorsement_counts
  const eligible = workers.filter(w => {
    const hasQuotes = w.retailer_quotes && w.retailer_quotes.length > 0 && w.retailer_quotes.some(q => q.quote?.trim());
    const hasEndorsements = w.endorsement_counts && Object.keys(w.endorsement_counts).length > 0;
    return hasQuotes || hasEndorsements;
  });

  if (eligible.length === 0) {
    console.log('No workers with DB retailer data need a summary.');
    return;
  }

  const totalBatches = Math.ceil(eligible.length / BATCH_SIZE);
  console.log(`${eligible.length} workers with retailer_quotes/endorsements need retailer_summary.  Batches: ${totalBatches}\n`);

  let generated = 0;
  let errors = 0;

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    if (quotaExhausted) { console.log('Quota exhausted — skipping remaining DB retailer batches.'); break; }
    const batch = eligible.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`  RDB-Batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, eligible.length)})... `);

    const results = await Promise.allSettled(batch.map(async (w) => {
      const firstName = (w.name || '').split(' ')[0];
      const gender: 'she' | 'he' = w.gender === 'male' ? 'he' : 'she';

      const feedback = w.retailer_quotes
        ? w.retailer_quotes.map(q => q.quote).filter(Boolean).join(' ')
        : '';
      const endorsements = w.endorsement_counts
        ? Object.keys(w.endorsement_counts).join(', ')
        : '';

      if (!feedback.trim() && !endorsements.trim()) return null;

      const summary = await generateRetailerSummary(firstName, gender, feedback, endorsements);
      return summary ? { workerUuid: w.worker_uuid, retailer_summary: summary } : null;
    }));

    let batchDone = 0;
    for (const r of results) {
      if (r.status === 'rejected') { errors++; continue; }
      if (!r.value) continue;
      const { error } = await supabase
        .from('workers')
        .update({ retailer_summary: r.value.retailer_summary })
        .eq('worker_uuid', r.value.workerUuid);
      if (error) { errors++; } else { generated++; batchDone++; }
    }

    console.log(`✓ ${batchDone} saved`);
    await delay(DELAY_MS);
  }

  console.log(`DB-only retailer summaries: ${generated} written  |  ${errors} errors`);
}

// ── Generic retailer summary (no AI — template from shift/tier data) ─────────

async function generateGenericRetailerSummaries() {
  console.log('\n--- Generic retailer summaries (shift/tier data only) ---');

  const PAGE_SIZE = 1000;
  const workers: { worker_uuid: string; name: string; shifts_on_reflex: number; current_tier: string | null; shift_experience: Record<string, number> | null }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_uuid, name, shifts_on_reflex, current_tier, shift_experience')
      .not('about_me', 'is', null)
      .is('retailer_summary', null)
      .not('worker_uuid', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) { console.error('Supabase error:', error.message); break; }
    if (!data?.length) break;
    for (const row of data) workers.push(row);
    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }

  // Only workers with some shift data or tier
  const eligible = workers.filter(w =>
    (w.shifts_on_reflex && w.shifts_on_reflex > 0) || w.current_tier || (w.shift_experience && Object.keys(w.shift_experience).length > 0)
  );

  if (eligible.length === 0) {
    console.log('No eligible workers for generic retailer line.');
    return;
  }

  console.log(`${eligible.length} workers eligible for generic retailer summary.`);
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < eligible.length; i += 500) {
    const batch = eligible.slice(i, i + 500);

    const results = await Promise.all(batch.map(async (w) => {
      const firstName = (w.name || '').split(' ')[0];
      const parts: string[] = [];

      if (w.shifts_on_reflex && w.shifts_on_reflex > 0) {
        const roles = w.shift_experience ? Object.keys(w.shift_experience) : [];
        if (roles.length > 0) {
          const roleList = roles.slice(0, 3).join(', ');
          parts.push(`${firstName} has completed ${w.shifts_on_reflex} shift${w.shifts_on_reflex === 1 ? '' : 's'} on Reflex across roles including ${roleList}.`);
        } else {
          parts.push(`${firstName} has completed ${w.shifts_on_reflex} shift${w.shifts_on_reflex === 1 ? '' : 's'} on the Reflex platform.`);
        }
      }

      if (w.current_tier) {
        parts.push(`Currently a ${w.current_tier} tier member.`);
      }

      if (parts.length === 0) return null;
      return { workerUuid: w.worker_uuid, retailer_summary: parts.join(' ') };
    }));

    for (const r of results) {
      if (!r) continue;
      const { error } = await supabase
        .from('workers')
        .update({ retailer_summary: r.retailer_summary })
        .eq('worker_uuid', r.workerUuid);
      if (error) { errors++; } else { updated++; }
    }

    await delay(50);
  }

  console.log(`Generic retailer summaries: ${updated} written  |  ${errors} errors`);
}

async function trimLongRetailerSummaries() {
  console.log('\n--- Trimming over-long retailer summaries ---');

  // Fetch all workers that have a retailer_summary
  const PAGE_SIZE = 1000;
  const toLong: { worker_uuid: string; retailer_summary: string }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('worker_uuid, retailer_summary')
      .not('retailer_summary', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data?.length) break;

    for (const row of data) {
      if (!row.retailer_summary) continue;
      // Count sentences (split on . ! ? followed by space or end)
      const sentences = row.retailer_summary
        .split(/(?<=[.!?])\s+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      if (sentences.length >= 5) toLong.push(row);
    }

    from += PAGE_SIZE;
    if (data.length < PAGE_SIZE) break;
  }

  if (toLong.length === 0) {
    console.log('No over-long summaries found.');
    return;
  }

  console.log(`Found ${toLong.length} summaries to trim. Trimming...`);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as never });

  let trimmed = 0;
  let trimErrors = 0;

  await Promise.all(toLong.map(async (row) => {
    try {
      const result = await withRetry(() => model.generateContent(
        `Trim this retailer summary to 2-4 sentences. Keep the most impactful content. Return ONLY the trimmed text, no labels.\n\n${row.retailer_summary}`
      ));
      const trimmedText = cleanResponse(result.response.text());
      if (!trimmedText) return;

      const { error } = await supabase
        .from('workers')
        .update({ retailer_summary: trimmedText })
        .eq('worker_uuid', row.worker_uuid);

      if (error) { trimErrors++; }
      else { trimmed++; }
    } catch { trimErrors++; }
  }));

  console.log(`Trimmed: ${trimmed}  |  Errors: ${trimErrors}`);
}

run().catch(console.error);
