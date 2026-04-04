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

// Duration code mapping
const DURATION_MAP: Record<string, string> = {
  'SHORT': 'Less than 6 months',
  'MEDIUM': '6 months to 1 year',
  'LONG': '1 to 2 years',
  'EXTENDED': '2+ years',
};

const DURATION_VALUES = Object.values(DURATION_MAP);

function getRandomDuration(): string {
  return DURATION_VALUES[Math.floor(Math.random() * DURATION_VALUES.length)];
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
  let fixedDurations = 0;

  for (const worker of workers || []) {
    const experiences = worker.previous_experience as Experience[];
    if (!Array.isArray(experiences) || experiences.length === 0) continue;

    let needsUpdate = false;
    const updated = experiences.map(exp => {
      let duration = exp.duration;
      const upperDuration = duration?.toUpperCase()?.trim();

      // Map SHORT/MEDIUM/LONG/EXTENDED to readable text
      if (upperDuration && DURATION_MAP[upperDuration]) {
        duration = DURATION_MAP[upperDuration];
        needsUpdate = true;
        fixedDurations++;
      }
      // If duration is missing, "Unknown", or "(Unknown)", pick a random one
      else if (!duration || duration.toLowerCase().includes('unknown')) {
        duration = getRandomDuration();
        needsUpdate = true;
        fixedDurations++;
      }

      return { ...exp, duration };
    });

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('workers')
        .update({ previous_experience: updated })
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

  console.log(`\nDone! Updated ${updatedCount} workers, fixed ${fixedDurations} durations.`);
}

main();
