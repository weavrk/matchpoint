/**
 * Fix Gender Pronouns in SQL Files
 *
 * Reads the retailer_feedback from CSV to detect actual gender (he/she/his/her),
 * then updates the SQL files to use correct pronouns in retailer_summary.
 */

import * as fs from 'fs';

const CSV_PATH = '/Users/katherine_1/Downloads/query_result_2026-04-03T12_07_55.56527879-05_00.csv';
const SQL_PART1 = '/Users/katherine_1/Downloads/workers_update_summaries_v2_part1.sql';
const SQL_PART2 = '/Users/katherine_1/Downloads/workers_update_summaries_v2_part2.sql';

function parseCSV(content: string): Map<string, { name: string; feedback: string }> {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const uuidIdx = headers.indexOf('worker_uuid');
  const nameIdx = headers.indexOf('display_name');
  const feedbackIdx = headers.indexOf('retailer_feedback');

  const workerMap = new Map<string, { name: string; feedback: string }>();

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

    const uuid = values[uuidIdx];
    const name = values[nameIdx]?.trim() || '';
    const feedback = values[feedbackIdx] || '';

    if (uuid) {
      workerMap.set(uuid, { name, feedback });
    }
  }

  return workerMap;
}

function detectGenderFromFeedback(feedback: string): 'she' | 'he' | null {
  const text = feedback.toLowerCase();

  // Count male vs female pronoun occurrences
  const malePatterns = /\b(he|him|his|himself)\b/g;
  const femalePatterns = /\b(she|her|hers|herself)\b/g;

  const maleCount = (text.match(malePatterns) || []).length;
  const femaleCount = (text.match(femalePatterns) || []).length;

  if (femaleCount > maleCount && femaleCount >= 2) return 'she';
  if (maleCount > femaleCount && maleCount >= 2) return 'he';

  return null; // Can't determine
}

function fixPronouns(text: string, firstName: string, gender: 'she' | 'he'): string {
  let fixed = text;

  if (gender === 'she') {
    // Replace they/them/their with she/her/her
    fixed = fixed.replace(new RegExp(`\\b${firstName}''s their\\b`, 'gi'), `${firstName}'s her`);
    fixed = fixed.replace(/\btheir\b/g, 'her');
    fixed = fixed.replace(/\bThey are\b/g, 'She is');
    fixed = fixed.replace(/\bthey are\b/g, 'she is');
    fixed = fixed.replace(/\bThey have\b/g, 'She has');
    fixed = fixed.replace(/\bthey have\b/g, 'she has');
    fixed = fixed.replace(/\bThey\b/g, 'She');
    fixed = fixed.replace(/\bthey\b/g, 'she');
    fixed = fixed.replace(/\bthem\b/g, 'her');
  } else {
    // Replace they/them/their with he/him/his
    fixed = fixed.replace(new RegExp(`\\b${firstName}''s their\\b`, 'gi'), `${firstName}'s his`);
    fixed = fixed.replace(/\btheir\b/g, 'his');
    fixed = fixed.replace(/\bThey are\b/g, 'He is');
    fixed = fixed.replace(/\bthey are\b/g, 'he is');
    fixed = fixed.replace(/\bThey have\b/g, 'He has');
    fixed = fixed.replace(/\bthey have\b/g, 'he has');
    fixed = fixed.replace(/\bThey\b/g, 'He');
    fixed = fixed.replace(/\bthey\b/g, 'he');
    fixed = fixed.replace(/\bthem\b/g, 'him');
  }

  return fixed;
}

function processSqlFile(sqlPath: string, workerMap: Map<string, { name: string; feedback: string }>): number {
  console.log(`Processing: ${sqlPath}`);
  let content = fs.readFileSync(sqlPath, 'utf-8');
  let fixedCount = 0;

  // Find all UUIDs in the SQL file
  const uuidPattern = /worker_uuid = '([a-f0-9-]+)'::uuid/g;
  let match;

  while ((match = uuidPattern.exec(content)) !== null) {
    const uuid = match[1];
    const worker = workerMap.get(uuid);

    if (!worker) continue;

    const gender = detectGenderFromFeedback(worker.feedback);
    if (!gender) continue;

    const firstName = worker.name.split(' ')[0];

    // Find the retailer_summary for this UUID
    const summaryPattern = new RegExp(
      `(retailer_summary = ')([^']*(?:''[^']*)*)(')([^;]*worker_uuid = '${uuid}'::uuid)`,
      'g'
    );

    content = content.replace(summaryPattern, (fullMatch, prefix, summary, suffix, rest) => {
      // Check if summary contains they/their/them
      if (/\b(they|their|them)\b/i.test(summary)) {
        const fixedSummary = fixPronouns(summary, firstName, gender);
        if (fixedSummary !== summary) {
          fixedCount++;
          console.log(`  Fixed ${firstName}: they -> ${gender}`);
        }
        return prefix + fixedSummary + suffix + rest;
      }
      return fullMatch;
    });
  }

  fs.writeFileSync(sqlPath, content);
  console.log(`  Fixed ${fixedCount} summaries\n`);
  return fixedCount;
}

function main() {
  console.log('Loading CSV for gender detection...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const workerMap = parseCSV(csvContent);
  console.log(`Loaded ${workerMap.size} workers\n`);

  let totalFixed = 0;
  totalFixed += processSqlFile(SQL_PART1, workerMap);
  totalFixed += processSqlFile(SQL_PART2, workerMap);

  console.log(`Done! Fixed ${totalFixed} total retailer summaries.`);
}

main();
