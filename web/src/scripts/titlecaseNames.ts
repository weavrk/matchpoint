/**
 * Titlecase Display Names Script
 *
 * Updates all display_name values to Title Case.
 */

import * as fs from 'fs';

const CSV_PATH = '/Users/katherine_1/Downloads/query_result_2026-04-03T12_07_55.56527879-05_00.csv';
const OUTPUT_PATH = '/Users/katherine_1/Downloads/workers_titlecase_names.sql';

function parseCSV(content: string): { uuid: string; name: string }[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const uuidIdx = headers.indexOf('worker_uuid');
  const nameIdx = headers.indexOf('display_name');

  const workers: { uuid: string; name: string }[] = [];

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

    // Skip invalid entries - uuid must be a valid UUID format, name must look like a name
    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (uuid && name && uuidPattern.test(uuid) && name.length < 50 && !name.includes('.')) {
      workers.push({ uuid, name });
    }
  }

  return workers;
}

// Common 2-letter name abbreviations that should stay uppercase
const UPPERCASE_NAMES = new Set(['AJ', 'JD', 'JR', 'DJ', 'TJ', 'CJ', 'RJ', 'MJ', 'BJ', 'JP', 'JC']);

// Known names with internal capitals - explicit list is more reliable than pattern matching
const SPECIAL_NAMES: Record<string, string> = {
  'desantis': 'DeSantis',
  'deyoung': 'DeYoung',
  'deangelo': 'DeAngelo',
  'dangelo': "D'Angelo",
  'labelle': 'LaBelle',
  'laporte': 'LaPorte',
  'diangelo': 'DiAngelo',
  'mccarthy': 'McCarthy',
  'mcdonald': 'McDonald',
  'mcnamara': 'McNamara',
  'mckinney': 'McKinney',
  'mckinley': 'McKinley',
  'mcclain': 'McClain',
  'mcgee': 'McGee',
  'mcbride': 'McBride',
  'macarthur': 'MacArthur',
  'obrien': "O'Brien",
  'oconnor': "O'Connor",
  'oneal': "O'Neal",
  'oneill': "O'Neill",
};

function toTitleCase(str: string): string {
  // Skip if it looks like feedback text (contains periods, pipes, or is very long)
  if (str.includes('.') || str.includes('|') || str.length > 50) {
    return str; // Don't modify - not a name
  }

  return str
    .split(' ')
    .map(word => {
      if (!word) return word;

      // Keep uppercase abbreviations as-is
      if (UPPERCASE_NAMES.has(word.toUpperCase())) {
        return word.toUpperCase();
      }

      // Check for known special names
      const lowerWord = word.toLowerCase();
      if (SPECIAL_NAMES[lowerWord]) {
        return SPECIAL_NAMES[lowerWord];
      }

      // Handle names with apostrophes (O'Brien, D'Angelo)
      if (word.includes("'")) {
        return word
          .split("'")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("'");
      }

      // Handle hyphenated names (Mary-Jane)
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('-');
      }

      // Handle Mc prefixes (McDonald, etc.) - only if followed by uppercase
      if (word.toLowerCase().startsWith('mc') && word.length > 2 && /[A-Z]/.test(word.charAt(2))) {
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

function main() {
  console.log('Loading CSV...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const workers = parseCSV(csvContent);
  console.log(`Found ${workers.length} workers\n`);

  const sqlStatements: string[] = [];
  let changedCount = 0;

  for (const worker of workers) {
    const titlecased = toTitleCase(worker.name);

    // Only update if it actually changes
    if (titlecased !== worker.name) {
      const sql = `UPDATE workers SET display_name = '${escapeSql(titlecased)}' WHERE worker_uuid = '${worker.uuid}'::uuid;`;
      sqlStatements.push(sql);
      changedCount++;

      if (changedCount <= 10) {
        console.log(`  "${worker.name}" -> "${titlecased}"`);
      }
    }
  }

  if (changedCount > 10) {
    console.log(`  ... and ${changedCount - 10} more\n`);
  }

  fs.writeFileSync(
    OUTPUT_PATH,
    `-- Titlecase Display Names\n-- Statements: ${sqlStatements.length}\n\n${sqlStatements.join('\n')}`
  );

  console.log(`Changed ${changedCount} names`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main();
