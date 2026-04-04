/**
 * Worker Summary Generation Script V2
 *
 * Generates AI summaries for workers using Gemini with improved prompts:
 * - about_me: Varied sentence structures, natural voice
 * - retailer_summary: Uses inferred gender pronouns (she/he based on first name)
 *
 * Reads from CSV file and outputs SQL UPDATE statements.
 *
 * Usage:
 *   npx tsx web/src/scripts/generateWorkerSummariesV2.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: '/Users/katherine_1/Dropbox/x.wip/x.Tools/matchpoint/.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not found in .env file');
  process.exit(1);
}
const CSV_PATH = '/Users/katherine_1/Downloads/query_result_2026-04-03T12_07_55.56527879-05_00.csv';
const OUTPUT_BASE = '/Users/katherine_1/Downloads/workers_update_summaries_v3';
const NUM_OUTPUT_FILES = 3; // Split into 3 files for Supabase

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const DELAY_MS = 100;
const BATCH_SIZE = 10;

// Common female names for gender inference
const FEMALE_NAMES = new Set([
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen',
  'lisa', 'nancy', 'betty', 'margaret', 'sandra', 'ashley', 'kimberly', 'emily', 'donna', 'michelle',
  'dorothy', 'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia',
  'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen',
  'samantha', 'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather',
  'diane', 'ruth', 'julie', 'olivia', 'joyce', 'virginia', 'victoria', 'kelly', 'lauren', 'christina',
  'joan', 'evelyn', 'judith', 'megan', 'andrea', 'cheryl', 'hannah', 'jacqueline', 'martha', 'gloria',
  'teresa', 'ann', 'sara', 'madison', 'frances', 'kathryn', 'janice', 'jean', 'abigail', 'alice',
  'judy', 'sophia', 'grace', 'denise', 'amber', 'doris', 'marilyn', 'danielle', 'beverly', 'isabella',
  'theresa', 'diana', 'natalie', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis', 'lori', 'ava',
  'brianna', 'jasmine', 'julia', 'tiffany', 'crystal', 'destiny', 'vanessa', 'brittney', 'mariah', 'adriana',
  'aaliyah', 'adrienne', 'alicia', 'allison', 'alyssa', 'ana', 'ariana', 'arianna', 'audrey', 'autumn',
  'bailey', 'bianca', 'briana', 'brooke', 'brooklyn', 'caitlin', 'carla', 'carmen', 'cassandra', 'cheyenne',
  'chloe', 'ciara', 'claire', 'claudia', 'courtney', 'daisy', 'dana', 'desiree', 'diamond', 'dominique',
  'ebony', 'elena', 'elise', 'ella', 'erica', 'erika', 'erin', 'esmeralda', 'eva', 'faith',
  'felicia', 'fiona', 'gabriela', 'gabriella', 'gabrielle', 'genesis', 'gianna', 'gina', 'giselle', 'hailey',
  'haley', 'hayley', 'holly', 'hope', 'imani', 'iris', 'ivy', 'jada', 'jade', 'jamie',
  'janae', 'jane', 'janelle', 'jasmin', 'jenna', 'jenny', 'jillian', 'jocelyn', 'jordan', 'jordyn',
  'josie', 'joy', 'kaitlyn', 'kara', 'katelyn', 'katie', 'kendra', 'kennedy', 'kiara', 'krista',
  'kristen', 'kristin', 'kristina', 'kylie', 'lacey', 'layla', 'leah', 'leslie', 'leticia', 'lexie',
  'lillian', 'lily', 'lindsay', 'lindsey', 'logan', 'lucia', 'lucy', 'lydia', 'mackenzie', 'madeline',
  'makenzie', 'mallory', 'mandy', 'margarita', 'mariana', 'marisol', 'marissa', 'maya', 'mckenzie', 'melanie',
  'melody', 'mercedes', 'mia', 'michaela', 'miranda', 'molly', 'monica', 'monique', 'morgan', 'nadia',
  'naomi', 'natasha', 'nina', 'noel', 'noelle', 'paige', 'paris', 'patience', 'paula', 'peyton',
  'priscilla', 'raven', 'reagan', 'regina', 'renee', 'riley', 'rosa', 'ruby', 'sabrina', 'sadie',
  'savannah', 'selena', 'serena', 'shannon', 'shawna', 'sheila', 'shelby', 'sierra', 'skylar', 'sonia',
  'stacy', 'stella', 'summer', 'sydney', 'sylvia', 'tabitha', 'tamara', 'tanya', 'tara', 'tatiana',
  'taylor', 'tessa', 'tia', 'tiana', 'tina', 'trinity', 'valerie', 'veronica', 'vivian', 'wendy',
  'whitney', 'yolanda', 'zoe', 'zoey',
  // Additional names
  'chippy', 'essence', 'ashonte', 'aarika', 'kiora', 'kisha', 'kristi', 'kristine', 'moira', 'yesenia', 'yoko'
]);

// Common male names for gender inference
const MALE_NAMES = new Set([
  'james', 'robert', 'john', 'michael', 'david', 'william', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander', 'patrick', 'jack', 'dennis', 'jerry',
  'tyler', 'aaron', 'jose', 'adam', 'nathan', 'henry', 'douglas', 'zachary', 'peter', 'kyle',
  'noah', 'ethan', 'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean',
  'gerald', 'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse', 'bryan', 'billy',
  'bruce', 'gabriel', 'joe', 'logan', 'alan', 'juan', 'wayne', 'elijah', 'randy', 'roy',
  'vincent', 'ralph', 'eugene', 'russell', 'bobby', 'mason', 'philip', 'louis', 'harry', 'albert',
  'antonio', 'carlos', 'danny', 'derek', 'marcus', 'omar', 'alex', 'andre', 'angel', 'brett',
  'caden', 'caleb', 'cameron', 'casey', 'chad', 'chase', 'cody', 'cole', 'colin', 'colton',
  'connor', 'corey', 'craig', 'curtis', 'dakota', 'dalton', 'damian', 'damon', 'dane', 'darren',
  'devin', 'devon', 'dominic', 'drew', 'dustin', 'edgar', 'eli', 'elliot', 'erik', 'evan',
  'felix', 'fernando', 'francisco', 'freddy', 'garrett', 'gavin', 'graham', 'grant', 'griffin', 'hector',
  'hunter', 'ian', 'isaac', 'ivan', 'jace', 'jackson', 'jaden', 'jake', 'jared', 'jayden',
  'jaylen', 'jesus', 'joel', 'johnny', 'jonah', 'jonas', 'jorge', 'julian', 'julio', 'justice',
  'kai', 'keegan', 'keith', 'kendrick', 'kobe', 'landon', 'leo', 'levi', 'liam', 'lucas',
  'luis', 'luke', 'malik', 'manuel', 'marco', 'mario', 'martin', 'max', 'maxwell', 'micah',
  'miguel', 'miles', 'mitchell', 'nate', 'nelson', 'nico', 'oliver', 'oscar', 'owen', 'parker',
  'pedro', 'preston', 'rafael', 'ramon', 'reid', 'ricardo', 'riley', 'ruben', 'salvador', 'sergio',
  'seth', 'shane', 'shawn', 'simon', 'spencer', 'taylor', 'tomas', 'tony', 'travis', 'trent',
  'trevor', 'tristan', 'troy', 'victor', 'wesley', 'will', 'xavier', 'zach', 'zane',
  // Additional names
  'aj', 'talib', 'kimar', 'gallo', 'connor'
]);

function inferGender(firstName: string): 'she' | 'he' | 'they' {
  const name = firstName.toLowerCase().trim();
  if (FEMALE_NAMES.has(name)) return 'she';
  if (MALE_NAMES.has(name)) return 'he';
  return 'they'; // Default to neutral if unsure
}

function getPronouns(gender: 'she' | 'he' | 'they'): { subject: string; object: string; possessive: string } {
  switch (gender) {
    case 'she': return { subject: 'she', object: 'her', possessive: 'her' };
    case 'he': return { subject: 'he', object: 'him', possessive: 'his' };
    default: return { subject: 'they', object: 'them', possessive: 'their' };
  }
}

// Avatar photo pools by gender
const MALE_PHOTOS = [
  '/images/avatars/w001.jpg', '/images/avatars/w003.jpg', '/images/avatars/w005.jpg',
  '/images/avatars/w007.jpg', '/images/avatars/w009.jpg', '/images/avatars/w013.jpg',
  '/images/avatars/w015.jpg', '/images/avatars/w017.jpg', '/images/avatars/w019.jpg',
  '/images/avatars/w021.jpg', '/images/avatars/w023.jpg', '/images/avatars/w025.jpg',
  '/images/avatars/w027.jpg', '/images/avatars/w029.jpg', '/images/avatars/w031.jpg',
  '/images/avatars/w033.jpg', '/images/avatars/w035.jpg', '/images/avatars/w037.jpg',
  '/images/avatars/w039.jpg',
];

const FEMALE_PHOTOS = [
  '/images/avatars/w002.jpg', '/images/avatars/w004.jpg', '/images/avatars/w006.jpg',
  '/images/avatars/w008.jpg', '/images/avatars/w010.jpg', '/images/avatars/w011.jpg',
  '/images/avatars/w012.jpg', '/images/avatars/w014.jpg', '/images/avatars/w016.jpg',
  '/images/avatars/w018.jpg', '/images/avatars/w020.jpg', '/images/avatars/w022.jpg',
  '/images/avatars/w024.jpg', '/images/avatars/w026.jpg', '/images/avatars/w028.jpg',
  '/images/avatars/w030.jpg', '/images/avatars/w032.jpg', '/images/avatars/w034.jpg',
  '/images/avatars/w036.jpg', '/images/avatars/w038.jpg', '/images/avatars/w040.jpg',
];

let malePhotoIndex = 0;
let femalePhotoIndex = 0;

function getPhotoForGender(gender: 'she' | 'he' | 'they'): string {
  if (gender === 'he') {
    const photo = MALE_PHOTOS[malePhotoIndex % MALE_PHOTOS.length];
    malePhotoIndex++;
    return photo;
  } else {
    // Default to female for 'she' and 'they'
    const photo = FEMALE_PHOTOS[femalePhotoIndex % FEMALE_PHOTOS.length];
    femalePhotoIndex++;
    return photo;
  }
}

const RETAILER_SUMMARY_EXAMPLES = `
Examples of good retailer summary styles (vary your structure like these):
- "Store managers consistently praise {Name} for her customer engagement skills."
- "{Name} has earned a reputation among brands for his reliability and professionalism."
- "Feedback from store teams highlights {Name}'s ability to handle high-volume days with ease."
- "Across multiple locations, {Name} is known for her attention to detail and initiative."
- "{Name} stands out to managers for his sales instincts - he reads customers well and closes naturally."
- "Store teams describe {Name} as someone who elevates the energy on the floor."
- "Brand after brand, the feedback is clear: {Name} shows up prepared and ready to contribute."
- "{Name}'s work ethic has made her a favorite with store managers who request her back."
- "What sets {Name} apart, according to brands, is his ability to jump in without needing hand-holding."
- "Store teams repeatedly mention {Name}'s positive attitude as a standout trait."
- "Managers at multiple locations have noted {Name}'s quick learning and adaptability."
- "{Name} brings a professionalism that store teams notice immediately."
- "The common thread in {Name}'s feedback: she takes initiative and finds work when things slow down."
- "From luxury to specialty, brands appreciate {Name}'s customer-first approach."
- "{Name} is the kind of worker store managers specifically request back."
- "What managers say about {Name}: he makes customers feel welcome from the moment they walk in."
- "Store teams trust {Name} to handle the floor without constant oversight."
- "{Name}'s reliability keeps her in high demand with brands across the city."
- "Across his shifts, {Name} has built a reputation for exceptional punctuality and preparedness."
- "Brands value {Name} for her sales skills and ability to connect with diverse customers."
`;

const ABOUT_ME_EXAMPLES = `
Examples of good "About Me" summaries (vary your style like these):
- "Customer service comes naturally to me after 3 years at Nordstrom and Saks."
- "I thrive in fast-paced luxury retail - my managers always said I could handle anything."
- "Started as seasonal at Gap, worked my way up to key holder, and discovered I'm great at visual merchandising."
- "My thing is making customers feel welcome the second they walk in. It's why I keep getting invited back."
- "Luxury brands are my comfort zone - I've done everything from clienteling to floor sets."
- "I'm the person who actually enjoys a busy Saturday shift. High volume doesn't stress me out."
- "Spent two years learning the ins and outs of footwear before moving into apparel."
- "Detail-oriented is an understatement - I'm the one who notices when the mannequin's collar is off."
- "Coming from hospitality, I brought a service-first mindset that retail managers seem to love."
- "I genuinely like helping people find what they're looking for, whether it's a $30 t-shirt or a $3,000 handbag."
- "Bilingual in Spanish, which has been a game-changer for connecting with customers."
- "I'm quick on the register and even quicker at reading what a customer actually needs."
- "After managing inventory for a year, nothing about stock rooms intimidates me anymore."
- "People tell me I have a calming presence on the floor - helpful when things get hectic during holidays."
- "Fashion has always been my thing. Getting paid to talk about it with customers? Even better."
- "I learn new POS systems fast and pick up product knowledge even faster."
- "Worked at both big box and boutique - I adapt my style depending on what the brand needs."
- "Early morning visual resets, closing shifts, weekend rushes - I've done them all and don't have a preference."
- "My background in makeup artistry taught me how to upsell without being pushy."
- "Reliability is my thing. In two years, I've never called out or shown up late."
`;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean up Gemini response - extract just the content, not "Option 1", "Option 2", etc.
function cleanGeminiResponse(text: string): string {
  let cleaned = text.trim();

  // Remove quotes at start/end
  cleaned = cleaned.replace(/^["']|["']$/g, '');

  // If response contains multiple options, take the first one
  if (cleaned.includes('**Option 1**') || cleaned.includes('Option 1:')) {
    // Find Option 1 content
    const option1Match = cleaned.match(/\*\*Option 1\*\*\s*\n?([\s\S]*?)(?=\*\*Option 2\*\*|Option 2:|$)/i) ||
                         cleaned.match(/Option 1:\s*\n?([\s\S]*?)(?=Option 2:|$)/i);
    if (option1Match && option1Match[1]) {
      cleaned = option1Match[1].trim();
    }
  }

  // Remove any remaining ** markers
  cleaned = cleaned.replace(/\*\*/g, '');

  // Remove "Here are a few options" type prefixes
  cleaned = cleaned.replace(/^(Here are .+?:\s*\n?)/i, '');
  cleaned = cleaned.replace(/^(Here's .+?:\s*\n?)/i, '');

  return cleaned.trim();
}

async function generateAboutMe(
  priorExperience: string,
  brandsWorked: string,
  endorsementTags: string,
  interviewTranscript: string
): Promise<string | null> {
  try {
    if (!priorExperience && !brandsWorked && !interviewTranscript) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Parse interview transcript if available
    let interviewInsights = '';
    if (interviewTranscript && interviewTranscript !== '{}') {
      try {
        const transcript = JSON.parse(interviewTranscript);
        if (transcript?.typeform_response?.answers) {
          const answers = transcript.typeform_response.answers as { answer_text?: string }[];
          interviewInsights = answers
            .filter(a => a.answer_text)
            .map(a => a.answer_text)
            .join(' ')
            .substring(0, 1000);
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    const prompt = `Write ONE "About Me" summary (2-4 sentences) for a retail worker's profile. Write in first person. Be conversational and natural.

${ABOUT_ME_EXAMPLES}

CRITICAL: Write ONLY the summary text. Do NOT provide multiple options. Do NOT use "Option 1", "Option 2" format. Just write one natural paragraph.

RULES:
- Never start with "As a..." or "As an..."
- Never use the worker's name
- Sound like a real person, not a resume
- Write 2-4 sentences
- No quotation marks

Worker's background:
- Previous experience: ${priorExperience || 'Various retail roles'}
- Brands worked with: ${brandsWorked || 'Multiple retail brands'}
- Top endorsements: ${endorsementTags || 'Customer service, reliability'}
${interviewInsights ? `- Interview insights: ${interviewInsights}` : ''}

Write the summary now (just the text, no labels):`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    return cleanGeminiResponse(response);
  } catch (error) {
    console.error('Error generating about_me:', error);
    return null;
  }
}

async function generateRetailerSummary(
  firstName: string,
  gender: 'she' | 'he' | 'they',
  retailerFeedback: string
): Promise<string | null> {
  try {
    if (!retailerFeedback) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const pronouns = getPronouns(gender);

    const prompt = `Write ONE summary (2-5 sentences) of what store teams and managers say about this worker. Use first name "${firstName}" and ${pronouns.subject}/${pronouns.object}/${pronouns.possessive} pronouns.

${RETAILER_SUMMARY_EXAMPLES}

CRITICAL: Write ONLY the summary text. Do NOT provide multiple options. Do NOT use "Option 1", "Option 2" format. Just write one natural paragraph.

RULES:
- Use ONLY first name "${firstName}"
- Use ${pronouns.subject}/${pronouns.object}/${pronouns.possessive} pronouns (NOT they/them/their)
- Write 2-5 sentences
- Use "store managers", "store teams", "brands" instead of "retailers"
- No quotation marks

Feedback:
${retailerFeedback.substring(0, 1500)}

Write the summary now (just the text, no labels):`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    return cleanGeminiResponse(response);
  } catch (error) {
    console.error(`Error generating retailer_summary for ${firstName}:`, error);
    return null;
  }
}

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
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function escapeSql(s: string | null): string {
  if (s === null) return 'NULL';
  return "'" + s.replace(/'/g, "''") + "'";
}

interface WorkerResult {
  workerUuid: string;
  name: string;
  updates: string[];
  aboutMeGenerated: boolean;
  retailerSummaryGenerated: boolean;
  photoUpdated: boolean;
  error: boolean;
}

async function processWorker(w: Record<string, string>): Promise<WorkerResult | null> {
  const workerUuid = w.worker_uuid;
  const displayName = w.display_name?.trim() || '';

  // Validate UUID format and name looks reasonable
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!workerUuid || !displayName || !uuidPattern.test(workerUuid) || displayName.length > 50) {
    return null;
  }

  const firstName = displayName.split(' ')[0];
  const gender = inferGender(firstName);

  const updates: string[] = [];
  let aboutMeGenerated = false;
  let retailerSummaryGenerated = false;
  let photoUpdated = false;
  let error = false;

  // Assign photo based on inferred gender
  const photoUrl = getPhotoForGender(gender);
  updates.push(`photo = ${escapeSql(photoUrl)}`);
  photoUpdated = true;

  // Generate about_me
  try {
    const aboutMe = await generateAboutMe(
      w.prior_experience || '',
      w.brands_worked || '',
      w.endorsement_tags || '',
      w.interview_transcript || ''
    );
    if (aboutMe) {
      updates.push(`about_me = ${escapeSql(aboutMe)}`);
      aboutMeGenerated = true;
    }
  } catch (e) {
    error = true;
  }

  // Generate retailer_summary
  try {
    if (w.retailer_feedback && w.retailer_feedback.trim()) {
      const summary = await generateRetailerSummary(firstName, gender, w.retailer_feedback);
      if (summary) {
        updates.push(`retailer_summary = ${escapeSql(summary)}`);
        retailerSummaryGenerated = true;
      }
    }
  } catch (e) {
    error = true;
  }

  return { workerUuid, name: displayName, updates, aboutMeGenerated, retailerSummaryGenerated, photoUpdated, error };
}

async function generateAllSummaries() {
  console.log('Reading CSV file...');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found: ${CSV_PATH}`);
    return;
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const workers = parseCSV(csvContent);

  console.log(`Found ${workers.length} workers in CSV.`);
  console.log(`Processing in batches of ${BATCH_SIZE}...\n`);

  const sqlStatements: string[] = [];
  let aboutMeCount = 0;
  let retailerSummaryCount = 0;
  let photoCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let processedCount = 0;

  for (let i = 0; i < workers.length; i += BATCH_SIZE) {
    const batch = workers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(workers.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches} (workers ${i + 1}-${Math.min(i + BATCH_SIZE, workers.length)})...`);

    const results = await Promise.all(batch.map(w => processWorker(w)));

    for (const result of results) {
      if (result === null) {
        skippedCount++;
        continue;
      }

      processedCount++;
      if (result.aboutMeGenerated) aboutMeCount++;
      if (result.retailerSummaryGenerated) retailerSummaryCount++;
      if (result.photoUpdated) photoCount++;
      if (result.error) errorCount++;

      if (result.updates.length > 0) {
        const sql = `UPDATE workers SET ${result.updates.join(', ')} WHERE worker_uuid = '${result.workerUuid}'::uuid;`;
        sqlStatements.push(sql);
      }
    }

    console.log(`  ✓ Batch complete: ${results.filter(r => r !== null).length} processed`);

    // Write progress every 10 batches
    if (batchNum % 10 === 0) {
      console.log(`  Writing progress...`);
    }

    await delay(DELAY_MS);
  }

  // Split into multiple files for Supabase SQL Editor limits
  const statementsPerFile = Math.ceil(sqlStatements.length / NUM_OUTPUT_FILES);
  const outputFiles: string[] = [];

  for (let i = 0; i < NUM_OUTPUT_FILES; i++) {
    const start = i * statementsPerFile;
    const end = Math.min(start + statementsPerFile, sqlStatements.length);
    const partStatements = sqlStatements.slice(start, end);

    if (partStatements.length === 0) break;

    const filePath = `${OUTPUT_BASE}_part${i + 1}.sql`;
    fs.writeFileSync(filePath, `-- Worker summary updates V3 - Part ${i + 1}
-- Statements: ${partStatements.length}

${partStatements.join('\n\n')}`);
    outputFiles.push(filePath);
  }

  console.log('\n\n=== Summary Generation Complete ===');
  console.log(`Total processed: ${processedCount}`);
  console.log(`about_me generated: ${aboutMeCount}`);
  console.log(`retailer_summary generated: ${retailerSummaryCount}`);
  console.log(`photo updated: ${photoCount}`);
  console.log(`Skipped (no uuid/name): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nSQL files written to:`);
  for (const file of outputFiles) {
    console.log(`  ${file}`);
  }
}

generateAllSummaries().catch(console.error);
