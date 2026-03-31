/**
 * Worker Summary Generation Script
 *
 * Generates unique AI-style summaries for each worker based on their retailer quotes
 * and stores them in the `retailer_summary` column.
 *
 * Prerequisites:
 *   Run this SQL in Supabase first to add the column:
 *   ALTER TABLE workers ADD COLUMN IF NOT EXISTS retailer_summary TEXT;
 *
 * Usage:
 *   npx tsx src/scripts/generateWorkerSummaries.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  endorsements: string[];
  reflex_activity: {
    shiftsByTier: { luxury: number; elevated: number; mid: number };
    storeFavoriteCount?: number;
  } | null;
}

/**
 * Generate a unique, personalized summary for a worker.
 * Each summary is crafted to highlight what makes this specific worker stand out.
 */
function generateSummary(worker: WorkerRow): string {
  const firstName = worker.name.split(' ')[0];
  const quotes = worker.retailer_quotes || [];
  const quoteText = quotes.map(q => q.quote.toLowerCase()).join(' ');
  const brands = new Set(quotes.map(q => q.brand));
  const brandCount = brands.size;

  // Analyze quote themes
  const themes = {
    anticipates: quoteText.includes('five steps ahead') || quoteText.includes('before i can ask') || quoteText.includes('already done'),
    energy: quoteText.includes('energy') || quoteText.includes('contagious') || quoteText.includes('spirit'),
    professional: quoteText.includes('professional') || quoteText.includes('polite') || quoteText.includes('brand ambassador'),
    hustle: quoteText.includes('hustle') || quoteText.includes('never stops') || quoteText.includes('hardest working'),
    customerFocus: quoteText.includes('customer') || quoteText.includes('greet') || quoteText.includes('connection'),
    quickLearner: quoteText.includes('quick to learn') || quoteText.includes('eager') || quoteText.includes('picks things up'),
    teamPlayer: quoteText.includes('team') || quoteText.includes('collaborate') || quoteText.includes('tone'),
    selfStarter: quoteText.includes('finding') || quoteText.includes('busy') || quoteText.includes('never standing around'),
    receptive: quoteText.includes('direction') || quoteText.includes('coaching') || quoteText.includes('feedback'),
    sales: quoteText.includes('sale') || quoteText.includes('conversion') || quoteText.includes('close'),
    visual: quoteText.includes('visual') || quoteText.includes('floor') || quoteText.includes('displays'),
    reliable: quoteText.includes('trust') || quoteText.includes('count on') || quoteText.includes('depend'),
    leadership: quoteText.includes('management') || quoteText.includes('lead') || quoteText.includes('example'),
    joyful: quoteText.includes('pleasure') || quoteText.includes('joy') || quoteText.includes('love having'),
    inviteBack: quoteText.includes('would love') || quoteText.includes('back anytime') || quoteText.includes('request'),
  };

  // Build sentences based on themes - create unique combinations
  const sentences: string[] = [];

  // Opening - what makes them stand out
  if (themes.anticipates) {
    sentences.push(`${firstName} is the type of worker who anticipates what needs to be done before being asked.`);
  } else if (themes.energy) {
    sentences.push(`${firstName} brings an infectious energy to the floor that elevates everyone around them.`);
  } else if (themes.hustle) {
    sentences.push(`Retailers consistently highlight ${firstName}'s relentless work ethic and drive.`);
  } else if (themes.customerFocus) {
    sentences.push(`${firstName} has a natural talent for making customers feel welcomed and valued.`);
  } else if (themes.professional) {
    sentences.push(`${firstName} represents the brand with a level of professionalism that retailers notice immediately.`);
  } else if (themes.selfStarter) {
    sentences.push(`${firstName} never waits to be told what to do - always finding ways to contribute.`);
  } else if (worker.reflex_activity?.storeFavoriteCount && worker.reflex_activity.storeFavoriteCount >= 3) {
    sentences.push(`${firstName} has become a store favorite at ${worker.reflex_activity.storeFavoriteCount} locations for a reason.`);
  } else if (worker.invited_back_stores >= 10) {
    sentences.push(`With invites back from ${worker.invited_back_stores} stores, ${firstName}'s reputation speaks for itself.`);
  } else {
    sentences.push(`Retailers across ${brandCount} brands consistently give ${firstName} standout feedback.`);
  }

  // Middle - supporting details
  if (themes.teamPlayer && !sentences[0].includes('energy')) {
    sentences.push(`Multiple managers note how ${firstName} elevates the performance of the whole team.`);
  }
  if (themes.receptive) {
    sentences.push(`${firstName} takes feedback professionally and applies it immediately.`);
  }
  if (themes.quickLearner && sentences.length < 3) {
    sentences.push(`${firstName} picks things up quickly and integrates seamlessly into any store environment.`);
  }
  if (themes.sales && sentences.length < 3) {
    sentences.push(`Strong sales instincts and customer rapport translate to real results on the floor.`);
  }
  if (themes.visual && sentences.length < 3) {
    sentences.push(`${firstName} has a sharp eye for floor presentation and visual details.`);
  }
  if (themes.joyful && sentences.length < 3) {
    sentences.push(`Store teams genuinely enjoy working alongside ${firstName}.`);
  }

  // Closing - the takeaway
  if (themes.inviteBack) {
    sentences.push(`The consistent feedback: retailers want ${firstName} back.`);
  } else if (themes.leadership) {
    sentences.push(`Several retailers see leadership potential and management readiness in ${firstName}.`);
  } else if (worker.shifts_on_reflex >= 40 && brandCount >= 4) {
    sentences.push(`With ${worker.shifts_on_reflex} shifts across ${brandCount} brands, ${firstName} has proven adaptable and reliable.`);
  }

  // Ensure we have 2-3 solid sentences
  if (sentences.length < 2) {
    if (worker.shift_verified) {
      sentences.push(`As a shift-verified Reflexer, ${firstName} has a proven track record retailers can count on.`);
    } else {
      sentences.push(`${firstName} shows up ready to work and delivers consistently.`);
    }
  }

  return sentences.slice(0, 3).join(' ');
}

async function generateAllSummaries() {
  console.log('Fetching workers from database...');

  const { data: workers, error: fetchError } = await supabase
    .from('workers')
    .select('id, name, retailer_quotes, shift_verified, shifts_on_reflex, invited_back_stores, brands_worked, endorsements, reflex_activity');

  if (fetchError) {
    console.error('Error fetching workers:', fetchError);
    return;
  }

  if (!workers || workers.length === 0) {
    console.log('No workers found in database.');
    return;
  }

  const shiftVerified = (workers as WorkerRow[]).filter(w => w.shift_verified);
  const notVerified = (workers as WorkerRow[]).filter(w => !w.shift_verified);

  console.log(`Found ${workers.length} workers total.`);
  console.log(`- ${shiftVerified.length} shift-verified (will generate summaries)`);
  console.log(`- ${notVerified.length} not verified (will clear any existing summaries)\n`);

  let successCount = 0;
  let clearedCount = 0;
  let errorCount = 0;

  // Generate summaries for shift-verified workers only
  for (const worker of shiftVerified) {
    const summary = generateSummary(worker);

    console.log(`\n--- ${worker.name} ---`);
    console.log(summary);

    const { error: updateError } = await supabase
      .from('workers')
      .update({ retailer_summary: summary })
      .eq('id', worker.id);

    if (updateError) {
      console.error(`Error updating ${worker.name}:`, updateError.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  // Clear summaries for non-verified workers
  for (const worker of notVerified) {
    const { error: updateError } = await supabase
      .from('workers')
      .update({ retailer_summary: null })
      .eq('id', worker.id);

    if (updateError) {
      console.error(`Error clearing ${worker.name}:`, updateError.message);
      errorCount++;
    } else {
      clearedCount++;
    }
  }

  console.log('\n\n=== Summary Generation Complete ===');
  console.log(`Summaries generated: ${successCount}`);
  console.log(`Summaries cleared: ${clearedCount}`);
  console.log(`Errors: ${errorCount}`);
}

generateAllSummaries().catch(console.error);
