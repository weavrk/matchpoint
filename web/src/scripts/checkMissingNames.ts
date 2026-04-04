/**
 * Check for quotes missing reviewer names
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

const supabase = createClient(supabaseUrl, supabaseKey);

interface RetailerQuote {
  quote: string;
  role: string;
  brand: string;
  reviewerName?: string;
}

async function checkMissingNames() {
  console.log('Checking for workers with quotes missing reviewerName...');

  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, retailer_quotes')
    .not('retailer_quotes', 'is', null);

  if (error) {
    console.error('Error fetching workers:', error);
    return;
  }

  console.log(`Found ${workers?.length || 0} workers with quotes`);

  let totalMissing = 0;
  let workersWithMissing = 0;

  for (const worker of workers || []) {
    const quotes: RetailerQuote[] = worker.retailer_quotes || [];
    const missing = quotes.filter(q => !q.reviewerName);

    if (missing.length > 0) {
      console.log(`${worker.name}: ${missing.length}/${quotes.length} quotes missing reviewerName`);
      totalMissing += missing.length;
      workersWithMissing++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`Workers with missing names: ${workersWithMissing}`);
  console.log(`Total quotes missing names: ${totalMissing}`);
}

checkMissingNames();
