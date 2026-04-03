/**
 * Worker Summary Generation Script
 *
 * Generates AI summaries for workers using Gemini:
 * - about_me: Generated from interview_transcript or previous experience
 * - retailer_summary: Generated from retailer_quotes
 *
 * Reads from CSV file and outputs SQL UPDATE statements.
 *
 * Usage:
 *   npx tsx web/src/scripts/generateWorkerSummaries.ts
 *
 * Then run the generated SQL in Supabase SQL editor.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

const GEMINI_API_KEY = 'AIzaSyC-KdQJRNOnf4IiyKBw0apbmkFpf6P_b3Q';
const CSV_PATH = '/Users/katherine_1/Downloads/query_result_2026-04-03T12_07_55.56527879-05_00.csv';
const OUTPUT_PATH = '/Users/katherine_1/Downloads/workers_update_summaries.sql';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const DELAY_MS = 100; // Delay between batches
const BATCH_SIZE = 10; // Process 10 workers in parallel
const CONCURRENCY = 10; // Number of concurrent API calls

interface RetailerQuote {
  quote: string;
  brand: string;
  role: string;
}

interface WorkerRow {
  id: string;
  name: string;
  retailer_quotes: RetailerQuote[] | null;
  shift_verified: boolean;
  shifts_on_reflex: number;
  invited_back_stores: number;
  brands_worked: { name: string; tier: string }[];
  endorsement_counts: Record<string, number> | null;
  reflex_activity: {
    shiftsByTier: { luxury: number; elevated: number; mid: number };
    storeFavoriteCount?: number;
  } | null;
  interview_transcript: Record<string, unknown> | null;
  about_me: string | null;
  retailer_summary: string | null;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate about_me using Gemini from interview transcript
 */
async function generateAboutMeFromTranscript(name: string, transcript: Record<string, unknown>): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Extract text from typeform response
    let transcriptText = '';
    if (transcript?.typeform_response?.answers) {
      const answers = transcript.typeform_response.answers as { answer_text?: string }[];
      transcriptText = answers
        .filter(a => a.answer_text)
        .map(a => a.answer_text)
        .join(' ');
    } else {
      transcriptText = JSON.stringify(transcript);
    }

    if (!transcriptText || transcriptText.length < 50) {
      return null;
    }

    const prompt = `Based on this interview transcript from a retail worker named ${name}, write a brief 2-3 sentence "About Me" summary in first person that highlights their retail experience and what they bring to the role. Keep it professional and concise. Don't use quotation marks around the response.

Transcript:
${transcriptText.substring(0, 2000)}

Write the summary:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    return response.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error(`Error generating about_me from transcript for ${name}:`, error);
    return null;
  }
}

/**
 * Generate about_me using Gemini from previous experience (fallback when no transcript)
 */
async function generateAboutMeFromExperience(
  name: string,
  previousExperience: { company: string; duration: string; roles: string[] }[],
  brandsWorked: { name: string; tier: string }[],
  endorsementCounts: Record<string, number> | null
): Promise<string | null> {
  try {
    if ((!previousExperience || previousExperience.length === 0) && (!brandsWorked || brandsWorked.length === 0)) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const expText = previousExperience
      .map(e => `${e.company}: ${e.roles.join(', ')} (${e.duration})`)
      .join('\n');

    const brandsText = brandsWorked.map(b => `${b.name} (${b.tier})`).join(', ');

    const topEndorsements = endorsementCounts
      ? Object.entries(endorsementCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name)
          .join(', ')
      : '';

    const prompt = `Write a brief 2-3 sentence "About Me" summary in first person for a retail worker named ${name}. Base it on their experience and make it sound natural and professional. Don't use quotation marks around the response.

Previous retail experience:
${expText || 'No specific experience listed'}

Brands worked with on Reflex:
${brandsText || 'Various retail brands'}

Top endorsements from retailers:
${topEndorsements || 'Customer service, reliability'}

Write the summary:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    return response.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error(`Error generating about_me from experience for ${name}:`, error);
    return null;
  }
}

/**
 * Generate retailer_summary using Gemini from retailer quotes
 */
async function generateRetailerSummaryFromQuotes(name: string, quotes: RetailerQuote[]): Promise<string | null> {
  try {
    if (!quotes || quotes.length === 0) {
      return null;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const quotesText = quotes.map(q => `"${q.quote}"`).join('\n');

    const prompt = `Based on these retailer quotes about a retail worker named ${name}, write a brief 1-2 sentence summary that captures what retailers appreciate about them. Write in third person and focus on their key strengths. Don't use quotation marks around the response.

Retailer feedback:
${quotesText.substring(0, 1500)}

Write the summary:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    return response.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error(`Error generating retailer_summary for ${name}:`, error);
    return null;
  }
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    // Simple CSV parsing (handles basic cases)
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
  error: boolean;
}

async function processWorker(w: Record<string, string>): Promise<WorkerResult | null> {
  const workerUuid = w.worker_uuid;
  const name = w.display_name?.trim() || '';

  if (!workerUuid || !name) {
    return null;
  }

  const updates: string[] = [];
  let aboutMeGenerated = false;
  let retailerSummaryGenerated = false;
  let error = false;

  // Generate about_me from prior_experience + brands_worked + endorsements
  try {
    let aboutMe: string | null = null;

    // Try interview transcript first (usually empty {})
    if (w.interview_transcript && w.interview_transcript.trim() && w.interview_transcript !== '{}') {
      try {
        const transcript = JSON.parse(w.interview_transcript);
        if (Object.keys(transcript).length > 0) {
          aboutMe = await generateAboutMeFromTranscript(name, transcript);
        }
      } catch {
        // Invalid JSON, skip transcript
      }
    }

    // Fallback to experience + brands
    if (!aboutMe) {
      const hasPriorExp = w.prior_experience && w.prior_experience.trim() && w.prior_experience !== '';
      const hasBrands = w.brands_worked && w.brands_worked.trim() && w.brands_worked !== '';

      if (hasPriorExp || hasBrands) {
        const priorExp = hasPriorExp ? w.prior_experience.split('|').map(e => {
          const match = e.trim().match(/^(.+?)\s*-\s*(.+?)\s*\(([^)]+)\)\s*$/);
          if (match) {
            return { company: match[1].trim(), roles: [match[2].trim()], duration: match[3].trim() };
          }
          const parts = e.trim().split(' - ');
          return { company: parts[0] || 'Retail', duration: 'Previous', roles: [parts[1] || 'Sales Associate'] };
        }) : [];

        const brands = hasBrands ? w.brands_worked.split(',').map(b => ({ name: b.trim(), tier: 'mid' as const })) : [];

        let endorsementCounts: Record<string, number> | null = null;
        if (w.endorsement_tags && w.endorsement_tags.trim()) {
          const tags = w.endorsement_tags.split(',').map(t => t.trim()).filter(t => t);
          endorsementCounts = {};
          for (const tag of tags) {
            endorsementCounts[tag] = (endorsementCounts[tag] || 0) + 1;
          }
        }

        aboutMe = await generateAboutMeFromExperience(name, priorExp, brands, endorsementCounts);
      }
    }

    if (aboutMe) {
      updates.push(`about_me = ${escapeSql(aboutMe)}`);
      aboutMeGenerated = true;
    }
  } catch (e) {
    error = true;
  }

  // Generate retailer_summary from retailer_feedback
  try {
    if (w.retailer_feedback && w.retailer_feedback.trim()) {
      const feedbackText = w.retailer_feedback.trim();
      if (feedbackText) {
        const quotes = [{ quote: feedbackText, brand: '', role: '' }];
        const summary = await generateRetailerSummaryFromQuotes(name, quotes);
        if (summary) {
          updates.push(`retailer_summary = ${escapeSql(summary)}`);
          retailerSummaryGenerated = true;
        }
      }
    }
  } catch (e) {
    error = true;
  }

  return { workerUuid, name, updates, aboutMeGenerated, retailerSummaryGenerated, error };
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
  console.log(`Processing in batches of ${BATCH_SIZE} with ${CONCURRENCY} concurrent API calls...\n`);

  const sqlStatements: string[] = [];
  let aboutMeCount = 0;
  let retailerSummaryCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let processedCount = 0;

  // Process in batches
  for (let i = 0; i < workers.length; i += BATCH_SIZE) {
    const batch = workers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(workers.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches} (workers ${i + 1}-${Math.min(i + BATCH_SIZE, workers.length)})...`);

    // Process batch in parallel
    const results = await Promise.all(batch.map(w => processWorker(w)));

    for (const result of results) {
      if (result === null) {
        skippedCount++;
        continue;
      }

      processedCount++;
      if (result.aboutMeGenerated) aboutMeCount++;
      if (result.retailerSummaryGenerated) retailerSummaryCount++;
      if (result.error) errorCount++;

      if (result.updates.length > 0) {
        const sql = `UPDATE workers SET ${result.updates.join(', ')} WHERE worker_uuid = '${result.workerUuid}'::uuid;`;
        sqlStatements.push(sql);
      }
    }

    console.log(`  ✓ Batch complete: ${results.filter(r => r !== null).length} processed, ${sqlStatements.length} total statements`);

    // Write progress every 10 batches (100 workers)
    if (batchNum % 10 === 0) {
      console.log(`  Writing progress to file...`);
      fs.writeFileSync(OUTPUT_PATH, sqlStatements.join('\n\n'));
    }

    // Small delay between batches to avoid rate limiting
    await delay(DELAY_MS);
  }

  // Write final SQL file
  fs.writeFileSync(OUTPUT_PATH, `-- Worker summary updates
-- Generated ${sqlStatements.length} UPDATE statements
-- about_me: ${aboutMeCount}
-- retailer_summary: ${retailerSummaryCount}
-- skipped: ${skippedCount}

${sqlStatements.join('\n\n')}`);

  console.log('\n\n=== Summary Generation Complete ===');
  console.log(`Total processed: ${processedCount}`);
  console.log(`about_me generated: ${aboutMeCount}`);
  console.log(`retailer_summary generated: ${retailerSummaryCount}`);
  console.log(`Skipped (no uuid/name): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nSQL file written to: ${OUTPUT_PATH}`);
}

generateAllSummaries().catch(console.error);
