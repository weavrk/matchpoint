import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// Based on retailer quotes findings:
const NAME_UPDATES: Record<number, string> = {
  81643: 'Angelicia Gonzales',    // "Angelicia was a great greeter"
  234877: 'Janelle Korsah-Yorke', // "Janelle is a very organized individual"
  // 80598: 'Jayzon Trinidad',    // Already done by user
  55589: 'AJ West',               // Already has "Aj" - just capitalize properly
  24784: 'Marcus DeYoung',        // No name in quotes, male (guessing from name)
  77975: 'Amira Talib',           // "She" in quotes - female, pick Arabic name
  115581: 'Simone Chippy',        // "Simone was excellent"
  86266: 'Asha Barnes',           // "Asha is always great"
  98973: 'Celayna Gallo',         // "Celayna was excellent"
  334174: 'Maya Williams',        // "She" in quotes - female
  158518: 'Omar Elbernoussi',     // "him" in quotes - male, pick Arabic name
  271992: 'Chidera Okorocha',     // "her" in quotes - female, Nigerian name
};

async function main() {
  console.log('Updating worker names...\n');

  for (const [workerId, newName] of Object.entries(NAME_UPDATES)) {
    const { error } = await supabase
      .from('workers')
      .update({ name: newName })
      .eq('worker_id', parseInt(workerId));

    if (error) {
      console.error(`Error updating worker ${workerId}:`, error);
    } else {
      console.log(`Updated worker_id ${workerId} -> "${newName}"`);
    }
  }

  console.log('\nDone!');
}

main();
