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
  let offset = 0;
  const limit = 1000;
  let totalUpdated = 0;
  let totalRemoved = 0;
  let totalDurationsFixed = 0;

  while (true) {
    console.log(`Fetching workers ${offset} to ${offset + limit}...`);

    const { data: workers, error } = await supabase
      .from('workers')
      .select('id, previous_experience')
      .not('previous_experience', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching workers:', error);
      return;
    }

    if (!workers || workers.length === 0) {
      console.log('No more workers to process.');
      break;
    }

    console.log(`Processing ${workers.length} workers...`);

    for (const worker of workers) {
      const experiences = worker.previous_experience as Experience[];
      if (!Array.isArray(experiences) || experiences.length === 0) continue;

      let needsUpdate = false;

      // Step 1: Filter out Unknown companies
      let filtered = experiences.filter(exp => {
        if (exp.company?.toLowerCase() === 'unknown') {
          totalRemoved++;
          needsUpdate = true;
          return false;
        }
        return true;
      });

      // Step 2: Fix durations
      filtered = filtered.map(exp => {
        let duration = exp.duration;
        const upperDuration = duration?.toUpperCase()?.trim();

        // Check for duration in parentheses like "(SHORT)" or "(LONG)"
        const parenMatch = duration?.match(/\((\w+)\)/i);
        if (parenMatch) {
          const code = parenMatch[1].toUpperCase();
          if (DURATION_MAP[code]) {
            duration = DURATION_MAP[code];
            needsUpdate = true;
            totalDurationsFixed++;
          }
        }
        // Map SHORT/MEDIUM/LONG/EXTENDED to readable text
        else if (upperDuration && DURATION_MAP[upperDuration]) {
          duration = DURATION_MAP[upperDuration];
          needsUpdate = true;
          totalDurationsFixed++;
        }
        // If duration is missing, "Unknown", or "(Unknown)", pick a random one
        else if (!duration || duration.toLowerCase().includes('unknown')) {
          duration = getRandomDuration();
          needsUpdate = true;
          totalDurationsFixed++;
        }

        return { ...exp, duration };
      });

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('workers')
          .update({ previous_experience: filtered })
          .eq('id', worker.id);

        if (updateError) {
          console.error(`Error updating worker ${worker.id}:`, updateError);
        } else {
          totalUpdated++;
        }
      }
    }

    offset += limit;

    // If we got fewer than limit, we're done
    if (workers.length < limit) {
      break;
    }
  }

  console.log(`\nDone!`);
  console.log(`Updated ${totalUpdated} workers`);
  console.log(`Removed ${totalRemoved} "Unknown" company entries`);
  console.log(`Fixed ${totalDurationsFixed} durations`);
}

main();
