/**
 * Fix all worker data: names (title case), gender, and pronouns
 * Gender priority: 1) retailer_quotes pronouns, 2) first name, 3) default female
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  'perla', 'kristal', 'tahkiya', 'kristy', 'latasha', 'luisa', 'mari', 'aiza', 'maritza', 'marycarmen', 'mechelle',
  'akia', 'marge', 'alainna', 'alanna', 'deja', 'nari', 'sabrina', 'sally', 'alexandra', 'alison', 'alysia',
  'amaka', 'angeline', 'angie', 'ariane', 'arianna', 'ariel', 'paola', 'ashlee', 'ashleigh', 'asia', 'nichola',
  'bella', 'brookelynn', 'careese', 'cache', 'candace', 'casandra', 'celeste', 'chanel', 'cherice', 'christa',
  'ciera', 'claire', 'clare', 'clarissa', 'colette', 'cristin', 'dalena', 'dawn', 'deedee', 'rocio', 'monique',
  'ayanna', 'aykiyah', 'mandi', 'aivy', 'dilsha', 'dimi', 'dorie', 'eithnie', 'dyani', 'ailin', 'elle', 'ellen',
  'ellie', 'romina', 'lynette', 'faidat', 'falan', 'gaby', 'gitika', 'joanne', 'kamryn', 'katrina', 'chippy',
  'westherlyne', 'marlaine', 'opal', 'sandeep', 'briel', 'jourdan', 'adriana', 'amethyst', 'cris', 'kim',
  'daniella', 'kat', 'mimie', 'ashonte', 'itzamara', 'keena', 'tiffany', 'vanessa', 'crystal', 'brittney',
  'jasmine', 'destiny', 'brianna', 'kaitlyn', 'morgan', 'taylor', 'jordan', 'alexia', 'alicia', 'erica'
]);

const MALE_NAMES = new Set([
  'james', 'robert', 'john', 'michael', 'david', 'william', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
  'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander', 'patrick', 'jack', 'dennis', 'jerry',
  'tyler', 'aaron', 'jose', 'adam', 'nathan', 'henry', 'douglas', 'zachary', 'peter', 'kyle',
  'noah', 'ethan', 'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean',
  'gerald', 'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jesse', 'bryan', 'billy',
  'bruce', 'gabriel', 'joe', 'logan', 'albert', 'willie', 'alan', 'eugene', 'russell', 'vincent',
  'gallo', 'adrian', 'derek', 'anil', 'kvyn', 'andro', 'brad', 'bryce', 'calen', 'carter',
  'cayden', 'chris', 'gabe', 'justis', 'blake', 'beto', 'bike', 'bin', 'moises', 'dash', 'aj'
]);

// Get gender from retailer quotes (priority 1)
function getGenderFromQuotes(quotes: { quote: string }[] | null): 'male' | 'female' | null {
  if (!quotes || quotes.length === 0) return null;

  const allText = quotes.map(q => q.quote.toLowerCase()).join(' ');
  const maleCount = (allText.match(/\b(he|him|his|himself)\b/g) || []).length;
  const femaleCount = (allText.match(/\b(she|her|hers|herself)\b/g) || []).length;

  if (femaleCount > maleCount && femaleCount >= 2) return 'female';
  if (maleCount > femaleCount && maleCount >= 2) return 'male';
  return null;
}

// Get gender from first name (priority 2)
function getGenderFromName(name: string): 'male' | 'female' | null {
  const firstName = name.trim().split(' ')[0].toLowerCase();
  if (FEMALE_NAMES.has(firstName)) return 'female';
  if (MALE_NAMES.has(firstName)) return 'male';
  return null;
}

// Title case name
function toTitleCase(name: string): string {
  let fixed = name.trim();
  fixed = fixed.split(' ').map(word => {
    if (!word) return '';
    // Keep 2-letter uppercase names like AJ, DJ
    if (word.length === 2 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) return word;
    if (word.includes('-')) {
      return word.split('-').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join('-');
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).filter(w => w).join(' ');
  return fixed;
}

// Fix pronouns in summary
function fixPronouns(summary: string, gender: 'male' | 'female'): string {
  let fixed = summary;

  if (gender === 'female') {
    fixed = fixed.replace(/\bThey\b/g, 'She');
    fixed = fixed.replace(/\bthey\b/g, 'she');
    fixed = fixed.replace(/\bTheir\b/g, 'Her');
    fixed = fixed.replace(/\btheir\b/g, 'her');
    fixed = fixed.replace(/\bThem\b/g, 'Her');
    fixed = fixed.replace(/\bthem\b/g, 'her');
    fixed = fixed.replace(/\bThemselves\b/g, 'Herself');
    fixed = fixed.replace(/\bthemselves\b/g, 'herself');
    fixed = fixed.replace(/\bHe\b/g, 'She');
    fixed = fixed.replace(/\bhe\b/g, 'she');
    fixed = fixed.replace(/\bHis\b/g, 'Her');
    fixed = fixed.replace(/\bhis\b/g, 'her');
    fixed = fixed.replace(/\bHim\b/g, 'Her');
    fixed = fixed.replace(/\bhim\b/g, 'her');
    fixed = fixed.replace(/\bHimself\b/g, 'Herself');
    fixed = fixed.replace(/\bhimself\b/g, 'herself');
  } else {
    fixed = fixed.replace(/\bThey\b/g, 'He');
    fixed = fixed.replace(/\bthey\b/g, 'he');
    fixed = fixed.replace(/\bTheir\b/g, 'His');
    fixed = fixed.replace(/\btheir\b/g, 'his');
    fixed = fixed.replace(/\bThem\b/g, 'Him');
    fixed = fixed.replace(/\bthem\b/g, 'him');
    fixed = fixed.replace(/\bThemselves\b/g, 'Himself');
    fixed = fixed.replace(/\bthemselves\b/g, 'himself');
    fixed = fixed.replace(/\bShe\b/g, 'He');
    fixed = fixed.replace(/\bshe\b/g, 'he');
    fixed = fixed.replace(/\bHer\b/g, 'His');
    fixed = fixed.replace(/\bher\b/g, 'his');
    fixed = fixed.replace(/\bHerself\b/g, 'Himself');
    fixed = fixed.replace(/\bherself\b/g, 'himself');
  }

  // Fix grammar
  fixed = fixed.replace(/\b(she|he) are\b/gi, (m, p) => p + ' is');
  fixed = fixed.replace(/\b(she|he) were\b/gi, (m, p) => p + ' was');
  fixed = fixed.replace(/\b(she|he) have\b/gi, (m, p) => p + ' has');

  return fixed;
}

async function main() {
  console.log('Fetching all workers...');

  // Paginate to get all workers (Supabase default limit is 1000)
  let allWorkers: any[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, name, gender, retailer_summary, retailer_quotes')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching workers:', error);
      return;
    }

    if (!workers || workers.length === 0) break;
    allWorkers = allWorkers.concat(workers);
    console.log(`Fetched ${allWorkers.length} workers...`);
    if (workers.length < limit) break;
    offset += limit;
  }

  console.log(`Total: ${allWorkers.length} workers\n`);
  const workers = allWorkers;

  let fixedCount = 0;
  let errorCount = 0;

  for (const w of workers || []) {
    const updates: Record<string, unknown> = {};

    // 1. Fix name to title case
    const fixedName = toTitleCase(w.name || '');
    if (fixedName !== w.name) {
      updates.name = fixedName;
    }

    // 2. Determine gender (quotes first, then name, then default female)
    let gender: 'male' | 'female' = w.gender;
    if (!gender) {
      gender = getGenderFromQuotes(w.retailer_quotes);
      if (!gender) {
        gender = getGenderFromName(w.name || '');
      }
      if (!gender) {
        gender = 'female'; // default for retail
      }
      updates.gender = gender;
    }

    // 3. Fix pronouns in retailer_summary
    if (w.retailer_summary) {
      const hasThey = /\b(they|their|them|themselves)\b/i.test(w.retailer_summary);
      if (hasThey) {
        const fixedSummary = fixPronouns(w.retailer_summary, gender);
        if (fixedSummary !== w.retailer_summary) {
          updates.retailer_summary = fixedSummary;
        }
      }
    }

    // Update if needed
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('workers')
        .update(updates)
        .eq('id', w.id);

      if (updateError) {
        console.error(`Error updating ${w.name}:`, updateError.message);
        errorCount++;
      } else {
        fixedCount++;
        if (fixedCount <= 10) {
          console.log(`Fixed: ${w.name} -> ${JSON.stringify(updates).substring(0, 100)}...`);
        }
      }
    }
  }

  console.log(`\nDone! Fixed ${fixedCount} records. Errors: ${errorCount}`);
}

main();
