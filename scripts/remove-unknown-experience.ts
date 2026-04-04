import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

interface Experience {
  company: string;
  duration: string;
  roles: string[];
}

async function main() {
  // Fetch all workers with previous_experience
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, previous_experience')
    .not('previous_experience', 'is', null);

  if (error) {
    console.error('Error fetching workers:', error);
    return;
  }

  const workerCount = workers ? workers.length : 0;
  console.log(`Found ${workerCount} workers with previous_experience`);

  let updatedCount = 0;
  let removedCount = 0;

  for (const worker of workers || []) {
    const experiences = worker.previous_experience as Experience[];
    if (!Array.isArray(experiences)) continue;

    // Filter out Unknown companies
    const filtered = experiences.filter(exp =>
      exp.company?.toLowerCase() !== 'unknown'
    );

    // Only update if we removed something
    if (filtered.length < experiences.length) {
      const removed = experiences.length - filtered.length;
      removedCount += removed;

      const { error: updateError } = await supabase
        .from('workers')
        .update({ previous_experience: filtered })
        .eq('id', worker.id);

      if (updateError) {
        console.error(`Error updating worker ${worker.id}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} workers...`);
        }
      }
    }
  }

  console.log(`\nDone! Updated ${updatedCount} workers, removed ${removedCount} "Unknown" entries.`);
}

main();
