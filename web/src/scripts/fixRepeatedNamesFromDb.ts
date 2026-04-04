/**
 * Fix Repeated Names in retailer_summary (from database)
 *
 * Queries Supabase for workers with retailer_summary and fixes cases
 * where a name appears twice in consecutive sentences.
 * Outputs SQL UPDATE statements.
 */

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';
const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_PATH = '/Users/katherine_1/Downloads/workers_fix_repeated_names.sql';

// Extract name from the retailer_summary (first word after common patterns)
function extractNameFromSummary(summary: string): string | null {
  const patterns = [
    /Store teams consistently (?:praise|commend|find) (\w+)/i,
    /(\w+) consistently receives/i,
    /(\w+) is consistently/i,
    /Managers (?:consistently|frequently) (?:praise|note|highlight) (\w+)/i,
    /(\w+) has earned/i,
    /(\w+) brings/i,
    /Retailers (?:praise|note|appreciate) (\w+)/i,
    /Store teams and managers consistently find (\w+)/i,
    /Brands (?:consistently|frequently) (?:praise|note) (\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Check if name appears in consecutive sentences
function hasRepeatedName(summary: string, name: string): boolean {
  const sentences = summary.split(/(?<=[.!?])\s+/);
  const namePattern = new RegExp(`\\b${name}\\b`, 'i');

  for (let i = 1; i < sentences.length; i++) {
    if (namePattern.test(sentences[i - 1]) && namePattern.test(sentences[i])) {
      return true;
    }
  }
  return false;
}

// Fix repeated name in consecutive sentences using he/she from photo
function fixRepeatedName(summary: string, name: string, gender: 'male' | 'female' | null): string {
  const sentences = summary.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return summary;

  // Use gender from photo, or detect from existing pronouns in summary
  let pronoun: string;
  let possessive: string;
  let objective: string;

  if (gender === 'female') {
    pronoun = 'She';
    possessive = 'her';
    objective = 'her';
  } else if (gender === 'male') {
    pronoun = 'He';
    possessive = 'his';
    objective = 'him';
  } else {
    // Fallback: detect from existing pronouns in summary
    const hasShe = /\bshe\b|\bher\b/i.test(summary);
    const hasHe = /\bhe\b|\bhis\b|\bhim\b/i.test(summary);
    if (hasShe && !hasHe) {
      pronoun = 'She';
      possessive = 'her';
      objective = 'her';
    } else {
      pronoun = 'He';
      possessive = 'his';
      objective = 'him';
    }
  }

  const fixedSentences: string[] = [sentences[0]];
  const namePattern = new RegExp(`\\b${name}\\b`, 'i');

  for (let i = 1; i < sentences.length; i++) {
    let sentence = sentences[i];
    const prevHasName = namePattern.test(fixedSentences[fixedSentences.length - 1]);
    const currHasName = namePattern.test(sentence);

    if (prevHasName && currHasName) {
      // Replace possessives first (before we replace the name)
      sentence = sentence.replace(new RegExp(`${name}''s`, 'gi'), possessive);
      sentence = sentence.replace(new RegExp(`${name}'s`, 'gi'), possessive);

      // Replace "for Name" -> "for him/her" (object of preposition)
      sentence = sentence.replace(new RegExp(`\\bfor ${name}\\b`, 'gi'), `for ${objective}`);
      // "establishes Name" -> "establishes him/her"
      sentence = sentence.replace(new RegExp(`establishes ${name}\\b`, 'gi'), `establishes ${objective}`);
      // "having Name" -> "having him/her"
      sentence = sentence.replace(new RegExp(`having ${name}\\b`, 'gi'), `having ${objective}`);
      // "value Name" -> "value him/her"
      sentence = sentence.replace(new RegExp(`value ${name}\\b`, 'gi'), `value ${objective}`);
      // "appreciate Name" -> "appreciate him/her"
      sentence = sentence.replace(new RegExp(`appreciate ${name}\\b`, 'gi'), `appreciate ${objective}`);
      // "describe Name" -> "describe him/her"
      sentence = sentence.replace(new RegExp(`describe ${name}\\b`, 'gi'), `describe ${objective}`);

      // Replace name at start of sentence with pronoun
      const nameAtStart = new RegExp(`^${name}\\b`, 'i');
      if (nameAtStart.test(sentence)) {
        sentence = sentence.replace(nameAtStart, pronoun);
      } else {
        // Replace name in middle of sentence with lowercase pronoun
        sentence = sentence.replace(new RegExp(`\\b${name}\\b`, 'gi'), pronoun.toLowerCase());
      }
    }

    fixedSentences.push(sentence);
  }

  return fixedSentences.join(' ');
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

// Common female/male names for gender inference
const FEMALE_NAMES = new Set([
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen',
  'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley', 'dorothy', 'kimberly', 'emily', 'donna',
  'michelle', 'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia',
  'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen',
  'samantha', 'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather',
  'diane', 'ruth', 'julie', 'olivia', 'joyce', 'virginia', 'victoria', 'kelly', 'lauren', 'christina',
  'joan', 'evelyn', 'judith', 'megan', 'andrea', 'cheryl', 'hannah', 'jacqueline', 'martha', 'gloria',
  'teresa', 'ann', 'sara', 'madison', 'frances', 'kathryn', 'janice', 'jean', 'abigail', 'alice',
  'judy', 'sophia', 'grace', 'denise', 'amber', 'doris', 'marilyn', 'danielle', 'beverly', 'isabella',
  'theresa', 'diana', 'natalie', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis', 'lori',
  // Additional common names from the data
  'kayla', 'tahkiya', 'kristy', 'latasha', 'luisa', 'mari', 'aiza', 'maritza', 'marycarmen', 'mechelle',
  'akia', 'marge', 'alainna', 'alanna', 'deja', 'nari', 'sabrina', 'sally', 'alexandra', 'alexis',
  'alison', 'alysia', 'amaka', 'angeline', 'angie', 'ariane', 'arianna', 'ariel', 'paola', 'ashlee',
  'ashleigh', 'asia', 'nichola', 'bella', 'brookelynn', 'careese', 'cache', 'candace', 'casandra',
  'celeste', 'chanel', 'cherice', 'christa', 'ciera', 'claire', 'clare', 'clarissa', 'colette', 'cristin',
  'dalena', 'dawn', 'deedee', 'rocio', 'monique', 'ayanna', 'aykiyah', 'mandi', 'aivy', 'dilsha',
  'dimi', 'dorie', 'eithnie', 'dyani', 'ailin', 'elle', 'ellen', 'ellie', 'emily', 'romina', 'lynette',
  'faidat', 'falan', 'gaby', 'gitika', 'joanne', 'kamryn', 'katrina', 'chippy', 'westherlyne', 'marlaine',
  'opal', 'sandeep', 'briel', 'jourdan', 'adriana', 'amethyst', 'cris', 'kim', 'daniella'
]);

const MALE_NAMES = new Set([
  'james', 'robert', 'john', 'michael', 'david', 'william', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander', 'patrick', 'jack', 'dennis', 'jerry',
  'tyler', 'aaron', 'jose', 'adam', 'nathan', 'henry', 'douglas', 'zachary', 'peter', 'kyle',
  'noah', 'ethan', 'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean',
  'gerald', 'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse', 'bryan', 'billy',
  'bruce', 'gabriel', 'joe', 'logan', 'albert', 'willie', 'alan', 'eugene', 'russell', 'vincent',
  // Additional from data
  'gallo', 'adrian', 'joseph', 'derek', 'anil', 'kvyn', 'andro', 'brad', 'bryce', 'calen', 'carter',
  'cayden', 'chris', 'david', 'gabe', 'justis', 'blake', 'beto', 'bike', 'bin', 'moises', 'dash'
]);

// 1. Check retailer feedback for pronouns
function getGenderFromFeedback(feedback: string | null): 'male' | 'female' | null {
  if (!feedback) return null;
  const text = feedback.toLowerCase();

  const maleCount = (text.match(/\b(he|him|his|himself)\b/g) || []).length;
  const femaleCount = (text.match(/\b(she|her|hers|herself)\b/g) || []).length;

  if (femaleCount > maleCount && femaleCount >= 2) return 'female';
  if (maleCount > femaleCount && maleCount >= 2) return 'male';
  return null;
}

// 2. Infer gender from first name
function getGenderFromName(name: string | null): 'male' | 'female' | null {
  if (!name) return null;
  const firstName = name.trim().split(' ')[0].toLowerCase();

  if (FEMALE_NAMES.has(firstName)) return 'female';
  if (MALE_NAMES.has(firstName)) return 'male';
  return null;
}

// Get photo number for a gender (female = even, male = odd)
function getPhotoForGender(gender: 'male' | 'female', workerId: string): string {
  // Use hash of worker ID to get consistent but varied photo numbers
  let hash = 0;
  for (let i = 0; i < workerId.length; i++) {
    hash = ((hash << 5) - hash) + workerId.charCodeAt(i);
    hash = hash & hash;
  }
  // Get a number 1-20
  let num = (Math.abs(hash) % 10) + 1;
  // Adjust for gender: female = even (2,4,6...), male = odd (1,3,5...)
  if (gender === 'female' && num % 2 === 1) num++;
  if (gender === 'male' && num % 2 === 0) num++;
  if (num > 20) num = gender === 'female' ? 20 : 19;

  return `/images/avatars/w${String(num).padStart(3, '0')}.jpg`;
}

async function main() {
  console.log('Fetching workers...');

  // Get all workers - use retailer_summary for pronoun detection (retailer_feedback doesn't exist in DB)
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, retailer_summary, photo');

  if (error) {
    console.error('Error fetching workers:', error);
    return;
  }

  console.log(`Found ${workers?.length || 0} workers with retailer_summary\n`);

  const sqlStatements: string[] = [];
  let fixCount = 0;

  // Track workers and their determined gender
  const workerGenders = new Map<string, { gender: 'male' | 'female'; source: string }>();

  // First: determine gender for all workers
  for (const worker of workers || []) {
    // Priority 1: retailer summary pronouns (the AI-generated summaries already have she/he)
    let gender = getGenderFromFeedback(worker.retailer_summary);
    let source = 'summary';

    // Priority 2: name inference
    if (!gender) {
      gender = getGenderFromName(worker.name);
      source = 'name';
    }

    // Default: female (more common in retail)
    if (!gender) {
      gender = 'female';
      source = 'default';
    }

    workerGenders.set(worker.id, { gender, source });
  }

  // Generate combined UPDATE statements (gender + photo + retailer_summary fix)
  for (const worker of workers || []) {
    const genderInfo = workerGenders.get(worker.id);
    if (!genderInfo) continue;

    const { gender, source } = genderInfo;
    const newPhoto = getPhotoForGender(gender, worker.id);
    const updates: string[] = [];

    // Always set gender
    updates.push(`gender = '${gender}'`);

    // Update photo if needed
    if (worker.photo !== newPhoto) {
      updates.push(`photo = '${newPhoto}'`);
    }

    // Fix retailer_summary if it has repeated names
    if (worker.retailer_summary) {
      const name = extractNameFromSummary(worker.retailer_summary);
      if (name && hasRepeatedName(worker.retailer_summary, name)) {
        const fixed = fixRepeatedName(worker.retailer_summary, name, gender);
        if (fixed !== worker.retailer_summary) {
          updates.push(`retailer_summary = '${escapeSql(fixed)}'`);
          fixCount++;
          console.log(`${fixCount}. ${worker.name} - ${gender} (from ${source})`);
        }
      }
    }

    // Generate UPDATE statement
    sqlStatements.push(
      `UPDATE workers SET ${updates.join(', ')} WHERE id = '${worker.id}';`
    );
  }

  if (sqlStatements.length > 0) {
    // Split into multiple files to avoid "query too large" error
    const BATCH_SIZE = 400;
    const batches = [];
    for (let i = 0; i < sqlStatements.length; i += BATCH_SIZE) {
      batches.push(sqlStatements.slice(i, i + BATCH_SIZE));
    }

    // Write ALTER TABLE first
    const alterPath = OUTPUT_PATH.replace('.sql', '_0_alter.sql');
    fs.writeFileSync(alterPath, `-- Step 0: Add gender column\nALTER TABLE workers ADD COLUMN IF NOT EXISTS gender TEXT;\n`);
    console.log(`\nWrote ALTER TABLE to ${alterPath}`);

    // Write each batch
    for (let i = 0; i < batches.length; i++) {
      const batchPath = OUTPUT_PATH.replace('.sql', `_${i + 1}.sql`);
      fs.writeFileSync(
        batchPath,
        `-- Update workers: gender, photo, retailer_summary\n-- Part ${i + 1} of ${batches.length}\n-- Statements: ${batches[i].length}\n\n${batches[i].join('\n')}`
      );
      console.log(`Wrote ${batches[i].length} statements to ${batchPath}`);
    }

    console.log(`\nTotal: ${sqlStatements.length} UPDATE statements (${fixCount} retailer_summary fixes)`);
    console.log(`\nRun in order:\n1. ${alterPath}\n${batches.map((_, i) => `${i + 2}. ${OUTPUT_PATH.replace('.sql', `_${i + 1}.sql`)}`).join('\n')}`);
  } else {
    console.log('\nNo updates needed!');
  }
}

main();
