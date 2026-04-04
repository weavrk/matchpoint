/**
 * Clean About Me Summaries Script
 *
 * - Removes "I'm {Name}," and "I am {Name}," from about_me summaries
 * - Keeps "As an experienced..." openers
 * - Replaces full names with first names only in retailer_summary
 */

import * as fs from 'fs';

const INPUT_PATH = '/Users/katherine_1/Downloads/workers_update_summaries.sql';
const OUTPUT_PATH = '/Users/katherine_1/Downloads/workers_update_summaries_cleaned.sql';

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function cleanAboutMe(aboutMe: string): string {
  let cleaned = aboutMe;

  // Remove "I''m {CapitalizedName}, " - SQL escaped apostrophe
  cleaned = cleaned.replace(/^I''m [A-Z][^,]+,\s*/g, '');

  // Remove "I'm {CapitalizedName}, " - regular apostrophe
  cleaned = cleaned.replace(/^I'm [A-Z][^,]+,\s*/g, '');

  // Remove "I am {CapitalizedName}, " - only when next word is capitalized (a name)
  cleaned = cleaned.replace(/^I am [A-Z][^,]+,\s*/g, '');

  // Capitalize first letter after removal
  cleaned = capitalizeFirst(cleaned);

  return cleaned;
}

function replaceFullNameWithFirst(retailerSummary: string, fullName: string): string {
  if (!fullName || !retailerSummary) return retailerSummary;

  // Get first name (first word of the name)
  const firstName = fullName.split(' ')[0];

  // If name is just one word, no change needed
  if (firstName === fullName) return retailerSummary;

  // Replace full name with first name (handle SQL escaped apostrophes in names like O''Brien)
  const escapedFullName = fullName.replace(/'/g, "''");
  let cleaned = retailerSummary.replace(new RegExp(escapedFullName, 'g'), firstName);

  // Also try without the SQL escaping in case the name doesn't have apostrophes
  cleaned = cleaned.replace(new RegExp(fullName, 'g'), firstName);

  return cleaned;
}

function extractWorkerName(line: string): string | null {
  // Try to extract name from patterns like "I''m Ava Lewis," or "I am Gallo,"
  // in the original about_me before cleaning
  const patterns = [
    /about_me = 'I''m ([A-Z][^,]+),/,
    /about_me = 'I'm ([A-Z][^,]+),/,
    /about_me = 'I am ([A-Z][^,]+),/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function processSQL() {
  console.log('Reading SQL file:', INPUT_PATH);
  const content = fs.readFileSync(INPUT_PATH, 'utf-8');

  const lines = content.split('\n');
  const processedLines: string[] = [];
  let aboutMeCleanedCount = 0;
  let retailerCleanedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (!line.includes('about_me = ')) {
      processedLines.push(line);
      continue;
    }

    // Extract worker name before cleaning (from the "I'm Name," pattern)
    const workerName = extractWorkerName(line);

    // Extract and clean about_me value
    const aboutMeMatch = line.match(/about_me = '((?:[^']|'')+)'/);
    if (aboutMeMatch) {
      const originalAboutMe = aboutMeMatch[1];
      const cleanedAboutMe = cleanAboutMe(originalAboutMe);

      if (originalAboutMe !== cleanedAboutMe) {
        aboutMeCleanedCount++;
        line = line.replace(
          `about_me = '${originalAboutMe}'`,
          `about_me = '${cleanedAboutMe}'`
        );
      }
    }

    // Extract and clean retailer_summary - replace full name with first name
    if (workerName) {
      const retailerMatch = line.match(/retailer_summary = '((?:[^']|'')+)'/);
      if (retailerMatch) {
        const originalRetailer = retailerMatch[1];
        const cleanedRetailer = replaceFullNameWithFirst(originalRetailer, workerName);

        if (originalRetailer !== cleanedRetailer) {
          retailerCleanedCount++;
          line = line.replace(
            `retailer_summary = '${originalRetailer}'`,
            `retailer_summary = '${cleanedRetailer}'`
          );
        }
      }
    }

    processedLines.push(line);
  }

  fs.writeFileSync(OUTPUT_PATH, processedLines.join('\n'));

  console.log(`\nCleaned ${aboutMeCleanedCount} about_me summaries`);
  console.log(`Cleaned ${retailerCleanedCount} retailer_summary (full name -> first name)`);
  console.log(`Output written to: ${OUTPUT_PATH}`);
}

processSQL();
