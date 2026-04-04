/**
 * Fix retailer quotes:
 * 1. Split quotes containing | into separate quotes
 * 2. Apply sentence case to all quotes
 * 3. Remove leading | characters
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Quote {
  quote: string;
  brand: string;
  role: string;
}

// Sentence case: capitalize first letter, rest as-is (preserve names etc)
function toSentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// Process quotes: split by |, sentence case, clean up
function processQuotes(quotes: Quote[]): Quote[] {
  const result: Quote[] = [];

  for (const q of quotes) {
    // Split by | if present
    const parts = q.quote.split('|').map(p => p.trim()).filter(p => p.length > 0);

    for (const part of parts) {
      // Apply sentence case
      const cleanQuote = toSentenceCase(part);
      if (cleanQuote) {
        result.push({
          quote: cleanQuote,
          brand: q.brand,
          role: q.role
        });
      }
    }
  }

  return result;
}

async function main() {
  console.log('Fetching all workers with quotes...');

  // Paginate to get all workers
  let allWorkers: any[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, name, retailer_quotes')
      .not('retailer_quotes', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching workers:', error);
      return;
    }

    if (!workers || workers.length === 0) break;
    allWorkers = allWorkers.concat(workers);
    console.log(`Fetched ${allWorkers.length} workers with quotes...`);
    if (workers.length < limit) break;
    offset += limit;
  }

  console.log(`Total: ${allWorkers.length} workers with quotes\n`);

  let fixedCount = 0;
  let newQuotesCount = 0;
  let errorCount = 0;

  for (const w of allWorkers) {
    const originalQuotes = w.retailer_quotes || [];
    const processedQuotes = processQuotes(originalQuotes);

    // Check if anything changed
    const changed = JSON.stringify(processedQuotes) !== JSON.stringify(originalQuotes);

    if (changed) {
      const { error: updateError } = await supabase
        .from('workers')
        .update({ retailer_quotes: processedQuotes })
        .eq('id', w.id);

      if (updateError) {
        console.error(`Error updating ${w.name}:`, updateError.message);
        errorCount++;
      } else {
        fixedCount++;
        newQuotesCount += processedQuotes.length - originalQuotes.length;
        if (fixedCount <= 5) {
          console.log(`Fixed: ${w.name}`);
          console.log(`  Before: ${originalQuotes.length} quotes`);
          console.log(`  After: ${processedQuotes.length} quotes`);
          if (processedQuotes.length > 0) {
            console.log(`  Sample: "${processedQuotes[0].quote.substring(0, 50)}..."`);
          }
        }
      }
    }
  }

  console.log(`\nDone! Fixed ${fixedCount} workers.`);
  console.log(`Created ${newQuotesCount} new quotes from splits.`);
  console.log(`Errors: ${errorCount}`);
}

main();
