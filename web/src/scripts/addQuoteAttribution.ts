/**
 * Add Quote Attribution Script
 *
 * Adds role and brand to retailer_quotes for each worker.
 * - role: "Store Manager" (45%), "Assistant Store Manager" (30%),
 *         "Store Team Leader" (15%), "Lead Associate" (10%)
 * - brand: randomly picked from worker's brands_worked
 *
 * Outputs SQL to update retailer_quotes column.
 */

import * as fs from 'fs';

const CSV_PATH = '/Users/katherine_1/Downloads/query_result_2026-04-03T12_07_55.56527879-05_00.csv';
const OUTPUT_PATH = '/Users/katherine_1/Downloads/workers_quote_attribution.sql';

function parseCSV(content: string): { uuid: string; brands: string[]; feedback: string }[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const uuidIdx = headers.indexOf('worker_uuid');
  const brandsIdx = headers.indexOf('brands_worked');
  const feedbackIdx = headers.indexOf('retailer_feedback');

  const workers: { uuid: string; brands: string[]; feedback: string }[] = [];

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
    const brandsStr = values[brandsIdx] || '';
    const feedback = values[feedbackIdx] || '';

    if (uuid && feedback) {
      const brands = brandsStr.split(',').map(b => b.trim()).filter(b => b);
      workers.push({ uuid, brands, feedback });
    }
  }

  return workers;
}

function getRandomRole(): string {
  const rand = Math.random();
  if (rand < 0.45) return 'Store Manager';
  if (rand < 0.75) return 'Assistant Store Manager';
  if (rand < 0.90) return 'Store Team Leader';
  return 'Lead Associate';
}

function extractQuotes(feedback: string): string[] {
  // Split feedback by common delimiters that separate reviews
  const quotes: string[] = [];

  // Try to split by patterns like "Great worker!", "Amazing!", etc.
  // Most feedback is a continuous blob, so we'll create synthetic quotes
  // by splitting on sentence boundaries
  const sentences = feedback.split(/(?<=[.!?])\s+/);

  // Group sentences into quotes of 1-3 sentences each
  let currentQuote = '';
  let sentenceCount = 0;
  const targetSentences = 1 + Math.floor(Math.random() * 2); // 1-2 sentences per quote

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    currentQuote += (currentQuote ? ' ' : '') + sentence.trim();
    sentenceCount++;

    if (sentenceCount >= targetSentences) {
      if (currentQuote.length > 20 && currentQuote.length < 300) {
        quotes.push(currentQuote);
      }
      currentQuote = '';
      sentenceCount = 0;
    }
  }

  // Add any remaining
  if (currentQuote.length > 20 && currentQuote.length < 300) {
    quotes.push(currentQuote);
  }

  // Limit to 3-5 quotes per worker
  return quotes.slice(0, Math.min(5, Math.max(3, quotes.length)));
}

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

function main() {
  console.log('Loading CSV...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const workers = parseCSV(csvContent);
  console.log(`Found ${workers.length} workers with feedback\n`);

  const sqlStatements: string[] = [];
  let processedCount = 0;

  for (const worker of workers) {
    if (!worker.feedback || worker.brands.length === 0) continue;

    const quotes = extractQuotes(worker.feedback);
    if (quotes.length === 0) continue;

    const retailerQuotes = quotes.map(quote => {
      const brand = worker.brands[Math.floor(Math.random() * worker.brands.length)];
      return {
        quote: quote,
        role: getRandomRole(),
        brand: toTitleCase(brand)
      };
    });

    const jsonStr = JSON.stringify(retailerQuotes);
    const sql = `UPDATE workers SET retailer_quotes = '${escapeSql(jsonStr)}'::jsonb WHERE worker_uuid = '${worker.uuid}'::uuid;`;
    sqlStatements.push(sql);
    processedCount++;
  }

  // Split into two files
  const midpoint = Math.ceil(sqlStatements.length / 2);
  const part1 = sqlStatements.slice(0, midpoint);
  const part2 = sqlStatements.slice(midpoint);

  fs.writeFileSync(
    OUTPUT_PATH.replace('.sql', '_part1.sql'),
    `-- Quote Attribution Updates - Part 1\n-- Statements: ${part1.length}\n\n${part1.join('\n\n')}`
  );

  fs.writeFileSync(
    OUTPUT_PATH.replace('.sql', '_part2.sql'),
    `-- Quote Attribution Updates - Part 2\n-- Statements: ${part2.length}\n\n${part2.join('\n\n')}`
  );

  console.log(`Processed ${processedCount} workers`);
  console.log(`Output files:`);
  console.log(`  Part 1: ${OUTPUT_PATH.replace('.sql', '_part1.sql')} (${part1.length} statements)`);
  console.log(`  Part 2: ${OUTPUT_PATH.replace('.sql', '_part2.sql')} (${part2.length} statements)`);
}

main();
