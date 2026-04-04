/**
 * Add reviewer names to retailer quotes
 * Generates random first name + last initial for each quote
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Common first names for retail managers
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn',
  'Avery', 'Drew', 'Blake', 'Parker', 'Cameron', 'Reese', 'Skyler', 'Dakota',
  'Michael', 'Sarah', 'David', 'Jessica', 'Chris', 'Amanda', 'Brian', 'Nicole',
  'Kevin', 'Rachel', 'Jason', 'Ashley', 'Ryan', 'Stephanie', 'Matt', 'Lauren',
  'Daniel', 'Emily', 'Andrew', 'Megan', 'Josh', 'Heather', 'Eric', 'Jennifer',
  'Mark', 'Lisa', 'Steve', 'Michelle', 'Tom', 'Kim', 'James', 'Angela',
  'Robert', 'Brittany', 'John', 'Samantha', 'Anthony', 'Tiffany', 'Greg', 'Natalie'
];

// Last initial letters (weighted toward common ones)
const lastInitials = 'ABCDEFGHJKLMNPRSTW'.split('');

function generateReviewerName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)];
  return `${firstName} ${lastInitial}.`;
}

interface RetailerQuote {
  quote: string;
  role: string;
  brand: string;
  reviewerName?: string;
}

async function addReviewerNames() {
  console.log('Fetching workers with retailer quotes...');

  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, retailer_quotes')
    .not('retailer_quotes', 'is', null);

  if (error) {
    console.error('Error fetching workers:', error);
    return;
  }

  console.log(`Found ${workers?.length || 0} workers with quotes`);

  let updatedCount = 0;
  let quotesUpdated = 0;

  for (const worker of workers || []) {
    const quotes: RetailerQuote[] = worker.retailer_quotes || [];

    if (quotes.length === 0) continue;

    let needsUpdate = false;
    const updatedQuotes = quotes.map(quote => {
      if (!quote.reviewerName) {
        needsUpdate = true;
        quotesUpdated++;
        return {
          ...quote,
          reviewerName: generateReviewerName()
        };
      }
      return quote;
    });

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('workers')
        .update({ retailer_quotes: updatedQuotes })
        .eq('id', worker.id);

      if (updateError) {
        console.error(`Error updating worker ${worker.name}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated ${worker.name}: added names to ${updatedQuotes.length} quotes`);
      }
    }
  }

  console.log(`\nDone! Updated ${updatedCount} workers, ${quotesUpdated} quotes total`);
}

addReviewerNames();
