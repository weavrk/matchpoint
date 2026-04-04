/**
 * Fix Repeated Names in retailer_summary
 *
 * Reads the existing SQL files and fixes cases where a name appears
 * twice in consecutive sentences in the retailer_summary field.
 */

import * as fs from 'fs';

const SQL_FILES = [
  '/Users/katherine_1/Downloads/workers_update_summaries_v3_part1.sql',
  '/Users/katherine_1/Downloads/workers_update_summaries_v3_part2.sql',
  '/Users/katherine_1/Downloads/workers_update_summaries_v3_part3.sql',
];

// Extract name from the retailer_summary (first word that appears before common patterns)
function extractNameFromSummary(summary: string): string | null {
  // Common patterns: "Store teams consistently praise X for", "X consistently receives", etc.
  const patterns = [
    /Store teams consistently (?:praise|commend|find) (\w+)/i,
    /(\w+) consistently receives/i,
    /(\w+) is consistently/i,
    /Managers (?:consistently|frequently) (?:praise|note|highlight) (\w+)/i,
    /(\w+) has earned/i,
    /(\w+) brings/i,
    /Retailers (?:praise|note|appreciate) (\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = summary.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Fix repeated name in consecutive sentences
function fixRepeatedName(summary: string, name: string): string {
  const sentences = summary.split(/(?<=[.!?])\s+/);
  if (sentences.length < 2) return summary;

  const fixedSentences: string[] = [sentences[0]];

  for (let i = 1; i < sentences.length; i++) {
    let sentence = sentences[i];
    const prevSentence = fixedSentences[fixedSentences.length - 1];

    // Check if both sentences start with or prominently feature the name
    const nameAtStart = new RegExp(`^${name}\\b`, 'i');
    const nameProminent = new RegExp(`^(\\w+\\s+){0,3}${name}\\b`, 'i');

    const prevHasName = nameProminent.test(prevSentence);
    const currHasName = nameProminent.test(sentence);

    if (prevHasName && currHasName) {
      // Replace name with pronoun or rephrase
      // Detect gender from context (they/their = neutral, he/his = male, she/her = female)
      const hasThey = /\bthey\b|\btheir\b|\bthem\b/i.test(summary);
      const hasShe = /\bshe\b|\bher\b/i.test(summary);
      const hasHe = /\bhe\b|\bhis\b|\bhim\b/i.test(summary);

      let pronoun = 'They';
      let possessive = 'their';
      if (hasShe && !hasHe) {
        pronoun = 'She';
        possessive = 'her';
      } else if (hasHe && !hasShe) {
        pronoun = 'He';
        possessive = 'his';
      }

      // Replace name at start of sentence with pronoun
      if (nameAtStart.test(sentence)) {
        sentence = sentence.replace(nameAtStart, pronoun);
      }
      // Replace "NAME's" with possessive
      sentence = sentence.replace(new RegExp(`${name}''s`, 'gi'), possessive);
      sentence = sentence.replace(new RegExp(`${name}'s`, 'gi'), possessive);
      // Replace name in middle of sentence with pronoun (lowercase)
      sentence = sentence.replace(new RegExp(`\\b${name}\\b`, 'gi'), pronoun.toLowerCase());
    }

    fixedSentences.push(sentence);
  }

  return fixedSentences.join(' ');
}

function processSqlFile(filePath: string): number {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let fixCount = 0;

  // Match retailer_summary = '...' patterns
  const summaryPattern = /retailer_summary = '([^']*(?:''[^']*)*)'/g;

  content = content.replace(summaryPattern, (match, summary) => {
    const name = extractNameFromSummary(summary);
    if (!name) return match;

    // Check if name appears in multiple consecutive sentences
    const sentences = summary.split(/(?<=[.!?])\s+/);
    let hasRepeat = false;

    for (let i = 1; i < sentences.length; i++) {
      const namePattern = new RegExp(`\\b${name}\\b`, 'i');
      if (namePattern.test(sentences[i-1]) && namePattern.test(sentences[i])) {
        hasRepeat = true;
        break;
      }
    }

    if (hasRepeat) {
      const fixed = fixRepeatedName(summary, name);
      if (fixed !== summary) {
        fixCount++;
        return `retailer_summary = '${fixed}'`;
      }
    }

    return match;
  });

  fs.writeFileSync(filePath, content);
  console.log(`  Fixed ${fixCount} summaries`);
  return fixCount;
}

function main() {
  let totalFixed = 0;

  for (const file of SQL_FILES) {
    if (fs.existsSync(file)) {
      totalFixed += processSqlFile(file);
    } else {
      console.log(`File not found: ${file}`);
    }
  }

  console.log(`\nTotal fixed: ${totalFixed} summaries`);
}

main();
