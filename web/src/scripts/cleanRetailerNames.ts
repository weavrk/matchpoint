/**
 * Clean Retailer Summary Names Script
 *
 * Replaces full names with first names only in retailer_summary fields.
 * Uses the CSV file to get worker_uuid -> display_name mapping.
 */

import * as fs from 'fs';

const CSV_PATH = '/Users/katherine_1/Downloads/query_result_2026-04-03T12_07_55.56527879-05_00.csv';
const INPUT_PART1 = '/Users/katherine_1/Downloads/workers_update_summaries_cleaned_part1.sql';
const INPUT_PART2 = '/Users/katherine_1/Downloads/workers_update_summaries_cleaned_part2.sql';
const OUTPUT_PART1 = '/Users/katherine_1/Downloads/workers_final_part1.sql';
const OUTPUT_PART2 = '/Users/katherine_1/Downloads/workers_final_part2.sql';

function parseCSV(content: string): Map<string, string> {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const uuidIdx = headers.indexOf('worker_uuid');
  const nameIdx = headers.indexOf('display_name');

  const nameMap = new Map<string, string>();

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
    const name = values[nameIdx];
    if (uuid && name) {
      nameMap.set(uuid, name);
    }
  }

  return nameMap;
}

function cleanRetailerSummary(text: string, fullName: string): string {
  if (!fullName || !text) return text;

  const firstName = fullName.split(' ')[0];

  let cleaned = text;

  // Replace full name with first name
  if (fullName !== firstName) {
    const escapedName = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sqlEscapedName = escapedName.replace(/'/g, "''");
    cleaned = cleaned.replace(new RegExp(sqlEscapedName, 'g'), firstName);
    cleaned = cleaned.replace(new RegExp(escapedName, 'g'), firstName);
  }

  // Replace they/them/their pronouns with first name
  // "their excellent" -> "Barnes''s excellent" (SQL escaped apostrophe)
  // "making them a" -> "making Barnes a"
  // "they are" -> "Barnes is"

  // their -> {Name}''s (possessive)
  cleaned = cleaned.replace(/\btheir\b/gi, `${firstName}''s`);

  // them -> {Name}
  cleaned = cleaned.replace(/\bthem\b/gi, firstName);

  // they are -> {Name} is
  cleaned = cleaned.replace(/\bthey are\b/gi, `${firstName} is`);
  cleaned = cleaned.replace(/\bThey are\b/g, `${firstName} is`);

  // they have -> {Name} has
  cleaned = cleaned.replace(/\bthey have\b/gi, `${firstName} has`);
  cleaned = cleaned.replace(/\bThey have\b/g, `${firstName} has`);

  // they -> {Name} (remaining cases)
  cleaned = cleaned.replace(/\bthey\b/gi, firstName);
  cleaned = cleaned.replace(/\bThey\b/g, firstName);

  return cleaned;
}

function processSQLFile(inputPath: string, outputPath: string, nameMap: Map<string, string>) {
  console.log(`Processing: ${inputPath}`);
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');
  const processedLines: string[] = [];
  let cleanedCount = 0;

  for (const line of lines) {
    if (!line.includes('worker_uuid = ')) {
      processedLines.push(line);
      continue;
    }

    // Extract UUID from the line
    const uuidMatch = line.match(/worker_uuid = '([a-f0-9\-]+)'::uuid/);
    if (!uuidMatch) {
      processedLines.push(line);
      continue;
    }

    const uuid = uuidMatch[1];
    const fullName = nameMap.get(uuid);

    if (!fullName) {
      processedLines.push(line);
      continue;
    }

    // Extract and clean retailer_summary
    const retailerMatch = line.match(/retailer_summary = '((?:[^']|'')+)'/);
    if (!retailerMatch) {
      processedLines.push(line);
      continue;
    }

    const originalRetailer = retailerMatch[1];
    const cleanedRetailer = cleanRetailerSummary(originalRetailer, fullName);

    if (originalRetailer !== cleanedRetailer) {
      cleanedCount++;
      const newLine = line.replace(
        `retailer_summary = '${originalRetailer}'`,
        `retailer_summary = '${cleanedRetailer}'`
      );
      processedLines.push(newLine);

      if (cleanedCount <= 3) {
        console.log(`  [${cleanedCount}] ${fullName} -> ${fullName.split(' ')[0]}`);
      }
    } else {
      processedLines.push(line);
    }
  }

  fs.writeFileSync(outputPath, processedLines.join('\n'));
  console.log(`  Cleaned ${cleanedCount} retailer summaries`);
  console.log(`  Output: ${outputPath}\n`);
}

function main() {
  console.log('Loading CSV for name mapping...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const nameMap = parseCSV(csvContent);
  console.log(`Loaded ${nameMap.size} worker names\n`);

  processSQLFile(INPUT_PART1, OUTPUT_PART1, nameMap);
  processSQLFile(INPUT_PART2, OUTPUT_PART2, nameMap);

  console.log('Done! Use these files:');
  console.log(`  1. ${OUTPUT_PART1}`);
  console.log(`  2. ${OUTPUT_PART2}`);
}

main();
